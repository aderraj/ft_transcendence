import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface HealthStatus {
  service: string;
  status: string;
  vault: string;
  database: string;
  timestamp: string;
}

function Health() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('Health check failed');
      const data = await response.json();
      setHealth(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'connected' || status === 'operational') return 'status-connected';
    return 'status-disconnected';
  };

  return (
    <div className="container">
      <h1>🖥️ SYSTEM STATUS</h1>
      <h2>Infrastructure Health</h2>

      {loading && <p className="loading">Checking systems...</p>}
      {error && <div className="error">{error}</div>}

      {health && (
        <div className="status-box">
          <div className="status-item">
            <span>Service</span>
            <span>{health.service}</span>
          </div>
          <div className="status-item">
            <span>Overall Status</span>
            <span className={getStatusColor(health.status)}>
              {health.status === 'operational' ? '🟢' : '🟡'} {health.status.toUpperCase()}
            </span>
          </div>
          <div className="status-item">
            <span>Vault</span>
            <span className={getStatusColor(health.vault)}>
              {health.vault === 'connected' ? '🟢' : '🔴'} {health.vault.toUpperCase()}
            </span>
          </div>
          <div className="status-item">
            <span>Database (PostgreSQL)</span>
            <span className={getStatusColor(health.database)}>
              {health.database === 'connected' ? '🟢' : '🔴'} {health.database.toUpperCase()}
            </span>
          </div>
          <div className="status-item">
            <span>Last Check</span>
            <span>{new Date(health.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      <p style={{ marginTop: '20px', color: '#0a0' }}>
        Auto-refreshes every 5 seconds
      </p>

      <Link to="/" className="back-link">← BACK</Link>
    </div>
  );
}

export default Health;
