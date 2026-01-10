import { useState, useEffect } from 'react'
import { authApi } from './api'

interface TwoFactorData {
  secret: string
  qrCode: string
  enabled: boolean
}

export function Settings({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showQR, setShowQR] = useState(false)

  const generate2FA = async () => {
    try {
      setLoading(true)
      setMessage(null)
      const res = await authApi.generate2FA()
      setTwoFactorData(res.data)
      setShowQR(true)
      setMessage({ type: 'success', text: 'QR Code generated! Scan it with your authenticator app.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate 2FA' })
    } finally {
      setLoading(false)
    }
  }

  const enable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' })
      return
    }

    try {
      setLoading(true)
      setMessage(null)
      await authApi.enable2FA(verificationCode)
      setMessage({ type: 'success', text: '2FA enabled successfully!' })
      setShowQR(false)
      setVerificationCode('')
      onUpdate() // Refresh user data
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid verification code' })
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' })
      return
    }

    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return
    }

    try {
      setLoading(true)
      setMessage(null)
      await authApi.disable2FA(verificationCode)
      setMessage({ type: 'success', text: '2FA disabled successfully' })
      setVerificationCode('')
      onUpdate() // Refresh user data
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid verification code' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Settings</h1>

      {/* User Info Section */}
      <div style={{ 
        background: '#2a2a2a', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '2rem' 
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Account Information</h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Display Name:</strong> {user.displayName || 'N/A'}</p>
          <p><strong>Level:</strong> {user.level || 1} ({user.experience || 0} XP)</p>
          <p><strong>Stats:</strong> {user.wins || 0}W / {user.losses || 0}L</p>
          <p>
            <strong>2FA Status:</strong>{' '}
            <span style={{ color: user.twoFactorEnabled ? '#4ade80' : '#f87171' }}>
              {user.twoFactorEnabled ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </p>
        </div>
      </div>

      {/* 2FA Management Section */}
      <div style={{ 
        background: '#2a2a2a', 
        padding: '1.5rem', 
        borderRadius: '8px' 
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Two-Factor Authentication (2FA)</h2>
        <p style={{ marginBottom: '1.5rem', color: '#9ca3af' }}>
          Add an extra layer of security to your account by enabling 2FA. 
          You'll need an authenticator app like Google Authenticator or Authy.
        </p>

        {message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            background: message.type === 'success' ? '#064e3b' : '#7f1d1d',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
          }}>
            {message.text}
          </div>
        )}

        {!user.twoFactorEnabled ? (
          <div>
            {!showQR ? (
              <button
                onClick={generate2FA}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Generating...' : '🔐 Enable 2FA'}
              </button>
            ) : (
              <div>
                <div style={{ 
                  background: 'white', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1rem',
                  display: 'inline-block'
                }}>
                  <img 
                    src={twoFactorData?.qrCode} 
                    alt="2FA QR Code" 
                    style={{ display: 'block', width: '200px', height: '200px' }}
                  />
                </div>
                
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                  Can't scan? Manual entry code: <br />
                  <code style={{ 
                    background: '#1f2937', 
                    padding: '0.5rem', 
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '0.5rem'
                  }}>
                    {twoFactorData?.secret}
                  </code>
                </p>

                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Enter 6-digit verification code:
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #4b5563',
                      background: '#1f2937',
                      color: 'white',
                      fontSize: '1.5rem',
                      letterSpacing: '0.5rem',
                      textAlign: 'center',
                      width: '200px',
                      marginRight: '1rem'
                    }}
                  />
                  <button
                    onClick={enable2FA}
                    disabled={loading || verificationCode.length !== 6}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: verificationCode.length === 6 ? '#10b981' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      cursor: (loading || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {loading ? 'Verifying...' : '✅ Verify & Enable'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{
              padding: '1rem',
              background: '#064e3b',
              border: '1px solid #10b981',
              borderRadius: '4px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0 }}>✅ 2FA is currently enabled on your account</p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Enter 6-digit code to disable 2FA:
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid #4b5563',
                  background: '#1f2937',
                  color: 'white',
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem',
                  textAlign: 'center',
                  width: '200px',
                  marginRight: '1rem'
                }}
              />
              <button
                onClick={disable2FA}
                disabled={loading || verificationCode.length !== 6}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: verificationCode.length === 6 ? '#ef4444' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: (loading || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Disabling...' : '❌ Disable 2FA'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OAuth Connections */}
      <div style={{ 
        background: '#2a2a2a', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Connected Accounts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <strong>42 Intra:</strong> {user.fortytwoId ? `Connected (${user.fortytwoId})` : 'Not connected'}
            </span>
            {user.fortytwoId && <span style={{ color: '#10b981' }}>✅</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <strong>Google:</strong> {user.googleId ? 'Connected' : 'Not connected'}
            </span>
            {user.googleId && <span style={{ color: '#10b981' }}>✅</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
