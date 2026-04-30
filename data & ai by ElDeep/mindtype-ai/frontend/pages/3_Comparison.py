"""
MindType AI — Comparison Page
Survey vs Model — Divergence & Hidden Stress Detection
"""

import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

import streamlit as st
import plotly.graph_objects as go
from frontend.utils.api_client import api_analyze, simulate_features
from frontend.utils.ui_components import (
    inject_css, page_header, kpi_card, render_recommendations,
    gauge_chart, emotion_prob_chart, divergence_gauge,
    hidden_stress_alert, good_status_alert, COLORS, EMOTION_AR, EMOTION_EN,
)

st.set_page_config(page_title="المقارنة والتحليل", page_icon="📊", layout="wide")
inject_css()

page_header(
    "المقارنة والتحليل",
    "قارن نتائج الاستبيان مع تنبؤ الموديل لاكتشاف التوتر الخفي",
    "📊"
)

# ── Check if we have saved data ─────────────────────────────────────────
survey_result  = st.session_state.get("survey_result")
predict_result = st.session_state.get("predict_result")
survey_answers = st.session_state.get("survey_answers")

has_survey  = survey_result  is not None
has_predict = predict_result is not None

if not has_survey or not has_predict:
    st.info("""
    💡 **للحصول على أفضل تحليل:**
    1. اذهب إلى صفحة **الاستبيان** وأجب على الأسئلة
    2. اذهب إلى صفحة **التنبؤ الحي** وقم بإجراء تنبؤ
    3. ارجع هنا للتحليل المقارن الكامل
    
    أو استخدم النموذج أدناه لإدخال البيانات مباشرةً.
    """)

# ── Direct input form ───────────────────────────────────────────────────
with st.expander("📥 إدخال البيانات مباشرةً" if not (has_survey and has_predict) else "🔧 تعديل البيانات", expanded=not (has_survey and has_predict)):

    col_f, col_s = st.columns(2)

    with col_f:
        st.markdown('<p class="section-head">خصائص الكتابة</p>', unsafe_allow_html=True)

        # Quick fill buttons
        q1, q2, q3, q4 = st.columns(4)
        if q1.button("😌 هادئ"):
            f = simulate_features("calm")
            for k,v in f.items(): st.session_state[f"cf_{k}"] = v
        if q2.button("😟 متوتر"):
            f = simulate_features("stressed")
            for k,v in f.items(): st.session_state[f"cf_{k}"] = v
        if q3.button("⚠️ خفي"):
            f = simulate_features("hidden_stress")
            for k,v in f.items(): st.session_state[f"cf_{k}"] = v
        if q4.button("😠 غضب"):
            f = simulate_features("angry_spike")
            for k,v in f.items(): st.session_state[f"cf_{k}"] = v

        f_dwell    = st.number_input("mean_dwell (ms)",    10.0, 300.0, float(st.session_state.get("cf_mean_dwell", 93.5)),    0.5)
        f_flight   = st.number_input("median_flight (ms)",  80.0, 600.0, float(st.session_state.get("cf_median_flight", 210.0)), 5.0)
        f_cv       = st.number_input("cv_flight",           0.1,  3.0,  float(st.session_state.get("cf_cv_flight", 0.87)),    0.05)
        f_del      = st.number_input("mean_del_freq",       0.0,  60.0, float(st.session_state.get("cf_mean_del_freq", 7.0)),  0.5)
        f_tot      = st.number_input("mean_tot_time (ms)", 10000, 200000, int(st.session_state.get("cf_mean_tot_time", 68000)), 1000)

        features_input = {
            "mean_dwell": f_dwell, "median_flight": f_flight,
            "cv_flight": f_cv, "mean_del_freq": f_del, "mean_tot_time": f_tot,
        }

    with col_s:
        st.markdown('<p class="section-head">إجابات الاستبيان</p>', unsafe_allow_html=True)
        labels_map = {1:"1 — منخفض جداً",2:"2 — منخفض",3:"3 — متوسط",4:"4 — مرتفع",5:"5 — مرتفع جداً"}
        survey_input = {}
        questions_short = [
            ("q1", "مدى التوتر العام"),
            ("q2", "صعوبة التركيز"),
            ("q3", "الإرهاق الذهني"),
            ("q4", "مستوى القلق"),
            ("q5", "الضغط من المهام"),
        ]
        for qid, qlabel in questions_short:
            saved_val = (survey_answers or {}).get(qid, 3) if has_survey else 3
            survey_input[qid] = st.select_slider(
                qlabel, options=[1,2,3,4,5], value=saved_val,
                format_func=lambda x: labels_map[x],
            )

    analyze_clicked = st.button("🔬 تحليل مقارن شامل", type="primary", use_container_width=True)

# ── Run analysis ────────────────────────────────────────────────────────
run_features = features_input if 'features_input' in dir() else None
run_survey   = survey_input   if 'survey_input'   in dir() else None

if analyze_clicked and run_features and run_survey:
    with st.spinner("جارٍ التحليل المقارن..."):
        result = api_analyze(run_features, run_survey)
    if result:
        st.session_state["analyze_result"] = result
    else:
        st.error("❌ تعذر الاتصال بالـ API.")

# ── Display analysis result ─────────────────────────────────────────────
result = st.session_state.get("analyze_result")
if result:
    st.markdown("---")

    # ── Alert banner ──────────────────────────────────────────────────
    if result.get("hidden_stress"):
        hidden_stress_alert(result.get("hidden_message", "توتر خفي مكتشف!"))
    elif result.get("hidden_message"):
        st.info(result["hidden_message"])
    elif result.get("combined_level") == "low":
        good_status_alert("لا يوجد فارق ملحوظ — كلا المصدرين يُؤكدان حالة نفسية هادئة ✓")

    # ── Side-by-side comparison ───────────────────────────────────────
    st.markdown('<p class="section-head">مقارنة المصدرين</p>', unsafe_allow_html=True)

    m_score = result.get("model_stress", 0)
    s_score = result.get("survey_score", 0)
    m_level = result.get("model_level", "low")
    s_level = result.get("survey_level", "low")
    div     = result.get("divergence",  0)

    col_m, col_div, col_s = st.columns([2, 1, 2])

    with col_m:
        st.markdown("""
        <div style="text-align:center;">
          <p style="font-size:13px; color:#028090; font-weight:700; letter-spacing:.06em; text-transform:uppercase; margin-bottom:8px;">
            🤖 نموذج الذكاء الاصطناعي
          </p>
        </div>
        """, unsafe_allow_html=True)
        st.plotly_chart(gauge_chart(m_score), use_container_width=True)
        col_m1, col_m2 = st.columns(2)
        with col_m1: kpi_card(f"{m_score:.1f}%", "درجة التوتر", COLORS[m_level])
        with col_m2:
            em = result.get("model_emotion","N")
            kpi_card(f'{EMOTION_AR.get(em,"?")} {result.get("model_emotion_label","")}', "الحالة", COLORS.get(em, "#888"))

    with col_div:
        st.markdown("<br><br><br>", unsafe_allow_html=True)
        st.markdown(f"""
        <div style="text-align:center; padding:20px 10px;">
          <p style="font-size:11px; color:#8896A5; font-weight:700; letter-spacing:.06em; text-transform:uppercase; margin-bottom:8px;">الفجوة</p>
          <p style="font-size:36px; font-weight:700; color:{'#D85A30' if abs(div)>0.20 else '#BA7517' if abs(div)>0.10 else '#1D9E75'}; margin:0;">
            {'+' if div>0 else ''}{round(div*100)}<small style="font-size:16px;">pp</small>
          </p>
          <p style="font-size:11px; color:#8896A5; margin:6px 0 0;">
            {'توتر خفي ⚠️' if div>0.20 else 'فارق بسيط' if abs(div)>0.10 else 'متوافقان ✓'}
          </p>
        </div>
        """, unsafe_allow_html=True)

    with col_s:
        st.markdown("""
        <div style="text-align:center;">
          <p style="font-size:13px; color:#185FA5; font-weight:700; letter-spacing:.06em; text-transform:uppercase; margin-bottom:8px;">
            📝 الاستبيان الذاتي
          </p>
        </div>
        """, unsafe_allow_html=True)
        st.plotly_chart(gauge_chart(s_score * 10), use_container_width=True)
        col_s1, col_s2 = st.columns(2)
        with col_s1: kpi_card(f"{s_score:.1f}/10", "درجة الاستبيان", COLORS[s_level])
        with col_s2: kpi_card(result.get("survey_interpretation","")[:20], "التفسير", COLORS["teal"])

    # ── Divergence visual bar ─────────────────────────────────────────
    st.markdown("<hr class='light'>", unsafe_allow_html=True)
    st.markdown('<p class="section-head">تحليل الفجوة</p>', unsafe_allow_html=True)

    c_left, c_right = st.columns([3, 2])

    with c_left:
        # Visual comparison bar
        fig = go.Figure()
        fig.add_trace(go.Bar(name="نموذج AI",  x=["درجة التوتر"], y=[m_score],
                             marker_color=COLORS[m_level], text=[f"{m_score:.1f}%"], textposition="outside"))
        fig.add_trace(go.Bar(name="استبيان",   x=["درجة التوتر"], y=[s_score*10],
                             marker_color="#185FA5", text=[f"{s_score*10:.1f}%"], textposition="outside"))
        fig.update_layout(
            barmode="group", height=220, margin=dict(t=20,b=20,l=20,r=20),
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            yaxis=dict(range=[0,110], gridcolor="#F0F0F0"),
            legend=dict(orientation="h", y=1.1),
            font=dict(family="Cairo, sans-serif"),
        )
        st.plotly_chart(fig, use_container_width=True)

    with c_right:
        hidden_table = [
            ("نموذج AI", f"{m_score:.1f}%",   COLORS[m_level]),
            ("استبيان",  f"{s_score*10:.1f}%", "#185FA5"),
            ("الفجوة",   f"{'+' if div>0 else ''}{round(div*100)}pp", "#D85A30" if abs(div)>0.20 else "#888"),
            ("توتر خفي", "✓ نعم" if result.get("hidden_stress") else "✗ لا",
             "#D85A30" if result.get("hidden_stress") else "#1D9E75"),
        ]
        for label, val, col in hidden_table:
            st.markdown(f"""
            <div style="display:flex; justify-content:space-between; align-items:center;
                        padding:8px 14px; background:#F4F6F8; border-radius:8px; margin-bottom:6px;">
              <span style="font-size:13px; color:#444;">{label}</span>
              <span style="font-size:14px; font-weight:700; color:{col};">{val}</span>
            </div>
            """, unsafe_allow_html=True)

    # ── Combined recommendations ──────────────────────────────────────
    st.markdown("<hr class='light'>", unsafe_allow_html=True)
    render_recommendations(result.get("recommendations", []))
