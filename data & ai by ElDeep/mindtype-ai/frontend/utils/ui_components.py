"""
MindType AI — Shared UI Components & Styling
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from typing import List, Optional

# ── Color palette ─────────────────────────────────────────────────────
COLORS = {
    "low":    "#1D9E75",   # green
    "medium": "#BA7517",   # amber
    "high":   "#D85A30",   # coral/red
    "navy":   "#0D1B2A",
    "teal":   "#028090",
    "ltgray": "#F4F6F8",
    "A": "#D85A30", "C": "#1D9E75",
    "H": "#BA7517", "N": "#888780", "S": "#185FA5",
}

EMOTION_AR = {"A": "غاضب", "C": "هادئ", "H": "سعيد", "N": "محايد", "S": "حزين"}
EMOTION_EN = {"A": "Angry", "C": "Calm", "H": "Happy", "N": "Neutral", "S": "Sad"}


def inject_css():
    st.markdown("""
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

      html, body, [class*="css"] {
        font-family: 'Cairo', 'Segoe UI', sans-serif;
      }

      /* Metric cards */
      .kpi-card {
        background: #F4F6F8;
        border-radius: 12px;
        padding: 16px 20px;
        border-left: 4px solid #028090;
        margin-bottom: 8px;
      }
      .kpi-value {
        font-size: 28px;
        font-weight: 700;
        color: #0D1B2A;
        margin: 0;
        line-height: 1.1;
      }
      .kpi-label {
        font-size: 12px;
        color: #8896A5;
        margin: 4px 0 0;
      }

      /* Status badges */
      .badge-low    { background:#E1F5EE; color:#085041; padding:4px 12px; border-radius:20px; font-weight:600; font-size:13px; }
      .badge-medium { background:#FAEEDA; color:#633806; padding:4px 12px; border-radius:20px; font-weight:600; font-size:13px; }
      .badge-high   { background:#FAECE7; color:#993C1D; padding:4px 12px; border-radius:20px; font-weight:600; font-size:13px; }

      /* Alert boxes */
      .alert-hidden {
        background: #FAECE7; border: 1.5px solid #D85A30;
        border-radius: 10px; padding: 12px 16px; margin: 10px 0;
      }
      .alert-hidden h4 { color: #993C1D; margin: 0 0 6px; }
      .alert-hidden p  { color: #712B13; margin: 0; font-size: 13px; }

      .alert-good {
        background: #E1F5EE; border: 1.5px solid #1D9E75;
        border-radius: 10px; padding: 12px 16px; margin: 10px 0;
      }
      .alert-good p { color: #085041; margin: 0; font-size: 13px; }

      /* Recommendation cards */
      .rec-card {
        background: white; border: 0.5px solid #E0E0E0;
        border-radius: 10px; padding: 12px 14px; margin-bottom: 8px;
        display: flex; align-items: flex-start; gap: 10px;
      }
      .rec-icon { font-size: 22px; line-height: 1; flex-shrink: 0; }
      .rec-title { font-weight: 600; color: #0D1B2A; font-size: 13px; margin: 0 0 3px; }
      .rec-sub   { color: #8896A5; font-size: 11px; margin: 0; }

      /* Section headers */
      .section-head {
        font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
        text-transform: uppercase; color: #028090; margin-bottom: 8px;
      }

      /* Divider */
      hr.light { border: none; border-top: 1px solid #E8EDF2; margin: 16px 0; }

      /* Sidebar */
      section[data-testid="stSidebar"] {
        background: #0D1B2A !important;
      }
      section[data-testid="stSidebar"] * { color: #CADCFC !important; }
      section[data-testid="stSidebar"] .stRadio label { color: white !important; }
    </style>
    """, unsafe_allow_html=True)


def page_header(title: str, subtitle: str = "", icon: str = "🧠"):
    st.markdown(f"""
    <div style="padding: 8px 0 20px;">
      <h1 style="color:#0D1B2A; font-size:30px; font-weight:700; margin:0;">{icon} {title}</h1>
      {"<p style='color:#8896A5; font-size:14px; margin:4px 0 0;'>" + subtitle + "</p>" if subtitle else ""}
    </div>
    """, unsafe_allow_html=True)


def kpi_card(value: str, label: str, color: str = "#028090"):
    st.markdown(f"""
    <div class="kpi-card" style="border-left-color:{color};">
      <p class="kpi-value" style="color:{color};">{value}</p>
      <p class="kpi-label">{label}</p>
    </div>
    """, unsafe_allow_html=True)


def stress_badge(level: str) -> str:
    labels = {"low": "منخفض ✓", "medium": "متوسط ⚡", "high": "مرتفع ⚠️"}
    return f'<span class="badge-{level}">{labels.get(level, level)}</span>'


def hidden_stress_alert(message: str):
    st.markdown(f"""
    <div class="alert-hidden">
      <h4>⚠️ توتر خفي مكتشف!</h4>
      <p>{message}</p>
    </div>
    """, unsafe_allow_html=True)


def good_status_alert(message: str = "حالتك النفسية ممتازة! استمر 🎉"):
    st.markdown(f'<div class="alert-good"><p>{message}</p></div>', unsafe_allow_html=True)


def render_recommendations(recs: List[dict]):
    if not recs:
        return
    st.markdown('<p class="section-head">التوصيات</p>', unsafe_allow_html=True)
    for r in recs:
        color = "#FAECE7" if r.get("type") == "hidden" else "#F4F6F8"
        st.markdown(f"""
        <div class="rec-card" style="background:{color};">
          <span class="rec-icon">{r.get("icon","💡")}</span>
          <div>
            <p class="rec-title">{r.get("title", "")}</p>
            <p class="rec-sub">{r.get("en", "")}</p>
          </div>
        </div>
        """, unsafe_allow_html=True)


# ── Charts ──────────────────────────────────────────────────────────

def gauge_chart(score: float, height: int = 220) -> go.Figure:
    color = COLORS["high"] if score >= 55 else COLORS["medium"] if score >= 35 else COLORS["low"]
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=score,
        number={"suffix": "%", "font": {"size": 34, "color": color}},
        gauge={
            "axis": {"range": [0, 100], "tickwidth": 1, "tickcolor": "#ccc"},
            "bar":  {"color": color, "thickness": 0.28},
            "bgcolor": "white",
            "steps": [
                {"range": [0, 35],  "color": "#E8F8F0"},
                {"range": [35, 55], "color": "#FEF3E2"},
                {"range": [55, 100],"color": "#FDEAE3"},
            ],
            "threshold": {"line": {"color": color, "width": 3}, "thickness": 0.8, "value": score},
        },
    ))
    fig.update_layout(height=height, margin=dict(t=20, b=10, l=20, r=20),
                      paper_bgcolor="rgba(0,0,0,0)", font_color="#444")
    return fig


def emotion_prob_chart(probs: dict, height: int = 200) -> go.Figure:
    order  = ["H", "C", "N", "S", "A"]
    labels = [f"{EMOTION_AR[k]} ({EMOTION_EN[k]})" for k in order]
    values = [round(probs.get(k, 0)*100, 1) for k in order]
    colors = [COLORS[k] for k in order]
    fig = go.Figure(go.Bar(
        x=values, y=labels, orientation="h",
        marker_color=colors, text=[f"{v:.0f}%" for v in values], textposition="outside",
    ))
    fig.update_layout(
        height=height, margin=dict(t=10, b=10, l=10, r=40),
        xaxis=dict(range=[0, 108], visible=False),
        yaxis=dict(showgrid=False),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        showlegend=False,
    )
    return fig


def timeline_chart(model_scores: list, survey_scores: list, height: int = 250) -> go.Figure:
    x = list(range(len(model_scores)))
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=x, y=model_scores, name="نموذج AI",
        line=dict(color="#D85A30", width=2.5),
        fill="tozeroy", fillcolor="rgba(216,90,48,0.08)",
        mode="lines",
    ))
    if any(s is not None for s in survey_scores):
        scaled = [s * 10 if s is not None else None for s in survey_scores]
        fig.add_trace(go.Scatter(
            x=x, y=scaled, name="استبيان",
            line=dict(color="#185FA5", width=2, dash="dash"), mode="lines",
        ))
    fig.update_layout(
        height=height, margin=dict(t=10, b=30, l=40, r=10),
        xaxis=dict(title="الجلسة", showgrid=False),
        yaxis=dict(title="درجة التوتر %", range=[0, 105], gridcolor="#F0F0F0"),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        legend=dict(orientation="h", y=1.1, x=0),
        font=dict(family="Cairo, sans-serif"),
    )
    return fig


def divergence_gauge(divergence: float, height: int = 160) -> go.Figure:
    clamped = max(-1, min(1, divergence))
    pct     = round(abs(clamped) * 100)
    color   = COLORS["high"] if clamped > 0.20 else COLORS["medium"] if abs(clamped) > 0.10 else COLORS["low"]
    fig = go.Figure(go.Indicator(
        mode="number+delta",
        value=round(clamped * 100, 1),
        number={"suffix": "pp", "font": {"size": 36, "color": color}},
        delta={"reference": 0, "valueformat": ".1f"},
    ))
    fig.update_layout(height=height, margin=dict(t=20, b=10, l=10, r=10),
                      paper_bgcolor="rgba(0,0,0,0)")
    return fig


def emotion_distribution_pie(sessions: list, height: int = 280) -> go.Figure:
    counts = {}
    for s in sessions:
        e = s.get("emotion", "N")
        if e:
            counts[e] = counts.get(e, 0) + 1
    if not counts:
        counts = {"N": 1}
    labels = [f"{EMOTION_AR[k]} ({EMOTION_EN[k]})" for k in counts]
    values = list(counts.values())
    colors = [COLORS.get(k, "#ccc") for k in counts]
    fig = go.Figure(go.Pie(
        labels=labels, values=values, marker_colors=colors,
        hole=0.5, textinfo="label+percent",
    ))
    fig.update_layout(height=height, margin=dict(t=20, b=20, l=20, r=20),
                      paper_bgcolor="rgba(0,0,0,0)",
                      showlegend=False)
    return fig
