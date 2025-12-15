import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // Handle WAF blocked requests (returns HTML, not JSON)
      if (response.status === 403) {
        throw new Error('🛡️ Request blocked by security firewall. Suspicious input detected.');
      }

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('🛡️ Request blocked by security firewall.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setSuccess(`Welcome, ${data.user.username}! ${data.message || ''}`);
      localStorage.setItem('token', data.token);
      
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      // Handle JSON parse errors (WAF returns HTML)
      if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        setError('🛡️ Request blocked by security firewall. Suspicious input detected.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🏓 LOGIN</h1>
      <h2>Enter the Arena</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="USERNAME"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <br />
        <input
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? '[ CONNECTING... ]' : '[ ENTER ]'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <p style={{ marginTop: '20px', color: '#0a0' }}>
        💡 Admin login uses password from Vault
      </p>

      <Link to="/" className="back-link">← BACK</Link>
    </div>
  );
}

export default Login;
