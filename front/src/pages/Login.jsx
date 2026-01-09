import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(formData);
    } catch (err) {
      setError("ACCESS DENIED: Invalid Credentials");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] w-full">
      
      <div className="w-full max-w-md p-8 rounded-3xl 
                      bg-cyan-950/40 backdrop-blur-xl backdrop-brightness-75
                      border border-white/10 border-t-white/20
                      shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </div>
        </div>

        <h2 className="text-2xl font-light text-center text-white tracking-[0.2em] mb-2 uppercase">
          Identity Verified
        </h2>
        <p className="text-center text-cyan-200/50 text-xs tracking-wider mb-8">
          RESTRICTED ACCESS | LEVEL 5 SECURITY
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200 text-sm font-mono">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="group space-y-2">
            <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text" 
                required
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20
                           focus:outline-none focus:border-cyan-400/50 focus:bg-black/40 focus:shadow-[0_0_15px_rgba(34,211,238,0.1)]
                           transition-all duration-300"
                placeholder="Enter ID"
              />
            </div>
          </div>

          <div className="group space-y-2">
            <label className="text-xs font-semibold text-cyan-300/70 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20
                           focus:outline-none focus:border-cyan-400/50 focus:bg-black/40 focus:shadow-[0_0_15px_rgba(34,211,238,0.1)]
                           transition-all duration-300"
                placeholder="Enter Passcode"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full mt-8 py-3.5 rounded-xl font-bold tracking-widest uppercase transition-all duration-300
                       bg-gradient-to-r from-cyan-600 to-blue-600 text-white
                       hover:from-cyan-500 hover:to-blue-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]
                       disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
              </span>
            ) : (
              "Initialize Link"
            )}
          </button>

        </form>

      </div>
    </div>
  );
};

export default Login;