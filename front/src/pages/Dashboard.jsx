import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { TrendingUp, Activity, MoreHorizontal, Inbox, Loader2 } from 'lucide-react';

import HighlightCard from '@/components/dashboard/HighlightCard';
import StatCard from '@/components/dashboard/StatCard';
import HistoryRow from '@/components/dashboard/HistoryRow';
import FriendRow from '@/components/dashboard/FriendRow';
import RequestsModal from '@/components/modals/RequestsModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { 
    friends, history, isLoaded, refreshData, 
    removeFriend, 
    pendingRequests, sentRequests,
    acceptFriendRequest, declineFriendRequest, cancelFriendRequest
  } = useAppData();
  
  const [friendToRemove, setFriendToRemove] = useState(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const onlineFriends = friends.filter(f => f.isOnline === true || f.status === 'online');
  const offlineFriends = friends.filter(f => !f.isOnline && f.status !== 'online');

  const handleConfirmRemove = async () => {
    if (friendToRemove) {
        await removeFriend(friendToRemove.id);
        setFriendToRemove(null);
    }
  };

  return (
    <div className="min-h-screen w-full transition-all duration-300 selection:bg-cyan-500/30 relative">

      {friendToRemove && (
        <ConfirmationModal 
            title="Remove Friend?"
            message={`Are you sure you want to remove ${friendToRemove.username}?`}
            onConfirm={handleConfirmRemove}
            onCancel={() => setFriendToRemove(null)}
        />
      )}

      {showRequestsModal && (
        <RequestsModal 
            onClose={() => setShowRequestsModal(false)}
            pending={pendingRequests}
            sent={sentRequests}
            onAccept={acceptFriendRequest}
            onDecline={declineFriendRequest}
            onCancel={cancelFriendRequest}
        />
      )}

      <main className="p-8 pt-6">
    
        <div className="flex flex-col xl:flex-row gap-8">
          
          <div className="flex-1 space-y-8 min-w-0">
            <HighlightCard />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <StatCard 
                 title="Total Matches" 
                 value={(user.totalGames || 0).toLocaleString()} 
                 subtitle="+12% from last week"
                 icon={Activity}
                 color="text-cyan-400"
                 glow="shadow-[0_0_20px_rgba(34,211,238,0.2)]"
               />
               <StatCard 
                 title="Win Rate" 
                 value={`${user.winRate || 0}%`} 
                 subtitle={`${user.rankTitle || user.rank || 'Unranked'} Rank`}
                 icon={TrendingUp}
                 color="text-emerald-400"
                 glow="shadow-[0_0_20px_rgba(52,211,153,0.2)]"
               />
            </div>

            <div className="rounded-3xl bg-[#0bc1021]/40 backdrop-blur-xl border border-white/5 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">Game History</h2>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                        <MoreHorizontal className="text-white/40 group-hover:text-white" />
                    </button>
                </div>

                <div className="space-y-2">
                    {history.length > 0 ? (
                        history.map((game, index) => (
                            <HistoryRow 
                                key={game.id || index}
                                result={game.result} 
                                opponent={game.opponent} 
                                score={game.score} 
                                date={game.date} 
                                isWin={game.isWin} 
                            />
                        ))
                    ) : (
                        <div className="text-white/20 text-sm py-4 text-center">
                            {isLoaded ? "No recent matches found." : <Loader2 className="h-6 w-6 animate-spin mx-auto text-cyan-400" />}
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="w-full xl:w-80 flex-shrink-0">
             <div className="sticky top-6 rounded-3xl bg-[#0bc1021]/40 backdrop-blur-xl border border-white/5 p-6 min-h-[500px] flex flex-col">
                
                <div className="flex items-center justify-between mb-6 pl-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white/50 tracking-[0.2em] uppercase">Friends</h2>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                    </div>

                    <button 
                        onClick={() => setShowRequestsModal(true)}
                        className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all group"
                        title="Manage Requests"
                    >
                        <Inbox size={16} />
                        {(pendingRequests.length > 0 || sentRequests.length > 0) && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                            </span>
                        )}
                    </button>
                </div>

                <div className="space-y-1 overflow-y-auto pr-1 custom-scrollbar flex-1">
                    {!isLoaded && <div className="text-white/20 text-xs text-center py-4"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>}
                    {isLoaded && friends.length === 0 && <div className="text-white/20 text-xs text-center py-4">No friends added</div>}

                    {onlineFriends.map((friend) => (
                        <FriendRow 
                            key={friend.id} 
                            name={friend.username || "Unknown"} 
                            status={friend.status || "Online"} 
                            statusColor="text-emerald-400" 
                            avatar={friend.avatar} 
                            onRemove={() => setFriendToRemove(friend)}
                            onClick={() => navigate(`/profile/${friend.id}`)}
                        />
                    ))}
                    
                    {offlineFriends.length > 0 && (
                        <>
                            <div className="my-4 border-t border-white/5 mx-2"></div>
                            <h2 className="text-xs font-bold text-white/20 tracking-[0.2em] uppercase mb-3 pl-2">Offline</h2>
                            {offlineFriends.map((friend) => (
                                <FriendRow 
                                    key={friend.id} 
                                    name={friend.username || "Unknown"} 
                                    status="Offline" 
                                    statusColor="text-white/20" 
                                    isOffline 
                                    avatar={friend.avatar} 
                                    onRemove={() => setFriendToRemove(friend)}
                                    onClick={() => navigate(`/profile/${friend.id}`)}
                                />
                            ))}
                        </>
                    )}
                </div>

             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;