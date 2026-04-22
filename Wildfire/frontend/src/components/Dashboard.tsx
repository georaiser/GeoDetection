import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import { AlertCircle, Eye, Activity, Truck, Loader } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import TimeSeriesChart from './TimeSeriesChart';
import AlertPanel from './AlertPanel';

// Fallback GeoJSON to show before the first LangGraph payload arrives
const fallbackGeojson: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[-120.5, 38.2], [-120.4, 38.2], [-120.4, 38.3], [-120.5, 38.3], [-120.5, 38.2]]] },
      properties: {}
    }
  ]
};

interface AnalysisResult {
  aoi_id: string;
  cloud_cover?: number;
  change_score?: number;
  detections?: GeoJSON.FeatureCollection;
  report?: {
    status: string;
    data: {
      narrative: string;
      severity: string;
    };
  };
  alerts?: {
    active: boolean;
    message: string;
  };
}

const Dashboard = () => {
  const [activeAoi, setActiveAoi] = useState('california');
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aoi_id: activeAoi, target_date: new Date().toISOString() })
        });
        const data = await response.json();
        setAnalysisData(data.results);
      } catch (err) {
        console.error("Failed to fetch analysis", err);
      }
      setLoading(false);
    };
    
    fetchAnalysis();
  }, [activeAoi]);
  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-section">
          <h3>Areas of Interest</h3>
          <div className="aoi-list">
            <div className={`aoi-item ${activeAoi === 'california' ? 'active' : ''}`} onClick={() => setActiveAoi('california')}>
              <span className="aoi-name">California (Dixie)</span>
              <span className="badge danger">2 Alerts</span>
            </div>
            <div className={`aoi-item ${activeAoi === 'oregon' ? 'active' : ''}`} onClick={() => setActiveAoi('oregon')}>
              <span className="aoi-name">Oregon (Bootleg)</span>
              <span className="badge warning">1</span>
            </div>
            <div className="aoi-item" onClick={() => setActiveAoi('amazon')}>
              <span className="aoi-name">Amazon (Rondônia)</span>
            </div>
            <div className="aoi-item" onClick={() => setActiveAoi('australia')}>
              <span className="aoi-name">Australia (NSW)</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <h3>Latest Analysis Run</h3>
          <div style={{ padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div className="pulse-indicator"></div>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Apr 16, 2026 · 06:42 UTC</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
              GOES-18 / VIIRS · {analysisData?.cloud_cover ? Math.round(analysisData.cloud_cover * 100) : 4}% cloud cover
            </div>
          </div>
        </div>
      </aside>

      <div className="map-container">
        {/* MapLibre Container */}
        <Map
          initialViewState={{
            longitude: -120.45,
            latitude: 38.25,
            zoom: 12
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        >
          <NavigationControl position="top-left" />
          
          <Source id="change-layer" type="geojson" data={analysisData?.detections || fallbackGeojson}>
             <Layer
              id="change-fill"
              type="fill"
              paint={{
                'fill-color': '#ef4444',
                'fill-opacity': 0.3
              }}
            />
            <Layer
              id="change-line"
              type="line"
              paint={{
                'line-color': '#ef4444',
                'line-width': 2
              }}
            />
          </Source>
        </Map>

        {/* Metrics Overlay */}
        <div className="overlay-panel metrics-panel">
          <AlertPanel alert={analysisData?.alerts} />
          {loading ? (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
               <Loader size={24} className="pulse-indicator" style={{ animation: 'spin 1s linear infinite', backgroundColor: 'transparent' }} color="var(--color-accent)" />
               <span style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>LangGraph Agents Analyzing...</span>
             </div>
          ) : (
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">Active Hotspots</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} className="value-danger" />
                  <span className="metric-value value-danger">+24</span>
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-label">FRP (MW)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} color="var(--color-accent)" />
                  <span className="metric-value">{analysisData?.change_score ? (analysisData.change_score * 2000).toFixed(0) : '1450'}</span>
                </div>
              </div>
              <div className="metric-card full-width" style={{ borderLeft: `4px solid ${analysisData?.report?.data?.severity === 'high' ? 'var(--color-danger)' : 'var(--color-success)'}` }}>
                <span className="metric-label">Confidence & Severity</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className={`metric-value ${analysisData?.report?.data?.severity === 'high' ? 'value-danger' : 'value-success'}`}>
                    {analysisData?.report?.data?.severity?.toUpperCase() || 'LOW'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>(0.87 cfg)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Time Series Chart Overlay */}
        <div className="overlay-panel timeseries-panel">
          <TimeSeriesChart aoiId={activeAoi} />
        </div>

        {/* Intelligence Report Overlay */}
        <div className="overlay-panel report-panel">
          <div className="report-header">
            <h4 className="report-title">Intelligence Report</h4>
            <span className="report-date">Apr 16, 2026</span>
          </div>
          <div className="report-body">
            {loading ? "Waiting for LLM analysis..." : (analysisData?.report?.data?.narrative || 'No report available for this AOI.')}
          </div>
          <div className="chip-container">
            <div className="chip">
              <Eye size={12} />
              14 sq km burned
            </div>
            <div className="chip alert">
              <AlertCircle size={12} />
              Extreme heat signature
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
