import React from 'react';
import HighlightCard from '@/components/HighlightCard';
import { TrendingUp, Activity, Clock, MoreHorizontal, UserPlus } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';

const Dashboard = () => {
  const { friends, stats, history, isLoaded } = useAppData();

  console.log(friends);
  const onlineFriends = friends.filter(f => f.is_online || f.status === 'online');
  const offlineFriends = friends.filter(f => !f.is_online && f.status !== 'online');

  return (
    <div className="min-h-screen w-full transition-all duration-300 selection:bg-cyan-500/30">

      <main className="p-8 pt-6">
        
        <div className="flex flex-col xl:flex-row gap-8">
          
          <div className="flex-1 space-y-8 min-w-0">
            <HighlightCard />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <StatCard 
                 title="Total Matches" 
                 value={isLoaded ? stats.totalMatches.toLocaleString() : "..."}
                 subtitle="+12% from last week"
                 icon={Activity}
                 color="text-cyan-400"
                 glow="shadow-[0_0_20px_rgba(34,211,238,0.2)]"
               />
               <StatCard 
                 title="Win Rate" 
                 value={isLoaded ? `${stats.winRate}%` : "..."} 
                 subtitle={`${stats.rank} Rank`}
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
                    {history.map((game, index) => (
                        <HistoryRow 
                            key={game.id || index}
                            result={game.result} 
                            opponent={game.opponent} 
                            score={game.score} 
                            date={game.date} 
                            isWin={game.isWin} 
                        />
                    ))}
                    {!isLoaded && <div className="text-white/20 text-sm">Loading history...</div>}
                </div>
            </div>
          </div>

          <div className="w-full xl:w-80 flex-shrink-0">
             <div className="sticky top-6 rounded-3xl bg-[#0bc1021]/40 backdrop-blur-xl border border-white/5 p-6 min-h-[500px] flex flex-col">
                
                <div className="flex items-center justify-between mb-6 pl-2">
                    <h2 className="text-sm font-bold text-white/50 tracking-[0.2em] uppercase">
                        Friends ({onlineFriends.length})
                    </h2>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                </div>

                <div className="space-y-1 overflow-y-auto pr-1 custom-scrollbar flex-1">
                    
                    {!isLoaded && (
                        <div className="text-white/20 text-xs text-center py-4">Syncing Data...</div>
                    )}

                    {!isLoaded && friends.length === 0 && (
                        <div className="text-white/20 text-xs text-center py-4">No friends found</div>
                    )}

                    {onlineFriends.map((friend) => (
                        <FriendRow 
                            key={friend.id} 
                            name={friend.username || "Unknown"} 
                            status={friend.status || "Online"} 
                            statusColor="text-emerald-400" 
                        />
                    ))}
                    
                    {offlineFriends.length > 0 && (
                        <>
                            <div className="my-4 border-t border-white/5 mx-2"></div>
                            <h2 className="text-xs font-bold text-white/20 tracking-[0.2em] uppercase mb-3 pl-2">
                                Offline ({offlineFriends.length})
                            </h2>
                            {offlineFriends.map((friend) => (
                                <FriendRow 
                                    key={friend.id} 
                                    name={friend.username || "Unknown"} 
                                    status="Offline" 
                                    statusColor="text-white/20" 
                                    isOffline 
                                />
                            ))}
                        </>
                    )}
                </div>

                <button className="w-full mt-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 text-xs text-white/50 hover:text-white font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group">
                    <UserPlus size={14} className="group-hover:text-cyan-400 transition-colors"/>
                    <span>Invite Friend</span>
                </button>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, glow }) => (
    <div className={`relative overflow-hidden rounded-3xl bg-[#0bc1021]/40 backdrop-blur-xl border border-white/5 p-8 group hover:border-white/10 transition-all duration-300`}>
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-3xl ${color.replace('text-', 'bg-')}`}></div>
        <div className="flex justify-between items-start mb-8">
            <div className={`p-3 rounded-xl bg-white/5 ${color} ${glow} ring-1 ring-white/5`}>
                <Icon size={24} />
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-white/5 text-white/40 border border-white/5">WEEKLY</span>
        </div>
        <div>
            <h3 className="text-white/40 text-xs font-mono tracking-widest uppercase mb-1">{title}</h3>
            <div className="text-4xl font-black text-white mb-2 tracking-tight">{value}</div>
            <p className={`text-xs ${color} font-medium tracking-wide`}>{subtitle}</p>
        </div>
    </div>
);

const HistoryRow = ({ result, opponent, score, date, isWin }) => (
    <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer">
        <div className="flex items-center gap-4">
            <div className={`w-1 h-10 rounded-full ${isWin ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500/50'}`}></div>
            <div>
                <div className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{opponent}</div>
                <div className={`text-[10px] font-mono tracking-wider uppercase ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>{result}</div>
            </div>
        </div>
        <div className="flex flex-col items-end">
             <div className="text-lg font-bold text-white/80 tracking-widest font-mono">{score}</div>
             <div className="flex items-center gap-1 text-[10px] text-white/30"><Clock size={10} />{date}</div>
        </div>
    </div>
);

const FriendRow = ({ name, status, statusColor, isOffline }) => (
    <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group ${isOffline ? 'opacity-40 hover:opacity-100' : ''}`}>
        <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 group-hover:border-cyan-400/50 transition-colors"></div>
            {!isOffline && <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#050b14] ${statusColor.replace('text-', 'bg-')}`}></div>}
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white/80 group-hover:text-white truncate transition-colors">{name}</div>
            <div className={`text-[9px] font-mono uppercase tracking-wider truncate ${statusColor}`}>{status}</div>
        </div>
    </div>
);

export default Dashboard;