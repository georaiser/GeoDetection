# Autonomous Wildfire Monitoring System

A full-stack, agentic intelligence system for detecting and monitoring wildfires using real-time fused satellite imagery (GOES-16/18, VIIRS). 

This project recently underwent a major architectural upgrade inspired by the **GeoSentinel** framework, introducing a centralized LangGraph state machine, a custom PyTorch Vision Transformer, and a real-time reactive dashboard.

## 🧠 Architecture Overview

The system operates across three decoupled modules located in the `Wildfire` directory:

- **[Engine](./Wildfire/engine/)**: The AI/ML core. Operates a `LangGraph` pipeline orchestrating 5 specialized `crewai` agents (Ingestion, Preprocessing, Fusion, Analysis, Publishing). It features **WildfireViT**, a custom from-scratch PyTorch Vision Transformer built to ingest 21-channel fused multi-spectral satellite data.
- **[Backend](./Wildfire/backend/)**: A FastAPI service that bridges the React frontend and the LangGraph engine. It accepts analysis triggers and manages API requests via CORS.
- **[Frontend](./Wildfire/frontend/)**: A premium React (TypeScript) + Vite web application using **MapLibre GL JS** for visualizing active fire perimeters, Fire Radiative Power (FRP) metrics, and LLM-generated intelligence reports on a dynamic dark-themed dashboard.

## ⚡ Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PyTorch & Torchvision

### 1. Start the FastAPI Backend & Engine

The FastAPI backend natively imports the LangGraph engine.

```bash
cd Wildfire/backend
# Install dependencies
pip install fastapi uvicorn pydantic crewai langgraph torch torchvision
# Start the API server
uvicorn app.main:app --reload --port 8000
```

### 2. Launch the React Dashboard

In a new terminal window:

```bash
cd Wildfire/frontend
# Install React dependencies
npm install
npm install lucide-react maplibre-gl react-map-gl recharts
# Start the Vite development server
npm run dev
```

Navigate to `http://localhost:5173` in your browser. Selecting different fire hotspots (like California or Oregon) from the sidebar will trigger the LangGraph pipeline, execute the WildfireViT forward pass, and return the LLM's severity analysis to the UI!

## 🔄 Data Pipeline Flow

Data flows seamlessly through the `StateGraph` pipeline:
1. **Ingestion**: Fetches raw GOES & VIIRS imagery.
2. **Preprocessing**: Applies cloud masking routines.
3. **Fusion**: Merges spatial and temporal data.
4. **Inference**: Passes tensors to `WildfireViT` for deep learning feature extraction and confidence scoring.
5. **Analysis**: Uses LLMs (`crewai`) to interpret the score and write a human-readable severity narrative.
6. **Publish/Alert**: Dispatches high-severity warnings and writes the GeoJSON polygons to PostGIS.

## Documentation

See [autonomous_wildfire_mvp.md](./autonomous_wildfire_mvp.md) for the original MVP blueprint.
