"""
MindType AI — History & Analytics Page
"""

import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime

from frontend.utils.api_client import api_history, api_clear_history
from frontend.utils.ui_components import (
    inject_css, page_header, kpi_card,
    timeline_chart, emotion_distribution_pie, COLORS,
    EMOTION_AR, EMOTION_EN,
)

st.set_page_config(page_title="السجل والتحليلات", page_icon="📈", layout="wide")
inject_css()

page_header("السجل والتحليلات", "استعرض كل الجلسات السابقة وتحليل الاتجاهات", "📈")

# ── Load history ────────────────────────────────────────────────────────
hist = api_history(100)

if hist is None:
    st.warning("⚠️ تعذر الاتصال بالـ API.")
    st.stop()

sessions = hist.get("sessions", [])
surveys  = hist.get("surveys",  [])
summary  = hist.get("summary",  {})

# ── Controls ────────────────────────────────────────────────────────────
col_ref, col_clr = st.columns([5, 1])
with col_ref:
    if st.button("🔄 تحديث", use_container_width=True):
        st.rerun()
with col_clr:
    if st.button("🗑 مسح الكل", type="secondary", use_container_width=True):
        if api_clear_history():
            st.success("تم مسح جميع البيانات.")
            st.rerun()

if not sessions:
    st.info("📭 لا توجد جلسات مسجلة بعد — ابدأ بإجراء تنبؤ أو ملء استبيان.")
    st.stop()

# ── KPI row ─────────────────────────────────────────────────────────────
c1, c2, c3, c4, c5 = st.columns(5)
with c1: kpi_card(str(summary.get("total_sessions", 0)),          "إجمالي الجلسات",   COLORS["teal"])
with c2: kpi_card(f"{summary.get('avg_stress', 0):.1f}%",         "متوسط التوتر",      COLORS["medium"])
with c3: kpi_card(f"{summary.get('peak_stress', 0):.1f}%",         "ذروة التوتر",       COLORS["high"])
with c4: kpi_card(summary.get("dominant_label", "Neutral"),        "الحالة الغالبة",    COLORS["navy"])
with c5: kpi_card(str(summary.get("hidden_stress_count", 0)),      "توتر خفي مكتشف",   "#D85A30")

st.markdown("<hr class='light'>", unsafe_allow_html=True)

# ── Stress timeline ──────────────────────────────────────────────────────
st.markdown('<p class="section-head">مسار التوتر عبر الجلسات</p>', unsafe_allow_html=True)

reversed_sessions = list(reversed(sessions))
model_scores  = [s["stress_score"]      for s in reversed_sessions if s.get("stress_score") is not None]
survey_scores = [s.get("survey_score")  for s in reversed_sessions]

if model_scores:
    st.plotly_chart(timeline_chart(model_scores, survey_scores, height=270), use_container_width=True)

st.markdown("<hr class='light'>", unsafe_allow_html=True)

# ── Two-column charts ────────────────────────────────────────────────────
col_pie, col_lvl = st.columns(2)

with col_pie:
    st.markdown('<p class="section-head">توزيع الحالات العاطفية</p>', unsafe_allow_html=True)
    st.plotly_chart(emotion_distribution_pie(sessions, height=260), use_container_width=True)

with col_lvl:
    st.markdown('<p class="section-head">توزيع مستويات التوتر</p>', unsafe_allow_html=True)
    level_counts = {"low": 0, "medium": 0, "high": 0}
    for s in sessions:
        lvl = s.get("stress_level", "low")
        level_counts[lvl] = level_counts.get(lvl, 0) + 1

    fig = go.Figure(go.Bar(
        x=["منخفض", "متوسط", "مرتفع"],
        y=[level_counts["low"], level_counts["medium"], level_counts["high"]],
        marker_color=[COLORS["low"], COLORS["medium"], COLORS["high"]],
        text=[level_counts["low"], level_counts["medium"], level_counts["high"]],
        textposition="outside",
    ))
    fig.update_layout(
        height=260, margin=dict(t=20, b=20, l=20, r=20),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        showlegend=False, yaxis=dict(gridcolor="#F0F0F0"),
        font=dict(family="Cairo, sans-serif"),
    )
    st.plotly_chart(fig, use_container_width=True)

st.markdown("<hr class='light'>", unsafe_allow_html=True)

# ── Hidden stress timeline ────────────────────────────────────────────────
hidden_sessions = [s for s in reversed_sessions if s.get("hidden_stress")]
if hidden_sessions:
    st.markdown(f'<p class="section-head" style="color:#D85A30;">⚠️ جلسات التوتر الخفي ({len(hidden_sessions)})</p>', unsafe_allow_html=True)
    hs_scores = [s["stress_score"] for s in hidden_sessions if s.get("stress_score")]
    ss_scores = [s.get("survey_score") for s in hidden_sessions]
    if hs_scores:
        st.plotly_chart(timeline_chart(hs_scores, ss_scores, height=200), use_container_width=True)
    st.markdown("<hr class='light'>", unsafe_allow_html=True)

# ── Session table ─────────────────────────────────────────────────────────
st.markdown('<p class="section-head">سجل الجلسات التفصيلي</p>', unsafe_allow_html=True)

rows = []
for s in sessions[:30]:
    ts_str = datetime.fromtimestamp(s["ts"]).strftime("%Y-%m-%d %H:%M:%S") if s.get("ts") else "—"
    em = s.get("emotion", "N")
    rows.append({
        "الوقت":           ts_str,
        "الحالة":          f'{EMOTION_AR.get(em,"?")} ({EMOTION_EN.get(em,"?")})',
        "توتر النموذج (%)": f'{s.get("stress_score", 0):.1f}' if s.get("stress_score") is not None else "—",
        "توتر الاستبيان":  f'{s.get("survey_score", "—"):.1f}' if s.get("survey_score") is not None else "—",
        "الفجوة":          f'{s.get("divergence", "—"):.2f}' if s.get("divergence") is not None else "—",
        "المستوى":         s.get("stress_level", "—"),
        "توتر خفي":        "⚠️ نعم" if s.get("hidden_stress") else "✓ لا",
        "المصدر":          s.get("source", "—"),
    })

if rows:
    df = pd.DataFrame(rows)
    st.dataframe(df, use_container_width=True, hide_index=True)

# ── Survey history ────────────────────────────────────────────────────────
if surveys:
    st.markdown("<hr class='light'>", unsafe_allow_html=True)
    st.markdown('<p class="section-head">سجل الاستبيانات</p>', unsafe_allow_html=True)
    s_rows = []
    for s in surveys[:20]:
        ts_str = datetime.fromtimestamp(s["ts"]).strftime("%Y-%m-%d %H:%M:%S") if s.get("ts") else "—"
        s_rows.append({
            "الوقت":   ts_str,
            "الدرجة":  f'{s.get("score", 0):.1f}/10',
            "المستوى": s.get("level", "—"),
        })
    st.dataframe(pd.DataFrame(s_rows), use_container_width=True, hide_index=True)
