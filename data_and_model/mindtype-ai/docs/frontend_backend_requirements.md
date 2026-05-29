# Frontend & Backend Handover

## 1. Model Artifacts

### Required artifacts for production
- `model/mindtype_model.pkl`
  - Pickle artifact containing the trained pipeline:
    - `StandardScaler`
    - `RandomForestClassifier(n_estimators=200, class_weight='balanced')`
- `model/encoder.pkl`
  - `LabelEncoder` used to transform emotion labels during training
- `model/metadata.json`
  - Model version, algorithm, feature names, classes, performance, thresholds and preprocessing notes
- `model/stress_model.pkl`
  - Experimental stress-level model artifact trained from notebook feature engineering
- `model/stress_metadata.json`
  - Metadata for the experimental stress-level classifier

### Notes
- The backend loads the production model artifact from `backend/main.py` using:
  - `MODEL_PATH = ROOT / "model" / "mindtype_model.pkl"`
- The experimental notebook model is saved by `save_model.py` to:
  - `model/stress_model.pkl`
- The input feature order is fixed and must match the training feature set.
- The scaler is embedded inside the saved pipeline, so frontend should send raw feature values, not scaled values.

## 2. API Specification

### Base URL
- `http://localhost:8000`

### OpenAPI / Swagger
- Auto-generated docs available at:
  - `http://localhost:8000/docs`

### CORS
- `backend/main.py` config allows all origins, methods and headers:
  - `allow_origins=["*"]`
  - `allow_methods=["*"]`
  - `allow_headers=["*"]`

### Authentication
- Currently no authentication implemented.
- Frontend can call backend directly without API key or bearer token.

### Endpoints

#### `GET /`
- Purpose: API health + endpoint discovery
- Response:
  - `status`: `ok`
  - `service`: `MindType AI API v2.0`
  - `endpoints`: list of available paths
  - `"/predict/extended"`: dual-model endpoint for extended stress-model support

#### `GET /health`
- Purpose: health check
- Response:
  - `status`: `healthy`
  - `emotion_model_loaded`: `true` or `false`
  - `stress_model_loaded`: `true` or `false`
  - `db`: path to SQLite DB
  - `ts`: timestamp

#### `GET /survey/questions`
- Purpose: return survey question list
- Response:
  - `questions`: array of question objects
    - `id`, `text`, `en`

#### `POST /predict`
- Purpose: primary model inference from behavioral features
- Request schema:
```json
{
  "mean_dwell": 78.3,
  "median_flight": 210.5,
  "cv_flight": 0.82,
  "mean_del_freq": 6.2,
  "mean_tot_time": 62000,
  "user_id": "optional-user-id"
}
```
- Example cURL:
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"mean_dwell":78.3,"median_flight":210.5,"cv_flight":0.82,"mean_del_freq":6.2,"mean_tot_time":62000}'
```
- Example Python request:
```python
import requests
url = "http://localhost:8000/predict"
payload = {
    "mean_dwell": 78.3,
    "median_flight": 210.5,
    "cv_flight": 0.82,
    "mean_del_freq": 6.2,
    "mean_tot_time": 62000,
}
resp = requests.post(url, json=payload)
print(resp.json())
```
- Example response:
```json
{
  "session_id": "a1b2c3d4",
  "emotion": "N",
  "emotion_label": "Neutral",
  "emotion_emoji": "😐",
  "emotion_probs": {"A":0.05,"C":0.10,"H":0.12,"N":0.65,"S":0.08},
  "stress_score": 13.0,
  "stress_level": "low",
  "recommendations": [
    {"type":"positive","title":"حالتك ممتازة! استمر","en":"Wellbeing looks great!","icon":"✅"}
  ],
  "timestamp": "2026-05-14T12:34:56.789"
}
```

#### `POST /predict/extended`
- Purpose: dual-model inference using extended behavioral features
- Uses the production emotion classifier and the experimental stress-level model when available
- Request schema:
```json
{
  "mean_dwell": 78.3,
  "std_dwell": 72.4,
  "mean_flight": 210.5,
  "std_flight": 75.1,
  "median_flight": 210.5,
  "cv_flight": 0.82,
  "balanced_del_freq": 6.2,
  "balanced_n_keys": 25,
  "mean_left_freq": 18.3,
  "balanced_tot_time": 62000,
  "typistType": 1,
  "pcTimeAverage": 12.4,
  "ageRange": 2,
  "gender": 1,
  "user_id": "optional-user-id"
}
```
- Example cURL:
```bash
curl -X POST http://localhost:8000/predict/extended \
  -H "Content-Type: application/json" \
  -d '{"mean_dwell":78.3,"std_dwell":72.4,"mean_flight":210.5,"std_flight":75.1,"median_flight":210.5,"cv_flight":0.82,"balanced_del_freq":6.2,"balanced_n_keys":25,"mean_left_freq":18.3,"balanced_tot_time":62000,"typistType":1,"pcTimeAverage":12.4,"ageRange":2,"gender":1}'
```
- Expected response structure:
```json
{
  "session_id": "a1b2c3d4",
  "primary_model": {
    "emotion": "N",
    "emotion_label": "Neutral",
    "emotion_emoji": "😐",
    "emotion_probs": {"A":0.05,"C":0.10,"H":0.12,"N":0.65,"S":0.08},
    "stress_score": 13.0,
    "stress_level": "low"
  },
  "stress_model": {
    "stress_class": 1,
    "stress_class_label": "Optimal",
    "stress_class_probs": {"0":0.12,"1":0.76,"2":0.12}
  },
  "recommendations": [ ... ],
  "timestamp": "2026-05-14T12:34:56.789"
}
```

#### `POST /survey`
- Purpose: score the self-report survey

Request schema:
```json
{
  "mean_dwell": 78.3,
  "median_flight": 210.5,
  "cv_flight": 0.82,
  "mean_del_freq": 6.2,
  "mean_tot_time": 62000,
  "user_id": "optional-user-id"
}
```

Response schema:
```json
{
  "session_id": "...",
  "emotion": "N",
  "emotion_label": "Neutral",
  "emotion_emoji": "😐",
  "emotion_probs": {"A": 0.05, "C": 0.10, "H": 0.12, "N": 0.65, "S": 0.08},
  "stress_score": 13.0,
  "stress_level": "low",
  "recommendations": [ ... ],
  "timestamp": "2026-05-14T..."
}
```

#### `POST /survey`
- Purpose: score the self-report survey

Request schema:
```json
{
  "q1": 3,
  "q2": 4,
  "q3": 2,
  "q4": 5,
  "q5": 3,
  "user_id": "optional-user-id"
}
```

Response schema:
```json
{
  "survey_id": "...",
  "score": 6.4,
  "level": "medium",
  "interpretation": "توتر معتدل — يُنصح ببعض الاسترخاء",
  "breakdown": {
    "q1": 3,
    "q2": 4,
    "q3": 2,
    "q4": 5,
    "q5": 3
  },
  "timestamp": "2026-05-14T..."
}
```

#### `POST /analyze`
- Purpose: combine model prediction and survey to detect hidden stress

Request schema:
```json
{
  "features": {
    "mean_dwell": 78.3,
    "median_flight": 210.5,
    "cv_flight": 0.82,
    "mean_del_freq": 6.2,
    "mean_tot_time": 62000
  },
  "survey": {
    "q1": 3,
    "q2": 4,
    "q3": 2,
    "q4": 5,
    "q5": 3
  }
}
```

Response schema:
```json
{
  "session_id": "...",
  "model_stress": 56.4,
  "model_level": "high",
  "model_emotion": "A",
  "model_emotion_label": "Angry",
  "model_probs": { ... },
  "survey_score": 6.4,
  "survey_level": "medium",
  "survey_interpretation": "توتر معتدل — يُنصح ببعض الاسترخاء",
  "divergence": 0. ,
  "hidden_stress": false,
  "hidden_message": "...",
  "combined_level": "high",
  "recommendations": [ ... ],
  "timestamp": "2026-05-14T..."
}
```

#### `GET /history`
- Purpose: return stored prediction and survey history for dashboard
- Query params:
  - `limit` (optional, default 50)
- Response schema:
```json
{
  "sessions": [ ... ],
  "surveys": [ ... ],
  "summary": {
    "total_sessions": 12,
    "avg_stress": 42.3,
    "peak_stress": 76.0,
    "dominant_emotion": "N",
    "dominant_label": "Neutral",
    "hidden_stress_count": 2
  }
}
```

#### `DELETE /history`
- Purpose: clear saved history
- Response schema:
```json
{ "status": "cleared" }
```

#### `WS /ws/stream`
- Purpose: real-time simulation stream every 500ms
- Client may send initial config:
```json
{ "profile": "calm", "survey_score": 3 }
```
- Server sends repeated payloads with the same fields as `/predict` plus `step` and `survey_score`.

## 3. Documentation / Model Card

### Problem type
- Classification of emotion labels from keystroke behavioral features
- Secondary stress score regression-style output derived from emotion probabilities

### Architecture
- Pipeline: `StandardScaler` + `RandomForestClassifier`
- Input features: 5 behavioral features
- Output: emotion class probabilities, dominant emotion, stress score, recommendations

### Model size & shape
- Input vector length: 5 features
- Output:
  - `emotion` (categorical, one of `A`, `C`, `H`, `N`, `S`)
  - `emotion_probs` (probabilities for 5 classes)
  - `stress_score`: 0–100
  - `stress_level`: `low` / `medium` / `high`

### Expected input format
- JSON with numeric fields:
  - `mean_dwell` (ms)
  - `median_flight` (ms)
  - `cv_flight` (coefficient of variation)
  - `mean_del_freq` (ms)
  - `mean_tot_time` (ms)

### Output interpretation
- `emotion`: predicted dominant emotional class
- `emotion_probs`: confidence distribution between classes
- `stress_score`: derived from probability mass of anger/sad classes
- `stress_level`: thresholded label:
  - `low` if score < 35
  - `medium` if score ≥ 35
  - `high` if score ≥ 55
- `hidden_stress`: flag when model stress exceeds survey stress by > 0.20 normalized difference

### Limitations
- Model trained on a limited keystroke dataset and may not generalize to all keyboard layouts or languages
- No text content is used, only timing features
- Not a clinical diagnostic tool
- Predictions are only as good as feature extraction quality from the desktop agent

### Resource requirements
- CPU inference: lightweight Random Forest on 5 features
- RAM: minimal (<200MB runtime for Python+FastAPI)
- GPU: not required for current model

### Inference latency
- Expected average latency on CPU: ~20–80ms per request for feature vector predictions
- Bottleneck is typically network or HTTP overhead, not model computation

## 4. Deployment Assets

### Existing project assets
- `requirements.txt`
  - Contains exact package set for backend, frontend, model training and simulation
- `backend/main.py`
  - FastAPI app, inference routes, SQLite persistence, WebSocket stream
- `frontend/utils/api_client.py`
  - frontend integration helper for `/predict`, `/survey`, `/analyze`, `/history`

### Recommended deployment files
- `backend/config.yaml`
  - model metadata, API metadata, CORS settings
- `backend/predict.py`
  - standalone inference loader for validation and local CLI checks

### Suggested containerization
- Add `Dockerfile` in `backend/` or project root to build a Python container
- Use `requirements.txt` for reproducible environment

## 5. Files to deliver to frontend developer

| File | Purpose |
|---|---|
| `README.md` | Project overview and local run instructions |
| `data_schema.md` | Feature definitions and data contract |
| `training_log.md` | Experiments, model metrics, hyperparameters |
| `model_versioning.md` | Model versions, artifact changes, rollback policy |
| `ethical_considerations.md` | Bias, fairness, privacy, limitations |

## 6. Frontend Integration Guide

### Base URL
- `http://localhost:8000`

### Available endpoints
- `GET /health`
- `GET /survey/questions`
- `POST /predict`
- `POST /survey`
- `POST /analyze`
- `GET /history`
- `DELETE /history`
- `WS /ws/stream`

### Authentication
- None required today
- Future work: add Bearer token or API key if cross-user access is needed

### Rate limits
- None configured today
- Recommended: 30 requests/min per user for frontend polling endpoints

### CORS
- Permissive CORS is enabled for all origins

## 7. Data Contract

### `/predict` input
- Numeric behavioral features only
- `user_id` optional, forwarded to logs but not used by model

### `/predict` output
- `emotion`, `emotion_label`, `emotion_emoji`
- `emotion_probs`: class probability map
- `stress_score`, `stress_level`
- `recommendations`: array of suggested actions

### `/survey` input
- Five Likert answers from `1` to `5`
- Optional `user_id`

### `/survey` output
- `score`: normalized stress rating 0–10
- `level`: `low` / `medium` / `high`
- `interpretation`

### `/analyze` output
- Combined model + survey assessment
- Hidden stress detection and divergence message

### Error codes
- `422` — validation error (invalid payload or missing required field)
- `500` — internal server error
- `404` — unsupported endpoint

## 8. UI / UX Requirements

### Loading state
- Show loader on `/predict`, `/survey`, `/analyze` calls
- Use fallback messaging if backend offline

### Result visualization
- Classification: display `emotion_label`, `emotion_emoji`, and probability bar chart
- Stress: gauge or progress bar with `stress_score`
- Recommendations: list of action cards with icons
- Hidden stress: visible warning banner when `hidden_stress` is `true`

### Confidence threshold
- If `max(emotion_probs)` < 0.40, show `Low confidence` hint
- Otherwise show the dominant prediction normally

## 9. Sample Data

### Dummy `/predict` request
```json
{
  "mean_dwell": 83.5,
  "median_flight": 235.2,
  "cv_flight": 0.91,
  "mean_del_freq": 6.8,
  "mean_tot_time": 64000
}
```

### Dummy `/predict` response
```json
{
  "session_id": "a1b2c3d4",
  "emotion": "N",
  "emotion_label": "Neutral",
  "emotion_emoji": "😐",
  "emotion_probs": {"A": 0.04, "C": 0.10, "H": 0.16, "N": 0.62, "S": 0.08},
  "stress_score": 12.0,
  "stress_level": "low",
  "recommendations": [
    {"type": "positive", "title": "حالتك ممتازة! استمر", "icon": "✅"}
  ],
  "timestamp": "2026-05-14T12:34:56.789"
}
```

### Dummy `/analyze` response
```json
{
  "session_id": "d4c3b2a1",
  "model_stress": 68.9,
  "model_level": "high",
  "model_emotion": "A",
  "model_emotion_label": "Angry",
  "model_probs": {"A": 0.58, "C": 0.05, "H": 0.10, "N": 0.15, "S": 0.12},
  "survey_score": 6.0,
  "survey_level": "medium",
  "survey_interpretation": "توتر معتدل — يُنصح ببعض الاسترخاء",
  "divergence": 0.0899,
  "hidden_stress": false,
  "hidden_message": "",
  "combined_level": "high",
  "recommendations": [ ... ],
  "timestamp": "2026-05-14T12:35:12.345"
}
```

## 10. Recommended project deliverables for the team

- `README.md` — overview و local setup
- `data_schema.md` — feature contract و expected input shape
- `training_log.md` — experiments and metrics
- `model_versioning.md` — model versions and release notes
- `ethical_considerations.md` — privacy, fairness, limitations
