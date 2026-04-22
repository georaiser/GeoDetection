import React from 'react';
import Dashboard from './components/Dashboard';
import { Shield } from 'lucide-react';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Shield size={24} color="#f97316" />
          Wild<span>fire</span>
        </div>
      </header>
      <main className="dashboard-layout">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
