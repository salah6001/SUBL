import json
import pickle
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
try:
    from imblearn.over_sampling import SMOTE
    _SMOTE_AVAILABLE = True
except ImportError:
    SMOTE = None
    _SMOTE_AVAILABLE = False
from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "processed" / "final_features.csv"
MODEL_DIR = ROOT / "model"
MODEL_PATH = MODEL_DIR / "mindtype_model.pkl"
ENCODER_PATH = MODEL_DIR / "encoder.pkl"
METADATA_PATH = MODEL_DIR / "metadata.json"

FEATURE_NAMES = [
    "mean_dwell",
    "median_flight",
    "cv_flight",
    "mean_del_freq",
    "mean_tot_time",
]

RANDOM_STATE = 42


def load_data(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df = df.dropna(subset=FEATURE_NAMES + ["emotionIndex"]).copy()
    return df


def build_pipeline(random_state: int = RANDOM_STATE) -> Pipeline:
    return Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "clf",
                RandomForestClassifier(
                    n_estimators=200,
                    class_weight="balanced",
                    random_state=random_state,
                ),
            ),
        ]
    )


def cross_val_with_smote(model: Pipeline, X: pd.DataFrame, y: np.ndarray, n_splits: int = 5) -> float:
    kf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=RANDOM_STATE)
    scores = []
    for train_idx, val_idx in kf.split(X, y):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        if _SMOTE_AVAILABLE:
            X_train_res, y_train_res = SMOTE(random_state=RANDOM_STATE).fit_resample(X_train, y_train)
        else:
            X_train_res, y_train_res = X_train, y_train
        model_fold = clone(model)
        model_fold.fit(X_train_res, y_train_res)
        scores.append(accuracy_score(y_val, model_fold.predict(X_val)))
    return float(np.mean(scores))


def train() -> dict:
    df = load_data(DATA_PATH)
    X = df[FEATURE_NAMES]
    y = df["emotionIndex"]

    label_encoder = LabelEncoder()
    y_enc = label_encoder.fit_transform(y)

    pipeline = build_pipeline()

    cv_accuracy = cross_val_with_smote(pipeline, X, y_enc, n_splits=5)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=RANDOM_STATE, stratify=y_enc
    )

    if _SMOTE_AVAILABLE:
        X_train_res, y_train_res = SMOTE(random_state=RANDOM_STATE).fit_resample(X_train, y_train)
    else:
        X_train_res, y_train_res = X_train, y_train
    pipeline.fit(X_train_res, y_train_res)

    y_pred = pipeline.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)
    test_f1_macro = f1_score(y_test, y_pred, average="macro")
    binary_target = np.isin(y_test, label_encoder.transform(["A", "S"])) if hasattr(label_encoder, "transform") else np.isin(y_test, [0, 4])
    binary_pred = np.isin(y_pred, label_encoder.transform(["A", "S"])) if hasattr(label_encoder, "transform") else np.isin(y_pred, [0, 4])
    binary_stress_f1 = f1_score(binary_target, binary_pred)

    clf = pipeline.named_steps["clf"]
    feature_importance = {
        name: float(score)
        for name, score in sorted(
            zip(FEATURE_NAMES, clf.feature_importances_), key=lambda item: item[1], reverse=True
        )
    }

    artifact = {
        "model": pipeline,
        "label_encoder": label_encoder,
        "feature_names": FEATURE_NAMES,
        "classes": list(label_encoder.classes_),
        "model_version": "1.0.0",
    }

    model_metrics = {
        "cv_accuracy": round(cv_accuracy, 4),
        "test_accuracy": round(test_accuracy, 4),
        "test_f1_macro": round(test_f1_macro, 4),
        "binary_stress_f1": round(binary_stress_f1, 4),
    }

    metadata = {
        "model_name": "MindType AI — Emotion Classifier",
        "version": artifact["model_version"],
        "created": date.today().isoformat(),
        "algorithm": "RandomForestClassifier",
        "n_estimators": 200,
        "class_weight": "balanced",
        "feature_names": FEATURE_NAMES,
        "emotion_classes": list(label_encoder.classes_),
        "stress_classes": ["A", "S"],
        "emotion_labels": {
            "A": "Angry",
            "C": "Calm",
            "H": "Happy",
            "N": "Neutral",
            "S": "Sad",
        },
        "performance": model_metrics,
        "thresholds": {
            "stress_low": 0.35,
            "stress_medium": 0.55,
            "hidden_stress_delta": 0.2,
        },
        "preprocessing": "StandardScaler + SMOTE oversampling on training folds" if _SMOTE_AVAILABLE else "StandardScaler",
        "smote_balanced": _SMOTE_AVAILABLE,
        "training_samples": int(len(df)),
        "dataset": "EmoSurv",
        "feature_importance": feature_importance,
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(artifact, f)
    with open(ENCODER_PATH, "wb") as f:
        pickle.dump(label_encoder, f)
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    return {
        "artifact_path": str(MODEL_PATH),
        "encoder_path": str(ENCODER_PATH),
        "metadata_path": str(METADATA_PATH),
        "metrics": model_metrics,
        "feature_importance": feature_importance,
        "classes": list(label_encoder.classes_),
    }


if __name__ == "__main__":
    result = train()
    print("Model saved:")
    print(f"  - {result['artifact_path']}")
    print(f"  - {result['encoder_path']}")
    print(f"  - {result['metadata_path']}")
    print("Metrics:")
    for key, value in result["metrics"].items():
        print(f"  {key}: {value}")
    print("Feature importance:")
    for name, score in result["feature_importance"].items():
        print(f"  {name}: {score:.4f}")
