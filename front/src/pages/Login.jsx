import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Lock, User, AlertCircle, Mail, ArrowLeft, UserPlus, Smartphone } from 'lucide-react';
import '@/styles/index.css';
import { API_BASE } from '@/utils/api'; // Import API_BASE

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335" />
  </svg>
);

const Login = () => {
  const { login, verifyTwoFactor } = useAuth();
  
  const [view, setView] = useState('login'); 
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', username: '', displayName: '', password: '', confirmPassword: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempUserId, setTempUserId] = useState(null); 

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); 
  const [shakeField, setShakeField] = useState('');   
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_]+$/; 

  const triggerValidationError = (field, message) => {
    setError(message);
    setFieldErrors(prev => ({ ...prev, [field]: true })); 
    setShakeField(field);             
    setIsLoading(false);
    setTimeout(() => setShakeField(''), 500);
  };

  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const getInputClass = (fieldName) => {
    const isError = fieldErrors[fieldName];
    const isShaking = shakeField === fieldName;
    return `
      w-full bg-black/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20 
      transition-all duration-200 focus:outline-none focus:bg-black/40
      ${isError 
        ? 'border border-red-500 focus:border-red-500 text-red-100 placeholder-red-200/50' 
        : 'border border-white/10 focus:border-cyan-400/50'}
      ${isShaking ? 'animate-shake' : ''}
    `;
  };

  const getIconClass = (fieldName) => {
      const isError = fieldErrors[fieldName];
      return `absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${isError ? 'text-red-500' : 'text-cyan-500/50'}`;
  };

  const switchView = (newView) => {
    setView(newView);
    setError('');
    setFieldErrors({});
    setShakeField('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
        const result = await login(loginData);

        if (result.requires2FA) {
            setTempUserId(result.userId);
            setView('2fa');
            setIsLoading(false);
        }
    } catch (err) {
      setError("ACCESS DENIED: " + err.message);
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const success = await verifyTwoFactor(tempUserId, twoFactorCode);
        
        if (!success) {
            triggerValidationError('2fa', "Invalid Verification Code");
        } 
    } catch (err) {
        triggerValidationError('2fa', "Verification Error");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    if (!registerData.email || !emailRegex.test(registerData.email)) {
        triggerValidationError('email', "FORMAT ERROR: Invalid email address.");
        return; 
    }
    
    if (!registerData.username || registerData.username.trim().length < 3) {
        triggerValidationError('username', "FORMAT ERROR: Username must be at least 3 characters.");
        return; 
    }
    if (!usernameRegex.test(registerData.username)) {
        triggerValidationError('username', "FORMAT ERROR: Username can only contain letters, numbers, and underscores.");
        return;
    }

    if (!registerData.displayName || registerData.displayName.trim().length < 3) {
        triggerValidationError('displayName', "FORMAT ERROR: Display name must be at least 3 characters.");
        return; 
    }
    if (!usernameRegex.test(registerData.displayName)) {
        triggerValidationError('displayName', "FORMAT ERROR: Display name can only contain letters, numbers, and underscores.");
        return;
    }

    if (!registerData.password || registerData.password.length < 6) {
        triggerValidationError('password', "SECURITY WEAK: Password must be at least 6 characters.");
        return; 
    }

    if (registerData.password !== registerData.confirmPassword) {
        triggerValidationError('confirmPassword', "SECURITY ERROR: Passwords do not match.");
        return; 
    }

    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, { // Use API_BASE
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: registerData.email,
                username: registerData.username,
                displayName: registerData.displayName, 
                password: registerData.password
            })
        });

        const data = await res.json();

        if (!res.ok) {
            const errorMsg = data.message || JSON.stringify(data);
            
            if (errorMsg.toLowerCase().includes('username')) {
                triggerValidationError('username', "ERROR: Username taken or invalid.");
            }
            else if (errorMsg.toLowerCase().includes('email')) {
                triggerValidationError('email', "ERROR: Email already registered.");
            }
            else if (errorMsg.toLowerCase().includes('displayname') || errorMsg.includes('display_name')) {
                triggerValidationError('displayName', "ERROR: Invalid Display Name.");
            }
            else if (errorMsg.toLowerCase().includes('password')) {
                triggerValidationError('password', "ERROR: Password weak or invalid.");
            }
            else {
                setError(errorMsg.substring(0, 60) + "..."); 
            }
            return;
        }

        setSuccessMsg("Identity Created. Proceed to authentication.");
        setTimeout(() => {
            setView('login');
            setSuccessMsg('');
            setLoginData({ username: registerData.username, password: '' }); 
        }, 2000);

    } catch (err) {
        setError("CREATION FAILED: System unreachable.");
    } finally {
        setIsLoading(false);
    }
  };

  // ... (handleResetSubmit, handleSocialLogin remain unchanged) ...
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, { // Use API_BASE
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      if (!res.ok) throw new Error('Failed to send reset link');
      setSuccessMsg("Recovery protocol initiated. Check your comms (email).");
    } catch (err) {
      setError("TRANSMISSION FAILED: Email not found.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialLogin = (provider) => { window.location.href = `${API_BASE}/api/auth/${provider}`; }; // Use API_BASE

  // --- RENDER ---
  return (
    <div className="w-full max-w-md">
      
      {/* SHAKE ANIMATION KEYFRAMES (Required for triggerValidationError) */}
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      <div className="p-8 rounded-3xl 
                      bg-cyan-950/40 backdrop-blur-xl backdrop-brightness-75
                      border border-white/10 border-t-white/20
                      shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        
        {/* LOGO AREA */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
        </div>

        <h2 className="text-2xl font-light text-center text-white tracking-[0.2em] mb-2 uppercase">
          {view === 'login' ? 'Identity Verified' : 
           view === 'register' ? 'New Identity' : 
           view === '2fa' ? 'Second Factor' : 
           'Recovery Mode'}
        </h2>
        <p className="text-center text-cyan-200/50 text-xs tracking-wider mb-8">
          {view === 'login' ? 'RESTRICTED ACCESS | LEVEL 5 SECURITY' : 
           view === 'register' ? 'INITIALIZE NEW USER PROTOCOL' : 
           view === '2fa' ? 'ENTER SECURITY CODE' :
           'INITIATE CREDENTIAL RESET'}
        </p>

        {/* FEEDBACK BANNERS */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-red-200 text-sm font-mono break-words leading-tight">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-emerald-200 text-sm font-mono break-words leading-tight">{successMsg}</span>
          </div>
        )}

        {/* --- VIEW: LOGIN --- */}
        {view === 'login' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="group space-y-2">
                <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="text" required value={loginData.username}
                    onChange={e => setLoginData({...loginData, username: e.target.value})}
                    className={getInputClass('login_username')} 
                    placeholder="Enter ID"
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider">Password</label>
                  <button type="button" onClick={() => switchView('forgot')} className="text-[12px] text-cyan-400/80 hover:text-cyan-300 hover:underline transition-colors tracking-wide outline-none">
                    Forgot Password ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="password" required value={loginData.password}
                    onChange={e => setLoginData({...loginData, password: e.target.value})}
                    className={getInputClass('login_password')}
                    placeholder="Enter Password"
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full mt-8 py-3.5 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10">
                {isLoading ? "INITIALIZING..." : "INITIALIZE LINK"}
              </button>
            </form>

            <div className="mt-6 text-center">
               <span className="text-white/40 text-xs">New to PongX ? </span>
               <button onClick={() => switchView('register')} className="text-cyan-400 text-xs font-bold hover:text-cyan-300 hover:underline transition-colors ml-1">
                 Create Account
               </button>
            </div>
            
            {/* SOCIALS */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-transparent px-2 text-white/30 backdrop-blur-xl">Or Authenticate via</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleSocialLogin('42')} className="flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-black/30 text-white/80 hover:bg-white/5 hover:border-cyan-400/50 hover:text-cyan-400 transition-all group">
                    <img src="https://profile.intra.42.fr/assets/42_logo-7dfc9110a5319a308863b96bda33cea995046d1731cebb735e41b16255106c12.svg" alt="42" className="w-5 h-5 brightness-0 invert opacity-90 group-hover:opacity-100"/>
                    <span className="text-sm font-medium">Intra 42</span>
                </button>
                <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-black/30 text-white/80 hover:bg-white/5 hover:border-white/40 hover:text-white transition-all">
                    <GoogleIcon />
                    <span className="text-sm font-medium">Google</span>
                </button>
            </div>
          </div>
        )}

        {/* --- VIEW: 2FA --- */}
        {view === '2fa' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <form onSubmit={handle2FASubmit} className="space-y-6">
                <div className="group space-y-2">
                  <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">Authentication Code</label>
                  <div className="relative">
                    <Smartphone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors['2fa'] ? 'text-red-500' : 'text-cyan-500/50'}`} />
                    <input 
                        type="text" 
                        maxLength="6"
                        required 
                        value={twoFactorCode} 
                        onChange={e => {
                            setTwoFactorCode(e.target.value.replace(/[^0-9]/g, '')); 
                            clearFieldError('2fa');
                        }} 
                        className={getInputClass('2fa') + " tracking-[0.5em] text-center font-mono text-lg"} 
                        placeholder="000000" 
                    />
                  </div>
                  <p className="text-xs text-white/40 text-center pt-2">Enter the 6-digit code from your authenticator app.</p>
                </div>

                <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => switchView('login')} className="flex-1 py-3.5 rounded-xl font-bold tracking-widest uppercase text-xs bg-transparent border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex-[2] py-3.5 rounded-xl font-bold tracking-widest uppercase text-xs bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 border border-white/10">
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </button>
                </div>
            </form>
          </div>
        )}

        {/* --- VIEW: REGISTER (Same logic as before, just kept for completeness) --- */}
        {view === 'register' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* ... (Register form fields - Email, Username, DisplayName, Password, Confirm) ... */}
                <div className="group space-y-1">
                    <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative">
                        <Mail className={getIconClass('email')} />
                        <input type="email" required value={registerData.email} onChange={e => {setRegisterData({...registerData, email: e.target.value}); clearFieldError('email');}} className={getInputClass('email')} placeholder="user@example.com" />
                    </div>
                </div>
                {/* ... other fields ... */}
                <div className="group space-y-1">
                    <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">Username</label>
                    <div className="relative">
                        <User className={getIconClass('username')} />
                        <input type="text" required value={registerData.username} onChange={e => {setRegisterData({...registerData, username: e.target.value}); clearFieldError('username');}} className={getInputClass('username')} placeholder="username" />
                    </div>
                </div>
                <div className="group space-y-1">
                    <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">Display Name</label>
                    <div className="relative">
                        <UserPlus className={getIconClass('displayName')} />
                        <input type="text" required value={registerData.displayName} onChange={e => {setRegisterData({...registerData, displayName: e.target.value}); clearFieldError('displayName');}} className={getInputClass('displayName')} placeholder="public name" />
                    </div>
                </div>
                <div className="group space-y-1">
                    <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                        <Lock className={getIconClass('password')} />
                        <input type="password" required value={registerData.password} onChange={e => {setRegisterData({...registerData, password: e.target.value}); clearFieldError('password');}} className={getInputClass('password')} placeholder="password" />
                    </div>
                </div>
                <div className="group space-y-1">
                    <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">Confirm Password</label>
                    <div className="relative">
                        <Lock className={getIconClass('confirmPassword')} />
                        <input type="password" required value={registerData.confirmPassword} onChange={e => {setRegisterData({...registerData, confirmPassword: e.target.value}); clearFieldError('confirmPassword');}} className={getInputClass('confirmPassword')} placeholder="verify password" />
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full mt-6 py-3.5 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10">
                    {isLoading ? "PROCESSING..." : "REGISTER IDENTITY"}
                </button>
            </form>
            
            <div className="mt-8 text-center">
               <button onClick={() => switchView('login')} className="text-cyan-400/60 text-xs hover:text-cyan-300 flex items-center justify-center gap-2 mx-auto transition-colors">
                 <ArrowLeft size={12} /> Return to Login
               </button>
            </div>
          </div>
        )}

        {/* --- VIEW: FORGOT PASSWORD --- */}
        {view === 'forgot' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <form onSubmit={handleResetSubmit} className="space-y-6">
                <div className="group space-y-2">
                  <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">Recovery Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
                    <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} className={getInputClass('resetEmail')} placeholder="Enter registered email" />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <button type="button" onClick={() => switchView('login')} className="flex-1 py-3.5 rounded-xl font-bold tracking-widest uppercase text-xs bg-transparent border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all">Cancel</button>
                    <button type="submit" disabled={isLoading || successMsg} className="flex-[2] py-3.5 rounded-xl font-bold tracking-widest uppercase text-xs bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 border border-white/10">
                      {isLoading ? "Sending..." : "Send Link"}
                    </button>
                </div>
             </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;