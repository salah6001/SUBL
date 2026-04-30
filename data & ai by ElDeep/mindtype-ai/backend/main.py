"""
MindType AI — Backend API
==========================
FastAPI service with:
  POST /predict   — keystroke features → emotion + stress + recommendations
  POST /survey    — Likert answers → survey stress score
  POST /analyze   — merge model + survey → divergence + hidden stress
  GET  /history   — session history for dashboard
  WS   /ws/stream — WebSocket real-time simulation stream

Run: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
"""

import asyncio
import json
import math
import os
import pickle
import random
import sqlite3
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import sys
import numpy as np

# Compatibility shim for pickles created with older NumPy versions that used
# the internal module path `numpy._core`. Current NumPy exposes `numpy.core`.
if "numpy._core" not in sys.modules:
    import numpy.core as _np_core
    sys.modules["numpy._core"] = _np_core

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────

ROOT       = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "model" / "mindtype_model.pkl"
DB_PATH    = ROOT / "data"  / "mindtype.db"

# ─────────────────────────────────────────────────────────────
# Database
# ─────────────────────────────────────────────────────────────

def get_db():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id           TEXT PRIMARY KEY,
            ts           REAL NOT NULL,
            emotion      TEXT,
            stress_score REAL,
            stress_level TEXT,
            survey_score REAL,
            hidden_stress INTEGER DEFAULT 0,
            divergence   REAL,
            features     TEXT,
            source       TEXT DEFAULT 'predict'
        );
        CREATE TABLE IF NOT EXISTS survey_responses (
            id    TEXT PRIMARY KEY,
            ts    REAL NOT NULL,
            score REAL,
            level TEXT,
            answers TEXT
        );
    """)
    conn.commit()
    conn.close()


def db_insert_session(row: dict):
    conn = get_db()
    conn.execute("""
        INSERT OR REPLACE INTO sessions
        (id, ts, emotion, stress_score, stress_level, survey_score,
         hidden_stress, divergence, features, source)
        VALUES (:id,:ts,:emotion,:stress_score,:stress_level,:survey_score,
                :hidden_stress,:divergence,:features,:source)
    """, row)
    conn.commit()
    conn.close()


def db_insert_survey(row: dict):
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO survey_responses (id,ts,score,level,answers) VALUES (?,?,?,?,?)",
        (row["id"], row["ts"], row["score"], row["level"], row["answers"])
    )
    conn.commit()
    conn.close()


def db_get_history(limit=60):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM sessions ORDER BY ts DESC LIMIT ?", (limit,)
    ).fetchall()
    surveys = conn.execute(
        "SELECT * FROM survey_responses ORDER BY ts DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows], [dict(s) for s in surveys]

# ─────────────────────────────────────────────────────────────
# Model loading
# ─────────────────────────────────────────────────────────────

_predictor = None

def load_model():
    global _predictor
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")
    with open(MODEL_PATH, "rb") as f:
        _predictor = pickle.load(f)

FEATURE_NAMES   = ["mean_dwell", "median_flight", "cv_flight", "mean_del_freq", "mean_tot_time"]
EMOTION_LABELS  = {"A": "Angry", "C": "Calm", "H": "Happy", "N": "Neutral", "S": "Sad"}
EMOTION_EMOJI   = {"A": "😠", "C": "😌", "H": "😊", "N": "😐", "S": "😢"}
STRESS_CLASSES  = {"A", "S"}

def model_predict(features: dict) -> dict:
    X      = np.array([[features[f] for f in FEATURE_NAMES]])
    probs  = _predictor["model"].predict_proba(X)[0]
    codes  = _predictor["classes"]
    le     = _predictor["label_encoder"]
    probs_d = {c: round(float(p), 4) for c, p in zip(codes, probs)}
    dominant = max(probs_d, key=probs_d.get)
    stress   = round(sum(probs_d.get(c, 0) for c in STRESS_CLASSES) * 100, 2)
    return {"probs": probs_d, "dominant": dominant, "stress_score": stress}

# ─────────────────────────────────────────────────────────────
# Decision & recommendation logic
# ─────────────────────────────────────────────────────────────

THRESHOLD_MEDIUM = 35.0
THRESHOLD_HIGH   = 55.0
HIDDEN_DELTA     = 0.20

def stress_level(score: float) -> str:
    if score >= THRESHOLD_HIGH:   return "high"
    if score >= THRESHOLD_MEDIUM: return "medium"
    return "low"

def divergence_check(model_score: float, survey_score: float):
    div    = round(model_score / 100 - survey_score / 10, 4)
    hidden = div > HIDDEN_DELTA
    return div, hidden

RECS = {
    ("high",   "A"): [
        {"type": "break",   "title": "خذ استراحة 5 دقائق",         "en": "Take a 5-min break",          "icon": "☕"},
        {"type": "breath",  "title": "تمرين التنفس (4-4-4-4)",     "en": "Box breathing exercise",       "icon": "🌬"},
        {"type": "posture", "title": "ارخِ عضلاتك",                 "en": "Release physical tension",     "icon": "🧘"},
    ],
    ("high",   "S"): [
        {"type": "social",  "title": "تواصل مع زميل",              "en": "Reach out to a colleague",     "icon": "💬"},
        {"type": "task",    "title": "انتقل لمهمة أسهل",           "en": "Switch to an easier task",     "icon": "📋"},
        {"type": "break",   "title": "اشرب ماء وتحرك",             "en": "Hydration & movement",         "icon": "🚶"},
    ],
    ("medium", None): [
        {"type": "breath",  "title": "استراحة قصيرة (دقيقتان)",    "en": "Micro-break (2 min)",          "icon": "⏸"},
        {"type": "task",    "title": "رتب أولوياتك",               "en": "Prioritize your tasks",        "icon": "📝"},
    ],
    ("low",    None): [
        {"type": "positive","title": "حالتك ممتازة! استمر",        "en": "Wellbeing looks great!",       "icon": "✅"},
    ],
}
HIDDEN_REC = {"type": "hidden", "title": "تحذير: توتر خفي مكتشف!",
              "en": "Hidden stress detected!", "icon": "⚠️"}

def get_recs(level: str, dominant: str, hidden: bool) -> List[dict]:
    key  = (level, dominant)
    recs = list(RECS.get(key) or RECS.get((level, None), []))
    if hidden:
        recs = [HIDDEN_REC] + recs
    return recs

# ─────────────────────────────────────────────────────────────
# Survey scoring
# ─────────────────────────────────────────────────────────────

SURVEY_QUESTIONS = [
    {"id": "q1", "text": "ما مدى شعورك بالتوتر الآن؟",            "en": "How stressed do you feel right now?"},
    {"id": "q2", "text": "كيف مستوى صعوبة التركيز لديك؟",         "en": "How difficult is it to concentrate?"},
    {"id": "q3", "text": "هل تشعر بالإرهاق الذهني؟",              "en": "Do you feel mentally overwhelmed?"},
    {"id": "q4", "text": "ما مستوى القلق الذي تشعر به؟",          "en": "How anxious do you feel?"},
    {"id": "q5", "text": "هل تشعر بضغط ناتج عن المهام الحالية؟", "en": "Do you feel pressure from current tasks?"},
]

def score_survey(answers: dict) -> dict:
    vals  = [answers.get(q["id"], 3) for q in SURVEY_QUESTIONS]
    avg   = sum(vals) / len(vals)
    score = round(avg * 2, 2)         # 0-10 scale
    level = "high" if score >= 7 else "medium" if score >= 4 else "low"
    interp = {
        "low":    "مستوى التوتر منخفض — حالتك النفسية جيدة",
        "medium": "توتر معتدل — يُنصح ببعض الاسترخاء",
        "high":   "توتر مرتفع — تحتاج إلى تدخل فوري",
    }
    return {
        "score": score, "level": level,
        "interpretation": interp[level],
        "breakdown": {q["id"]: v for q, v in zip(SURVEY_QUESTIONS, vals)},
    }

# ─────────────────────────────────────────────────────────────
# Simulation generator
# ─────────────────────────────────────────────────────────────

PROFILES = {
    "calm":         dict(dwell=(75,115),  flight=(190,300), cv=(0.5,0.9),  del_f=(4,9),   tot=(55000,75000)),
    "stressed":     dict(dwell=(60,95),   flight=(150,250), cv=(0.6,1.2),  del_f=(6,15),  tot=(50000,70000)),
    "hidden_stress":dict(dwell=(90,130),  flight=(220,360), cv=(0.8,1.8),  del_f=(2,8),   tot=(60000,90000)),
    "angry_spike":  dict(dwell=(55,90),   flight=(140,230), cv=(0.5,0.95), del_f=(5,14),  tot=(45000,65000)),
}

def random_features(profile="calm") -> dict:
    p = PROFILES.get(profile, PROFILES["calm"])
    def r(lo, hi): return round(random.uniform(lo, hi), 3)
    return {
        "mean_dwell":    r(*p["dwell"]),
        "median_flight": r(*p["flight"]),
        "cv_flight":     r(*p["cv"]),
        "mean_del_freq": r(*p["del_f"]),
        "mean_tot_time": r(*p["tot"]),
    }

# ─────────────────────────────────────────────────────────────
# App startup
# ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    load_model()
    yield

app = FastAPI(title="MindType AI", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────

class FeatureInput(BaseModel):
    mean_dwell:    float = Field(..., gt=0)
    median_flight: float = Field(..., gt=0)
    cv_flight:     float = Field(..., ge=0)
    mean_del_freq: float = Field(..., ge=0)
    mean_tot_time: float = Field(..., gt=0)
    user_id:       Optional[str] = None

class SurveyInput(BaseModel):
    q1: int = Field(..., ge=1, le=5)
    q2: int = Field(..., ge=1, le=5)
    q3: int = Field(..., ge=1, le=5)
    q4: int = Field(..., ge=1, le=5)
    q5: int = Field(..., ge=1, le=5)
    user_id: Optional[str] = None

class AnalyzeInput(BaseModel):
    features: FeatureInput
    survey:   SurveyInput

# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "MindType AI API v2.0", "endpoints": ["/predict","/survey","/analyze","/history","/ws/stream"]}

@app.get("/health")
def health():
    return {"status": "healthy", "model": "loaded", "db": str(DB_PATH), "ts": time.time()}

@app.get("/survey/questions")
def survey_questions():
    return {"questions": SURVEY_QUESTIONS}


@app.post("/predict")
def يعpredict(inp: FeatureInput):
    feat = inp.model_dump(exclude={"user_id"})
    res  = model_predict(feat)
    lvl  = stress_level(res["stress_score"])
    recs = get_recs(lvl, res["dominant"], False)
    sid  = str(uuid.uuid4())[:8]

    db_insert_session({
        "id": sid, "ts": time.time(),
        "emotion": res["dominant"],
        "stress_score": res["stress_score"],
        "stress_level": lvl,
        "survey_score": None, "hidden_stress": 0, "divergence": None,
        "features": json.dumps(feat), "source": "predict",
    })

    return {
        "session_id":     sid,
        "emotion":        res["dominant"],
        "emotion_label":  EMOTION_LABELS[res["dominant"]],
        "emotion_emoji":  EMOTION_EMOJI[res["dominant"]],
        "emotion_probs":  res["probs"],
        "stress_score":   res["stress_score"],
        "stress_level":   lvl,
        "recommendations": recs,
        "timestamp":      datetime.now().isoformat(),
    }


@app.post("/survey")
def survey(inp: SurveyInput):
    answers = inp.model_dump(exclude={"user_id"})
    result  = score_survey(answers)
    sid     = str(uuid.uuid4())[:8]

    db_insert_survey({
        "id": sid, "ts": time.time(),
        "score": result["score"], "level": result["level"],
        "answers": json.dumps(answers),
    })

    return {"survey_id": sid, **result, "timestamp": datetime.now().isoformat()}


@app.post("/analyze")
def analyze(inp: AnalyzeInput):
    feat    = inp.features.model_dump(exclude={"user_id"})
    answers = inp.survey.model_dump(exclude={"user_id"})

    m_res  = model_predict(feat)
    s_res  = score_survey(answers)
    div, hidden = divergence_check(m_res["stress_score"], s_res["score"])
    m_lvl  = stress_level(m_res["stress_score"])
    recs   = get_recs(m_lvl, m_res["dominant"], hidden)

    # Combined level — take the worse of the two
    levels = {"low": 0, "medium": 1, "high": 2}
    s_lvl  = s_res["level"]
    combined = max([m_lvl, s_lvl], key=lambda x: levels[x])

    sid = str(uuid.uuid4())[:8]
    db_insert_session({
        "id": sid, "ts": time.time(),
        "emotion": m_res["dominant"],
        "stress_score": m_res["stress_score"],
        "stress_level": m_lvl,
        "survey_score": s_res["score"],
        "hidden_stress": int(hidden),
        "divergence": div,
        "features": json.dumps(feat),
        "source": "analyze",
    })

    hidden_msg = ""
    if hidden:
        hidden_msg = "⚠️ تم اكتشاف توتر خفي! نماذجك السلوكية تكشف توتراً أعلى مما ذكرته في الاستبيان."
    elif div < -0.15:
        hidden_msg = "ℹ️ الاستبيان يُشير لتوتر أعلى مما تُظهره أنماط الكتابة — قد يكون التوتر نفسياً بحتاً."

    return {
        "session_id":      sid,
        "model_stress":    m_res["stress_score"],
        "model_level":     m_lvl,
        "model_emotion":   m_res["dominant"],
        "model_emotion_label": EMOTION_LABELS[m_res["dominant"]],
        "model_probs":     m_res["probs"],
        "survey_score":    s_res["score"],
        "survey_level":    s_lvl,
        "survey_interpretation": s_res["interpretation"],
        "divergence":      div,
        "hidden_stress":   hidden,
        "hidden_message":  hidden_msg,
        "combined_level":  combined,
        "recommendations": recs,
        "timestamp":       datetime.now().isoformat(),
    }


@app.get("/history")
def history(limit: int = 50):
    sessions, surveys = db_get_history(limit)

    if sessions:
        scores   = [s["stress_score"] for s in sessions if s["stress_score"] is not None]
        emotions = [s["emotion"] for s in sessions if s["emotion"]]
        dom_emo  = max(set(emotions), key=emotions.count) if emotions else "N"
        summary  = {
            "total_sessions":  len(sessions),
            "avg_stress":      round(sum(scores)/len(scores), 1) if scores else 0,
            "peak_stress":     round(max(scores), 1) if scores else 0,
            "dominant_emotion": dom_emo,
            "dominant_label":  EMOTION_LABELS.get(dom_emo, "Neutral"),
            "hidden_stress_count": sum(1 for s in sessions if s.get("hidden_stress")),
        }
    else:
        summary = {"total_sessions": 0, "avg_stress": 0, "peak_stress": 0,
                   "dominant_emotion": "N", "dominant_label": "Neutral", "hidden_stress_count": 0}

    return {"sessions": sessions, "surveys": surveys, "summary": summary}


@app.delete("/history")
def clear_history():
    conn = get_db()
    conn.execute("DELETE FROM sessions")
    conn.execute("DELETE FROM survey_responses")
    conn.commit()
    conn.close()
    return {"status": "cleared"}

# ─────────────────────────────────────────────────────────────
# WebSocket — real-time simulation stream
# ─────────────────────────────────────────────────────────────

@app.websocket("/ws/stream")
async def ws_stream(websocket: WebSocket):
    """
    Streams simulated keystroke predictions every 500ms.
    Client sends: {"profile": "calm"|"stressed"|"hidden_stress"|"angry_spike", "survey_score": 3}
    Server sends: prediction JSON every 500ms
    """
    await websocket.accept()
    profile      = "calm"
    survey_score = 3.0
    step         = 0

    try:
        # Read initial config (non-blocking)
        try:
            cfg = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
            profile      = cfg.get("profile", "calm")
            survey_score = float(cfg.get("survey_score", 3))
        except asyncio.TimeoutError:
            pass

        while True:
            # Check for config updates
            try:
                cfg = await asyncio.wait_for(websocket.receive_json(), timeout=0.0)
                profile      = cfg.get("profile", profile)
                survey_score = float(cfg.get("survey_score", survey_score))
            except (asyncio.TimeoutError, Exception):
                pass

            feat  = random_features(profile)
            res   = model_predict(feat)
            lvl   = stress_level(res["stress_score"])
            div, hidden = divergence_check(res["stress_score"], survey_score)
            recs  = get_recs(lvl, res["dominant"], hidden)

            payload = {
                "step":          step,
                "ts":            time.time(),
                "emotion":       res["dominant"],
                "emotion_label": EMOTION_LABELS[res["dominant"]],
                "emotion_emoji": EMOTION_EMOJI[res["dominant"]],
                "stress_score":  res["stress_score"],
                "stress_level":  lvl,
                "survey_score":  round(survey_score * 10, 1),
                "divergence":    div,
                "hidden_stress": hidden,
                "top_rec":       recs[0] if recs else None,
                "probs":         res["probs"],
            }
            await websocket.send_json(payload)
            step += 1
            await asyncio.sleep(0.5)

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
