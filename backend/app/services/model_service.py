from pathlib import Path

import joblib
import numpy as np
from fastapi import HTTPException

from app.core.config import get_settings


class ModelService:
    def __init__(self):
        settings = get_settings()
        self.scaler_path: Path = settings.scaler_path
        self.model_path: Path = settings.model_path
        self.scaler = None
        self.model = None
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        if self.scaler_path.exists():
            self.scaler = joblib.load(self.scaler_path)

        if self.model_path.exists():
            self.model = joblib.load(self.model_path)

    def transform(self, features):
        if self.scaler is None:
            return features

        try:
            return self.scaler.transform(features)
        except Exception as exc:
            raise HTTPException(status_code=500, detail='Scaler transform failed') from exc

    def predict(self, scaled_features):
        if self.model is None:
            # Temporary fallback until saved model is dropped in backend/models.
            return 'not_fatigued', 0.0

        try:
            raw_prediction = self.model.predict(scaled_features)
            label = str(raw_prediction[0])
        except Exception as exc:
            raise HTTPException(status_code=500, detail='Model prediction failed') from exc

        confidence = 0.0
        if hasattr(self.model, 'predict_proba'):
            try:
                probs = self.model.predict_proba(scaled_features)
                confidence = float(np.max(probs[0]))
            except Exception:
                confidence = 0.0

        return label, confidence
