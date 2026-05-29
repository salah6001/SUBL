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
`new_data/mindtype-ai/` provides:
- **ML model files** — trained RandomForest classifiers
- **Raw & processed data** — CSV and SQLite for training/analysis
- **Python ML service** — FastAPI app serving the model via HTTP

**No changes are needed in the `.NET` backend** — everything is already configured.

---

## 1. Which Model Is Used

The integration uses **`model/mindtype_model.pkl`** — an emotion classifier trained on 5 keystroke-timing features.

| Aspect | Detail |
|---|---|
| **File** | `new_data/mindtype-ai/model/mindtype_model.pkl` |
| **Algorithm** | RandomForestClassifier (200 trees, balanced class weights) |
| **Features** (5) | `mean_dwell`, `median_flight`, `cv_flight`, `mean_del_freq`, `mean_tot_time` |
| **Output classes** | `A` (Angry), `C` (Calm), `H` (Happy), `N` (Neutral), `S` (Sad) |
| **Stress score** | `P(Angry) + P(Sad)` → mapped to `[0.0, 1.0]` |
| **Test accuracy** | 83.6% |
| **Binary stress F1** | 91.9% |
| **Training samples** | 303 from EmoSurv dataset |

**Why not `stress_model.pkl`?** The `.NET` backend's `StressDetectionHttpService.cs` is hard-coded to send the exact 5 fields above. The `stress_model.pkl` requires 14 features (including typist type, age, gender) that the desktop agent doesn't collect. It's available for future use if the agent is extended.

**Why not `notebooks/model/stress_model.pkl`?** It's an identical copy of `model/stress_model.pkl` (same file, stored there for notebook access). Not used in production.

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

| Field | Type | Description |
|---|---|---|
| `mean_dwell` | float > 0 | Average key-hold time in ms |
| `median_flight` | float > 0 | Median time between keydowns in ms |
| `cv_flight` | float >= 0 | Coefficient of variation of flight time |
| `mean_del_freq` | float >= 0 | Deletion frequency (0–100) |
| `mean_tot_time` | float > 0 | Total elapsed time in ms |
| `n_keys` | int >= 0 | Total keystrokes in window |
| `user_id` | string? | User GUID (for future per-user adaptation) |

#### Response:

```json
{
  "score": 0.72,
  "confidence": 0.91,
  "model_version": "mindtype-ai-v1.0.0",
  "label": "Angry",
  "metadata": "{\"features_used\": [\"mean_dwell\", \"median_flight\", \"cv_flight\", \"mean_del_freq\", \"mean_tot_time\"], \"dominant\": \"A\"}"
}
```

| Field | Type | Constraints |
|---|---|---|
| `score` | float | `[0.0, 1.0]` (clamped) |
| `confidence` | float | `[0.0, 1.0]` (= max class probability) |
| `model_version` | string | For traceability / debugging |
| `label` | string? | `"Angry"` / `"Calm"` / `"Happy"` / `"Neutral"` / `"Sad"` |
| `metadata` | string? | Opaque JSON with extra info |

### `GET /health`

```json
{"status": "healthy", "model_loaded": true, "ts": 1712345678.0}
```

Returns 200 OK. Used by the .NET backend's health checks.

### Score → Stress Level (done in .NET)

| `score` range | `StressLevel` |
|---|---|
| `[0.00, 0.30)` | Low |
| `[0.30, 0.60)` | Moderate |
| `[0.60, 0.85)` | High |
| `[0.85, 1.00]` | Critical |

---

## 3. Running the ML Service

### Option A: Local (development)

```bash
cd new_data/mindtype-ai
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Test it:

```bash
# health check
curl http://localhost:8000/health

# prediction
curl -X POST http://localhost:8000/predict-stress \
  -H "Content-Type: application/json" \
  -d '{"mean_dwell":82.1,"median_flight":215.0,"cv_flight":0.92,"mean_del_freq":7.1,"mean_tot_time":63000.0,"n_keys":312}'
```

### Option B: Docker (production)

Build and run:

```bash
cd new_data/mindtype-ai
docker build -t mindtype-ml-service .
docker run -d --name mindtype-ml -p 8000:8000 mindtype-ml-service
```

### Option C: Docker Compose (with .NET backend)

Add to `backend/docker-compose.yml`:

```yaml
ml-service:
  image: mindtype-ml-service
  build:
    context: ./new_data/mindtype-ai
    dockerfile: Dockerfile
  ports:
    - 8000:8000
  restart: unless-stopped
```

Then the `.NET` backend connects via `http://host.docker.internal:8000` (already configured in `docker-compose.yml`).

---

## 4. .NET Backend Configuration

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

If you want to change anything:

| Setting | Current | When to change |
|---|---|---|
| `BaseUrl` | `http://localhost:8000` | If ML service runs on a different host/port |
| `TimeoutSeconds` | `10` | If the model takes > 10s to respond |
| `PredictPath` | `/predict-stress` | If you rename the endpoint (not recommended) |
| `HealthPath` | `/health` | If you rename the health endpoint |

---

## 5. Database Migration

The `.NET` backend needs 4 new tables for the stress detection module.

From `backend/`:

```bash
dotnet ef migrations add AddStressDetectionModule \
  --project src/Infrastructure \
  --startup-project src/Web.Api \
  --context ApplicationDbContext

dotnet ef database update \
  --project src/Infrastructure \
  --startup-project src/Web.Api \
  --context ApplicationDbContext
```

Tables created:

| Table | Stores |
|---|---|
| `public.devices` | Registered desktop agents (fingerprint, platform, status) |
| `public.stress_sessions` | Monitoring sessions per user (start/end, status, aggregates) |
| `public.keyboard_metrics` | Raw keystroke feature batches per session |
| `public.stress_readings` | ML predictions (score, level, confidence, model version) |

---

## 6. Data Files Quick Reference

| Path | What it is | Used by |
|---|---|---|
| `model/mindtype_model.pkl` | **Primary model** (5 features) | ML service |
| `model/stress_model.pkl` | Experimental stress model (14 features) | Not used yet |
| `model/metadata.json` | Primary model info (version, accuracy) | ML service reads version |
| `model/encoder.pkl` | Label encoder from training | Training pipeline only |
| `data/raw/*.csv` | Raw survey data (4 CSVs) | Training / analysis |
| `data/cleaned/cleaned_data.csv` | Cleaned merged dataset | Training |
| `data/processed/final_features.csv` | Feature-engineered data | Training |
| `data/mindtype.db` | SQLite demo session history | Demo only |
| `notebooks/*.ipynb` | Jupyter notebooks | Analysis / exploration |
| `notebooks/model/stress_model.pkl` | Copy of `model/stress_model.pkl` | Notebooks only |
| `inference/*.py` | Standalone inference modules | Demo only |

---

## 7. Files That Implement the Bridge

| File | Role |
|---|---|
| `new_data/mindtype-ai/backend/main.py` | **FastAPI app** — loads model, exposes `/predict-stress` + `/health` |
| `new_data/mindtype-ai/Dockerfile` | Container image for the ML service |
| `backend/src/Infrastructure/StressDetection/StressDetectionHttpService.cs` | **HTTP client** — calls Python ML service from .NET |
| `backend/src/Infrastructure/StressDetection/StressDetectionSettings.cs` | Config binding for `appsettings.json` |
| `backend/src/Web.Api/appsettings.json` | Connection settings (URL, paths, timeout) |

---

## 8. End-to-End Flow

```
1. User logs into desktop agent → gets JWT
2. Agent POST /devices → registers machine, gets deviceId
3. Agent POST /stress-sessions/start → creates session, gets sessionId
4. Every N seconds:
   a. Agent computes features from keystroke timing
   b. POST /stress-sessions/{sessionId}/metrics
   c. .NET handler calls POST /predict-stress on Python ML service
   d. Python returns {score, confidence, model_version, label, metadata}
   e. .NET persists metrics + reading, updates session aggregates
   f. If score >= 0.60 (High/Critical) → SignalR alert to agent
5. Web dashboard queries /stress/current, /stress/readings, /stress/trends
```

---

## 9. Production Considerations

| Concern | Recommendation |
|---|---|
| **Containerization** | Use the provided `Dockerfile`. Add health checks to Compose. |
| **Scaling** | HTTP is stateless — multiple Python containers behind a load balancer |
| **Security** | Add `ApiKey` in `appsettings.json`, validate in Python with middleware |
| **Monitoring** | `/health` endpoint works with Docker health checks and Kubernetes probes |
| **Model updates** | Change `MODEL_PATH` in `backend/main.py` or mount a volume with new models |
| **GPU** | Not needed — RandomForest is CPU-only |
| **Timeouts** | `TimeoutSeconds: 10` in config; increase if model latency grows |

**To add API key authentication** (recommended for production):

In `new_data/mindtype-ai/backend/main.py`, add:
```python
from fastapi import Header, HTTPException

@app.post("/predict-stress")
def predict_stress(inp: PredictStressInput, x_api_key: str = Header(None)):
    if x_api_key != "your-secret-key":
        raise HTTPException(403, "Invalid API key")
    # ... rest of the handler
```

And set `ApiKey` in `appsettings.json`:
```json
"StressDetection": { "ApiKey": "your-secret-key", ... }
```
