# MindType AI Desktop Agent

هذا الوكيل يلتقط توقيتات ضغطات الكيبورد من الجهاز ويرسل خصائص الكتابة إلى backend `/predict`.

## المتطلبات

- Python 3.11+
- مكتبة `pynput`
- backend يعمل على `http://localhost:8000`

## التشغيل

```bash
pip install -r requirements.txt
python -m desktop_agent --backend http://localhost:8000
```

## كيف يعمل

- يجمع توقيتات `keydown` و `keyup`
- يحسب:
  - `mean_dwell`
  - `median_flight`
  - `cv_flight`
  - `mean_del_freq`
  - `mean_tot_time`
- يرسل هذه الخصائص إلى `POST /predict`

## الإيقاف

- اضغط `ESC` لإيقاف الوكيل.
