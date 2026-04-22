import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeSeriesChartProps {
  aoiId: string;
}

const generateMockData = (aoiId: string) => {
  // Generate 30 days of mock data
  const data = [];
  let currentScore = aoiId === 'california' ? 0.6 : 0.2;
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // Add some random walk
    currentScore = Math.max(0, Math.min(1, currentScore + (Math.random() - 0.45) * 0.2));
    
    // Create spike for california
    if (aoiId === 'california' && i === 2) {
        currentScore = 0.95;
    }
    
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      score: Number(currentScore.toFixed(2))
    });
  }
  return data;
};

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ aoiId }) => {
  const data = React.useMemo(() => generateMockData(aoiId), [aoiId]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '180px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
        30-Day Fire Intensity Trend
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--color-text-tertiary)" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--color-text-tertiary)" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.8rem' }}
            itemStyle={{ color: '#fff' }}
          />
          <Area type="monotone" dataKey="score" stroke="#f97316" fillOpacity={1} fill="url(#colorScore)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeSeriesChart;
