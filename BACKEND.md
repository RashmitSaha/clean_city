# CleanCity — Full-Stack Backend

Urban waste management platform with three wired backend tiers.

---

## Architecture

```
Browser (React + Vite)
    │
    ├── REST (JSON)     → FastAPI  :8000   (Python 3.12)
    │                        │
    │                        ├── SQLite / PostgreSQL  (SQLAlchemy async)
    │                        ├── POST /internal/emit → Node.js realtime
    │                        └── POST /score         → C++ engine
    │
    └── WebSocket       → Node.js  :4000   (Socket.IO)
                              └── JWT-authenticated rooms
                                  (user:{id} · citizen · collector · admin · zone:{id})

                         C++ engine  :8001
                              ├── POST /score   — priority scoring
                              └── POST /route   — route optimisation (greedy nearest-neighbour)
```

---

## Directory structure

```
cleancity/
├── docker-compose.yml          ← start everything
├── Dockerfile.dev              ← Vite frontend dev container
├── .env.example                ← copy to .env.local for frontend
│
├── src/                        ← React frontend (Vite)
│   ├── App.jsx                 ← routes + ProtectedRoute guards ✅ wired
│   ├── context/
│   │   └── AuthContext.jsx     ← real login/signup/apiFetch ✅ wired
│   ├── hooks/
│   │   ├── useApi.js           ← authenticated fetch hook
│   │   └── useSocket.js        ← Socket.IO hook
│   └── components/
│       └── ProtectedRoute.jsx  ← role-based route guard
│
└── backend/
    ├── api/                    ← FastAPI (Python)
    │   ├── main.py             ← app factory + lifespan
    │   ├── requirements.txt
    │   ├── Dockerfile
    │   ├── .env.example
    │   ├── core/
    │   │   ├── config.py       ← pydantic-settings
    │   │   └── security.py     ← JWT, bcrypt, role guards
    │   ├── db/
    │   │   ├── database.py     ← async SQLAlchemy engine + Base
    │   │   └── seed.py         ← demo data (run once)
    │   ├── models/
    │   │   ├── user.py         ← User (citizen/collector/admin)
    │   │   ├── report.py       ← Report + enums
    │   │   └── zone.py         ← Zone
    │   ├── schemas/
    │   │   ├── auth.py         ← LoginRequest, SignupRequest, TokenResponse
    │   │   ├── report.py       ← ReportCreate, ReportOut, ReportListResponse
    │   │   └── analytics.py    ← AnalyticsResponse
    │   ├── services/
    │   │   ├── auth_service.py     ← authenticate_user, register_user
    │   │   ├── report_service.py   ← CRUD + photo upload + engine score + realtime emit
    │   │   └── analytics_service.py← SQL aggregations → admin dashboard
    │   └── routers/
    │       ├── auth.py         ← POST /api/auth/login|signup
    │       ├── reports.py      ← GET|POST /api/reports, PATCH /api/reports/{id}
    │       ├── collector.py    ← GET|PATCH /api/collector/tasks
    │       ├── admin.py        ← /api/admin/analytics|reports|users|zones
    │       └── categories.py   ← GET /api/categories
    │
    ├── realtime/               ← Node.js 20 / Socket.IO
    │   ├── index.js            ← HTTP server + Socket.IO + JWT auth middleware
    │   ├── package.json
    │   ├── Dockerfile
    │   ├── .env.example
    │   ├── middleware/
    │   │   └── logger.js       ← Winston logger
    │   └── handlers/
    │       ├── taskEvents.js   ← task:start, task:complete, collector:location
    │       └── notifications.js← notification:ack, admin:broadcast
    │
    └── engine/                 ← C++20 scoring + routing engine
        ├── CMakeLists.txt
        ├── Dockerfile
        ├── include/
        │   ├── priority_scorer.hpp   ← PriorityScorer class
        │   └── route_optimizer.hpp   ← RouteOptimizer class
        ├── src/
        │   ├── priority_scorer.cpp   ← base weight + category bonus + age decay
        │   ├── route_optimizer.cpp   ← haversine + weighted nearest-neighbour TSP
        │   └── main.cpp              ← HTTP bridge (POSIX sockets, no deps)
        ├── tests/
        │   ├── test_scorer.cpp       ← 6 scorer tests (all pass)
        │   └── test_router.cpp       ← 7 router tests (all pass)
        └── vendor/
            └── json.hpp              ← nlohmann/json (replace with real release for prod)
```

---

## Quick start

### Option A — Docker (recommended)

```bash
# 1. Copy env files
cp backend/api/.env.example  backend/api/.env
cp backend/realtime/.env.example backend/realtime/.env
cp .env.example .env.local

# 2. Start all services
docker compose up --build

# 3. Seed demo data (first run only)
docker compose exec api python -m api.db.seed
```

Open http://localhost:5173

### Option B — Native (3 terminals)

**Terminal 1 — C++ engine**
```bash
cd backend/engine
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
./build/cleancity_engine 8001
```

**Terminal 2 — FastAPI**
```bash
cd backend/api
pip install -r requirements.txt
cp .env.example .env
uvicorn api.main:app --reload --port 8000
# First run: python -m api.db.seed
```

**Terminal 3 — Node.js realtime**
```bash
cd backend/realtime
npm install
cp .env.example .env
npm run dev
```

**Terminal 4 — Frontend**
```bash
# project root
cp .env.example .env.local
npm install
npm run dev
```

---

## API reference

### Auth
| Method | Path | Body | Auth |
|--------|------|------|------|
| `POST` | `/api/auth/login` | `{email, password}` | — |
| `POST` | `/api/auth/signup` | `{full_name, email, password, role?, zone_id?}` | — |

### Reports (citizen)
| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/reports` | multipart/form-data; up to 4 photos |
| `GET`  | `/api/reports` | scoped to citizen's own reports |
| `GET`  | `/api/reports/{id}` | — |

### Collector
| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/api/collector/tasks` | paginated; filter by status/search |
| `PATCH`| `/api/collector/tasks/{id}` | update status or add notes |

### Admin
| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/api/admin/analytics?period=30d` | 7d / 30d / 90d / 1y |
| `GET`  | `/api/admin/reports` | all reports with full filters |
| `PATCH`| `/api/admin/reports/{id}` | assign collector, change status |
| `GET`  | `/api/admin/users` | list users by role |
| `POST` | `/api/admin/users` | create any-role account |
| `PATCH`| `/api/admin/users/{id}/deactivate` | — |
| `GET`  | `/api/admin/zones` | — |
| `POST` | `/api/admin/zones` | — |
| `DELETE`| `/api/admin/zones/{id}` | — |

### Categories
| Method | Path |
|--------|------|
| `GET`  | `/api/categories` |
| `GET`  | `/api/categories/priorities` |

Interactive docs: http://localhost:8000/api/docs

---

## C++ engine endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/score` | Compute priority score for a report |
| `POST` | `/route` | Optimise a collector's task order |
| `GET`  | `/health` | Liveness probe |

**Score request:**
```json
{ "report_id": 1, "category": "Hazardous Waste", "priority": "High", "lat": 40.71, "lng": -74.0, "age_hours": 48 }
```
**Score response:**
```json
{ "report_id": 1, "score": 6.84, "base_weight": 3.5, "category_bonus": 2.0, "age_bump": 1.34, "explanation": "..." }
```

**Route request:**
```json
{ "start_lat": 40.70, "start_lng": -74.00, "tasks": [{ "id": 1, "lat": 40.71, "lng": -74.01, "priority_score": 5.0 }] }
```

---

## WebSocket events

Connect to `ws://localhost:4000` with `{ auth: { token: "<jwt>" } }`.

| Event (server → client) | When |
|------------------------|------|
| `report:created` | New report submitted |
| `report:status_changed` | Any status change |
| `task:assigned` | Admin assigns a collector |
| `collector:location` | Collector shares live GPS |
| `system:alert` | Admin broadcasts a platform message |

| Event (client → server) | Who |
|------------------------|-----|
| `join:zone` | Any — subscribe to zone updates |
| `task:start` | Collector |
| `task:complete` | Collector |
| `collector:location` | Collector |
| `notification:ack` | Any |
| `admin:broadcast` | Admin |

---

## Demo credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cleancity.app | admin1234 |
| Collector | collector1@cleancity.app | collector1234 |
| Citizen | citizen1@cleancity.app | citizen1234 |

---

## Scoring algorithm

The C++ engine scores each report on a **[0–10]** scale:

```
score = clamp(base_weight + category_bonus + age_bump, 0, 10)

base_weight:    Low=1  Medium=2  High=3.5  Critical=5
category_bonus: Hazardous Waste=2  Illegal Dumping=1.5  Overflowing Bin=1  …
age_bump:       min(log1p(age_hours/24) × 0.72, 2.0)
```

Higher scores surface older, more dangerous reports so collectors prioritise them first.
The route optimizer uses these scores as a priority weight in a weighted nearest-neighbour TSP.

---

## Production checklist

- [ ] Replace `SECRET_KEY` in FastAPI `.env`
- [ ] Replace `JWT_SECRET` in Node.js `.env`
- [ ] Switch `DATABASE_URL` to PostgreSQL
- [ ] Replace vendor `json.hpp` stub with real nlohmann/json release
- [ ] Add Nginx reverse proxy in front of all services
- [ ] Enable HTTPS / WSS
- [ ] Set `ALLOWED_ORIGINS` to production domain only
- [ ] Set `DEBUG=false` in FastAPI
