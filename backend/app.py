from fastapi import FastAPI, UploadFile, File
import pandas as pd
import numpy as np
import joblib
from tensorflow.keras.models import load_model
from scipy.signal import welch

app = FastAPI()

# Load model + scaler
model = load_model("eeg_cnn_lstm_model.h5")
scaler = joblib.load("scaler.pkl")

channels = ["Fp1", "Fp2", "F3", "F4", "Fz", "Pz"]
fs = 250
window_size = 500
step_size = 250

theta_band = (4, 8)
alpha_band = (8, 12)
beta_band = (12, 30)


def bandpower(data, sf, band):
    low, high = band
    freqs, psd = welch(data, sf, nperseg=min(len(data), 256))
    idx = (freqs >= low) & (freqs <= high)
    return np.trapz(psd[idx], freqs[idx])


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    df = pd.read_csv(file.file)

    signal_data = {}
    for ch in channels:
        signal_data[ch] = df[ch].values

    features = []

    for start in range(0, len(signal_data["Fp1"]) - window_size, step_size):
        end = start + window_size
        row = []

        for ch in channels:
            window = signal_data[ch][start:end]

            theta = bandpower(window, fs, theta_band)
            alpha = bandpower(window, fs, alpha_band)
            beta = bandpower(window, fs, beta_band)

            row.extend([theta, alpha, beta])

        features.append(row)

    feature_df = pd.DataFrame(features)

    # Scaling
    X_scaled = scaler.transform(feature_df)

    # Create sequences
    time_steps = 20
    X_seq = []

    for i in range(len(X_scaled) - time_steps):
        X_seq.append(X_scaled[i:i + time_steps])

    X_seq = np.array(X_seq)

    # Prediction
    preds = model.predict(X_seq)
    preds = (preds > 0.5).astype(int)

    fatigue_score = int(preds.mean() * 100)

    return {
        "fatigue_percentage": fatigue_score,
        "status": "High" if fatigue_score > 60 else "Moderate" if fatigue_score > 30 else "Low"
    }
