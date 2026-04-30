"""
MindType AI — Survey Page
"""

import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

import streamlit as st
from frontend.utils.api_client import api_survey, api_questions, api_health
from frontend.utils.ui_components import (
    inject_css, page_header, kpi_card, stress_badge,
    render_recommendations, gauge_chart, hidden_stress_alert, good_status_alert, COLORS
)

st.set_page_config(page_title="استبيان التوتر", page_icon="📝", layout="wide")
inject_css()

page_header("استبيان التوتر", "قيّم حالتك النفسية الآن من خلال 5 أسئلة بسيطة", "📝")

questions = api_questions()

st.markdown("""
<div style="background:#F4F6F8; border-radius:12px; padding:16px 20px; margin-bottom:20px;">
  <p style="color:#0D1B2A; font-size:14px; margin:0;">
    أجب على الأسئلة التالية بصدق — التقييم على مقياس من <strong>1 (منخفض جداً)</strong> إلى <strong>5 (مرتفع جداً)</strong>.
    النتائج مؤقتة ولأغراض تعليمية فقط.
  </p>
</div>
""", unsafe_allow_html=True)

# ── Question sliders ────────────────────────────────────────────────────
st.markdown('<p class="section-head">الأسئلة</p>', unsafe_allow_html=True)

LABELS = {1: "1 — منخفض جداً", 2: "2 — منخفض", 3: "3 — متوسط", 4: "4 — مرتفع", 5: "5 — مرتفع جداً"}
answers = {}

with st.form("survey_form"):
    for q in questions:
        st.markdown(f"**{q['text']}**")
        st.caption(q.get("en", ""))
        answers[q["id"]] = st.select_slider(
            label=q["id"],
            options=[1, 2, 3, 4, 5],
            value=3,
            format_func=lambda x: LABELS[x],
            label_visibility="collapsed",
        )
        st.markdown("<hr class='light'>", unsafe_allow_html=True)

    submitted = st.form_submit_button("📊 احسب مستوى التوتر", type="primary", use_container_width=True)

# ── Results ─────────────────────────────────────────────────────────────
if submitted:
    with st.spinner("جارٍ تحليل إجاباتك..."):
        result = api_survey(answers)

    if result is None:
        st.error("❌ تعذر الاتصال بالـ API. تأكد من تشغيل الـ Backend.")
    else:
        st.markdown("---")
        st.markdown('<p class="section-head">نتائج الاستبيان</p>', unsafe_allow_html=True)

        col1, col2, col3 = st.columns(3)
        level = result.get("level", "low")
        score = result.get("score", 0)
        color = COLORS[level]

        with col1:
            kpi_card(f"{score:.1f}/10", "درجة التوتر", color)
        with col2:
            level_ar = {"low": "منخفض", "medium": "متوسط", "high": "مرتفع"}
            kpi_card(level_ar.get(level, level), "مستوى التوتر", color)
        with col3:
            kpi_card(result.get("interpretation","")[:30], "التفسير", COLORS["teal"])

        st.markdown("<br>", unsafe_allow_html=True)
        col_g, col_r = st.columns([1, 1])

        with col_g:
            st.plotly_chart(gauge_chart(score * 10), use_container_width=True)

        with col_r:
            st.markdown(f'<p style="font-size:15px; color:{color}; font-weight:700; margin-top:40px;">'
                        f'{result.get("interpretation","")}</p>', unsafe_allow_html=True)

            if level == "high":
                st.markdown("""
                <div class="alert-hidden">
                  <h4>⚠️ توتر مرتفع</h4>
                  <p>ننصحك باتخاذ استراحة قصيرة والتحدث مع شخص تثق به.</p>
                </div>
                """, unsafe_allow_html=True)
            elif level == "low":
                good_status_alert("حالتك النفسية ممتازة! استمر في ما تفعله 🎉")

        # Breakdown
        st.markdown("<hr class='light'>", unsafe_allow_html=True)
        st.markdown('<p class="section-head">تفاصيل إجاباتك</p>', unsafe_allow_html=True)
        breakdown = result.get("breakdown", {})
        cols = st.columns(len(questions))
        for i, q in enumerate(questions):
            val = breakdown.get(q["id"], answers.get(q["id"], 3))
            bar_color = "#1D9E75" if val <= 2 else "#BA7517" if val == 3 else "#D85A30"
            with cols[i]:
                st.markdown(f"""
                <div style="background:#F4F6F8; border-radius:10px; padding:12px; text-align:center;
                            border-top: 4px solid {bar_color};">
                  <p style="font-size:22px; font-weight:700; color:{bar_color}; margin:0;">{val}</p>
                  <p style="font-size:10px; color:#8896A5; margin:4px 0 0;">{q['id'].upper()}</p>
                </div>
                """, unsafe_allow_html=True)

        # Save to session state for Comparison page
        st.session_state["survey_result"] = result
        st.session_state["survey_answers"] = answers
        st.success("✅ تم حفظ نتائج الاستبيان — انتقل إلى صفحة **المقارنة** لتحليل مقارن.")
