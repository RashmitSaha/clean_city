# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake g++ make ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY . .

# Download real nlohmann/json if vendor/json.hpp is the stub
RUN if ! grep -q '"nlohmann_json"' vendor/json.hpp 2>/dev/null; then \
    curl -sSL https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp \
         -o vendor/json.hpp || true; fi

RUN cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build --parallel

# ── Stage 2: minimal runtime ──────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /src/build/cleancity_engine /usr/local/bin/cleancity_engine

EXPOSE 8001
ENTRYPOINT ["cleancity_engine", "8001"]
