from typing import Dict, Any
from src.agents.ingestion import create_ingestion_agent
from src.agents.preprocess_agent import create_preprocess_agent, cloud_masking_routine
from src.agents.inference_agent import create_inference_agent, WildfireDetector
from src.agents.alert_agent import create_alert_agent, send_alert
from src.agents.map_publish_agent import create_map_publish_agent, publish_to_db
from crewai import Task
import torch

def ingestion_node(state: Dict[str, Any]) -> Dict[str, Any]:
    print(f"[Pipeline] Ingesting satellite data for AOI: {state.get('aoi_id')}")
    agent = create_ingestion_agent()
    # Mocking CrewAI Task execution
    state["goes_data"] = {"status": "downloaded", "path": f"data/raw/goes_{state.get('aoi_id')}.nc"}
    state["viirs_data"] = {"status": "downloaded", "path": f"data/raw/viirs_{state.get('aoi_id')}.nc"}
    return state

def preprocess_node(state: Dict[str, Any]) -> Dict[str, Any]:
    print("[Pipeline] Preprocessing satellite data...")
    agent = create_preprocess_agent()
    goes_path = state.get("goes_data", {}).get("path")
    if goes_path:
        cloud_masking_routine(goes_path)
    state["preprocessed"] = True
    return state

def fusion_node(state: Dict[str, Any]) -> Dict[str, Any]:
    print("[Pipeline] Fusing multi-sensor GOES and VIIRS data representations...")
    # This was originally a langgraph node in fusion.py, keeping it simple here
    state["fusion_data"] = {"fused_score": 0.94, "sensors": ["GOES-16", "VIIRS"]}
    return state

def inference_node(state: Dict[str, Any]) -> Dict[str, Any]:
    print("[Pipeline] Running Wildfire Detection inference...")
    detector = WildfireDetector()
    
    # Construct a dummy tensor representing the fused GOES/VIIRS tile (Batch, Channels, H, W)
    # Channels = 21 (from WildfireEncoderParams)
    dummy_tensor = torch.randn(1, 21, 224, 224)
    prediction = detector.predict(dummy_tensor)
    
    print(f"[Pipeline] Deep Learning Confidence Score: {prediction['confidence']:.2f}")
    
    # Mock detection features
    state["detections"] = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [[[-120.5, 38.2], [-120.4, 38.2], [-120.4, 38.3], [-120.5, 38.3], [-120.5, 38.2]]]},
            "properties": {"confidence": prediction["confidence"], "frp": 1450.5}
        }]
    }
    state["change_score"] = 0.88 # Equivalent to confidence/intensity
    return state

def analysis_node(state: Dict[str, Any]) -> Dict[str, Any]:
    print("[Pipeline] Analyzing wildfire severity...")
    severity = "high" if state.get("change_score", 0) > 0.8 else "low"
    state["analysis"] = {
        "narrative": f"Active hotspot detected with {severity} intensity.",
        "severity": severity
    }
    state["severity"] = severity
    return state

def alert_node(state: Dict[str, Any]) -> Dict[str, Any]:
    print("[Pipeline] Evaluating severity for active alerting...")
    agent = create_alert_agent()
    if state.get("severity") == "high":
        print("[Pipeline] 🚨 HIGH SEVERITY FIRE ALERT TRIGGERED! Dispatching notification.")
        send_alert(state["analysis"])
        state["alerts"] = {"active": True, "message": f"High severity fire at {state.get('aoi_id')}"}
    else:
        state["alerts"] = {"active": False, "message": "Normal conditions."}
    return state

def publish_node(state: Dict[str, Any]) -> Dict[str, Any]:
    print(f"[Pipeline] 🗺️ Publishing events to PostGIS...")
    agent = create_map_publish_agent()
    publish_to_db(state.get("detections", {}).get("features", []))
    state["published"] = True
    return state
