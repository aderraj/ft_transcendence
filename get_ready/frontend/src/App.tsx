import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { authApi, usersApi, friendsApi, leaderboardApi } from './api'
import { AuthCallback } from './AuthCallback'
import { Chat } from './Chat'
import { ForgotPassword } from './ForgotPassword'
import { ResetPassword } from './ResetPassword'
import { Settings } from './Settings'
import config from './config'

// Types
interface User {
  id: string
  email: string
  username: string
  displayName: string | null
  avatar: string
  isOnline: boolean
  level: number
  experience: number
  wins: number
  losses: number
}

interface FriendRequest {
  id: string
  sender: User
  receiver: User
}

// Auth Context
const useAuth = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loginWithCredentials = async (username: string, password: string) => {
    try {
      const res = await authApi.login(username, password)
      
      // Check if 2FA is required
      if (res.data.requires2FA) {
        return { 
          success: true, 
          requires2FA: true, 
          userId: res.data.userId,
          message: res.data.message 
        }
      }
      
      // Normal login - set token
      localStorage.setItem('token', res.data.access_token)
      setToken(res.data.access_token)
      return { success: true }
    } catch (err: any) {
      console.error('Login failed:', err)
      return { success: false, error: err.response?.data?.message || 'Login failed' }
    }
  }

  const verify2FALogin = async (userId: string, code: string) => {
    try {
      const res = await authApi.verify2FA(userId, code)
      localStorage.setItem('token', res.data.access_token)
      setToken(res.data.access_token)
      return { success: true }
    } catch (err: any) {
      console.error('2FA verification failed:', err)
      return { success: false, error: err.response?.data?.message || '2FA verification failed' }
    }
  }

  const testLogin = async () => {
    try {
      const res = await authApi.testLogin()
      localStorage.setItem('token', res.data.access_token)
      setToken(res.data.access_token)
      return { success: true }
    } catch (err: any) {
      console.error('Login failed:', err)
      return { success: false, error: err.response?.data?.message || 'Login failed' }
    }
  }

  const register = async (email: string, username: string, password: string, displayName?: string) => {
    try {
      const res = await authApi.register({ email, username, password, displayName })
      localStorage.setItem('token', res.data.access_token)
      setToken(res.data.access_token)
      return { success: true }
    } catch (err: any) {
      console.error('Registration failed:', err)
      return { success: false, error: err.response?.data?.message || 'Registration failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const fetchUser = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await usersApi.getMe()
      setUser(res.data)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [token])

  return { token, user, loginWithCredentials, verify2FALogin, testLogin, register, logout, fetchUser, loading }
}

// Login Page
function LoginPage({ 
  onLogin, 
  onVerify2FA,
  onTestLogin,
  onRegister 
}: { 
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string; requires2FA?: boolean; userId?: string; message?: string }>
  onVerify2FA: (userId: string, code: string) => Promise<{ success: boolean; error?: string }>
  onTestLogin: () => Promise<{ success: boolean; error?: string }>
  onRegister: (email: string, username: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>
}) {
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFAUserId, setTwoFAUserId] = useState<string | null>(null)
  const [twoFACode, setTwoFACode] = useState('')
  const navigate = useNavigate()

  // Login form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Register form state
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regDisplayName, setRegDisplayName] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await onLogin(username, password)
    setLoading(false)
    
    if (result.requires2FA) {
      setRequires2FA(true)
      setTwoFAUserId(result.userId || null)
      setError(null)
    } else if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twoFAUserId || twoFACode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }
    
    setError(null)
    setLoading(true)
    const result = await onVerify2FA(twoFAUserId, twoFACode)
    setLoading(false)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || '2FA verification failed')
    }
  }

  const handle2FABack = () => {
    setRequires2FA(false)
    setTwoFAUserId(null)
    setTwoFACode('')
    setError(null)
  }

  const handleTestLogin = async () => {
    setError(null)
    setLoading(true)
    const result = await onTestLogin()
    setLoading(false)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await onRegister(regEmail, regUsername, regPassword, regDisplayName || undefined)
    setLoading(false)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  return (
    <div className="login-container">
      <div className="card login-card">
        <h1>🏓 Transcendence</h1>
        <p style={{ marginBottom: 24, color: 'rgba(255,255,255,0.6)' }}>
          Multiplayer Pong Game
        </p>

        {error && (
          <div className="error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {requires2FA ? (
          // 2FA Verification Form
          <form onSubmit={handle2FAVerify}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ marginBottom: 8 }}>🔐 Two-Factor Authentication</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            
            <input
              type="text"
              placeholder="000000"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              autoFocus
              style={{
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                textAlign: 'center',
                fontFamily: 'monospace'
              }}
            />
            
            <button 
              type="submit"
              className="btn btn-primary" 
              disabled={loading || twoFACode.length !== 6}
              style={{ width: '100%', marginTop: 16, marginBottom: 12 }}
            >
              {loading ? 'Verifying...' : '✅ Verify'}
            </button>
            
            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={handle2FABack}
              style={{ width: '100%' }}
            >
              ← Back to Login
            </button>
          </form>
        ) : !isRegister ? (
          // Login Form
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div style={{ textAlign: 'right', marginBottom: 12 }}>
              <Link to="/forgot-password" style={{ color: '#667eea', fontSize: '0.875rem', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            
            <button 
              type="submit"
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', marginBottom: 12 }}
            >
              {loading ? 'Logging in...' : '🔑 Login'}
            </button>
            
            <div style={{ margin: '16px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              — OR —
            </div>
            
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={() => {
                const oauthUrl = `${config.API_URL}/api/auth/42`;
                console.log('🔐 42 OAuth URL:', oauthUrl);
                console.log('🔧 Config:', config);
                window.location.href = oauthUrl;
              }}
              disabled={loading}
              style={{ 
                width: '100%', 
                marginBottom: 12,
                background: 'linear-gradient(135deg, #00babc 0%, #667eea 100%)'
              }}
            >
              🚀 Login with 42
            </button>
            
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={() => {
                const oauthUrl = `${config.API_URL}/api/auth/google`;
                console.log('🔐 Google OAuth URL:', oauthUrl);
                window.location.href = oauthUrl;
              }}
              disabled={loading}
              style={{ 
                width: '100%', 
                marginBottom: 12,
                background: 'linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc05 75%, #ea4335 100%)'
              }}
            >
              🔐 Login with Google
            </button>
            
            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={handleTestLogin}
              disabled={loading}
              style={{ width: '100%', marginBottom: 12 }}
            >
              🧪 Test Login (Dev)
            </button>
            <p style={{ textAlign: 'center', marginTop: 16 }}>
              Don't have an account?{' '}
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setIsRegister(true); setError(null); }}
                style={{ color: '#667eea' }}
              >
                Register
              </a>
            </p>
          </form>
        ) : (
          // Register Form
          <form onSubmit={handleRegister}>
            <input
              type="email"
              placeholder="Email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Display Name (optional)"
              value={regDisplayName}
              onChange={(e) => setRegDisplayName(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
              minLength={6}
            />
            <button 
              type="submit"
              className="btn btn-success" 
              disabled={loading}
              style={{ width: '100%', marginBottom: 12 }}
            >
              {loading ? 'Registering...' : '� Register'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16 }}>
              Already have an account?{' '}
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setIsRegister(false); setError(null); }}
                style={{ color: '#667eea' }}
              >
                Login
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// Dashboard
function Dashboard({ user, token, logout, refreshUser }: { user: User; token: string; logout: () => void; refreshUser: () => void }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [invite, setInvite] = useState<{ senderId: string, senderName: string, roomId: string } | null>(null);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(`${config.API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('receive_invite', (data: { senderId: string, senderName: string, roomId: string }) => {
        setInvite(data);
    });

    newSocket.on('game_start', (data: { roomId: string }) => {
        const gameUrl = `http://${window.location.hostname}:3002/srcs/remote_game.html?user_id=${user.id}&token=${token}&roomId=${data.roomId}`;
        window.location.href = gameUrl;
    });

    newSocket.on('invite_declined', (data: { receiverId: string }) => {
        alert("Your friend declined the match.");
        // Should also clear any "waiting" state if we had one
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user.id]);

  const handleAcceptInvite = () => {
    if (invite && socket) {
      socket.emit('respond_invite', { senderId: invite.senderId, accepted: true });
      setInvite(null);
    }
  };

  const handleDeclineInvite = () => {
    if (invite && socket) {
      socket.emit('respond_invite', { senderId: invite.senderId, accepted: false });
      setInvite(null);
    }
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      
      {/* Custom Game Invite Notification */}
      {invite && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <style>{`
            @keyframes pulse-rose {
              0% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7); transform: scale(1); }
              50% { transform: scale(1.05); }
              70% { box-shadow: 0 0 0 20px rgba(236, 72, 153, 0); transform: scale(1.05); }
              100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); transform: scale(1); }
            }
            @keyframes pulse-coffee {
              0% { box-shadow: 0 0 0 0 rgba(180, 83, 9, 0.7); transform: scale(1); }
              50% { transform: scale(1.05); }
              70% { box-shadow: 0 0 0 20px rgba(180, 83, 9, 0); transform: scale(1.05); }
              100% { box-shadow: 0 0 0 0 rgba(180, 83, 9, 0); transform: scale(1); }
            }
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
            }
            @keyframes popIn {
              0% { opacity: 0; transform: scale(0.8) translateY(20px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          
          <div style={{
            background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
            padding: '40px',
            borderRadius: '30px',
            boxShadow: '0 0 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)',
            textAlign: 'center',
            minWidth: '400px',
            animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'float 3s ease-in-out infinite' }}>🎮</div>
            <h2 style={{ 
              marginBottom: '15px', 
              color: '#fff', 
              fontFamily: "'Bungee', cursive, sans-serif",
              fontSize: '2rem',
              letterSpacing: '2px',
              textShadow: '0 0 10px rgba(236, 72, 153, 0.5)'
             }}>
              CHALLENGER ALERT!
            </h2>
            <p style={{ color: '#e2e8f0', marginBottom: '40px', fontSize: '1.2rem', lineHeight: '1.6' }}>
              <span style={{ 
                color: '#ec4899', 
                fontWeight: 'bold', 
                fontSize: '1.4rem',
                textShadow: '0 0 10px rgba(236, 72, 153, 0.3)'
              }}>{invite.senderName}</span>
              <br/>
              has challenged you to a duel!
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px' }}>
              
              {/* Accept Bubble (Rose) */}
              <button 
                onClick={handleAcceptInvite}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                  border: '4px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  animation: 'pulse-rose 2s infinite',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.animation = 'none';
                  e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(236, 72, 153, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.animation = 'pulse-rose 2s infinite';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '32px', marginBottom: '4px' }}>⚔️</span>
                <span style={{ fontSize: '14px', letterSpacing: '1px' }}>FIGHT</span>
              </button>

              {/* Decline Bubble (Brown/Coffee) */}
              <button 
                onClick={handleDeclineInvite}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
                  border: '4px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  animation: 'pulse-coffee 2s infinite',
                  animationDelay: '1s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.animation = 'none';
                  e.currentTarget.style.transform = 'scale(1.1) rotate(-5deg)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(180, 83, 9, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.animation = 'pulse-coffee 2s infinite';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '32px', marginBottom: '4px' }}>🏳️</span>
                <span style={{ fontSize: '14px', letterSpacing: '1px' }}>PASS</span>
              </button>

            </div>
          </div>
        </div>
      )}

      <nav className="nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/dashboard/profile">Profile</Link>
        <Link to="/dashboard/settings">Settings</Link>
        <Link to="/dashboard/users">Users</Link>
        <Link to="/dashboard/friends">Friends</Link>
        <Link to="/dashboard/chat">Chat</Link>
        <Link to="/dashboard/leaderboard">Leaderboard</Link>
        <button className="btn btn-secondary" onClick={logout} style={{ marginLeft: 'auto' }}>
          Logout
        </button>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardHome user={user} />} />
        <Route path="/profile" element={<ProfilePage user={user} onUpdate={refreshUser} />} />
        <Route path="/settings" element={<Settings user={user} onUpdate={refreshUser} />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/friends" element={<FriendsPage currentUserId={user.id} socket={socket} />} />
        <Route path="/chat" element={<Chat token={token} currentUserId={user.id} />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </div>
  )
}

// Profile Page - Edit Profile
function ProfilePage({ user, onUpdate }: { user: User; onUpdate: () => void }) {
  const [username, setUsername] = useState(user.username)
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      await usersApi.updateMe({ username, displayName: displayName || undefined })
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      onUpdate() // Refresh user data
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' })
      return
    }

    setAvatarLoading(true)
    setMessage(null)

    try {
      await usersApi.uploadAvatar(file)
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' })
      onUpdate() // Refresh user data
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload avatar' })
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true)
    setMessage(null)

    try {
      await usersApi.removeAvatar()
      setMessage({ type: 'success', text: 'Avatar removed!' })
      onUpdate()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to remove avatar' })
    } finally {
      setAvatarLoading(false)
    }
  }

  const getAvatarDisplay = () => {
    if (user.avatar && user.avatar !== 'default-avatar.png') {
      return (
        <img 
          src={usersApi.getAvatarUrl(user.avatar)} 
          alt="Avatar" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      )
    }
    return user.username[0].toUpperCase()
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>✏️ Edit Profile</h2>
        
        {message && (
          <div className={message.type} style={{ marginBottom: 16 }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            minLength={3}
            maxLength={20}
          />

          <label style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
            maxLength={50}
          />

          <label style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>
            Email (cannot be changed)
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          />

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: 12 }}
          >
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>�️ Avatar</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div 
            className="avatar" 
            style={{ 
              width: 120, 
              height: 120, 
              fontSize: 48,
              border: '4px solid rgba(102, 126, 234, 0.5)',
              overflow: 'hidden'
            }}
          >
            {getAvatarDisplay()}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <label className="btn btn-primary" style={{ cursor: 'pointer', opacity: avatarLoading ? 0.5 : 1 }}>
              {avatarLoading ? 'Uploading...' : '📷 Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={avatarLoading}
                style={{ display: 'none' }}
              />
            </label>
            {user.avatar && user.avatar !== 'default-avatar.png' && (
              <button 
                className="btn btn-danger" 
                onClick={handleRemoveAvatar}
                disabled={avatarLoading}
              >
                🗑️ Remove
              </button>
            )}
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            Max 5MB. JPG, PNG, GIF, or WebP.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>�👤 Current Profile</h2>
        <div className="user-card" style={{ marginBottom: 16 }}>
          <div 
            className="avatar" 
            style={{ width: 80, height: 80, fontSize: 32, overflow: 'hidden' }}
          >
            {getAvatarDisplay()}
          </div>
          <div>
            <h3 style={{ fontSize: 24 }}>{user.displayName || user.username}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>@{user.username}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{user.email}</p>
          </div>
        </div>

        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            <strong>Account ID:</strong> {user.id}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8 }}>
            <strong>Status:</strong>{' '}
            <span className={`online-status ${user.isOnline ? 'online' : 'offline'}`}></span>
            {user.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
    </div>
  )
}

// Dashboard Home with Statistics
function DashboardHome({ user }: { user: User }) {
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    Promise.all([
      leaderboardApi.getMyStats(),
      leaderboardApi.getMyHistory()
    ]).then(([statsRes, historyRes]) => {
      setStats(statsRes.data)
      setHistory(historyRes.data.games || [])
      setLoadingStats(false)
    }).catch(() => setLoadingStats(false))
  }, [])

  const totalGames = user.wins + user.losses
  const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="avatar" style={{ width: 80, height: 80, fontSize: 32 }}>
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ marginBottom: 4 }}>Welcome back, {user.displayName || user.username}! 👋</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>
              {user.isOnline ? '🟢 Online' : '⚫ Offline'} • Rank #{stats?.rank || '-'} • Level {user.level}
            </p>
          </div>
        </div>
      </div>

      <div className="grid">
        {/* Statistics Card */}
        <div className="card">
          <h2>📊 Your Statistics</h2>
          <div className="stats" style={{ flexWrap: 'wrap' }}>
            <div className="stat">
              <div className="stat-value" style={{ color: '#667eea' }}>#{stats?.rank || '-'}</div>
              <div className="stat-label">Global Rank</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: '#ffd700' }}>Level {user.level}</div>
              <div className="stat-label">
                {user.experience} XP
                {user.level < 100 && (
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    {' '}• {1000 - (user.experience % 1000)} to next
                  </span>
                )}
              </div>
            </div>
            <div className="stat">
              <div className="stat-value">{totalGames}</div>
              <div className="stat-label">Games Played</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: '#38ef7d' }}>{user.wins}</div>
              <div className="stat-label">Wins</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: '#f5576c' }}>{user.losses}</div>
              <div className="stat-label">Losses</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ color: winRate >= 50 ? '#38ef7d' : '#f5576c' }}>
                {winRate}%
              </div>
              <div className="stat-label">Win Rate</div>
            </div>
          </div>

          {/* Win Rate Bar */}
          <div style={{ marginTop: 20 }}>
            <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>Win/Loss Ratio</p>
            <div style={{ 
              height: 24, 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: 12, 
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div style={{ 
                width: `${winRate}%`, 
                background: 'linear-gradient(90deg, #38ef7d, #11998e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold',
                minWidth: winRate > 10 ? 'auto' : 0
              }}>
                {winRate > 10 && `${user.wins}W`}
              </div>
              <div style={{ 
                flex: 1,
                background: 'linear-gradient(90deg, #f5576c, #f093fb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold'
              }}>
                {100 - winRate > 10 && `${user.losses}L`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2>🎮 Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                const token = localStorage.getItem('token');
                if (token) {
                  // Redirect to the Game Server with Auth Token
                  // Use window.location.hostname for dynamic IP/host resolution
                  window.location.href = `http://${window.location.hostname}:3002/srcs/remote_game.html?user_id=${user.id}&token=${token}`;
                } else {
                  alert("Please log in again.");
                }
              }}
            >
              🎯 Play Remote Pong
            </button>
            <a 
              href="/srcs/local_game.html"
              onClick={(e) => {
                e.preventDefault();
                // Redirect to the Game Server Port 3002
                // We use window.location.hostname to keep it working on remote setups
                window.location.href = `http://${window.location.hostname}:3002/srcs/local_game.html`;
              }}
              className="btn btn-secondary" 
              style={{ textAlign: 'center', textDecoration: 'none', lineHeight: '42px', display: 'block' }}
            >
              👥 Play Local Pong
            </a>
            <Link to="/dashboard/profile" className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              ✏️ Edit Profile
            </Link>
            <Link to="/dashboard/friends" className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              👥 View Friends
            </Link>
          </div>
        </div>

        {/* Recent Games */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2>🕹️ Recent Games</h2>
          {loadingStats ? (
            <p>Loading...</p>
          ) : history.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No games played yet. Start a match to see your history!</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map((game: any) => {
                  const isPlayer1 = game.player1Id === user.id
                  const opponent = isPlayer1 ? game.player2 : game.player1
                  const myScore = isPlayer1 ? game.player1Score : game.player2Score
                  const oppScore = isPlayer1 ? game.player2Score : game.player1Score
                  const won = game.winnerId === user.id

                  return (
                    <tr key={game.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
                            {opponent?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          {opponent?.displayName || opponent?.username || 'Unknown'}
                        </div>
                      </td>
                      <td>{myScore} - {oppScore}</td>
                      <td>
                        <span style={{ 
                          color: won ? '#38ef7d' : '#f5576c',
                          fontWeight: 'bold'
                        }}>
                          {won ? '🏆 WIN' : '❌ LOSS'}
                        </span>
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(game.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// Users Page
function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersApi.getAll().then(res => {
      setUsers(res.data.users)
      setLoading(false)
    })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="card">
      <h2>👥 All Users</h2>
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Status</th>
            <th>Level</th>
            <th>W/L</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div>{user.displayName || user.username}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      @{user.username}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`online-status ${user.isOnline ? 'online' : 'offline'}`}></span>
                {user.isOnline ? 'Online' : 'Offline'}
              </td>
              <td>
                <div>
                  Level {user.level}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    {user.experience} XP
                  </div>
                </div>
              </td>
              <td>{user.wins}/{user.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Friends Page
function FriendsPage({ currentUserId, socket }: { currentUserId: string; socket?: Socket | null }) {
  const [friends, setFriends] = useState<User[]>([])
  const [pending, setPending] = useState<FriendRequest[]>([])
  const [sent, setSent] = useState<FriendRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    try {
      const [friendsRes, pendingRes, sentRes, usersRes] = await Promise.all([
        friendsApi.getAll(),
        friendsApi.getPending(),
        friendsApi.getSent(),
        usersApi.getAll(100),
      ])
      setFriends(friendsRes.data)
      setPending(pendingRes.data)
      setSent(sentRes.data)
      setUsers(usersRes.data.users.filter((u: User) => u.id !== currentUserId))
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const sendRequest = async (userId: string) => {
    try {
      await friendsApi.sendRequest(userId)
      showMessage('success', 'Friend request sent!')
      loadData()
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to send request')
    }
  }

  const acceptRequest = async (requestId: string) => {
    try {
      await friendsApi.acceptRequest(requestId)
      showMessage('success', 'Friend request accepted!')
      loadData()
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to accept')
    }
  }

  const declineRequest = async (requestId: string) => {
    try {
      await friendsApi.declineRequest(requestId)
      showMessage('success', 'Friend request declined')
      loadData()
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to decline')
    }
  }

  const removeFriend = async (friendId: string) => {
    try {
      await friendsApi.remove(friendId)
      showMessage('success', 'Friend removed')
      loadData()
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to remove')
    }
  }

  if (loading) return <div>Loading...</div>

  const friendIds = friends.map(f => f.id)
  const sentIds = sent.map(s => s.receiver.id)
  const pendingIds = pending.map(p => p.sender.id)

  return (
    <div>
      {message && <div className={message.type}>{message.text}</div>}

      <div className="grid">
        <div className="card">
          <h2>👥 Friends ({friends.length})</h2>
          {friends.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No friends yet</p>
          ) : (
            friends.map(friend => (
              <div key={friend.id} className="user-card flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 40, height: 40 }}>
                    {friend.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div>{friend.displayName || friend.username}</div>
                    <div style={{ fontSize: 12 }}>
                      <span className={`online-status ${friend.isOnline ? 'online' : 'offline'}`}></span>
                      {friend.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      if (socket) {
                        socket.emit('invite_game', { friendId: friend.id }, (response: any) => {
                          if (response && response.success) {
                             alert("Invite sent! Waiting for your friend to accept...");
                          } else {
                            alert(response?.error || 'Failed to send invite');
                          }
                        });
                      } else {
                        alert("Chat connection not established");
                      }
                    }}
                  >
                    Invite
                  </button>
                  <button className="btn btn-danger" onClick={() => removeFriend(friend.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h2>📥 Pending Requests ({pending.length})</h2>
          {pending.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No pending requests</p>
          ) : (
            pending.map(req => (
              <div key={req.id} className="user-card flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 40, height: 40 }}>
                    {req.sender.username[0].toUpperCase()}
                  </div>
                  <div>{req.sender.username}</div>
                </div>
                <div className="flex">
                  <button className="btn btn-success" onClick={() => acceptRequest(req.id)}>
                    Accept
                  </button>
                  <button className="btn btn-danger" onClick={() => declineRequest(req.id)}>
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card mt-4">
        <h2>🔍 Find Users</h2>
        <div className="grid">
          {users.filter(u => !friendIds.includes(u.id)).slice(0, 10).map(user => (
            <div key={user.id} className="user-card flex-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar" style={{ width: 40, height: 40 }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <div>{user.displayName || user.username}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    Level {user.level} • {user.experience} XP
                  </div>
                </div>
              </div>
              {sentIds.includes(user.id) ? (
                <button className="btn btn-secondary" disabled>Pending</button>
              ) : pendingIds.includes(user.id) ? (
                <button className="btn btn-secondary" disabled>Accept Above</button>
              ) : (
                <button className="btn btn-primary" onClick={() => sendRequest(user.id)}>
                  Add Friend
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Leaderboard Page
function LeaderboardPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leaderboardApi.get().then(res => {
      setPlayers(res.data.players)
      setLoading(false)
    })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="card">
      <h2>🏆 Leaderboard</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Level</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <tr key={player.id}>
              <td>
                <span className={`rank rank-${player.rank}`}>#{player.rank}</span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                    {player.username[0].toUpperCase()}
                  </div>
                  {player.displayName || player.username}
                </div>
              </td>
              <td>
                <div>
                  <div style={{ fontWeight: 600, color: '#ffd700' }}>Level {player.level}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    {player.experience} XP
                  </div>
                </div>
              </td>
              <td style={{ color: '#38ef7d' }}>{player.wins}</td>
              <td style={{ color: '#f5576c' }}>{player.losses}</td>
              <td>{player.winRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Main App
function App() {
  const { token, user, loginWithCredentials, verify2FALogin, testLogin, register, logout, fetchUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="login-container">
        <div className="card login-card">
          <h1>🏓 Transcendence</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            token && user ? (
              <Navigate to="/dashboard" />
            ) : (
              <LoginPage 
                onLogin={loginWithCredentials}
                onVerify2FA={verify2FALogin}
                onTestLogin={testLogin}
                onRegister={register}
              />
            )
          }
        />
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
        <Route
          path="/dashboard/*"
          element={
            token && user ? (
              <Dashboard user={user} token={token} logout={logout} refreshUser={fetchUser} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
