cmake_minimum_required(VERSION 3.20)
project(cleancity_engine CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ── Compiler flags ─────────────────────────────────────────────────────────────
add_compile_options(
    -Wall -Wextra -Wpedantic
    -O2
    $<$<CONFIG:Release>:-DNDEBUG>
)

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    add_compile_options(-g -fsanitize=address,undefined)
    add_link_options(-fsanitize=address,undefined)
endif()

# ── Include paths ──────────────────────────────────────────────────────────────
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_SOURCE_DIR}/vendor      # nlohmann/json single-header lives here
)

# ── Engine library (reusable by tests) ────────────────────────────────────────
add_library(engine_lib STATIC
    src/priority_scorer.cpp
    src/route_optimizer.cpp
)
target_include_directories(engine_lib PUBLIC include vendor)

# ── HTTP bridge executable ────────────────────────────────────────────────────
add_executable(cleancity_engine src/main.cpp)
target_link_libraries(cleancity_engine PRIVATE engine_lib)

# Threads needed for std::thread
find_package(Threads REQUIRED)
target_link_libraries(cleancity_engine PRIVATE Threads::Threads)

# ── Unit tests ────────────────────────────────────────────────────────────────
enable_testing()

add_executable(engine_tests
    tests/test_scorer.cpp
    tests/test_router.cpp
)
target_link_libraries(engine_tests PRIVATE engine_lib)
add_test(NAME engine_tests COMMAND engine_tests)

# ── Build info ────────────────────────────────────────────────────────────────
message(STATUS "Build type : ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ standard: ${CMAKE_CXX_STANDARD}")
