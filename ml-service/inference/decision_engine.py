"""
MindType AI — Decision Engine
================================
Converts raw model output (emotion probabilities) into a
structured decision: stress score, stress level, divergence
detection, hidden stress flag, and recommendations.

This module is the single source of truth for all business logic
thresholds. Change thresholds here and the whole pipeline updates.
"""

from typing import Dict, List, Optional, Tuple
from .recommendation import get_recommendations


# ─────────────────────────────────────────────
# Thresholds (single source of truth)
# ─────────────────────────────────────────────

STRESS_CLASSES           = {"A", "S"}       # Angry + Sad contribute to stress score
THRESHOLD_STRESS_MEDIUM  = 35.0             # score >= this → medium
THRESHOLD_STRESS_HIGH    = 55.0             # score >= this → high
THRESHOLD_HIDDEN_STRESS  = 0.20             # divergence (model - survey, 0-1) above this → hidden


# ─────────────────────────────────────────────
# Core decision logic
# ─────────────────────────────────────────────

def compute_stress_score(emotion_probs: Dict[str, float]) -> float:
    """
    Compute 0–100 stress score from emotion probability dict.

    stress_score = (P(Angry) + P(Sad)) × 100
    """
    return round(
        sum(emotion_probs.get(c, 0.0) for c in STRESS_CLASSES) * 100,
        2,
    )


def classify_stress_level(stress_score: float) -> str:
    """Map a 0–100 stress score to a categorical level."""
    if stress_score >= THRESHOLD_STRESS_HIGH:
        return "high"
    if stress_score >= THRESHOLD_STRESS_MEDIUM:
        return "medium"
    return "low"


def compute_divergence(
    stress_score: float,
    survey_score: Optional[float],
) -> Tuple[Optional[float], bool]:
    """
    Compute model–survey divergence and hidden-stress flag.

    Parameters
    ----------
    stress_score : float  (0–100 model stress score)
    survey_score : float | None  (0–10 self-reported)

    Returns
    -------
    (divergence, hidden_stress)
        divergence   : float on −1 to +1 scale, or None if survey absent
        hidden_stress: True if divergence exceeds THRESHOLD_HIDDEN_STRESS
    """
    if survey_score is None:
        return None, False
    model_norm  = stress_score / 100.0
    survey_norm = float(survey_score) / 10.0
    divergence  = round(model_norm - survey_norm, 4)
    return divergence, divergence > THRESHOLD_HIDDEN_STRESS


def dominant_emotion(emotion_probs: Dict[str, float]) -> str:
    """Return the emotion code with the highest probability."""
    return max(emotion_probs, key=emotion_probs.get)


def run(
    emotion_probs: Dict[str, float],
    survey_score: Optional[float] = None,
) -> Dict:
    """
    Full decision pass — combines all sub-functions.

    Parameters
    ----------
    emotion_probs : dict  {emotion_code: probability}
    survey_score  : float | None  (0–10)

    Returns
    -------
    dict with keys:
        stress_score, stress_level, dominant_emotion,
        divergence, hidden_stress, recommendations
    """
    score      = compute_stress_score(emotion_probs)
    level      = classify_stress_level(score)
    dominant   = dominant_emotion(emotion_probs)
    div, hidden = compute_divergence(score, survey_score)
    recs       = get_recommendations(level, dominant, hidden)

    return {
        "stress_score":    score,
        "stress_level":    level,
        "dominant_emotion": dominant,
        "divergence":      div,
        "hidden_stress":   hidden,
        "recommendations": recs,
    }
