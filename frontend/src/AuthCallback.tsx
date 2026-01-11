import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      console.log('OAuth token received:', token.substring(0, 20) + '...');
      localStorage.setItem('token', token);
      
      // Force a full page reload to reinitialize the auth state
      window.location.href = '/dashboard';
    } else {
      console.error('No token received from OAuth');
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#1a1a2e'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
        <h2 style={{ marginBottom: '8px' }}>Authenticating with 42...</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Please wait while we log you in</p>
      </div>
    </div>
  );
}
