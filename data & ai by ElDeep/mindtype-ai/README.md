# 🧠 MindType AI

> **نظام اكتشاف التوتر من أنماط الكتابة — Full Stack AI System**
>
> Keystroke-Based Psychological Stress Detection & Monitoring Platform

---

## 🚀 تشغيل المشروع (Quick Start)

```bash
# 1. تثبيت المكتبات
pip install -r requirements.txt

# 2. تشغيل الـ Backend والـ Frontend معاً
bash run.sh
```

| الخدمة | الرابط |
|---|---|
| 🎨 Dashboard (Streamlit) | http://localhost:8501 |
| ⚙️ API Backend (FastAPI) | http://localhost:8000 |
| 📖 API Docs (Swagger) | http://localhost:8000/docs |

أو تشغيل كل خدمة على حدة:

```bash
# Backend فقط
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend فقط
streamlit run frontend/app.py --server.port 8501

# Desktop Agent
python -m desktop_agent --backend http://localhost:8000

# Browser Extension
# Load the unpacked extension from browser_extension/
```

---

## �️ Desktop Agent — الوكيل المكتبي
الـ Desktop Agent يلتقط توقيتات ضغطات الكيبورد من الجهاز، يحسب خصائص الكتابة، ويرسلها مباشرةً إلى الـ Backend عبر `POST /predict`. هذه الخطوة تجعل النظام قادرًا على تنفيذ التحليل في مسار end-to-end بدون إدخال يدوي للخصائص.

### كيف يعمل end-to-end
1. تشغيل الـ Backend: `uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload`
2. تشغيل الـ Desktop Agent: `python -m desktop_agent --backend http://localhost:8000`
3. يجمع الوكيل توقيتات `keydown` و `keyup` ويرشح الجلسات.
4. يحسب الوكيل خمسة ميزات أساسية: `mean_dwell`, `median_flight`, `cv_flight`, `mean_del_freq`, `mean_tot_time`.
5. يرسل البيانات إلى `POST /predict` في الـ Backend.
6. يستجيب الـ Backend بتنبؤات العاطفة، نقطة التوتر، ومستوى التوتر، إلى جانب توصيات.
7. يمكن عرض النتائج والتاريخ والتحليل في الـ Frontend Dashboard.

### ملاحظة
- لإيقاف الوكيل اضغط `ESC`
- يمكن تشغيل الـ Desktop Agent والـ Frontend معًا لعرض البيانات الحيّة في لوحة التحكم

---

## �📁 هيكل المشروع

```
mindtype-ai/
│
├── 📄 README.md                    ← أنت هنا
├── 📄 requirements.txt             ← كل المكتبات المطلوبة
├── 📄 .gitignore
├── 📄 run.sh                       ← يشغّل Backend + Frontend معاً
│
├── 🔧 backend/
│   ├── __init__.py
│   └── main.py                     ← FastAPI كامل (endpoints + DB + WebSocket)
│
├── 🎨 frontend/
│   ├── app.py                      ← الصفحة الرئيسية (Overview Dashboard)
│   ├── pages/
│   │   ├── 1_Survey.py             ← الاستبيان (5 أسئلة Likert)
│   │   ├── 2_Live_Prediction.py    ← التنبؤ الحي + المحاكاة التلقائية
│   │   ├── 3_Comparison.py         ← مقارنة النموذج vs الاستبيان
│   │   └── 4_History.py            ← السجل والرسوم البيانية
│   └── utils/
│       ├── api_client.py           ← كل HTTP calls للـ Backend
│       └── ui_components.py        ← CSS + مكونات مشتركة + Charts
│
├── 🧠 inference/
│   ├── inference.py                ← MindTypePredictor class
│   ├── decision_engine.py          ← stress score + divergence + hidden stress
│   └── recommendation.py          ← قواعد التوصيات
│
├── 📦 model/
│   ├── mindtype_model.pkl          ← الموديل الجاهز (Random Forest)
│   ├── encoder.pkl                 ← LabelEncoder
│   └── metadata.json               ← معلومات الموديل والـ thresholds
│
├── 📊 data/
│   ├── raw/                        ← البيانات الخام (EmoSurv CSVs)
│   ├── cleaned/                    ← cleaned_data.csv
│   └── processed/                  ← final_features.csv
│
├── 📓 notebooks/
│   ├── 01_data_import_cleaning.ipynb
│   ├── 02_feature_engineering.ipynb
│   ├── 03_eda_analysis.ipynb
│   ├── 04_model_training.ipynb
│   └── 05_model_evaluation.ipynb
│
├── 🛠️ desktop_agent/
│   ├── __init__.py
│   ├── __main__.py
│   ├── agent.py
│   └── README.md
│
├── 🌐 browser_extension/
│   ├── manifest.json
│   ├── content_script.js
│   ├── popup.html
│   └── README.md
│
└── 📚 docs/
    ├── pipeline.md                 ← توثيق كامل للـ Pipeline
    └── presentation.pptx           ← عرض تقديمي (9 slides)
```

---

## ⚙️ Backend API Endpoints

| Method | Endpoint | الوصف |
|---|---|---|
| `GET` | `/health` | فحص حالة الـ API والموديل |
| `POST` | `/predict` | تحليل خصائص الكتابة → emotion + stress |
| `POST` | `/survey` | تقييم الاستبيان → stress score |
| `POST` | `/analyze` | دمج النموذج + الاستبيان → hidden stress |
| `GET` | `/history` | سجل كل الجلسات للداشبورد |
| `WS` | `/ws/stream` | WebSocket محاكاة حية كل 500ms |

### مثال — POST /predict

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "mean_dwell": 88.0,
    "median_flight": 195.0,
    "cv_flight": 0.62,
    "mean_del_freq": 7.5,
    "mean_tot_time": 59000
  }'
```

**Response:**
```json
{
  "emotion": "A",
  "emotion_label": "Angry",
  "stress_score": 47.0,
  "stress_level": "medium",
  "recommendations": [
    {"icon": "☕", "title": "خذ استراحة 5 دقائق", "en": "Take a 5-min break"},
    {"icon": "🌬", "title": "تمرين التنفس (4-4-4-4)", "en": "Box breathing exercise"}
  ]
}
```

### مثال — POST /analyze (Hidden Stress Detection)

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "features": {"mean_dwell": 104.0, "median_flight": 285.0,
                 "cv_flight": 0.68, "mean_del_freq": 5.0, "mean_tot_time": 61000},
    "survey":   {"q1": 2, "q2": 1, "q3": 2, "q4": 1, "q5": 2}
  }'
```

---

## 🎨 Frontend Pages

### 📝 الاستبيان (Survey)
- 5 أسئلة بمقياس Likert (1–5)
- حساب درجة التوتر تلقائياً
- عرض النتائج بـ gauge chart

### ⌨️ التنبؤ الحي (Live Prediction)
- **وضع يدوي**: sliders للـ 5 features مع تحليل فوري
- **وضع المحاكاة**: يختار نمط الجلسة ويحدث كل 500ms تلقائياً
- يعرض: emotion, stress gauge, emotion distribution, recommendations

### 📊 المقارنة (Comparison)
- جنب لجنب: نتيجة الموديل vs الاستبيان
- حساب الـ divergence
- **كشف التوتر الخفي** مع alert تلقائي لو الفجوة > 20%
- زرار Quick Fill لاختبار سيناريوهات مختلفة

### 📈 السجل (History)
- Timeline chart لمسار التوتر
- Pie chart لتوزيع الحالات العاطفية
- Bar chart لمستويات التوتر
- جدول تفصيلي لكل الجلسات

---

## 🤖 منطق النظام

### حساب درجة التوتر
```
stress_score = (P(Angry) + P(Sad)) × 100
```

### مستويات التوتر
| الدرجة | المستوى | اللون |
|---|---|---|
| 0 – 34.9% | منخفض | 🟢 أخضر |
| 35 – 54.9% | متوسط | 🟡 أصفر |
| 55 – 100% | مرتفع | 🔴 أحمر |

### كشف التوتر الخفي
```
divergence = (model_stress / 100) - (survey_score / 10)
hidden_stress = divergence > 0.20
```

| النموذج | الاستبيان | النتيجة |
|---|---|---|
| مرتفع | مرتفع | توتر حقيقي مؤكد |
| مرتفع | منخفض | **⚠️ توتر خفي** |
| منخفض | مرتفع | توتر نفسي بحت |
| منخفض | منخفض | حالة طبيعية ✓ |

---

## 📊 أداء الموديل

| المقياس | القيمة |
|---|---|
| دقة CV (5-fold) | **90.3%** |
| دقة Test Set | **94.2%** |
| Binary Stress F1 | **91.3%** |
| الخوارزمية | Random Forest (200 trees) |
| عدد الـ Features | 5 |
| الـ Classes | Angry, Calm, Happy, Neutral, Sad |

---

## 📦 المكتبات المطلوبة

```
fastapi, uvicorn, pydantic      ← Backend
streamlit, plotly               ← Frontend
scikit-learn, imbalanced-learn  ← ML
pandas, numpy, scipy            ← Data
requests, websockets            ← Integration
```

---

*MindType AI v2.0 — Keystroke Dynamics Stress Detection System*
