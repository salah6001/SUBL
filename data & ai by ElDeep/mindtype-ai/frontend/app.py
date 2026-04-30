"""
MindType AI — Main Dashboard
==============================
Run: streamlit run frontend/app.py --server.port 8501
"""

import sys
from pathlib import Path

# Make project root importable
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import streamlit as st
import time

from frontend.utils.api_client import api_health, api_history
from frontend.utils.ui_components import (
    inject_css, page_header, kpi_card, stress_badge,
    timeline_chart, emotion_distribution_pie, COLORS
)

st.set_page_config(
    page_title="MindType AI",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)
inject_css()

# ── Sidebar ────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("""
    <div style="text-align:center; padding: 20px 0 10px;">
      <h2 style="color:white; font-size:22px; margin:0;">🧠 MindType AI</h2>
      <p style="color:#8896A5; font-size:12px; margin:4px 0 0;">Keystroke Stress Detection</p>
    </div>
    """, unsafe_allow_html=True)
    st.markdown("---")

    online = api_health()
    status_color = "#1D9E75" if online else "#D85A30"
    status_text  = "API متصل ✓" if online else "API غير متصل ✗"
    st.markdown(f'<p style="color:{status_color}; font-size:13px; text-align:center; font-weight:600;">{status_text}</p>', unsafe_allow_html=True)

    st.markdown("""
    <div style="margin-top:20px; padding: 0 10px;">
      <p style="color:#8896A5; font-size:11px; margin:0 0 8px;">التصفح</p>
    </div>
    """, unsafe_allow_html=True)

# ── Main page ──────────────────────────────────────────────────────────

page_header("MindType AI", "نظام اكتشاف التوتر من أنماط الكتابة — لوحة التحكم الرئيسية")

# API status banner
if not online:
    st.warning("""
    ⚠️ **API غير متصل** — شغّل الـ Backend أولاً:
    ```bash
    uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    """)

# ── Fetch history ──────────────────────────────────────────────────────
hist = api_history(50) if online else None

sessions = hist["sessions"] if hist else []
summary  = hist["summary"]  if hist else {
    "total_sessions": 0, "avg_stress": 0,
    "peak_stress": 0, "dominant_label": "Neutral",
    "hidden_stress_count": 0,
}

# ── KPI Row ────────────────────────────────────────────────────────────
c1, c2, c3, c4, c5 = st.columns(5)
with c1: kpi_card(str(summary["total_sessions"]), "إجمالي الجلسات", COLORS["teal"])
with c2: kpi_card(f"{summary['avg_stress']:.0f}%",  "متوسط التوتر",   COLORS["medium"])
with c3: kpi_card(f"{summary['peak_stress']:.0f}%",  "ذروة التوتر",    COLORS["high"])
with c4: kpi_card(summary["dominant_label"],          "الحالة الغالبة", COLORS["navy"])
with c5: kpi_card(str(summary["hidden_stress_count"]), "توتر خفي مكتشف", "#D85A30")

st.markdown("<hr class='light'>", unsafe_allow_html=True)

# ── Charts row ────────────────────────────────────────────────────────
if sessions:
    col_left, col_right = st.columns([2, 1])

    with col_left:
        st.markdown('<p class="section-head">مسار التوتر عبر الجلسات</p>', unsafe_allow_html=True)
        model_scores  = [s["stress_score"]  for s in sessions if s.get("stress_score")  is not None]
        survey_scores = [s.get("survey_score") for s in sessions]
        if model_scores:
            st.plotly_chart(
                timeline_chart(list(reversed(model_scores)), list(reversed(survey_scores))),
                use_container_width=True,
            )

    with col_right:
        st.markdown('<p class="section-head">توزيع الحالات العاطفية</p>', unsafe_allow_html=True)
        st.plotly_chart(emotion_distribution_pie(sessions), use_container_width=True)

else:
    st.info("📊 لا توجد بيانات بعد — ابدأ بإجراء تنبؤ أو ملء الاستبيان من القائمة الجانبية.")

st.markdown("<hr class='light'>", unsafe_allow_html=True)

# ── Recent sessions table ──────────────────────────────────────────────
if sessions:
    st.markdown('<p class="section-head">آخر الجلسات</p>', unsafe_allow_html=True)
    import pandas as pd
    from frontend.utils.ui_components import EMOTION_AR, EMOTION_EN
    from datetime import datetime

    rows = []
    for s in sessions[:10]:
        ts = datetime.fromtimestamp(s["ts"]).strftime("%H:%M:%S") if s.get("ts") else "—"
        rows.append({
            "الوقت":        ts,
            "الحالة":       f'{EMOTION_AR.get(s.get("emotion","N"), "?")} ({EMOTION_EN.get(s.get("emotion","N"), "?")})',
            "التوتر (%)":  f'{s.get("stress_score", 0):.1f}',
            "المستوى":     s.get("stress_level", "—"),
            "توتر خفي":    "⚠️ نعم" if s.get("hidden_stress") else "✓ لا",
            "المصدر":      s.get("source", "—"),
        })
    df = pd.DataFrame(rows)
    st.dataframe(df, use_container_width=True, hide_index=True)

# ── Footer ────────────────────────────────────────────────────────────
st.markdown("""
<div style="text-align:center; padding:20px 0 8px; color:#8896A5; font-size:11px;">
  MindType AI v2.0 — Keystroke Dynamics Stress Detection System
</div>
""", unsafe_allow_html=True)
