from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import json
import numpy as np
import pandas as pd
from app.services.pipeline_service import extract_features, model, scaler

router = APIRouter()
UPLOAD_DIR = "uploads"
BASELINE_PATH = "models/baseline.json"

@router.post("/calibrate")
async def calibrate(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ---- Load CSV ----
    with open(file_path, "r") as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        if "pkt_num" in line:
            header_index = i
            break

    df = pd.read_csv(file_path, skiprows=header_index)
    df.columns = df.columns.str.strip()

    # ---- Extract Features ----
    feature_df = extract_features(df)

    if len(feature_df) < 10:
        return {"error": "Not enough data"}

    # ---- Compute Baseline ----
    theta_mean = feature_df.iloc[:, 0::5].mean().mean()
    alpha_mean = feature_df.iloc[:, 1::5].mean().mean()
    beta_mean  = feature_df.iloc[:, 2::5].mean().mean()

    # ---- Baseline Trend ----
    X = feature_df.values
    if scaler:
        X = scaler.transform(X)

    time_steps = min(10, len(X)//2)
    X_seq = []
    for i in range(len(X) - time_steps):
        X_seq.append(X[i:i + time_steps])

    X_seq = np.array(X_seq)
    preds = model.predict(X_seq).flatten()
    smooth_preds = np.convolve(preds, np.ones(5)/5, mode='valid')

    baseline = {
        "theta": float(theta_mean),
        "alpha": float(alpha_mean),
        "beta": float(beta_mean),
        "fatigue_trend": smooth_preds.tolist(),
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }

    # ---- Save baseline ----
    with open(BASELINE_PATH, "w") as f:
        json.dump(baseline, f)

    return {
        "message": "Calibration successful ✅",
        "baseline": baseline
    }


@router.get("/baseline")
async def get_baseline():
    if not os.path.exists(BASELINE_PATH):
        raise HTTPException(status_code=404, detail="Baseline not found")

    with open(BASELINE_PATH, "r") as f:
        baseline = json.load(f)

    return {
        "baseline": baseline
    }


@router.delete("/baseline")
async def delete_baseline():
    if not os.path.exists(BASELINE_PATH):
        raise HTTPException(status_code=404, detail="Baseline not found")

    os.remove(BASELINE_PATH)

    return {
        "message": "Baseline removed"
    }