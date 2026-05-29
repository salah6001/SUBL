import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "processed" / "final_features.csv"
MODEL_DIR = ROOT / "model"
MODEL_PATH = MODEL_DIR / "stress_model.pkl"
METADATA_PATH = MODEL_DIR / "stress_metadata.json"

FEATURES = [
    "mean_dwell", "std_dwell", "mean_flight", "std_flight", "median_flight",
    "cv_flight", "balanced_del_freq", "balanced_n_keys", "mean_left_freq",
    "balanced_tot_time", "typistType", "pcTimeAverage", "ageRange", "gender"
]

STRESS_MAPPING = {
    "C": 0,
    "N": 1,
    "H": 1,
    "S": 2,
    "A": 2,
}

RANDOM_STATE = 42


def load_data(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df = df.copy()
    df.drop(columns=["userId"], errors="ignore", inplace=True)

    df["typistType"] = df["typistType"].map({
        "Touch Typist": 1,
        "Two Finger Typist": 1,
        "One Finger Typist": 2,
    })
    df["pcTimeAverage"] = df["pcTimeAverage"].map({
        "less than an hour per day": 1,
        "between 1 hour and 3 hours per day": 1,
        "More than 3 hours per day": 2,
    })
    df["gender"] = df["gender"].map({"Female": 1, "Male": 0})
    df["ageRange"] = df["ageRange"].map({">=50": 0, "16-19": 1, "30-39": 2, "20-29": 3})
    df["stress_Level"] = df["emotionIndex"].map(STRESS_MAPPING)
    df.drop(columns=["emotionIndex"], errors="ignore", inplace=True)

    return df


def fit_model(df: pd.DataFrame):
    X = df[FEATURES]
    y = df["stress_Level"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        class_weight="balanced",
        random_state=RANDOM_STATE,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "report": classification_report(y_test, y_pred, output_dict=True),
    }

    return model, metrics


def save_artifact(model, features):
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    artifact = {
        "model": model,
        "feature_names": features,
        "classes": [0, 1, 2],
    }
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(artifact, f)

    metadata = {
        "name": "MindType AI Stress Level Classifier",
        "version": "1.0.0",
        "artifact_path": str(MODEL_PATH),
        "feature_names": features,
        "classes": [0, 1, 2],
        "mapping": {"0": "Low", "1": "Optimal", "2": "High"},
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    return artifact, metadata


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Data file not found: {DATA_PATH}")

    print("Loading data...")
    df = load_data(DATA_PATH)
    print("Training model...")
    model, metrics = fit_model(df)

    print("Saving artifact...")
    artifact, metadata = save_artifact(model, FEATURES)

    print("Done.")
    print(f"Model saved to: {MODEL_PATH}")
    print(f"Metadata saved to: {METADATA_PATH}")
    print(f"Accuracy: {metrics['accuracy']:.4f}")


if __name__ == "__main__":
    main()
