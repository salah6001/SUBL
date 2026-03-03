# Subl - Complete Project Guide

## Data Analysis, Machine Learning & Web Integration

---

## 📋 Table of Contents

1. [Understanding the Charts](#1-understanding-the-charts)
2. [Connecting Data to Frontend &amp; Backend](#2-connecting-data-to-frontend--backend)
3. [Complete Data Processing Pipeline](#3-complete-data-processing-pipeline)
4. [Project Files Summary](#4-project-files-summary)

---

## 1. Understanding the Charts

### 📊 Chart 1: Emotion Analysis

**File**: `01_emotion_analysis.png`

**What it shows**:

- **Hold Time Mean by Emotion**: How long users press keys in each emotional state
- **Flight Time Mean by Emotion**: Time between pressing consecutive keys
- **Hold Time Variability (CV)**: Consistency of key press duration
- **Typing Speed by Emotion**: Keys per minute for each emotion

**Key Insight**:

- High Stress (H) and Angry (A) show elevated hold times (~108-113ms vs ~95-98ms for Normal)
- This indicates **muscle tension** under stress
- Typing speed varies but isn't a reliable standalone indicator

**Why it matters**: This chart proves that emotional state affects physical typing behavior.

---

### 📊 Chart 2: Correlation Analysis

**File**: `02_correlation_analysis.png`

**What it shows**:

- **Correlation Matrix**: Shows relationships between all features لماذا
- **Scatter Plot**: Hold Time vs Typing Speed colored by emotion

**Key Insight**:

- Strong negative correlation (-0.75) between hold_time and typing_speed كيف
- Longer key presses = slower typing (obvious but quantified)
- Different emotions cluster in different regions

**Why it matters**: Helps identify redundant features and understand feature relationships for ML.

---

### 📊 Chart 3: Error Patterns

**File**: `03_error_patterns.png`

**What it shows**:

- **Delete Key Usage**: How often users press Delete
- **Left Arrow Usage**: Navigation to fix errors
- **Session Duration**: Total typing time
- **Error Rate**: Calculated from delete frequency

**Key Insight**:

- Delete usage varies by emotion but not consistently
- Some users make more errors when stressed, others become more careful
- Individual coping mechanisms vary significantly

**Why it matters**: Error patterns provide additional context for stress detection. كيف

---

### 📊 Chart 4: Advanced Patterns

**File**: `04_advanced_patterns.png`

**What it shows**:

- **Rhythm Variability**: Flight time CV (coefficient of variation)
- **Hold vs Flight Scatter**: Relationship between timing metrics
- **Key Press Count**: Total keystrokes per session
- **Inter-Key Timing**: U1D2 mean كيف

**Key Insight**:

- **Broken Rhythm Phenomenon**: Under stress, typing becomes irregular كيف
- Users type in bursts: "fast...pause...fast...pause" كيف
- Rhythm variability is a strong stress indicator كيف

**Why it matters**: This is the second key phenomenon (after muscle tension) for stress detection.

---

### 📊 Chart 5: Distribution Analysis

**File**: `05_distributions.png`

**What it shows**:

- **KDE Plots**: Distribution curves for key features
- **Mean Comparison**: Average values by emotion
- **Variability Comparison**: CV values by emotion
- **Sample Count**: Number of samples per emotion

**Key Insight**:

- Normal/Calm have bell-shaped (normal) distributions كيف
- Stress states show skewed or scattered distributions كيف
- Sample count varies (class imbalance exists)

**Why it matters**: Shows data distribution characteristics important for ML model selection.

---

### 📊 Chart 6: Model Analysis

**File**: `06_model_analysis.png`

**What it shows**:

- **Accuracy Comparison**: Test accuracy for each model
- **Confusion Matrix**: True vs Predicted labels
- **Feature Importance**: Which features matter most
- **ROC Curve**: True Positive Rate vs False Positive Rate

**Key Insight**:

- **Gradient Boosting wins** with 76.9% accuracy
- ROC AUC = 0.85 (excellent)
- Top 3 features: typing_speed, hold_time_mean, flight_time_mean

**Why it matters**: Proves our ML approach works and identifies the best model.

---

### 📊 Chart 7: Comprehensive Dashboard

**File**: `07_comprehensive_dashboard.png`

**What it shows**:

- All key metrics in one view
- Hold time, rhythm variance, typing speed by emotion
- Delete usage, session duration by emotion
- Normal vs Stress comparison (normalized)

**Key Insight**:

- Clear differences between Normal/Calm and Stress states
- Multiple metrics confirm stress detection reliability
- Provides executive summary view

**Why it matters**: One-stop view for all project findings.

---

### 📊 Chart 8: Real-time Simulation

**File**: `08_realtime_simulation.png`

**What it shows**:

- **Hold Time Over Time**: Normal vs stress pattern
- **Flight Time Over Time**: Rhythm changes
- **Stress Score**: Calculated stress level (0-100)
- **Key Press Heatmap**: Activity intensity

**Key Insight**:

- At t=30s, stress is triggered
- Hold time increases from ~100ms to ~120ms
- Stress score crosses alert threshold (50)
- System would trigger intervention

**Why it matters**: Demonstrates how Subl would work in real-world application.

---

## 2. Connecting Data to Frontend & Backend

### 🌐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │   Desktop    │  │   Mobile     │          │
│  │   (React)    │  │   (Electron) │  │   (React)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│                      FRONTEND LAYER                             │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  • Real-time typing capture                           │   │
│  │  • Feature calculation (hold time, flight time)      │   │
│  │  • Stress score display                              │   │
│  │  • Intervention notifications                        │   │
│  └────────────────────────┬───────────────────────────────┘   │
└───────────────────────────┼────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│                       API LAYER                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  REST API / WebSocket                                   │   │
│  │  • /predict - Get stress prediction                    │   │
│  │  • /features - Extract features from keystrokes        │   │
│  │  • /history - Get user history                         │   │
│  └────────────────────────┬───────────────────────────────┘   │
└───────────────────────────┼────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│                      BACKEND LAYER                              │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Python (Flask/FastAPI)                                 │   │
│  │  • Load trained model (subl_stress_model.pkl)          │   │
│  │  • Feature preprocessing                               │   │
│  │  • Prediction endpoint                                 │   │
│  │  • Data storage (optional)                             │   │
│  └────────────────────────┬───────────────────────────────┘   │
└───────────────────────────┼────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│                       ML MODEL LAYER                            │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Gradient Boosting Classifier                           │   │
│  │  • 12 input features                                    │   │
│  │  • Binary output: Normal (0) or Stress (1)             │   │
│  │  • 76.9% accuracy                                       │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 🔗 Data Flow

#### Frontend → Backend (Request)

```json
{
  "keystrokes": [
    {"key": "a", "press_time": 1000, "release_time": 1100},
    {"key": "b", "press_time": 1150, "release_time": 1250}
  ],
  "user_id": "user_123"
}
```

#### Backend → Frontend (Response)

```json
{
  "stress_detected": true,
  "stress_score": 72.5,
  "confidence": 0.85,
  "features": {
    "hold_time_mean": 115.2,
    "flight_time_mean": 342.8,
    "typing_speed": 132.5
  },
  "recommendation": "Take a 5-minute break"
}
```

### 📁 Key Files for Integration

| File                             | Purpose                  | Integration Point     |
| -------------------------------- | ------------------------ | --------------------- |
| `subl_stress_model.pkl`        | Trained ML model         | Backend loads this    |
| `analysis_results.json`        | Model metadata           | Backend configuration |
| `Subl_Complete_Analysis.ipynb` | Feature engineering code | Backend preprocessing |

### 🛠️ Backend Implementation (Python/Flask)

```python
from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# Load model
with open('subl_stress_model.pkl', 'rb') as f:
    model_data = pickle.load(f)

model = model_data['model']
feature_names = model_data['feature_names']

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    keystrokes = data['keystrokes']
  
    # Calculate features
    features = calculate_features(keystrokes)
  
    # Make prediction
    prediction = model.predict([features])[0]
    probability = model.predict_proba([features])[0]
  
    return jsonify({
        'stress_detected': bool(prediction),
        'confidence': float(max(probability)),
        'features': dict(zip(feature_names, features))
    })

def calculate_features(keystrokes):
    # Extract hold times, flight times
    hold_times = [k['release_time'] - k['press_time'] for k in keystrokes]
    flight_times = [keystrokes[i+1]['press_time'] - keystrokes[i]['release_time'] 
                    for i in range(len(keystrokes)-1)]
  
    # Calculate features (same as in notebook)
    features = [
        np.mean(hold_times),
        np.std(hold_times),
        np.max(hold_times),
        np.min(hold_times),
        np.std(hold_times) / np.mean(hold_times),
        np.mean(flight_times),
        np.std(flight_times),
        np.max(flight_times),
        np.min(flight_times),
        np.std(flight_times) / np.mean(flight_times),
        60000 / (np.mean(hold_times) + np.mean(flight_times)),
        len(keystrokes)
    ]
  
    return features

if __name__ == '__main__':
    app.run(debug=True)
```

### 🎨 Frontend Implementation (React)

```typescript
// Capture keystrokes
const handleKeyDown = (event: KeyboardEvent) => {
  const timestamp = Date.now();
  keystrokes.current.push({
    key: event.key,
    press_time: timestamp,
    release_time: null
  });
};

const handleKeyUp = (event: KeyboardEvent) => {
  const timestamp = Date.now();
  const lastKeystroke = keystrokes.current.find(k => k.key === event.key && !k.release_time);
  if (lastKeystroke) {
    lastKeystroke.release_time = timestamp;
  }
};

// Send to backend
const analyzeStress = async () => {
  const response = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keystrokes: keystrokes.current })
  });
  
  const result = await response.json();
  setStressScore(result.stress_score);
  
  if (result.stress_detected) {
    showIntervention(result.recommendation);
  }
};
```

---

## 3. Complete Data Processing Pipeline

### Step-by-Step Pipeline

```
Raw Data (4 CSV files)
    ↓
Data Loading (pandas.read_csv)
    ↓
Data Cleaning (filter invalid values)
    ↓
Feature Engineering (12 features)
    ↓
Exploratory Data Analysis (8 visualizations)
    ↓
Model Training (3 models)
    ↓
Model Evaluation (accuracy, ROC, confusion matrix)
    ↓
Model Saving (pickle)
    ↓
Web Integration (API + Frontend)
```

### Detailed Steps

#### Step 1: Data Loading

```python
import pandas as pd

participants = pd.read_csv('Participants Information.csv', sep=';')
fixed_text = pd.read_csv('Fixed Text Typing Dataset.csv', sep=';')
free_text = pd.read_csv('Free Text Typing Dataset.csv', sep=';')
frequency = pd.read_csv('Frequency Dataset.csv', sep=';')
```

#### Step 2: Data Cleaning

```python
# Remove invalid timestamps
fixed_clean = fixed_text[
    (fixed_text['D1U1'] > 0) & 
    (fixed_text['D1U1'] < 2000) &
    (fixed_text['D1D2'] > 0) & 
    (fixed_text['D1D2'] < 2000)
]
```

#### Step 3: Feature Engineering

```python
def create_features(df):
    grouped = df.groupby(['userId', 'emotionIndex'])
  
    features = pd.DataFrame()
    features['hold_time_mean'] = grouped['D1U1'].mean()
    features['hold_time_std'] = grouped['D1U1'].std()
    features['flight_time_mean'] = grouped['D1D2'].mean()
    features['flight_time_std'] = grouped['D1D2'].std()
    features['typing_speed'] = 60000 / (features['flight_time_mean'] + features['hold_time_mean'])
  
    return features.reset_index()
```

#### Step 4: Model Training

```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = GradientBoostingClassifier(n_estimators=200, max_depth=5)
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print(f"Accuracy: {accuracy:.2%}")
```

#### Step 5: Model Saving

```python
import pickle

model_data = {
    'model': model,
    'feature_names': list(X.columns),
    'accuracy': accuracy
}

with open('subl_stress_model.pkl', 'wb') as f:
    pickle.dump(model_data, f)
```

---

## 4. Project Files Summary

### 📁 Complete File List

| File                                  | Type             | Description                          |
| ------------------------------------- | ---------------- | ------------------------------------ |
| `Subl_Complete_Analysis.ipynb`      | Jupyter Notebook | Complete analysis with explanations  |
| `subl_data_analysis.py`             | Python Script    | Reusable pipeline script             |
| `Subl_Data_Analysis_Dashboard.xlsx` | Excel            | 7-sheet professional dashboard       |
| `Subl_Presentation.pptx`            | PowerPoint       | 14-slide presentation for Dr.        |
| `subl_stress_model.pkl`             | Model            | Trained Gradient Boosting classifier |
| `analysis_results.json`             | JSON             | Model metadata and results           |
| `PowerBI_*.csv`                     | CSV (6 files)    | Data files for Power BI              |
| `PowerBI_Dashboard_Instructions.md` | Markdown         | Power BI setup guide                 |
| `01_emotion_analysis.png`           | Image            | Chart 1                              |
| `02_correlation_analysis.png`       | Image            | Chart 2                              |
| `03_error_patterns.png`             | Image            | Chart 3                              |
| `04_advanced_patterns.png`          | Image            | Chart 4                              |
| `05_distributions.png`              | Image            | Chart 5                              |
| `06_model_analysis.png`             | Image            | Chart 6                              |
| `07_comprehensive_dashboard.png`    | Image            | Chart 7                              |
| `08_realtime_simulation.png`        | Image            | Chart 8                              |
| `COMPLETE_PROJECT_GUIDE.md`         | Markdown         | This file                            |

### 🎯 What Each File Contains

#### Jupyter Notebook (`Subl_Complete_Analysis.ipynb`)

- 50+ cells with complete analysis
- Step-by-step explanations
- All 8 visualizations with code
- Model training and evaluation
- Exportable and runnable

#### Python Script (`subl_data_analysis.py`)

- 879 lines of organized code
- 8 functions for different tasks
- Can be run as: `python subl_data_analysis.py`
- Produces all outputs automatically

#### Excel Dashboard (`Subl_Data_Analysis_Dashboard.xlsx`)

- **Dashboard**: Key metrics and summaries
- **Raw Data Summary**: Dataset statistics
- **Feature Engineering**: 12 features explained
- **Model Performance**: Results and comparisons
- **Emotion Analysis**: Behavior by emotion
- **Error Patterns**: Correction behavior
- **Summary & Conclusions**: Project overview

#### Power BI Data Files (6 CSV files)

- Ready to import into Power BI
- Pre-formatted for visualization
- Includes all necessary metrics

#### Presentation (`Subl_Presentation.pptx`)

- 14 professional slides
- Ready for Dr. presentation
- Covers all key findings
- Includes conclusion and Q&A

---

## ✅ Quick Start Guide

### For Data Analysis

```bash
# Run the complete pipeline
python subl_data_analysis.py

# Or open in Jupyter
jupyter notebook Subl_Complete_Analysis.ipynb
```

### For Excel Dashboard

1. Open `Subl_Data_Analysis_Dashboard.xlsx`
2. Navigate through 7 sheets
3. All data is pre-formatted and ready

### For Power BI Dashboard

1. Open Power BI Desktop
2. Import all `PowerBI_*.csv` files
3. Follow `PowerBI_Dashboard_Instructions.md`
4. Create visualizations as described

### For Presentation

1. Open `Subl_Presentation.pptx`
2. Review 14 slides
3. Present to Dr.

### For Web Integration

1. Backend: Use `subl_stress_model.pkl`
2. Frontend: Capture keystrokes and send to API
3. Follow architecture diagram above

---

## 📞 Support

For questions about:

- **Data Analysis**: Check `Subl_Complete_Analysis.ipynb`
- **Code**: Check `subl_data_analysis.py`
- **Charts**: Check this guide (Section 1)
- **Integration**: Check this guide (Section 2)
- **Excel**: Open `Subl_Data_Analysis_Dashboard.xlsx`
- **Power BI**: Check `PowerBI_Dashboard_Instructions.md`

---

**End of Complete Project Guide**
