#include "priority_scorer.hpp"
#include <sstream>
#include <algorithm>

namespace cleancity {

PriorityScorer::PriorityScorer() {
    // Base weight per priority level (mirrors the frontend PRIORITY_OPTIONS)
    priority_weights_ = {
        {"Low",      1.0},
        {"Medium",   2.0},
        {"High",     3.5},
        {"Critical", 5.0},
    };

    // Extra urgency bonus per waste category
    category_bonuses_ = {
        {"Hazardous Waste",  2.0},   // health risk — highest bonus
        {"Illegal Dumping",  1.5},   // legal + environmental risk
        {"Overflowing Bin",  1.0},   // visible / sanitation risk
        {"Bulk Waste",       0.75},
        {"Missed Pickup",    0.5},
        {"Recycling Issue",  0.25},
        {"Other",            0.0},
    };
}

double PriorityScorer::age_bump(int age_hours) const noexcept {
    // Logarithmic growth: +0 at 0h, +0.5 at 24h, +1 at 168h (1 week), caps at +2
    if (age_hours <= 0) return 0.0;
    return clamp(std::log1p(age_hours / 24.0) * 0.72, 0.0, 2.0);
}

double PriorityScorer::clamp(double v, double lo, double hi) const noexcept {
    return std::max(lo, std::min(hi, v));
}

PriorityScorer::ScoreOutput PriorityScorer::compute(const ScoreInput& input) const {
    ScoreOutput out;
    out.report_id = input.report_id;

    // 1. Base weight
    auto pw_it = priority_weights_.find(input.priority);
    out.base_weight = (pw_it != priority_weights_.end()) ? pw_it->second : 2.0;

    // 2. Category bonus
    auto cb_it = category_bonuses_.find(input.category);
    out.category_bonus = (cb_it != category_bonuses_.end()) ? cb_it->second : 0.0;

    // 3. Age bump
    out.age_bump = age_bump(input.age_hours);

    // 4. Final score — clamped to [0, 10]
    double raw = out.base_weight + out.category_bonus + out.age_bump;
    out.score = clamp(raw, 0.0, 10.0);

    // Human-readable explanation for debugging/logging
    std::ostringstream oss;
    oss << "base=" << out.base_weight
        << " + category_bonus=" << out.category_bonus
        << " + age_bump=" << out.age_bump
        << " => score=" << out.score;
    out.explanation = oss.str();

    return out;
}

} // namespace cleancity
