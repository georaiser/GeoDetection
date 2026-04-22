import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface Alert {
  active: boolean;
  message: string;
}

interface AlertPanelProps {
  alert: Alert | undefined;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ alert }) => {
  if (!alert) return null;

  return (
    <div className={`overlay-panel alert-panel ${alert.active ? 'active-alert' : 'inactive-alert'}`} style={{
      borderLeft: `4px solid ${alert.active ? 'var(--color-danger)' : 'var(--color-success)'}`,
      padding: '16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      backgroundColor: alert.active ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)',
    }}>
      {alert.active ? (
        <AlertTriangle color="var(--color-danger)" size={24} style={{ flexShrink: 0, animation: 'pulse 2s infinite' }} />
      ) : (
        <Info color="var(--color-success)" size={24} style={{ flexShrink: 0 }} />
      )}
      
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: alert.active ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {alert.active ? 'Active Fire Alert' : 'System Status Normal'}
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          {alert.message}
        </p>
      </div>
    </div>
  );
};

export default AlertPanel;
