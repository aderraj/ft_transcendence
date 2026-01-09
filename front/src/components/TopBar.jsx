import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search, ChevronDown } from 'lucide-react';

const UserSkeleton = () => (
  <div className="flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-full bg-[#0b1021]/60 border border-white/5 backdrop-blur-xl animate-pulse">
    <div className="flex flex-col items-end gap-1">
      <div className="h-3 w-20 bg-white/10 rounded"></div>
      <div className="h-2 w-12 bg-white/10 rounded"></div>
    </div>
    <div className="h-10 w-10 rounded-full bg-white/10"></div>
  </div>
);


const TopBar = () => {
  const location = useLocation();
  const { user } = useAuth(); 

  const getPageTitle = (pathname) => {
    switch(pathname) {
      case '/game': return 'GAME ARENA';
      case '/chat': return 'CHAT';
      case '/profile': return 'PROFILE';
      default: return 'HOME';
    }
  };

  return (
    <header className="w-full flex items-center justify-between px-8 pt-8 pb-4">
      <div className="flex flex-col">
        <h1 className="text-3xl font-light text-white tracking-[0.15em] uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          {getPageTitle(location.pathname)}
        </h1>
        <span className="text-xs text-cyan-400/60 font-mono tracking-widest mt-1">
        </span>
      </div>

      <div className="flex items-center gap-6">

        <div className="hidden md:flex items-center px-4 py-2 rounded-full bg-[#0b1021]/40 border border-white/5 backdrop-blur-sm text-white/50 focus-within:text-cyan-400 focus-within:border-cyan-400/30 transition-all">
          <Search className="w-4 h-4 mr-2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm w-32 placeholder-white/30 text-white"
          />
        </div>

        <button className="relative p-3 rounded-full hover:bg-white/5 transition-colors group">
          <Bell className="w-6 h-6 text-white/70 group-hover:text-cyan-400 transition-colors" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_cyan] animate-pulse"></span>
        </button>

        {user ? (
          <div className="flex items-center gap-4 pl-4 pr-2 py-1.5 rounded-full 
                          bg-[#0b1021]/60 backdrop-blur-xl border border-white/10 
                          hover:bg-white/5 hover:border-white/20 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]
                          transition-all duration-300 cursor-pointer group">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                {user.username}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                {user.level}
              </div>
            </div>

            <div className="relative">
                <div className="h-10 w-10 rounded-full border-2 border-white/10 overflow-hidden bg-black/50 group-hover:border-cyan-400/50 transition-colors duration-300">
                  <img 
                      src={user.avatar} 
                      alt="Profile"
                      className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0b1021] rounded-full shadow-[0_0_5px_#10b981]"></div>
            </div>
            <ChevronDown className="w-4 h-4 text-white/30 mr-2 group-hover:text-white transition-colors" />
          </div>
        ) : (
          <UserSkeleton />
        )}

      </div>
    </header>
  );
};


export default TopBar;