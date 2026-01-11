import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Bell, Search, ChevronDown, Check, X, UserPlus, Loader2, Gamepad2 } from 'lucide-react';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 1. Consume Data from Context (including the pre-fetched 'users' list)
  const { 
    users: allUsers, // Get the batch of users loaded by AppDataContext
    pendingRequests, 
    sentRequests, 
    friends,
    gameInvites, 
    acceptFriendRequest, 
    declineFriendRequest, 
    sendFriendRequest,
    respondToGameInvite
  } = useAppData();
  
  // --- STATE ---
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // Badge Count (Updates instantly via Context)
  const totalNotifications = pendingRequests.length + gameInvites.length;

  const getPageTitle = (pathname) => {
    switch(pathname) {
      case '/game': return 'GAME ARENA';
      case '/chat': return 'CHAT';
      case '/profile': return 'PROFILE';
      default: return 'HOME';
    }
  };

  // --- SEARCH LOGIC ---
  // Filter the 'allUsers' list from context locally
  useEffect(() => {
    if (!searchQuery.trim()) { 
      setSearchResults([]); 
      return; 
    }
    
    const lowerQ = searchQuery.toLowerCase();
    
    // Filter logic: Match name, exclude self
    const filtered = allUsers.filter(u => 
        u.id !== user?.id &&
        (u.username.toLowerCase().includes(lowerQ) || 
         (u.displayName && u.displayName.toLowerCase().includes(lowerQ)))
    );
    
    setSearchResults(filtered.slice(0, 5));
  }, [searchQuery, allUsers, user]);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserStatus = (targetUserId) => {
     if (friends.some(f => f.id === targetUserId)) return 'friend';
     if (sentRequests.some(r => r.receiverId === targetUserId)) return 'sent';
     if (pendingRequests.some(r => r.senderId === targetUserId)) return 'received';
     return 'none';
  };

  return (
    <header className="w-full flex items-center justify-between px-8 pt-8 pb-4 relative z-50">
      
      {/* TITLE */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-light text-white tracking-[0.15em] uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-6">

        {/* --- GLOBAL SEARCH BAR --- */}
        <div className="relative" ref={searchRef}>
          <div className={`hidden md:flex items-center px-4 py-2 rounded-full border backdrop-blur-sm transition-all duration-300 w-64
                ${isSearchFocused ? 'bg-[#0b1021] border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-[#0b1021]/40 border-white/5 text-white/50'}`}>
            <Search className={`w-4 h-4 mr-2 ${isSearchFocused ? 'text-cyan-400' : ''}`} />
            <input 
              type="text" placeholder="Search users..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder-white/30 text-white"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)}
            />
          </div>

          {/* Search Dropdown */}
          {isSearchFocused && searchQuery && (
            <div className="absolute top-12 left-0 w-80 rounded-2xl bg-[#0b1021]/95 backdrop-blur-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="p-2 space-y-1">
                  {searchResults.length > 0 ? (
                      searchResults.map(u => {
                          const status = getUserStatus(u.id);
                          return (
                            <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${u.id}`)}>
                                    <img src={u.avatar || "/default-avatar.png"} alt={u.username} className="w-9 h-9 rounded-full object-cover bg-black border border-white/10"/>
                                    <div><p className="text-sm font-bold text-white">{u.username}</p></div>
                                </div>
                                {/* Actions based on status */}
                                {status === 'none' && (
                                    <button onClick={() => sendFriendRequest(u.id)} className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500 hover:text-black text-white/70 transition-all">
                                        <UserPlus size={14} />
                                    </button>
                                )}
                                {status === 'friend' && <span className="text-[10px] text-emerald-400 font-bold px-2">FRIEND</span>}
                                {status === 'sent' && <span className="text-[10px] text-white/30 font-bold px-2 flex items-center gap-1"><Check size={10}/> SENT</span>}
                                {status === 'received' && <span className="text-[10px] text-cyan-400 font-bold px-2">PENDING</span>}
                            </div>
                          );
                      })
                  ) : (<div className="py-4 text-center text-white/30 text-xs">No users found</div>)}
               </div>
            </div>
          )}
        </div>

        {/* --- NOTIFICATIONS --- */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-3 rounded-full hover:bg-white/5 transition-colors group ${showNotifications ? 'bg-white/10 text-white' : 'text-white/70'}`}
          >
            <Bell className={`w-6 h-6 group-hover:text-cyan-400 transition-colors ${showNotifications ? 'text-cyan-400' : ''}`} />
            
            {/* Real-time Badge */}
            {totalNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-14 right-0 w-80 rounded-2xl bg-[#0b1021]/90 backdrop-blur-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-xs font-bold text-white/50 tracking-widest uppercase">Notifications</span>
                <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                  {totalNotifications} New
                </span>
              </div>

              <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                {totalNotifications === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2">
                    <Bell className="w-8 h-8 text-white/10" />
                    <p className="text-white/30 text-xs">No new notifications</p>
                  </div>
                ) : (
                  <>
                    {/* 1. GAME INVITES */}
                    {gameInvites.map((invite) => (
                      <div key={invite.senderId} className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Gamepad2 size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{invite.senderName || "Player"}</p>
                          <p className="text-[10px] text-purple-300 truncate">invited you to play</p>
                        </div>
                        <div className="flex gap-1">
                           <button onClick={() => respondToGameInvite(invite.senderId, true)} className="p-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all"><Check size={14}/></button>
                           <button onClick={() => respondToGameInvite(invite.senderId, false)} className="p-2 bg-white/10 hover:bg-white/20 text-white/50 hover:text-white rounded-lg transition-all"><X size={14}/></button>
                        </div>
                      </div>
                    ))}

                    {/* Separator */}
                    {gameInvites.length > 0 && pendingRequests.length > 0 && <div className="h-px bg-white/5 my-2 mx-2"></div>}

                    {/* 2. FRIEND REQUESTS */}
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors flex items-center gap-3">
                        <img 
                          src={req.sender.avatar || "/default-avatar.png"} 
                          alt={req.sender.username}
                          className="w-10 h-10 rounded-full object-cover bg-black border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{req.sender.username}</p>
                          <p className="text-[10px] text-white/50 truncate">sent friend request</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => acceptFriendRequest(req.id)} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"><Check size={14} /></button>
                          <button onClick={() => declineFriendRequest(req.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- USER PROFILE (Clickable) --- */}
        {user ? (
          <div 
             onClick={() => navigate('/profile')}
             className="flex items-center gap-4 pl-4 pr-2 py-1.5 rounded-full bg-[#0b1021]/60 backdrop-blur-xl border border-white/10 hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-white tracking-wide group-hover:text-cyan-300">{user.username}</div>
              <div className="text-[10px] text-cyan-400 font-mono uppercase">{user.level || 'Level 1'}</div>
            </div>
            <div className="relative">
                <img src={user.avatar || "/default-avatar.png"} alt="Profile" className="h-10 w-10 rounded-full object-cover border-2 border-white/10 bg-black"/>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0b1021] rounded-full"></div>
            </div>
            <ChevronDown className="w-4 h-4 text-white/30 mr-2" />
          </div>
        ) : <UserSkeleton />}

      </div>
    </header>
  );
};

export default TopBar;