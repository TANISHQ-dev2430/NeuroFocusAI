# NeuroFocus

NeuroFocus is a brain-fatigue insights app that analyzes EEG CSV sessions, provides fatigue scores, and supports a guided calibration flow to personalize results. The frontend is built with React (Vite) and the backend uses FastAPI.

## Features

- Upload EEG CSV sessions and get fatigue, focus, relaxation, and cognitive load scores
- Guided calibration flow (read → relax → solve → relax) to build a personal baseline
- Baseline comparison and dual-line fatigue trend chart when a baseline trend exists
- Recommendations and insights based on predicted fatigue levels
- Session history saved locally in the browser

## Project Structure

- `src/` - React frontend (pages, styles, assets)
- `backend/` - FastAPI backend
- `backend/models/` - model files and baseline JSON

## Prerequisites

- Node.js 18+ (for the frontend)
- Python 3.10+ (for the backend)

## Frontend Setup

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API runs at `http://localhost:8000`.

## Calibration Flow (How It Works)

1. Click **Start Calibrating** on the home page.
2. Follow the 4-step guide (read, relax, solve, relax), each for 10 seconds.
3. Upload the recorded CSV from Neuphony to save your baseline.
4. Future uploads are compared against the baseline to personalize fatigue scores.

If a baseline is present, the fatigue chart will show two lines (current vs baseline trend).

## API Endpoints

- `POST /api/calibrate` - Save baseline from a normal session CSV
- `GET /api/baseline` - Read the stored baseline
- `DELETE /api/baseline` - Remove the stored baseline
- `POST /api/predict` - Get predictions for a session CSV

## Notes

- Calibration baseline is stored in `backend/models/baseline.json`.
- If the baseline file is missing, predictions still work (no baseline comparison line).
- Session history is stored in browser `localStorage` under `neurofocus_sessions`.

## Common Issues

- **CORS errors**: ensure the backend is running and CORS is enabled (it is in `backend/app/main.py`).
- **Missing model/scaler**: place required model artifacts in `backend/models/`.

