/**
 * CleanCity — C++ Engine HTTP Bridge
 * ────────────────────────────────────
 * Tiny HTTP server (no external deps beyond a POSIX socket) that exposes
 * the C++ scoring and routing engines over a local REST interface.
 *
 * Endpoints
 *   POST /score    — score a single report (called by FastAPI report_service)
 *   POST /route    — optimise a collector's task order
 *   GET  /health   — liveness probe
 *
 * Protocol: line-delimited HTTP/1.0 with JSON bodies.
 * For production, replace the manual socket code with cpp-httplib or Crow.
 *
 * Build:
 *   cd backend/engine && cmake -B build && cmake --build build
 * Run:
 *   ./build/cleancity_engine  [port=8001]
 */

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>

#include <algorithm>
#include <charconv>
#include <cstring>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <thread>
#include <vector>

#include "priority_scorer.hpp"
#include "route_optimizer.hpp"
#include "json.hpp"   // nlohmann/json single-header (vendor/json.hpp)

using json = nlohmann::json;
using namespace cleancity;

// ── Global engine singletons ──────────────────────────────────────────────────
static PriorityScorer g_scorer;
static RouteOptimizer g_router;

// ── Minimal HTTP helpers ──────────────────────────────────────────────────────
static std::string http_response(int code, const std::string& body,
                                 const std::string& content_type = "application/json") {
    std::ostringstream oss;
    std::string status_text = (code == 200) ? "OK"
                            : (code == 400) ? "Bad Request"
                            : (code == 404) ? "Not Found"
                            : "Internal Server Error";
    oss << "HTTP/1.0 " << code << " " << status_text << "\r\n"
        << "Content-Type: " << content_type << "\r\n"
        << "Content-Length: " << body.size() << "\r\n"
        << "Connection: close\r\n"
        << "\r\n"
        << body;
    return oss.str();
}

static void send_all(int fd, const std::string& data) {
    std::size_t sent = 0;
    while (sent < data.size()) {
        ssize_t n = ::write(fd, data.data() + sent, data.size() - sent);
        if (n <= 0) break;
        sent += static_cast<std::size_t>(n);
    }
}

// ── Request parsing ───────────────────────────────────────────────────────────
struct Request {
    std::string method;
    std::string path;
    std::string body;
};

static Request parse_request(int fd) {
    // Read until "\r\n\r\n" (headers end), then read Content-Length bytes
    std::string raw;
    raw.reserve(2048);
    char buf[1024];
    while (true) {
        ssize_t n = ::read(fd, buf, sizeof(buf));
        if (n <= 0) break;
        raw.append(buf, static_cast<std::size_t>(n));
        if (raw.find("\r\n\r\n") != std::string::npos) break;
    }

    Request req;
    std::istringstream stream(raw);
    stream >> req.method >> req.path;

    // Find Content-Length
    std::string header_section = raw.substr(0, raw.find("\r\n\r\n"));
    std::size_t cl_pos = header_section.find("Content-Length:");
    if (cl_pos != std::string::npos) {
        int content_length = 0;
        std::string cl_str = header_section.substr(cl_pos + 15);
        cl_str.erase(0, cl_str.find_first_not_of(' '));
        content_length = std::stoi(cl_str);

        std::size_t body_start = raw.find("\r\n\r\n") + 4;
        req.body = raw.substr(body_start);

        // Read remaining bytes if body was split across reads
        while (static_cast<int>(req.body.size()) < content_length) {
            ssize_t n = ::read(fd, buf, sizeof(buf));
            if (n <= 0) break;
            req.body.append(buf, static_cast<std::size_t>(n));
        }
        if (content_length > 0)
            req.body = req.body.substr(0, static_cast<std::size_t>(content_length));
    }

    return req;
}

// ── Route handlers ────────────────────────────────────────────────────────────
static std::string handle_score(const std::string& body) {
    try {
        auto j = json::parse(body);
        PriorityScorer::ScoreInput input;
        input.report_id = j.value("report_id", 0);
        input.category  = j.value("category",  std::string("Other"));
        input.priority  = j.value("priority",  std::string("Medium"));
        input.lat       = j.value("lat",        0.0);
        input.lng       = j.value("lng",        0.0);
        input.age_hours = j.value("age_hours",  0);

        auto out = g_scorer.compute(input);
        json res = {
            {"report_id",      out.report_id},
            {"score",          out.score},
            {"base_weight",    out.base_weight},
            {"category_bonus", out.category_bonus},
            {"age_bump",       out.age_bump},
            {"explanation",    out.explanation},
        };
        return http_response(200, res.dump());
    } catch (const std::exception& e) {
        return http_response(400, json{{"error", e.what()}}.dump());
    }
}

static std::string handle_route(const std::string& body) {
    try {
        auto j = json::parse(body);
        double start_lat = j.value("start_lat", 0.0);
        double start_lng = j.value("start_lng", 0.0);

        std::vector<RouteOptimizer::Task> tasks;
        for (auto& t : j.at("tasks")) {
            tasks.push_back({
                t.value("id",             0),
                t.value("lat",            0.0),
                t.value("lng",            0.0),
                t.value("priority_score", 1.0),
            });
        }

        auto result = g_router.optimise(start_lat, start_lng, tasks);
        json res = {
            {"ordered_ids", result.ordered_ids},
            {"total_km",    result.total_km},
            {"leg_km",      result.leg_km},
        };
        return http_response(200, res.dump());
    } catch (const std::exception& e) {
        return http_response(400, json{{"error", e.what()}}.dump());
    }
}

static std::string handle_health() {
    return http_response(200, json{{"status", "ok"}, {"service", "engine"}}.dump());
}

// ── Connection handler (runs in its own thread) ───────────────────────────────
static void handle_connection(int client_fd) {
    Request req = parse_request(client_fd);

    std::string response;
    if (req.method == "GET"  && req.path == "/health") {
        response = handle_health();
    } else if (req.method == "POST" && req.path == "/score") {
        response = handle_score(req.body);
    } else if (req.method == "POST" && req.path == "/route") {
        response = handle_route(req.body);
    } else {
        response = http_response(404, json{{"error", "Not found"}}.dump());
    }

    send_all(client_fd, response);
    ::close(client_fd);
}

// ── Main ──────────────────────────────────────────────────────────────────────
int main(int argc, char* argv[]) {
    int port = 8001;
    if (argc > 1) port = std::stoi(argv[1]);

    int server_fd = ::socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) { perror("socket"); return 1; }

    int opt = 1;
    ::setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    sockaddr_in addr{};
    addr.sin_family      = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port        = htons(static_cast<uint16_t>(port));

    if (::bind(server_fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0) {
        perror("bind"); return 1;
    }
    if (::listen(server_fd, 128) < 0) { perror("listen"); return 1; }

    std::cout << "✅  CleanCity C++ engine listening on port " << port << "\n"
              << "   POST /score  — priority scoring\n"
              << "   POST /route  — route optimisation\n"
              << "   GET  /health — liveness probe\n";

    while (true) {
        sockaddr_in client_addr{};
        socklen_t   client_len = sizeof(client_addr);
        int client_fd = ::accept(server_fd,
                                 reinterpret_cast<sockaddr*>(&client_addr),
                                 &client_len);
        if (client_fd < 0) continue;

        // Each connection handled in its own thread
        std::thread([cfd = client_fd]() { handle_connection(cfd); }).detach();
    }

    ::close(server_fd);
    return 0;
}
