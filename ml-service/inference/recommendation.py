"""
MindType AI — Recommendation Engine
=====================================
Maps stress level, dominant emotion, and divergence status
to a prioritized list of actionable wellbeing recommendations.
"""

from typing import Dict, List, Optional


# ─────────────────────────────────────────────
# Recommendation catalogue
# ─────────────────────────────────────────────

_RULES: Dict[tuple, List[Dict]] = {
    ("high", "A"): [
        {"type": "break",   "priority": 1,
         "title": "Take a 5-minute break",
         "desc":  "Angry typing patterns detected. Step away briefly to reset your focus."},
        {"type": "breath",  "priority": 2,
         "title": "Box breathing (4-4-4-4)",
         "desc":  "Inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4 times."},
        {"type": "posture", "priority": 3,
         "title": "Release physical tension",
         "desc":  "Roll your shoulders, unclench your jaw, and relax your hands."},
    ],
    ("high", "S"): [
        {"type": "social", "priority": 1,
         "title": "Reach out to a colleague",
         "desc":  "Sad behavioral patterns detected. Brief social contact can help."},
        {"type": "task",   "priority": 2,
         "title": "Switch to an easier task",
         "desc":  "Reduce cognitive load. Choose a lighter, structured task for 10 minutes."},
        {"type": "break",  "priority": 3,
         "title": "Hydration & movement",
         "desc":  "Stand up, drink water, and take a short walk around the room."},
    ],
    ("medium", None): [
        {"type": "breath", "priority": 1,
         "title": "Micro-break (2 min)",
         "desc":  "Stress is building. A short pause now prevents escalation."},
        {"type": "task",   "priority": 2,
         "title": "Prioritize your task list",
         "desc":  "Pick the single most important item and focus on that only."},
    ],
    ("low", None): [
        {"type": "positive", "priority": 1,
         "title": "Wellbeing looks good",
         "desc":  "Calm, focused typing patterns. No action required — keep going."},
    ],
}

_HIDDEN_STRESS_REC: Dict = {
    "type":     "hidden",
    "priority": 0,
    "title":    "Hidden stress pattern detected",
    "desc": (
        "Your behavioral signals indicate significantly higher stress than self-reported. "
        "This may reflect suppressed or unnoticed tension. Consider a short break."
    ),
}


# ─────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────

def get_recommendations(
    stress_level: str,
    dominant_emotion: str,
    hidden_stress: bool = False,
) -> List[Dict]:
    """
    Return a prioritized list of recommendations.

    Parameters
    ----------
    stress_level     : 'low' | 'medium' | 'high'
    dominant_emotion : emotion code 'A' | 'C' | 'H' | 'N' | 'S'
    hidden_stress    : True if model–survey divergence exceeds threshold

    Returns
    -------
    List of recommendation dicts, sorted by priority (0 = most urgent).
    Each dict has keys: type, priority, title, desc.
    """
    key = (stress_level, dominant_emotion)
    recs = list(_RULES.get(key) or _RULES.get((stress_level, None), []))

    if hidden_stress:
        recs = [dict(_HIDDEN_STRESS_REC)] + recs

    return sorted(recs, key=lambda r: r["priority"])


def get_recommendation_types() -> List[str]:
    """Return all possible recommendation type codes."""
    return ["hidden", "break", "breath", "posture", "social", "task", "positive"]
