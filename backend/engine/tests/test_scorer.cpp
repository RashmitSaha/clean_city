/**
 * Minimal test runner — no external framework required.
 * Uses assert() and prints pass/fail per test case.
 * Linked into engine_tests via CMake.
 */
#include <cassert>
#include <cmath>
#include <iostream>
#include <string>

#include "priority_scorer.hpp"

using namespace cleancity;

static int passed = 0;
static int failed = 0;

#define EXPECT_NEAR(a, b, tol, name)                                      \
    do {                                                                    \
        if (std::fabs((a) - (b)) <= (tol)) {                               \
            std::cout << "  PASS  " << (name) << "\n";                     \
            ++passed;                                                        \
        } else {                                                             \
            std::cerr << "  FAIL  " << (name)                              \
                      << "  got=" << (a) << "  want≈" << (b) << "\n";     \
            ++failed;                                                        \
        }                                                                    \
    } while (0)

#define EXPECT_EQ(a, b, name)                                              \
    do {                                                                    \
        if ((a) == (b)) {                                                   \
            std::cout << "  PASS  " << (name) << "\n";                     \
            ++passed;                                                        \
        } else {                                                             \
            std::cerr << "  FAIL  " << (name)                              \
                      << "  got=" << (a) << "  want=" << (b) << "\n";     \
            ++failed;                                                        \
        }                                                                    \
    } while (0)

// ── Test cases ────────────────────────────────────────────────────────────────

void test_low_priority_other() {
    PriorityScorer scorer;
    PriorityScorer::ScoreInput in{ 1, "Other", "Low", 0.0, 0.0, 0 };
    auto out = scorer.compute(in);
    // base=1.0 + bonus=0.0 + age=0.0 = 1.0
    EXPECT_NEAR(out.score, 1.0, 0.01, "Low/Other/fresh => 1.0");
    EXPECT_EQ(out.report_id, 1, "report_id preserved");
}

void test_critical_hazardous() {
    PriorityScorer scorer;
    PriorityScorer::ScoreInput in{ 2, "Hazardous Waste", "Critical", 0.0, 0.0, 0 };
    auto out = scorer.compute(in);
    // base=5.0 + bonus=2.0 + age=0.0 = 7.0
    EXPECT_NEAR(out.score, 7.0, 0.01, "Critical/Hazardous => 7.0");
}

void test_age_bump_one_week() {
    PriorityScorer scorer;
    // 168 hours = 1 week
    PriorityScorer::ScoreInput in{ 3, "Other", "Low", 0.0, 0.0, 168 };
    auto out = scorer.compute(in);
    // base=1.0, age_bump at 168h ≈ log1p(7)*0.72 ≈ 1.459
    EXPECT_NEAR(out.age_bump, 1.459, 0.05, "age_bump at 168h ≈ 1.459");
    EXPECT_NEAR(out.score, 1.0 + 1.459, 0.05, "total score with age bump");
}

void test_score_clamped_at_ten() {
    PriorityScorer scorer;
    // Critical(5) + Hazardous(2) + age_bump_max(2.0) = 9.0 — clamp only kicks in above 10
    PriorityScorer::ScoreInput in{ 4, "Hazardous Waste", "Critical", 0.0, 0.0, 8760 };
    auto out = scorer.compute(in);
    // Score must be ≤ 10 and ≥ 9 (age bump saturates at 2.0)
    bool in_range = out.score >= 9.0 && out.score <= 10.0;
    EXPECT_EQ(in_range, true, "score in [9,10] for max-urgency aged report");
}

void test_unknown_priority_defaults() {
    PriorityScorer scorer;
    PriorityScorer::ScoreInput in{ 5, "Other", "UltraSuper", 0.0, 0.0, 0 };
    auto out = scorer.compute(in);
    // Unknown priority → falls back to 2.0
    EXPECT_NEAR(out.base_weight, 2.0, 0.01, "unknown priority defaults to 2.0");
}

void test_explanation_non_empty() {
    PriorityScorer scorer;
    PriorityScorer::ScoreInput in{ 6, "Missed Pickup", "Medium", 40.7, -74.0, 24 };
    auto out = scorer.compute(in);
    bool has_explanation = !out.explanation.empty();
    EXPECT_EQ(has_explanation, true, "explanation string non-empty");
}

// ── Entry point (linked alongside test_router.cpp) ────────────────────────────
// Each test file defines a run_*_tests() function; main() is in test_router.cpp.

void run_scorer_tests() {
    std::cout << "\n=== PriorityScorer ===\n";
    test_low_priority_other();
    test_critical_hazardous();
    test_age_bump_one_week();
    test_score_clamped_at_ten();
    test_unknown_priority_defaults();
    test_explanation_non_empty();
}

extern void run_router_tests();   // defined in test_router.cpp

int main() {
    run_scorer_tests();
    run_router_tests();

    std::cout << "\n────────────────────────────\n"
              << "  Results: " << passed << " passed, " << failed << " failed\n";
    return failed > 0 ? 1 : 0;
}
