import json
import numpy as np
import pandas as pd
from scipy.signal import welch
import joblib
from tensorflow.keras.models import load_model

# ================================
# LOAD MODEL + SCALER (once)
# ================================

model = load_model("models/eeg_cnn_lstm_model.h5")

try:
    with open("models/baseline.json", "r") as f:
        baseline = json.load(f)
except:
    baseline = None

try:
    scaler = joblib.load("models/scaler.pkl")
except:
    scaler = None


# ================================
# FEATURE EXTRACTION
# ================================

def bandpower(data, sf, band):
    low, high = band
    freqs, psd = welch(data, sf, nperseg=min(len(data), 256))
    idx = (freqs >= low) & (freqs <= high)
    return np.trapz(psd[idx], freqs[idx])


def extract_features(df):
    channels = ["Fp1", "Fp2", "F3", "F4", "Fz", "Pz"]

    for ch in channels:
        df[ch] = df[ch].astype(float)

    fs = 250
    window_size = 500
    step_size = 250

    theta_band = (4, 8)
    alpha_band = (8, 12)
    beta_band = (12, 30)

    features = []

    for start in range(0, len(df) - window_size, step_size):
        end = start + window_size
        row = []

        for ch in channels:
            window = df[ch].values[start:end]

            theta = bandpower(window, fs, theta_band)
            alpha = bandpower(window, fs, alpha_band)
            beta = bandpower(window, fs, beta_band)

            alpha_beta = alpha / (beta + 1e-6)
            theta_beta = theta / (beta + 1e-6)

            row.extend([theta, alpha, beta, alpha_beta, theta_beta])

        features.append(row)

    return pd.DataFrame(features)


# ================================
# MAIN PIPELINE FUNCTION
# ================================

def run_pipeline(file_path):

    # --- Load CSV ---
    with open(file_path, "r") as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        if "pkt_num" in line:
            header_index = i
            break

    df = pd.read_csv(file_path, skiprows=header_index)
    df.columns = df.columns.str.strip()

    # --- Feature Extraction ---
    feature_df = extract_features(df)

    if len(feature_df) < 10:
        return {"error": "Not enough data"}

    # --- Scaling ---
    X = feature_df.values
    if scaler:
        X = scaler.transform(X)

    # --- Sequence ---
    time_steps = min(10, len(X)//2)

    X_seq = []
    for i in range(len(X) - time_steps):
        X_seq.append(X[i:i + time_steps])

    X_seq = np.array(X_seq)

    # --- Prediction ---
    preds = model.predict(X_seq).flatten()

    # --- Smooth ---
    smooth_preds = np.convolve(preds, np.ones(5)/5, mode='valid')

    # --- Scores ---
    theta_mean = feature_df.iloc[:, 0::5].mean().mean()
    alpha_mean = feature_df.iloc[:, 1::5].mean().mean()
    beta_mean = feature_df.iloc[:, 2::5].mean().mean()

    model_score = smooth_preds.mean()
    if baseline:
        theta_mean = theta_mean / (baseline["theta"] + 1e-6)
        beta_mean = beta_mean / (baseline["beta"] + 1e-6)

    fatigue_ratio = theta_mean / (beta_mean + 1e-6)

    final_score = (0.4 * model_score) + (0.6 * (fatigue_ratio / 5))
    final_score = np.tanh(final_score)

    fatigue = round(min(final_score * 100, 85), 2)

    # --- Extra metrics ---
    focus = round(np.tanh((beta_mean / (alpha_mean + 1e-6))/5) * 100, 2)
    relax = round(np.tanh((alpha_mean / (beta_mean + 1e-6))/5) * 100, 2)
    load  = round(np.tanh((theta_mean / (alpha_mean + 1e-6))/5) * 100, 2)

    # --- Recommendations ---
    recommendations = []

    if fatigue > 65:
        recommendations += [
            "High fatigue detected - take a break immediately",
            "Drink water and relax your eyes",
            "Try deep breathing for 2-5 minutes",
        ]
    elif fatigue > 35:
        recommendations += [
            "Moderate fatigue - plan a short break soon",
            "Reduce screen brightness",
            "Minimize distractions",
        ]
    else:
        recommendations += [
            "You are in a good cognitive state",
            "Maintain your current focus",
            "Keep going",
        ]

    # --- Insights ---
    insights = []

    if focus < 30:
        insights.append("Low focus detected - try minimizing distractions")

    if relax > 60:
        insights.append("You are in a relaxed state")

    if load > 70:
        insights.append("High cognitive load - brain is under pressure")

    if fatigue > 70:
        insights.append("Risk of burnout if continued without rest")

    return {
        "fatigue": fatigue,
        "focus": focus,
        "relaxation": relax,
        "cognitive_load": load,
        "fatigue_trend": smooth_preds.tolist(),
        "recommendations": recommendations,
        "insights": insights,
    }