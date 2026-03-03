# Subl - Power BI Dashboard Instructions

## 📊 Power BI Dashboard Setup Guide

This guide will help you create a professional Power BI Dashboard using the provided CSV data files.

---

## 📁 Data Files

The following CSV files are provided for Power BI import:

| File | Description | Visualizations |
|------|-------------|----------------|
| `PowerBI_Emotion_Summary.csv` | Emotion statistics and metrics | Bar charts, pie charts |
| `PowerBI_Feature_Importance.csv` | ML feature importance | Horizontal bar chart |
| `PowerBI_Model_Performance.csv` | Model comparison | Column chart |
| `PowerBI_Time_Series.csv` | Real-time simulation data | Line chart, area chart |
| `PowerBI_Key_Metrics.csv` | Key project metrics | KPI cards |
| `PowerBI_Error_Patterns.csv` | Error correction patterns | Clustered bar chart |

---

## 🎯 Dashboard Pages

### Page 1: Executive Summary
**Purpose**: High-level overview for stakeholders

**Visualizations**:
1. **KPI Cards** (from PowerBI_Key_Metrics.csv)
   - Total Keystrokes: 42,500
   - Model Accuracy: 76.9%
   - Participants: 39
   - ROC AUC: 0.85

2. **Emotion Distribution** (Pie Chart)
   - Field: Emotion
   - Values: Percentage

3. **Model Performance** (Column Chart)
   - X-axis: Model
   - Y-axis: Test_Accuracy
   - Conditional formatting: Highlight "BEST"

### Page 2: Emotion Analysis
**Purpose**: Deep dive into emotion patterns

**Visualizations**:
1. **Hold Time by Emotion** (Bar Chart)
   - X-axis: Emotion
   - Y-axis: Hold_Time_Mean
   - Color by emotion

2. **Typing Speed by Emotion** (Bar Chart)
   - X-axis: Emotion
   - Y-axis: Typing_Speed

3. **Session Duration by Emotion** (Bar Chart)
   - X-axis: Emotion
   - Y-axis: Session_Duration

4. **Emotion Matrix** (Table)
   - All emotion metrics in one table

### Page 3: Feature Importance
**Purpose**: Show which features matter most

**Visualizations**:
1. **Feature Importance** (Horizontal Bar Chart)
   - Y-axis: Feature
   - X-axis: Importance
   - Sort by Importance descending

2. **Feature by Category** (Donut Chart)
   - Category: Timing, Speed, Variability, Count
   - Values: Count of features

### Page 4: Real-time Simulation
**Purpose**: Demonstrate how Subl works in real-time

**Visualizations**:
1. **Hold Time Over Time** (Line Chart)
   - X-axis: Time_Seconds
   - Y-axis: Normal_Hold_Time, Stress_Hold_Time
   - Legend: State

2. **Stress Score** (Area Chart)
   - X-axis: Time_Seconds
   - Y-axis: Stress_Score
   - Color zones: Green (0-50), Yellow (50-75), Red (75-100)

3. **State Indicator** (Gauge)
   - Current stress level
   - Thresholds: 50 (Alert), 75 (Critical)

### Page 5: Error Patterns
**Purpose**: Analyze error correction behavior

**Visualizations**:
1. **Delete Usage by Emotion** (Clustered Bar Chart)
   - X-axis: Emotion
   - Y-axis: Delete_Mean
   - Error bars: Delete_Std

2. **Left Arrow Usage** (Clustered Bar Chart)
   - X-axis: Emotion
   - Y-axis: LeftArrow_Mean

---

## 🎨 Design Guidelines

### Color Scheme
```
Normal (N):   #2ECC71 (Green)
Calm (C):     #3498DB (Blue)
High Stress:  #E74C3C (Red)
Angry (A):    #F39C12 (Orange)
Sad (S):      #9B59B6 (Purple)
```

### Theme Settings
- **Background**: White (#FFFFFF)
- **Text**: Dark Gray (#333333)
- **Title Font**: Segoe UI Bold, 16pt
- **Label Font**: Segoe UI, 11pt

### Visual Formatting
- Add data labels to all charts
- Use consistent decimal places (2 for percentages)
- Enable tooltips for detailed information

---

## 📊 DAX Measures (Optional)

Create these measures for advanced analysis:

```dax
// Stress Detection Rate
Stress Detection Rate = 
DIVIDE(
    CALCULATE(COUNTROWS('PowerBI_Emotion_Summary'), 'PowerBI_Emotion_Summary'[Code] IN {"H", "A", "S"}),
    COUNTROWS('PowerBI_Emotion_Summary')
)

// Average Hold Time
Avg Hold Time = AVERAGE('PowerBI_Emotion_Summary'[Hold_Time_Mean])

// Model Accuracy %
Model Accuracy % = 
VAR BestModel = MAXX('PowerBI_Model_Performance', 'PowerBI_Model_Performance'[Test_Accuracy])
RETURN BestModel
```

---

## 🚀 Steps to Create Dashboard

1. **Open Power BI Desktop**
2. **Get Data** → **Text/CSV**
3. **Import all 6 CSV files**
4. **Create relationships** (if needed)
5. **Create pages** as described above
6. **Add visualizations** to each page
7. **Apply formatting** and colors
8. **Add slicers** for interactivity
9. **Save as .pbix file**

---

## 📱 Mobile Layout

Enable mobile layout and arrange visuals for phone viewing:
- Stack KPI cards vertically
- Use single-column layout
- Prioritize key metrics

---

## ✅ Dashboard Checklist

- [ ] All 6 data files imported
- [ ] 5 pages created
- [ ] Visualizations added
- [ ] Colors applied correctly
- [ ] Data labels enabled
- [ ] Tooltips configured
- [ ] Mobile layout optimized
- [ ] Dashboard published (optional)

---

## 📞 Support

For questions about the data or analysis, refer to:
- `Subl_Complete_Analysis.ipynb` - Full analysis notebook
- `subl_data_analysis.py` - Python script
- `Subl_Data_Analysis_Dashboard.xlsx` - Excel dashboard
