from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Inject the engine directory into sys.path to allow importing the pipeline
current_dir = os.path.dirname(os.path.abspath(__file__))
engine_path = os.path.join(current_dir, "../../engine")
sys.path.append(os.path.abspath(engine_path))

from src.pipeline import build_pipeline

app = FastAPI(title="Wildfire Monitoring API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compile pipeline singleton
pipeline = build_pipeline()

class AnalysisRequest(BaseModel):
    aoi_id: str
    target_date: str

@app.get("/")
def read_root():
    return {"status": "ok", "service": "wildfire-backend"}

@app.post("/api/analyze")
def trigger_analysis(request: AnalysisRequest):
    # Initialize state for the LangGraph pipeline
    initial_state = {
        "aoi_id": request.aoi_id,
        "preprocessed": False,
        "change_score": 0.0
    }
    
    # Run the compiled LangGraph pipeline
    # In a real environment, this might be async or queued
    final_state = pipeline.invoke(initial_state)
    
    return {"job_status": "completed", "aoi_id": request.aoi_id, "results": final_state}

@app.get("/api/reports/{aoi_id}")
def get_reports(aoi_id: str):
    return []
