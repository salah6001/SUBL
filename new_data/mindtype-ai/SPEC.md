# MindType AI — Integration Spec: `new_data/` ↔ `.NET Backend`

## Architecture

```
Desktop Agent                 ONEX API (.NET)               Python ML Service
(subl_agent)                   (backend/)                    (new_data/mindtype-ai/)
     │                              │                               │
     │ POST /stress-sessions/{id}    │                               │
     │     /metrics                  │                               │
     │ ─────────────────────────►    │                               │
     │                              │ POST /predict-stress          │
     │                              │ ──────────────────────────►   │
     │                              │                               │
     │                              │ {score, confidence,           │
     │                              │  model_version, label,        │
     │                              │  metadata}                    │
     │                              │ ◀──────────────────────────   │
     │                              │                               │
     │ ◀── SignalR (real-time) ───  │                               │
```

The `.NET` backend delegates ML inference to a Python FastAPI service.

**No changes are needed in the `.NET` backend** — everything is pre-configured.

---

## 1. Which Model Is Used

The integration uses **`model/mindtype_model.pkl`** — an emotion classifier trained on 5 keystroke-timing features.

| Aspect | Detail |
|---|---|
| File | `new_data/mindtype-ai/model/mindtype_model.pkl` |
| Algorithm | RandomForestClassifier (200 trees, balanced class weights) |
| Features (5) | `mean_dwell`, `median_flight`, `cv_flight`, `mean_del_freq`, `mean_tot_time` |
| Output classes | `A` (Angry), `C` (Calm), `H` (Happy), `N` (Neutral), `S` (Sad) |
| Stress score | `P(Angry) + P(Sad)` → mapped to `[0.0, 1.0]` |
| Test accuracy | 83.6% |
| Binary stress F1 | 91.9% |

---

## 2. Python ML Service Contract

### `POST /predict-stress`

#### Request (`.NET` sends this):

```json
{
  "mean_dwell": 82.1,
  "median_flight": 215.0,
  "cv_flight": 0.92,
  "mean_del_freq": 7.1,
  "mean_tot_time": 63000.0,
  "n_keys": 312,
  "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

#### Response:

```json
{
  "score": 0.145,
  "confidence": 0.725,
  "model_version": "mindtype-ai-v1.0.0",
  "label": "Neutral",
  "metadata": "{\"features_used\": [\"mean_dwell\", \"median_flight\", \"cv_flight\", \"mean_del_freq\", \"mean_tot_time\"], \"dominant\": \"N\"}"
}
```

| Field | Type | Constraints |
|---|---|---|
| `score` | float | `[0.0, 1.0]` (clamped) |
| `confidence` | float | `[0.0, 1.0]` (= max class probability) |
| `model_version` | string | For traceability |
| `label` | string? | `"Angry"` / `"Calm"` / `"Happy"` / `"Neutral"` / `"Sad"` |
| `metadata` | string? | Opaque JSON string |

### `GET /health`

```json
{"status": "healthy", "model_loaded": true, "ts": 1780081935.1}
```

### Score → Stress Level (done in .NET)

| `score` range | `StressLevel` |
|---|---|
| `[0.00, 0.30)` | Low |
| `[0.30, 0.60)` | Moderate |
| `[0.60, 0.85)` | High |
| `[0.85, 1.00]` | Critical |

---

## 3. Running the ML Service

### Local (development)

```bash
cd new_data/mindtype-ai
pip install -r requirements-ml.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Test it:

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/predict-stress \
  -H "Content-Type: application/json" \
  -d '{"mean_dwell":82.1,"median_flight":215.0,"cv_flight":0.92,"mean_del_freq":7.1,"mean_tot_time":63000.0,"n_keys":312}'
```

### Docker (standalone)

```bash
cd new_data/mindtype-ai
docker build -t mindtype-ml-service .
docker run -d --name mindtype-ml -p 8000:8000 mindtype-ml-service
```

### Docker Compose (with .NET backend)

```bash
cd backend
docker compose up -d
```

This starts 5 containers: `ml-service`, `web-api`, `postgres`, `mailpit`, `seq`.

---

## 4. Docker Compose Setup

File: `backend/docker-compose.yml`

```yaml
services:
  web-api:
    # ... standard .NET config ...
    environment:
      - StressDetection__BaseUrl=http://ml-service:8000
    depends_on:
      ml-service:
        condition: service_healthy

  ml-service:
    image: mindtype-ml-service
    build:
      context: ../new_data/mindtype-ai
      dockerfile: Dockerfile
    ports:
      - 8000:8000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python3", "-c",
        "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
```

Key points:
- `web-api` talks to `ml-service` over the internal Docker network by service name
- `ml-service` has a health check — `web-api` waits for it to be healthy before starting
- No `host.docker.internal` needed

---

## 5. .NET Backend Configuration

**No changes needed.** The settings in `backend/src/Web.Api/appsettings.json` already point to the ML service:

```json
"StressDetection": {
  "BaseUrl": "http://localhost:8000",
  "ApiKey": "",
  "TimeoutSeconds": 10,
  "PredictPath": "/predict-stress",
  "HealthPath": "/health"
}
```

When running in Docker, `BaseUrl` is overridden to `http://ml-service:8000` via environment variable in `docker-compose.yml`.

---

## 6. Database Migration

The 4 stress detection tables (`devices`, `stress_sessions`, `keyboard_metrics`, `stress_readings`) are already migrated into PostgreSQL. If running fresh:

```bash
cd backend
docker compose up -d postgres
dotnet ef database update \
  --project src/Infrastructure \
  --startup-project src/Web.Api \
  --context ApplicationDbContext
```

---

## 7. Verified End-to-End Status

| Check | Status |
|---|---|
| ML service `/health` | ✅ `{"status":"healthy","model_loaded":true}` |
| ML service `/predict-stress` | ✅ Returns score, confidence, label |
| Web API `/health` | ✅ 200 with PostgreSQL check |
| Docker DNS: `web-api → ml-service` | ✅ Resolves to `172.20.0.x` |
| PostgreSQL: all 4 stress tables | ✅ Present |
| `docker compose up` | ✅ All 5 containers start cleanly |

---

## 8. Files That Implement the Bridge

| File | Role |
|---|---|
| `new_data/mindtype-ai/backend/main.py` | FastAPI app: `/predict-stress` + `/health` |
| `new_data/mindtype-ai/Dockerfile` | Container image for the ML service |
| `new_data/mindtype-ai/requirements-ml.txt` | Minimal Python deps (no streamlit/plotly) |
| `backend/docker-compose.yml` | Orchestrates all 5 services together |
| `backend/src/Infrastructure/StressDetection/StressDetectionHttpService.cs` | HTTP client calling Python ML service |
| `backend/src/Web.Api/appsettings.json` | Connection settings |

---

## 9. Production Notes

| Concern | Recommendation |
|---|---|
| **API key** | Set `ApiKey` in both `appsettings.json` and Python middleware |
| **Model updates** | Build a new Docker image with updated `.pkl` files |
| **Scaling** | Multiple `ml-service` replicas behind a load balancer (stateless) |
| **Monitoring** | `/health` works with Docker health checks and K8s probes |
| **Secrets** | Never commit `.env` or `ApiKey` values to git |
