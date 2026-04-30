# MindType AI Browser Extension

هذه الإضافة تجمع خصائص الكتابة في صفحات الويب وتُرسلها إلى backend `/predict`.

## التشغيل

1. شغل backend على `http://localhost:8000`.
2. افتح Chrome أو Edge.
3. اذهب إلى `chrome://extensions` أو `edge://extensions`.
4. فعّل وضع المطور (`Developer mode`).
5. اضغط `Load unpacked` واختر مجلد `browser_extension`.

## كيف تعمل

- تستمع إلى أحداث `keydown` و `keyup` في صفحات الويب.
- تحسب ميزات الكتابة التالية:
  - `mean_dwell`
  - `median_flight`
  - `cv_flight`
  - `mean_del_freq`
  - `mean_tot_time`
- ترسل البيانات إلى `POST http://localhost:8000/predict`.

## ملاحظات

- البيانات لا تُخزن في الإضافة.
- الموديل Backend يجب أن يكون شغّالاً قبل التثبيت.
