import json
import pickle
import sys
import time
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

if "numpy._core" not in sys.modules:
    import numpy.core as _np_core
    sys.modules["numpy._core"] = _np_core

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "model" / "mindtype_model.pkl"
METADATA_PATH = ROOT / "model" / "metadata.json"

EMOTION_LABELS = {"A": "Angry", "C": "Calm", "H": "Happy", "N": "Neutral", "S": "Sad"}
STRESS_CLASSES = {"A", "S"}
FEATURE_NAMES = ["mean_dwell", "median_flight", "cv_flight", "mean_del_freq", "mean_tot_time"]

_model_artifact = None
_model_metadata = None


def load_model():
    global _model_artifact, _model_metadata
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")
    with open(MODEL_PATH, "rb") as f:
        _model_artifact = pickle.load(f)
    if METADATA_PATH.exists():
        with open(METADATA_PATH) as f:
            _model_metadata = json.load(f)


def predict(features: dict) -> dict:
    X = np.array([[features[f] for f in FEATURE_NAMES]])
    probs = _model_artifact["model"].predict_proba(X)[0]
    classes = _model_artifact["classes"]
    probs_dict = {c: round(float(p), 4) for c, p in zip(classes, probs)}
    dominant = max(probs_dict, key=probs_dict.get)
    stress_pct = round(sum(probs_dict.get(c, 0) for c in STRESS_CLASSES) * 100, 2)
    return {"probs": probs_dict, "dominant": dominant, "stress_pct": stress_pct}


class PredictStressInput(BaseModel):
    mean_dwell: float = Field(..., gt=0)
    median_flight: float = Field(..., gt=0)
    cv_flight: float = Field(..., ge=0)
    mean_del_freq: float = Field(..., ge=0)
    mean_tot_time: float = Field(..., gt=0)
    n_keys: int = Field(default=0, ge=0)
    user_id: Optional[str] = None


app = FastAPI(title="MindType AI — ML Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def startup():
    load_model()


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": _model_artifact is not None,
        "ts": time.time(),
    }


@app.post("/predict-stress")
def predict_stress(inp: PredictStressInput):
    feat = inp.model_dump(exclude={"user_id", "n_keys"})
    res = predict(feat)
    score = min(res["stress_pct"] / 100.0, 1.0)
    dominant = res["dominant"]
    confidence = res["probs"][dominant]
    version = _model_metadata.get("version", "1.0.0") if _model_metadata else "1.0.0"
    return {
        "score": round(score, 4),
        "confidence": round(confidence, 4),
        "model_version": f"mindtype-ai-v{version}",
        "label": EMOTION_LABELS.get(dominant),
        "metadata": json.dumps({"features_used": FEATURE_NAMES, "dominant": dominant}),
    }
