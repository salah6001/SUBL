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
                    04_model_training ──► mindtype_model.pkl
                                         encoder.pkl
                                         metadata.json
                              │
                              ▼
                    05_model_evaluation ──► Performance metrics
                              │
                        ┌─────┴──────┐
                        ▼            ▼
                  inference/       api/
                  ├ inference.py   ├ app.py
                  ├ decision_engine├ routes.py
                  └ recommendation └ schemas.py
                        │
                        ▼
                  dashboard/app.py ──► Real-time UI
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

**Notebook:** `04_model_training.ipynb`  
**Outputs:** `model/mindtype_model.pkl`, `model/encoder.pkl`, `model/metadata.json`

### Algorithm selection

| Model | CV Accuracy | Macro F1 |
|---|---|---|
| Random Forest (200 trees) | **90.3%** | **90.3%** |
| Gradient Boosting | 88.0% | 88.1% |
| SVM (RBF) | 69.8% | 69.7% |
| Logistic Regression | 58.0% | 57.9% |

Logistic Regression at 58% confirms the class boundaries are non-linear.
Random Forest selected for its interpretability (feature importance) and
robustness (ensemble averaging reduces variance).

### Training procedure
1. SMOTE oversampling: minority classes upsampled to match Neutral (120 samples/class)
2. `StandardScaler` fit on training set only
3. `RandomForestClassifier(n_estimators=200, class_weight='balanced')`
4. Stratified 5-fold cross-validation with user IDs **not** shared across folds

---

## Stage 5 — Model Evaluation

**Notebook:** `05_model_evaluation.ipynb`

### Per-class performance (test set, n=120)

| Emotion | Precision | Recall | F1 |
|---|---|---|---|
| Angry | 0.92 | 0.92 | 0.92 |
| Calm | 0.88 | 0.96 | 0.92 |
| **Happy** | **1.00** | 0.96 | **0.98** |
| Neutral | 0.96 | 0.92 | 0.94 |
| Sad | 0.96 | 0.96 | 0.96 |

### Confusion analysis
Primary confusions: 2× Angry predicted as Neutral, 1× Calm as Sad.
Both are edge cases where behavioral signals overlap (focused neutral
typing can resemble controlled-anger typing in flight time).

### Binary stress detection (Angry + Sad vs rest)
Random Forest F1 = **0.913** — suitable for production alerting.

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

**Module:** `api/`  
**Run:** `uvicorn api.app:app --port 8000`

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Liveness check |
| `/model/info` | GET | Algorithm metadata |
| `/emotions` | GET | Behavioral reference data |
| `/predict` | POST | Single session — full output |
| `/predict/batch` | POST | Up to 100 sessions |
| `/predict/stream` | POST | Raw keystrokes → live stress |

---

## Stage 9 — Dashboard

**Module:** `dashboard/app.py`  
**Run:** `python dashboard/app.py`  
**Requires:** API running on `localhost:8000`

Components:
- `charts.py` — Plotly figure builders (gauge, bars, timeline, radar)
- `survey.py` — Self-report survey Dash layout fragment
- `realtime.py` — Keystroke buffer and polling helpers

Falls back to demo mode (random data) if API is offline.

---

## Running the Full Stack

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the API (terminal 1)
uvicorn api.app:app --host 0.0.0.0 --port 8000

# 3. Start the dashboard (terminal 2)
python dashboard/app.py

# 4. Open browser
#    Dashboard: http://localhost:8050
#    API docs:  http://localhost:8000/docs
```
هو كدا شغال في الخلفيه وبياخد الdata بتاغت الكلكات ويطلع النتائج من الداش بورد 




You are a senior AI engineer, systems architect, and full-stack developer.

Build a complete end-to-end graduation project called:

**"EmoType OS – Real-Time Emotion & Stress Detection Desktop System"**

The system must behave like a background desktop agent that monitors user behavior (keyboard + mouse) in real-time, learns personal patterns, detects stress, and visualizes insights in a dashboard and social feed.

---

## 🎯 CORE IDEA

A desktop agent runs in the background on the user’s laptop.
Once the user clicks "Start", it begins collecting behavioral signals (typing + mouse).
It builds a **personal baseline model per user**, then detects deviations (stress, fatigue, lack of focus).

---

## 🧠 ML SYSTEM (VERY IMPORTANT)

### 1. Dual Model Approach:

* Global Model:

  * Pretrained on dataset like DUX
  * Predicts general emotion (happy, neutral, stressed)
* Personal Model:

  * Trained ONLY on the user’s own data
  * Learns baseline behavior:

    * typing speed
    * key hold time
    * mouse movement patterns
  * Detects anomalies:

    * "Your behavior deviated from your normal pattern"

### 2. Techniques:

* Classification:

  * Decision Tree
  * KNN
  * Naive Bayes
* Personalization:

  * Rolling average baseline
  * Z-score anomaly detection
* Output:

  * emotion label
  * stress score (0–100)
  * deviation level

---

## 💻 DESKTOP AGENT (CORE FEATURE)

* Language: Python
* Runs in background (like system tray app)
* Features:

  * Start / Stop button
  * Runs automatically on OS startup
  * Captures:

    * Keystroke timing (NOT actual text for privacy)
    * Mouse movement speed and clicks
* Libraries:

  * pynput (keyboard & mouse)
  * threading / async loop

### Behavior:

* When user clicks START:

  * begin tracking
  * store data locally
* Every X seconds:

  * send data to backend for prediction

---

## ⚙️ BACKEND SYSTEM

### Architecture:

* FastAPI (ML service)
* Flask (Main API / Gateway)

### Responsibilities:

#### FastAPI:

* /predict → returns emotion + stress score
* loads trained global model (.pkl)

#### Flask:

* Auth (login/register)
* Store user data
* Store predictions history
* Provide dashboard APIs

### Database:

* PostgreSQL
  Tables:
* users
* behavior_logs
* predictions
* baseline_profiles

---

## 🌐 FRONTEND (WEB APP)

Use React.js

### Pages:

1. Dashboard:

   * stress timeline
   * charts (hourly/daily stress)
   * “You were stressed at 3:40 PM”
2. Live Status:

   * current emotion
3. Insights:

   * “Your typing speed dropped today”
   * “Your behavior changed from normal pattern”
4. Social Feed (VERY IMPORTANT):

   * Like Facebook timeline
   * Users can:

     * post: “I felt stressed today because…”
     * add tags (study, work, exams)
     * see tips
     * interact (likes)

---

## 🧩 SPECIAL FEATURE (WOW FACTOR)

* Personal AI Insight Engine:

  * compares today vs baseline
  * generates messages:

    * “You are less focused than usual”
    * “Your stress increased by 30% today”

---

## 🔐 PRIVACY (IMPORTANT)

* Do NOT store actual typed text
* Only store timing and patterns
* Explain this clearly in UI

---

## 📁 PROJECT STRUCTURE

Provide full structure:

/project-root
/ml
- training.ipynb
- model.pkl
/desktop-agent
- agent.py
/backend
/flask-app
/fastapi-app
/frontend
/react-app
/database
README.md

---

## 📊 BUSINESS SIDE

* Product name: EmoType OS
* Problem: Hidden stress & burnout
* Solution: passive emotion detection
* Target users:

  * students
  * developers
  * remote workers
* Monetization:

  * freemium dashboard
  * premium analytics
* Future:

  * integration with wearable devices

---

## 🎤 PRESENTATION

* Create a full demo scenario:

  * user starts agent
  * system detects stress
  * dashboard updates
* Provide talking points:

  * personalization
  * real-time detection
  * privacy-aware AI

---

## 🚀 REQUIREMENTS

* Clean code
* Modular structure
* Arabic comments in ML notebook
* Step-by-step explanation
* Ready for deployment

---

Build this as a real startup-level system, not just a school project.
