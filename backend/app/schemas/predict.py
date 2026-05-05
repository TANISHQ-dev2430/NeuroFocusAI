from pydantic import BaseModel


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    rows_processed: int
    filename: str
