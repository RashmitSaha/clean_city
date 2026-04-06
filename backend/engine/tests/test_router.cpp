/**
 * Unit tests for RouteOptimizer.
 * run_router_tests() is called from test_scorer.cpp's main().
 */
#include <cassert>
#include <cmath>
#include <iostream>
#include <vector>

#include "route_optimizer.hpp"

using namespace cleancity;

static int& passed_ref() { static int v = 0; return v; }
static int& failed_ref() { static int v = 0; return v; }

// Reuse macros from test_scorer — they write to the same globals via extern linkage
// but we use local function-scope counters here for clarity.
#define CHECK(cond, name)                                                 \
    do {                                                                   \
        if (cond) {                                                        \
            std::cout << "  PASS  " << (name) << "\n";                    \
            ++passed_ref();                                                \
        } else {                                                           \
            std::cerr << "  FAIL  " << (name) << "\n";                   \
            ++failed_ref();                                                \
        }                                                                  \
    } while (0)

// ── Test helpers ──────────────────────────────────────────────────────────────
static bool contains(const std::vector<int>& v, int x) {
    for (int id : v) if (id == x) return true;
    return false;
}

// ── Test cases ────────────────────────────────────────────────────────────────

void test_empty_tasks() {
    RouteOptimizer opt;
    auto result = opt.optimise(40.7, -74.0, {});
    CHECK(result.ordered_ids.empty(), "empty input → empty route");
    CHECK(result.total_km == 0.0,     "empty input → total_km=0");
}

void test_single_task() {
    RouteOptimizer opt;
    std::vector<RouteOptimizer::Task> tasks = {
        {42, 40.71, -74.01, 3.0}
    };
    auto result = opt.optimise(40.70, -74.00, tasks);
    CHECK(result.ordered_ids.size() == 1,  "single task → 1 stop");
    CHECK(result.ordered_ids[0] == 42,     "single task → correct id");
    CHECK(result.total_km > 0.0,           "single task → positive distance");
}

void test_all_ids_present() {
    RouteOptimizer opt;
    std::vector<RouteOptimizer::Task> tasks = {
        {1, 40.71, -74.01, 2.0},
        {2, 40.73, -74.02, 3.5},
        {3, 40.69, -73.99, 1.0},
        {4, 40.75, -74.03, 5.0},
    };
    auto result = opt.optimise(40.70, -74.00, tasks);
    CHECK(result.ordered_ids.size() == 4, "4 tasks → 4 stops");
    for (int id : {1, 2, 3, 4})
        CHECK(contains(result.ordered_ids, id), "task " + std::to_string(id) + " in route");
}

void test_high_priority_visited_first() {
    /**
     * Two tasks equidistant from start — one Critical (score=5), one Low (score=1).
     * The weighted cost for Critical = dist/5 < dist/1, so Critical should come first.
     */
    RouteOptimizer opt;

    // Place both tasks at the same haversine distance (~1.1 km north / south)
    std::vector<RouteOptimizer::Task> tasks = {
        {10, 40.710, -74.00, 5.0},   // high priority, north
        {20, 40.690, -74.00, 1.0},   // low priority,  south
    };
    auto result = opt.optimise(40.700, -74.00, tasks);
    CHECK(result.ordered_ids[0] == 10, "high-priority task visited first");
}

void test_leg_km_count_matches() {
    RouteOptimizer opt;
    std::vector<RouteOptimizer::Task> tasks = {
        {1, 40.71, -74.01, 2.0},
        {2, 40.73, -74.02, 2.0},
        {3, 40.75, -74.03, 2.0},
    };
    auto result = opt.optimise(40.70, -74.00, tasks);
    CHECK(result.leg_km.size() == tasks.size(), "leg_km count matches task count");
}

void test_total_km_is_sum_of_legs() {
    RouteOptimizer opt;
    std::vector<RouteOptimizer::Task> tasks = {
        {1, 40.71, -74.01, 2.0},
        {2, 40.73, -74.02, 2.0},
    };
    auto result = opt.optimise(40.70, -74.00, tasks);
    double sum = 0.0;
    for (double leg : result.leg_km) sum += leg;
    bool close = std::fabs(result.total_km - sum) < 1e-9;
    CHECK(close, "total_km == sum of leg_km");
}

// ── Called from test_scorer.cpp's main() ─────────────────────────────────────
void run_router_tests() {
    std::cout << "\n=== RouteOptimizer ===\n";
    test_empty_tasks();
    test_single_task();
    test_all_ids_present();
    test_high_priority_visited_first();
    test_leg_km_count_matches();
    test_total_km_is_sum_of_legs();
}
