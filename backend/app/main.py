from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.calibrate import router as calibrate_router
from app.api.routes.predict import router as predict_router
from app.core.config import get_settings

app = FastAPI()

settings = get_settings()

app.add_middleware(
	CORSMiddleware,
	allow_origins=[origin.strip() for origin in settings.cors_origins.split(',') if origin.strip()],
	allow_credentials=True,
	allow_methods=['*'],
	allow_headers=['*'],
)

app.include_router(calibrate_router, prefix="/api")
app.include_router(predict_router, prefix="/api")