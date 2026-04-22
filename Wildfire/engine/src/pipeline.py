from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from src.nodes import (
    ingestion_node, preprocess_node, fusion_node, inference_node,
    analysis_node, alert_node, publish_node
)

class WildfireState(TypedDict):
    aoi_id: str
    goes_data: Dict
    viirs_data: Dict
    preprocessed: bool
    fusion_data: Dict
    detections: Dict
    change_score: float
    analysis: Dict
    severity: str
    alerts: Dict
    published: bool

def build_pipeline():
    graph = StateGraph(WildfireState)
    
    # Add nodes
    graph.add_node("ingestion", ingestion_node)
    graph.add_node("preprocess", preprocess_node)
    graph.add_node("fusion", fusion_node)
    graph.add_node("inference", inference_node)
    graph.add_node("analyze", analysis_node)
    graph.add_node("alert", alert_node)
    graph.add_node("publish", publish_node)
    
    # Define edges
    graph.set_entry_point("ingestion")
    graph.add_edge("ingestion", "preprocess")
    graph.add_edge("preprocess", "fusion")
    graph.add_edge("fusion", "inference")
    graph.add_edge("inference", "analyze")
    
    # Analyze splits to Alert and Publish directly
    graph.add_edge("analyze", "alert")
    graph.add_edge("analyze", "publish")
    
    # Alert converges to END
    graph.add_edge("alert", END)
    # Publish converges to END
    graph.add_edge("publish", END)
    
    return graph.compile()
