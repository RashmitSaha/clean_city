#include "route_optimizer.hpp"
#include <cmath>
#include <limits>
#include <stdexcept>

namespace cleancity {

// ── Haversine formula ─────────────────────────────────────────────────────────
double RouteOptimizer::haversine_km(double lat1, double lng1,
                                    double lat2, double lng2) noexcept {
    constexpr double R   = 6371.0;   // Earth radius in km
    constexpr double DEG = M_PI / 180.0;

    double dlat = (lat2 - lat1) * DEG;
    double dlng = (lng2 - lng1) * DEG;

    double a = std::sin(dlat / 2) * std::sin(dlat / 2)
             + std::cos(lat1 * DEG) * std::cos(lat2 * DEG)
             * std::sin(dlng / 2) * std::sin(dlng / 2);

    return R * 2.0 * std::atan2(std::sqrt(a), std::sqrt(1.0 - a));
}

// ── Weighted nearest-neighbour TSP ────────────────────────────────────────────
RouteOptimizer::RouteResult
RouteOptimizer::optimise(double start_lat, double start_lng,
                         const std::vector<Task>& tasks) const {
    if (tasks.empty()) return {};

    const std::size_t n = tasks.size();

    // visited[i] == true once task i is added to the route
    std::vector<bool> visited(n, false);
    RouteResult result;
    result.ordered_ids.reserve(n);
    result.leg_km.reserve(n);

    double cur_lat = start_lat;
    double cur_lng = start_lng;

    for (std::size_t step = 0; step < n; ++step) {
        double best_cost = std::numeric_limits<double>::infinity();
        std::size_t best_idx = 0;
        double best_dist_km  = 0.0;

        for (std::size_t i = 0; i < n; ++i) {
            if (visited[i]) continue;

            double dist_km = haversine_km(cur_lat, cur_lng,
                                          tasks[i].lat, tasks[i].lng);
            double score   = tasks[i].priority_score > 0.0
                             ? tasks[i].priority_score
                             : 1e-9;    // guard against zero-division

            // Cost: distance penalised by priority (lower cost = more attractive)
            double cost = dist_km / score;

            if (cost < best_cost) {
                best_cost     = cost;
                best_idx      = i;
                best_dist_km  = dist_km;
            }
        }

        visited[best_idx] = true;
        result.ordered_ids.push_back(tasks[best_idx].id);
        result.leg_km.push_back(best_dist_km);
        result.total_km += best_dist_km;

        cur_lat = tasks[best_idx].lat;
        cur_lng = tasks[best_idx].lng;
    }

    return result;
}

} // namespace cleancity
