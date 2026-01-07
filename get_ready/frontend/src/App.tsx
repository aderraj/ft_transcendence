import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { authApi, usersApi, friendsApi, leaderboardApi } from './api'
import { AuthCallback } from './AuthCallback'
import { Chat } from './Chat'
import { ForgotPassword } from './ForgotPassword'
import { ResetPassword } from './ResetPassword'

// Types
interface User {
  id: string
  email: string
  username: string
  displayName: string | null
  avatar: string
  isOnline: boolean
  elo: number
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
      localStorage.setItem('token', res.data.access_token)
      setToken(res.data.access_token)
      return { success: true }
    } catch (err: any) {
      console.error('Login failed:', err)
      return { success: false, error: err.response?.data?.message || 'Login failed' }
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

  return { token, user, loginWithCredentials, testLogin, register, logout, fetchUser, loading }
}

// Login Page
function LoginPage({ 
  onLogin, 
  onTestLogin,
  onRegister 
}: { 
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  onTestLogin: () => Promise<{ success: boolean; error?: string }>
  onRegister: (email: string, username: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>
}) {
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
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

        {!isRegister ? (
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
              onClick={() => window.location.href = 'http://10.14.57.32:3001/api/auth/42'}
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
  return (
    <div className="container">
      <nav className="nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/dashboard/profile">Profile</Link>
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
        <Route path="/users" element={<UsersPage />} />
        <Route path="/friends" element={<FriendsPage currentUserId={user.id} />} />
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
              {user.isOnline ? '🟢 Online' : '⚫ Offline'} • Rank #{stats?.rank || '-'} • {user.elo} ELO
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
              <div className="stat-value" style={{ color: '#ffd700' }}>{user.elo}</div>
              <div className="stat-label">ELO Rating</div>
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
            <button className="btn btn-primary" disabled>
              🎯 Find Match (Coming Soon)
            </button>
            <button className="btn btn-secondary" disabled>
              👥 Invite Friend to Play
            </button>
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
            <th>ELO</th>
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
              <td>{user.elo}</td>
              <td>{user.wins}/{user.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Friends Page
function FriendsPage({ currentUserId }: { currentUserId: string }) {
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
                <button className="btn btn-danger" onClick={() => removeFriend(friend.id)}>
                  Remove
                </button>
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
                    ELO: {user.elo}
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
            <th>ELO</th>
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
              <td>{player.elo}</td>
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
  const { token, user, loginWithCredentials, testLogin, register, logout, fetchUser, loading } = useAuth()

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
