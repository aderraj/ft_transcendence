import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

const API_URL = '/api';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setMessage({ type: 'error', text: 'Invalid reset link. Please request a new one.' });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reset password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="card login-card">
          <h1>🔐 Reset Password</h1>
          <div className="error" style={{ marginBottom: 16 }}>
            Invalid reset link. Please request a new one.
          </div>
          <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="card login-card">
        <h1>🔐 Reset Password</h1>
        <p style={{ marginBottom: 24, color: 'rgba(255,255,255,0.6)' }}>
          Enter your new password below.
        </p>

        {message && (
          <div className={message.type} style={{ marginBottom: 16 }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
            style={{ width: '100%', marginBottom: 12 }}
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
            style={{ width: '100%', marginBottom: 16 }}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginBottom: 12 }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/" style={{ color: '#2196f3', textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
