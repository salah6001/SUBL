# MindType AI — Pipeline Documentation

## System Overview

MindType AI is a full-stack intelligent system that detects psychological stress
in real time by analysing keystroke dynamics — the timing patterns in how a person
types. It combines behavioral modeling with self-reported survey data to identify
both overt and hidden stress states.

---

## Data Flow Diagram

```
participants.csv ─┐
fixed_text.csv   ─┤
free_text.csv    ─┼──► 01_data_import_cleaning ──► cleaned_data.csv
frequency.csv    ─┘
                              │
                              ▼
                  02_feature_engineering ──► final_features.csv
                              │
                              ▼
                    03_eda_analysis ──► Behavioral insights
                              │
                              ▼
                    train_model.py ──► mindtype_model.pkl
                                         encoder.pkl
                                         metadata.json
                              │
                              ▼
                    05_model_evaluation ──► Performance metrics
                              │
                        ┌─────┴──────┐
                        ▼            ▼
                  inference/       backend/
                  ├ inference.py   ├ main.py
                  ├ decision_engine
                  └ recommendation
                        │
                        ▼
                  frontend/app.py ──► Real-time UI
```

---

## Stage 1 — Data Import & Cleaning

**Notebook:** `01_data_import_cleaning.ipynb`  
**Output:** `data/cleaned/cleaned_data.csv`

### Operations
- Load 4 CSVs with semicolon separator
- Coerce timing columns (`D1U1`, `D1D2`, `D1D3`) to numeric
- Drop rows where `D1U1 ≤ 0` (key held at session end — structural, not random)
- Drop rows where `D1D2 ≤ 0`
- Remove duplicates
- Validate emotionIndex labels

### Missing value strategy

| Column | Missingness | Action |
|---|---|---|
| `keyUp` | 2.8% | Drop — structurally missing (key held at end) |
| `D1U2`, `D1D2` | 0.6% | Drop row — required for features |
| `answer` | 59.9% | Keep — only present for correctness subset |
| `TotTime` (freq) | 49.1% | Fill with median per emotion group |

---

## Stage 2 — Feature Engineering

**Notebook:** `02_feature_engineering.ipynb`  
**Output:** `data/processed/final_features.csv`

### Feature definitions

| Feature | Formula | Interpretation |
|---|---|---|
| `mean_dwell` | mean(D1U1) per session | How long keys are held — reflects motor tension |
| `median_flight` | median(D1D2) per session | Rhythm of key transitions — robust to outliers |
| `cv_flight` | std(D1D2) / mean(D1D2) | Variability of typing rhythm — high under stress |
| `mean_del_freq` | mean(delFreq) per session | Error/correction rate |
| `mean_tot_time` | mean(TotTime) per session | Session pace — happy users finish fastest |

### Dropped features and rationale

| Feature | Reason |
|---|---|
| `mean_flight` | r = 0.72 with `mean_tot_time` — redundant |
| `std_flight` | r = 0.94 with `cv_flight` — same signal |
| `std_dwell` | r = 0.37 with `mean_dwell`, low F-score |

### Outlier handling
IQR clipping at 1.5× IQR applied to `mean_dwell`, `median_flight`, and `cv_flight`
after group-level aggregation. Delete frequency and total time are left unclipped
as extreme values carry real signal (angry users may have many deletes).

---

## Stage 3 — EDA

**Notebook:** `03_eda_analysis.ipynb`

### Key findings

1. **Angry** users show the shortest flight time (239ms) and dwell time (88.6ms).
   Fast, sharp keypresses are a reliable signal of heightened arousal.

2. **Sad** users type slowest (292ms flight, 104ms dwell) with the fewest corrections.
   Consistent with reduced motor energy under low arousal.

3. **Happy** users complete sessions fastest (52.8s avg total time).
   Positive affect correlates with fluent, uninterrupted text production.

4. **Neutral** dominates the corpus (59% of fixed-text keystrokes).
   Class imbalance is the primary pre-training concern.

5. **D1D2 and D1D3** are highly correlated (r = 0.72) — only one needed.

---

## Stage 4 — Model Training

**Script:** `train_model.py`  
**Outputs:** `model/mindtype_model.pkl`, `model/encoder.pkl`, `model/metadata.json`

**Train locally:**
```bash
python train_model.py
```

**Experimental notebook model:**
```bash
python save_model.py
```
This saves an additional stress-level artifact to `model/stress_model.pkl` for notebook-based experiments.
The backend now supports both the production emotion classifier and this extended stress-level model via `/predict/extended` when the artifact is present.

### Algorithm selection

| Model | CV Accuracy | Test Accuracy | Macro F1 |
|---|---|---|---|
| Random Forest (200 trees) | **80.54%** | **83.61%** | **79.24%** |

The current implementation trains a Random Forest on the five engineered features.

### Training procedure
1. `StandardScaler` fit on the training features
2. `RandomForestClassifier(n_estimators=200, class_weight='balanced')`
3. Stratified 5-fold cross-validation on the training set
4. Holdout test split for final evaluation

---

## Stage 5 — Model Evaluation

**Evaluation metadata:** `model/metadata.json`

### Evaluation summary

The current trained model was evaluated on a held-out test split after training.
Results from the saved metadata are:

| Metric | Value |
|---|---|
| Test accuracy | **83.61%** |
| Macro F1 score | **79.24%** |
| Binary stress F1 | **91.89%** |
| Training samples | **303** |

### Notes
- The model is a Random Forest with 200 trees.
- The evaluation dataset is a holdout split from the processed feature set.
- Binary stress detection groups `Angry` and `Sad` as the stressed class.

---

## Stage 6 — Decision Engine

**Module:** `inference/decision_engine.py`

### Stress score
```
stress_score = (P(Angry) + P(Sad)) × 100  ∈ [0, 100]
```

### Stress levels
| Range | Level |
|---|---|
| 0 – 34.9 | Low |
| 35 – 54.9 | Medium |
| 55 – 100 | High |

### Hidden stress detection
```
divergence = (stress_score / 100) − (survey_score / 10)
hidden_stress = divergence > 0.20
```

| Model | Survey | Interpretation |
|---|---|---|
| High | High | Confirmed stress |
| High | Low | **Hidden stress** — alert triggered |
| Low | High | Psychological stress, no behavioral marker |
| Low | Low | Baseline confirmed |

---

## Stage 7 — Recommendation System

**Module:** `inference/recommendation.py`

Rules are keyed on `(stress_level, dominant_emotion)`.
Hidden stress prepends a priority-0 alert.

| Trigger | Recommendations |
|---|---|
| High + Angry | Break → Box breathing → Posture |
| High + Sad | Social contact → Easier task → Movement |
| Medium (any) | Micro-break → Prioritize |
| Low (any) | Positive confirmation only |
| Hidden stress | Divergence alert (prepended) |

---

## Stage 8 — REST API

**Module:** `backend/main.py`  
**Run:** `uvicorn backend.main:app --host 0.0.0.0 --port 8000`

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Service status and endpoints |
| `/health` | GET | API and model health check |
| `/survey/questions` | GET | Retrieve survey questions |
| `/predict` | POST | Predict emotion and stress from keystroke features |
| `/survey` | POST | Score self-report survey answers |
| `/analyze` | POST | Compare model and survey for hidden stress |
| `/history` | GET | Retrieve recent prediction/survey history |
| `/ws/stream` | WS | Real-time simulation stream |

---

## Stage 9 — Dashboard

**Module:** `frontend/app.py`  
**Run:** `streamlit run frontend/app.py --server.port 8501`  
**Requires:** API running on `localhost:8000`

Components:
- `frontend/pages/1_Survey.py` — Survey page and score interpreter
- `frontend/pages/2_Live_Prediction.py` — Live prediction and simulation
- `frontend/pages/3_Comparison.py` — Model vs survey comparison
- `frontend/pages/4_History.py` — History timeline and charts

Falls back to demo mode if the API is offline.

---

## Running the Full Stack

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the API (terminal 1)
uvicorn backend.main:app --host 0.0.0.0 --port 8000

# 3. Start the dashboard (terminal 2)
streamlit run frontend/app.py --server.port 8501

# 4. Open browser
#    Dashboard: http://localhost:8501
#    API docs:  http://localhost:8000/docs
```

