from fastapi import APIRouter, UploadFile, File
import shutil
import os

from app.services.pipeline_service import run_pipeline

router = APIRouter()

UPLOAD_DIR = "uploads"

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = run_pipeline(file_path)

    return result