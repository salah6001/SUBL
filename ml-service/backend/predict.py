import pickle
from pathlib import Path
from typing import Dict

import numpy as np

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT.parent / "model" / "mindtype_model.pkl"

FEATURE_NAMES = [
    "mean_dwell",
    "median_flight",
    "cv_flight",
    "mean_del_freq",
    "mean_tot_time",
]


def load_artifact() -> Dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


def predict(features: Dict[str, float]) -> Dict:
    artifact = load_artifact()
    model = artifact["model"]

    X = np.array([[features[name] for name in FEATURE_NAMES]])
    probs = model.predict_proba(X)[0]
    classes = artifact["classes"]
    probs_dict = {c: float(round(p, 4)) for c, p in zip(classes, probs)}
    dominant = max(probs_dict, key=probs_dict.get)
    stress = float(round(sum(probs_dict.get(c, 0) for c in ["A", "S"]) * 100, 2))

    return {
        "emotion": dominant,
        "emotion_probs": probs_dict,
        "stress_score": stress,
        "stress_level": "high" if stress >= 55 else "medium" if stress >= 35 else "low",
    }


if __name__ == "__main__":
    sample = {
        "mean_dwell": 82.1,
        "median_flight": 215.0,
        "cv_flight": 0.92,
        "mean_del_freq": 7.1,
        "mean_tot_time": 63000.0,
    }
    result = predict(sample)
    print("Sample input:", sample)
    print("Prediction:", result)
