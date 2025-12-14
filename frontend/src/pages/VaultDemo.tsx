import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface VaultStatus {
  connected: boolean;
  secrets: Record<string, { value: string; status: string }>;
}

function VaultDemo() {
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVaultStatus();
  }, []);

  const fetchVaultStatus = async () => {
    try {
      const response = await fetch('/api/vault/status');
      if (!response.ok) throw new Error('Failed to fetch Vault status');
      const data = await response.json();
      setVaultStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🔐 VAULT DEMO</h1>
      <h2>HashiCorp Vault Integration</h2>

      {loading && <p className="loading">Connecting to Vault...</p>}
      {error && <div className="error">{error}</div>}

      {vaultStatus && (
        <>
          <div className="status-box">
            <h3>
              Vault Status: {vaultStatus.connected ? (
                <span className="status-connected">🟢 CONNECTED</span>
              ) : (
                <span className="status-disconnected">🔴 DISCONNECTED</span>
              )}
            </h3>
            <p style={{ marginTop: '10px' }}>
              Secrets are fetched from Vault at backend startup.<br />
              Database password is used to connect to PostgreSQL.
            </p>
          </div>

          <h3 style={{ marginTop: '30px' }}>Loaded Secrets (Masked)</h3>
          <table>
            <thead>
              <tr>
                <th>SECRET KEY</th>
                <th>VALUE (MASKED)</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(vaultStatus.secrets).length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ color: '#f00' }}>
                    No secrets loaded - Vault unavailable
                  </td>
                </tr>
              ) : (
                Object.entries(vaultStatus.secrets).map(([key, info]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{info.value}</td>
                    <td>✅ {info.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="status-box" style={{ borderColor: '#0a0', marginTop: '30px' }}>
            <h3>🧪 How to Test</h3>
            <p style={{ margin: '10px 0' }}>
              1. <strong>Login as admin</strong> - Password is from Vault
            </p>
            <p style={{ margin: '10px 0' }}>
              2. <strong>Register a user</strong> - Stored in PostgreSQL (DB credentials from Vault)
            </p>
            <p style={{ margin: '10px 0' }}>
              3. <strong>Stop Vault</strong>: <code style={{ color: '#ff0' }}>docker stop pong-vault</code>
            </p>
            <p style={{ margin: '10px 0' }}>
              4. <strong>Restart backend</strong>: <code style={{ color: '#ff0' }}>docker restart pong-backend</code>
            </p>
            <p style={{ margin: '10px 0' }}>
              5. App should fail to connect to database (no secrets)
            </p>
          </div>
        </>
      )}

      <Link to="/" className="back-link">← BACK</Link>
    </div>
  );
}

export default VaultDemo;
