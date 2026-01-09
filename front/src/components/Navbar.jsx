import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [title, setTitle] = useState("DASHBOARD");

  useEffect(() => {
    const pathTitles = {
      '/': 'DASHBOARD',
      '/profile': 'PROFILE',
      '/chat': 'CHAT',
      '/game': 'GAME',
      '/login': 'LOGIN'
    };
    setTitle(pathTitles[location.pathname] || 'HOME');
  }, [location]);

  return (
    <nav className="w-full h-24 flex items-center justify-between px-8 z-50 fixed top-0 left-0">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-white/10 border border-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shadow-lg">
             <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-sm shadow-cyan-500/50" />
        </div>
        <h1 className="text-3xl font-light tracking-wider text-white uppercase drop-shadow-md">
          {title}
        </h1>
      </div>

      {user ? (
      <div className="flex items-center gap-6">
        <button className="relative group p-3 rounded-full hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/10">
            <Bell className="w-6 h-6 text-white/80 group-hover:text-cyan-300 transition-colors" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        </button>

      
            <div className="flex items-center gap-4 px-5 py-2 rounded-2xl 
                            bg-cyan-950/60 backdrop-blur-xl backdrop-brightness-50
                            border border-white/10 border-t-white/20
                            shadow-[0_4px_20px_rgba(0,0,0,0.5)]
                            hover:bg-cyan-900/70 hover:border-white/30 transition-all duration-300 group cursor-pointer">
                
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-white tracking-wide uppercase drop-shadow-md">
                        {user.username}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-cyan-200/80 uppercase tracking-wider">
                        <span className="text-cyan-400 font-semibold">{user?.level}</span>
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full box-shadow-[0_0_5px_cyan]" />
                        <span>{user.title}</span>
                    </div>
                </div>

                <div className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-cyan-400/50 overflow-hidden shadow-lg transition-colors">
                    <img 
                        src={user.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                    />
                </div>
            </div>

      </div>
      ): ''}
    </nav>
  );
};

export default Navbar;