"""
MindType AI — Predictor
========================
Thin wrapper that loads the model artifact and delegates
all business logic to decision_engine and recommendation modules.
"""

import pickle
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

from .decision_engine import run as decide

FEATURE_NAMES = [
    "mean_dwell",
    "median_flight",
    "cv_flight",
    "mean_del_freq",
    "mean_tot_time",
]

EMOTION_LABELS = {
    "A": "Angry", "C": "Calm",
    "H": "Happy", "N": "Neutral", "S": "Sad",
}


class MindTypePredictor:
    """
    Load the trained pipeline and run end-to-end predictions.

    Usage
    -----
        predictor = MindTypePredictor("model/mindtype_model.pkl")
        result    = predictor.predict(features, survey_score=3)
    """

    def __init__(self, model_path: str = "model/mindtype_model.pkl"):
        path = Path(model_path)
        if not path.exists():
            raise FileNotFoundError(f"Model not found: {path.resolve()}")
        with open(path, "rb") as f:
            artifacts = pickle.load(f)
        self.model         = artifacts["model"]
        self.label_encoder = artifacts["label_encoder"]
        self.feature_names = artifacts["feature_names"]
        self.classes_      = artifacts["classes"]
        self.version       = artifacts.get("model_version", "1.0.0")

    def predict(
        self,
        features: Dict[str, float],
        survey_score: Optional[float] = None,
    ) -> Dict:
        """
        Full prediction pass.

        Parameters
        ----------
        features     : dict with the 5 FEATURE_NAMES keys
        survey_score : float 0-10 or None

        Returns
        -------
        dict — see decision_engine.run() plus emotion_probs and labels
        """
        X = self._vectorise(features)
        probs_array   = self.model.predict_proba(X)[0]
        emotion_probs = {
            code: round(float(p), 4)
            for code, p in zip(self.classes_, probs_array)
        }

        decision = decide(emotion_probs, survey_score)

        return {
            "emotion_probs":   emotion_probs,
            "dominant_label":  EMOTION_LABELS.get(decision["dominant_emotion"], "?"),
            "survey_score":    survey_score,
            "model_version":   self.version,
            **decision,
        }

    def stress_only(self, features: Dict[str, float]) -> float:
        """Fastest path — returns just the 0-100 stress score."""
        X = self._vectorise(features)
        probs = self.model.predict_proba(X)[0]
        probs_dict = dict(zip(self.classes_, probs))
        from .decision_engine import compute_stress_score
        return compute_stress_score(probs_dict)

    def predict_batch(
        self,
        feature_rows: List[Dict[str, float]],
        survey_scores: Optional[List[float]] = None,
    ) -> List[Dict]:
        scores = survey_scores or [None] * len(feature_rows)
        return [self.predict(f, s) for f, s in zip(feature_rows, scores)]

    def _vectorise(self, features: Dict[str, float]) -> np.ndarray:
        missing = [f for f in FEATURE_NAMES if f not in features]
        if missing:
            raise ValueError(f"Missing features: {missing}")
        return np.array([[features[f] for f in FEATURE_NAMES]])
