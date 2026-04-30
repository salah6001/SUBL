"""
MindType AI — Live Prediction Page
Manual feature input + real-time auto-simulation
"""

import sys, time, random
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

import streamlit as st
from frontend.utils.api_client import api_predict, api_health, simulate_features, PROFILES
from frontend.utils.ui_components import (
    inject_css, page_header, kpi_card, stress_badge,
    render_recommendations, gauge_chart, emotion_prob_chart,
    timeline_chart, hidden_stress_alert, good_status_alert, COLORS,
    EMOTION_AR, EMOTION_EN,
)

st.set_page_config(page_title="التنبؤ الحي", page_icon="⌨️", layout="wide")
inject_css()

# ── Init session state ─────────────────────────────────────────────────
for key, default in [
    ("sim_running",    False),
    ("sim_history",    []),
    ("sim_step",       0),
    ("last_result",    None),
    ("sim_profile",    "calm"),
]:
    if key not in st.session_state:
        st.session_state[key] = default

page_header("التنبؤ الحي", "أدخل خصائص الكتابة أو شغّل المحاكاة التلقائية", "⌨️")

# ── Mode selector ──────────────────────────────────────────────────────
mode = st.radio(
    "اختر الوضع",
    ["📊 إدخال يدوي", "🤖 محاكاة تلقائية"],
    horizontal=True,
    label_visibility="collapsed",
)

st.markdown("<hr class='light'>", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════
# MANUAL MODE
# ═══════════════════════════════════════════════════════════════
if mode == "📊 إدخال يدوي":
    st.markdown('<p class="section-head">خصائص الكتابة</p>', unsafe_allow_html=True)

    col1, col2 = st.columns(2)
    with col1:
        mean_dwell    = st.slider("⏱ متوسط مدة ضغط المفتاح (mean_dwell, ms)", 40, 200, 93, 1,
                                   help="How long keys are held down on average")
        median_flight = st.slider("✈️ وسيط زمن الانتقال بين المفاتيح (median_flight, ms)", 80, 500, 210, 5,
                                   help="Median inter-key interval")
        cv_flight     = st.slider("📐 معامل تباين زمن الانتقال (cv_flight)", 0.2, 2.5, 0.87, 0.05,
                                   help="Coefficient of variation of flight time")
    with col2:
        mean_del_freq = st.slider("🗑 متوسط تكرار الحذف (mean_del_freq)", 0, 50, 7, 1,
                                   help="Average number of backspace/delete presses")
        mean_tot_time = st.slider("⏰ متوسط وقت الجلسة (mean_tot_time, ms)", 20000, 150000, 68000, 1000,
                                   help="Mean total session duration in milliseconds",
                                   format="%d ms")

    features = {
        "mean_dwell":    mean_dwell,
        "median_flight": median_flight,
        "cv_flight":     cv_flight,
        "mean_del_freq": mean_del_freq,
        "mean_tot_time": mean_tot_time,
    }

    if st.button("🔍 تحليل الآن", type="primary", use_container_width=True):
        with st.spinner("جارٍ التحليل..."):
            result = api_predict(features)
        if result:
            st.session_state["last_result"] = result
        else:
            st.error("❌ تعذر الاتصال بالـ API.")

    # Show result
    result = st.session_state.get("last_result")
    if result:
        st.markdown("---")
        _show_result(result)

# ═══════════════════════════════════════════════════════════════
# SIMULATION MODE
# ═══════════════════════════════════════════════════════════════
else:
    col_ctrl, col_chart = st.columns([1, 2])

    with col_ctrl:
        st.markdown('<p class="section-head">إعدادات المحاكاة</p>', unsafe_allow_html=True)

        profile_label = st.selectbox(
            "نمط الجلسة",
            list(PROFILES.keys()),
            index=0,
        )
        st.session_state["sim_profile"] = PROFILES[profile_label]

        speed = st.select_slider("سرعة التحديث", options=[0.5, 1.0, 1.5, 2.0], value=0.5,
                                  format_func=lambda x: f"{x}s")

        c_start, c_stop = st.columns(2)
        if c_start.button("▶️ ابدأ", type="primary", use_container_width=True):
            st.session_state["sim_running"] = True
            st.session_state["sim_history"] = []
            st.session_state["sim_step"]    = 0

        if c_stop.button("⏹ أوقف", use_container_width=True):
            st.session_state["sim_running"] = False

        if st.button("🗑 مسح", use_container_width=True):
            st.session_state["sim_history"] = []
            st.session_state["sim_step"]    = 0
            st.session_state["sim_running"] = False

        # Current status box
        hist = st.session_state["sim_history"]
        if hist:
            last = hist[-1]
            lvl  = last.get("stress_level", "low")
            color = COLORS[lvl]
            em   = last.get("emotion","N")
            st.markdown(f"""
            <div class="kpi-card" style="border-left-color:{color}; margin-top:16px;">
              <p class="kpi-value" style="color:{color};">{last.get('stress_score',0):.0f}%</p>
              <p class="kpi-label">درجة التوتر الحالية</p>
              <p style="font-size:13px; color:{COLORS[em]}; margin:6px 0 0; font-weight:600;">
                {EMOTION_AR.get(em,'?')} — {EMOTION_EN.get(em,'?')}
              </p>
            </div>
            """, unsafe_allow_html=True)

    with col_chart:
        chart_placeholder = st.empty()
        rec_placeholder   = st.empty()

    # ── Simulation loop ──────────────────────────────────────────────
    if st.session_state["sim_running"]:
        feat   = simulate_features(st.session_state["sim_profile"])
        result = api_predict(feat)

        if result:
            entry = {
                "stress_score":  result["stress_score"],
                "stress_level":  result["stress_level"],
                "emotion":       result["emotion"],
                "survey_score":  None,
            }
            st.session_state["sim_history"].append(entry)
            st.session_state["sim_step"] += 1
            st.session_state["last_result"] = result

        hist = st.session_state["sim_history"]
        if hist:
            scores  = [h["stress_score"] for h in hist]
            surveys = [h["survey_score"] for h in hist]
            with chart_placeholder:
                st.plotly_chart(timeline_chart(scores, surveys, height=230), use_container_width=True)

            with rec_placeholder:
                recs = result.get("recommendations", []) if result else []
                render_recommendations(recs[:2])

        time.sleep(speed)
        st.rerun()

    else:
        # Show static chart if history exists
        hist = st.session_state["sim_history"]
        if hist:
            scores  = [h["stress_score"] for h in hist]
            surveys = [h["survey_score"] for h in hist]
            with chart_placeholder:
                st.plotly_chart(timeline_chart(scores, surveys, height=230), use_container_width=True)
        else:
            with chart_placeholder:
                st.info("اضغط ▶️ ابدأ لتشغيل المحاكاة")


# ── Shared result renderer ──────────────────────────────────────────────
def _show_result(result: dict):
    level = result.get("stress_level", "low")
    color = COLORS[level]
    em    = result.get("emotion", "N")

    c1, c2, c3, c4 = st.columns(4)
    with c1: kpi_card(f'{result.get("stress_score",0):.1f}%', "درجة التوتر", color)
    with c2:
        level_ar = {"low": "منخفض", "medium": "متوسط", "high": "مرتفع"}
        kpi_card(level_ar.get(level, level), "مستوى التوتر", color)
    with c3: kpi_card(f'{result.get("emotion_emoji","")} {result.get("emotion_label","")}', "الحالة العاطفية", COLORS[em])
    with c4: kpi_card(result.get("session_id","—"), "رقم الجلسة", COLORS["teal"])

    st.markdown("<br>", unsafe_allow_html=True)
    col_g, col_b, col_r = st.columns(3)

    with col_g:
        st.markdown('<p class="section-head">مقياس التوتر</p>', unsafe_allow_html=True)
        st.plotly_chart(gauge_chart(result["stress_score"]), use_container_width=True)

    with col_b:
        st.markdown('<p class="section-head">توزيع الحالات العاطفية</p>', unsafe_allow_html=True)
        if result.get("emotion_probs"):
            st.plotly_chart(emotion_prob_chart(result["emotion_probs"]), use_container_width=True)

    with col_r:
        render_recommendations(result.get("recommendations", []))

    if level == "high":
        st.error(f"⚠️ تنبيه: توتر مرتفع مكتشف — {result.get('emotion_label','')}")
    elif level == "low":
        good_status_alert()

    # Save for comparison
    st.session_state["predict_result"]   = result
    st.session_state["predict_features"] = {
        k: v for k, v in result.items()
        if k in ["mean_dwell","median_flight","cv_flight","mean_del_freq","mean_tot_time"]
    }
