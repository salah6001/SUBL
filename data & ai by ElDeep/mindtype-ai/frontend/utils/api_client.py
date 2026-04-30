"""
MindType AI — API Client
=========================
Centralised HTTP calls from Streamlit to FastAPI backend.
Falls back gracefully if API is offline.
"""

import random
import time
from typing import Optional
import requests

API_BASE = "http://localhost:8000"
TIMEOUT  = 5


def _post(path: str, data: dict) -> Optional[dict]:
    try:
        r = requests.post(f"{API_BASE}{path}", json=data, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None


def _get(path: str, params: dict = None) -> Optional[dict]:
    try:
        r = requests.get(f"{API_BASE}{path}", params=params, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None


def api_health() -> bool:
    try:
        r = requests.get(f"{API_BASE}/health", timeout=2)
        return r.status_code == 200
    except Exception:
        return False


def api_predict(features: dict) -> Optional[dict]:
    return _post("/predict", features)


def api_survey(answers: dict) -> Optional[dict]:
    return _post("/survey", answers)


def api_analyze(features: dict, survey_answers: dict) -> Optional[dict]:
    return _post("/analyze", {"features": features, "survey": survey_answers})


def api_history(limit: int = 50) -> Optional[dict]:
    return _get("/history", {"limit": limit})


def api_clear_history() -> bool:
    try:
        r = requests.delete(f"{API_BASE}/history", timeout=TIMEOUT)
        return r.status_code == 200
    except Exception:
        return False


def api_questions() -> list:
    res = _get("/survey/questions")
    if res:
        return res.get("questions", [])
    return [
        {"id": "q1", "text": "ما مدى شعورك بالتوتر الآن؟",            "en": "How stressed do you feel?"},
        {"id": "q2", "text": "كيف مستوى صعوبة التركيز لديك؟",         "en": "How hard to concentrate?"},
        {"id": "q3", "text": "هل تشعر بالإرهاق الذهني؟",              "en": "Feeling mentally overwhelmed?"},
        {"id": "q4", "text": "ما مستوى القلق الذي تشعر به؟",          "en": "How anxious do you feel?"},
        {"id": "q5", "text": "هل تشعر بضغط ناتج عن المهام الحالية؟", "en": "Pressure from current tasks?"},
    ]


# ── Simulation helper (no API needed) ──
PROFILES = {
    "😌 هادئ (Calm)":          "calm",
    "😟 متوتر (Stressed)":     "stressed",
    "⚠️ توتر خفي (Hidden)":   "hidden_stress",
    "😠 غضب (Angry Spike)":   "angry_spike",
}

SIM_PARAMS = {
    "calm":         dict(dwell=(75,115),  flight=(190,300), cv=(0.5,0.9),  del_f=(4,9),   tot=(55000,75000)),
    "stressed":     dict(dwell=(60,95),   flight=(150,250), cv=(0.6,1.2),  del_f=(6,15),  tot=(50000,70000)),
    "hidden_stress":dict(dwell=(90,130),  flight=(220,360), cv=(0.8,1.8),  del_f=(2,8),   tot=(60000,90000)),
    "angry_spike":  dict(dwell=(55,90),   flight=(140,230), cv=(0.5,0.95), del_f=(5,14),  tot=(45000,65000)),
}

def simulate_features(profile: str = "calm") -> dict:
    p = SIM_PARAMS.get(profile, SIM_PARAMS["calm"])
    def r(lo, hi): return round(random.uniform(lo, hi), 3)
    return {
        "mean_dwell":    r(*p["dwell"]),
        "median_flight": r(*p["flight"]),
        "cv_flight":     r(*p["cv"]),
        "mean_del_freq": r(*p["del_f"]),
        "mean_tot_time": r(*p["tot"]),
    }
