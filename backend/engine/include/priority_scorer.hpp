#pragma once

#include <string>
#include <unordered_map>
#include <cmath>

namespace cleancity {

/**
 * PriorityScorer
 * ──────────────
 * Computes a numeric priority score for a waste report.
 *
 * Score components:
 *   1. Base priority weight    (from enum: Low→1, Medium→2, High→3.5, Critical→5)
 *   2. Category urgency bonus  (hazardous/illegal dumping score higher)
 *   3. Zone density penalty    (denser zones get a small boost so crowded areas clear faster)
 *   4. Age decay               (optional: older unresolved reports get a bump)
 *
 * Final score is clamped to [0, 10].
 */
class PriorityScorer {
public:
    struct ScoreInput {
        int         report_id;
        std::string category;
        std::string priority;
        double      lat;
        double      lng;
        int         age_hours = 0;   // hours since report was created
    };

    struct ScoreOutput {
        int    report_id;
        double score;           // [0, 10]
        double base_weight;
        double category_bonus;
        double age_bump;
        std::string explanation;
    };

    PriorityScorer();
    ScoreOutput compute(const ScoreInput& input) const;

private:
    std::unordered_map<std::string, double> priority_weights_;
    std::unordered_map<std::string, double> category_bonuses_;

    double age_bump(int age_hours) const noexcept;
    double clamp(double v, double lo, double hi) const noexcept;
};

} // namespace cleancity
