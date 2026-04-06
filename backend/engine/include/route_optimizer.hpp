#pragma once

#include <vector>
#include <string>
#include <cmath>
#include <numeric>
#include <algorithm>

namespace cleancity {

/**
 * RouteOptimizer
 * ──────────────
 * Greedy nearest-neighbour route optimizer for collector task ordering.
 *
 * Input:  a list of geo-located tasks with priority scores.
 * Output: an ordered list of task IDs representing the optimised visit order.
 *
 * Algorithm: Weighted nearest-neighbour — at each step the next task is chosen
 * by minimising  (distance_km / priority_score).  Higher priority tasks are
 * therefore "closer" in the weighted sense and get visited sooner.
 *
 * For production, swap with OR-Tools or a proper TSP solver.
 */
class RouteOptimizer {
public:
    struct Task {
        int    id;
        double lat;
        double lng;
        double priority_score;  // higher = more urgent
    };

    struct RouteResult {
        std::vector<int>    ordered_ids;    // task IDs in visit order
        double              total_km = 0.0;       // estimated distance
        std::vector<double> leg_km;         // distance of each leg
    };

    /**
     * @param start_lat  Collector's current latitude
     * @param start_lng  Collector's current longitude
     * @param tasks      Unordered list of tasks to optimise
     */
    RouteResult optimise(double start_lat, double start_lng,
                         const std::vector<Task>& tasks) const;

private:
    /// Haversine distance in kilometres between two (lat,lng) pairs
    static double haversine_km(double lat1, double lng1,
                               double lat2, double lng2) noexcept;
};

} // namespace cleancity
