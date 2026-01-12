import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Shield, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '@/utils/api';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const RankIcon = ({ rank }) => {
    if (rank === 1) return <Crown size={16} className="text-amber-400 fill-amber-400/20" />;
    if (rank === 2) return <Medal size={16} className="text-gray-300 fill-gray-300/20" />;
    if (rank === 3) return <Medal size={16} className="text-amber-700 fill-amber-700/20" />;
    return <span className="text-xs font-mono font-bold text-white/30">#{rank}</span>;
};

const LeaderboardRow = ({ rank, userId, username, avatar, level, wins, winRate, isCurrentUser }) => {
    const navigate = useNavigate();

    const handleProfileClick = (e) => {
        e.stopPropagation();
        if (userId) {
            navigate(`/profile/${userId}`);
        }
    };

    return (
        <div className={cn(
            "group flex items-center gap-4 p-3 rounded-xl transition-all duration-300 border",
            isCurrentUser 
                ? "bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                : "border-transparent hover:bg-white/5 hover:border-white/5"
        )}>
            <div className="w-8 flex justify-center shrink-0">
                <RankIcon rank={rank} />
            </div>

            <div 
                onClick={handleProfileClick}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            >
                <div className="relative shrink-0">
                    <Avatar className={cn(
                        "w-9 h-9 border transition-colors", 
                        isCurrentUser ? "border-cyan-400/50" : "border-white/10 group-hover:border-cyan-400/50",
                        rank <= 3 && "ring-2 ring-white/10"
                    )}>
                        <AvatarImage src={avatar} className="object-cover" />
                        <AvatarFallback className="bg-white/5 text-[10px] text-white/40">
                            {username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {rank === 1 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#050b14]" />
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className={cn(
                        "text-sm font-bold truncate transition-colors",
                        isCurrentUser ? "text-cyan-400" : "text-white/80 group-hover:text-cyan-400",
                        rank <= 3 && !isCurrentUser && "text-amber-100"
                    )}>
                        {username} {isCurrentUser && <span className="text-[10px] ml-1 opacity-50">(You)</span>}
                    </span>
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider flex items-center gap-1">
                        <span className="text-cyan-400/60 font-bold">Lvl {level}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        {rank <= 3 ? 'Elite' : 'Challenger'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6 pr-2 shrink-0">
                <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Win Rate</div>
                    <div className={cn(
                        "text-xs font-bold",
                        parseFloat(winRate) >= 50 ? "text-emerald-400" : "text-white/60"
                    )}>
                        {winRate}%
                    </div>
                </div>
                <div className="text-right w-16">
                    <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">WINS</div>
                    <div className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                        {wins}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await authenticatedFetch('/api/leaderboard');
                if (!res.ok) throw new Error('Failed to fetch leaderboard');
                const data = await res.json();
                
                let list = Array.isArray(data) ? data : (data.players || []);

                list = list.sort((a, b) => {
                    const winsA = a.wins || 0;
                    const winsB = b.wins || 0;
                    return winsB - winsA; 
                });

                setLeaders(list);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    return (
        <div className="relative overflow-hidden rounded-3xl bg-[#0b0c15]/40 backdrop-blur-xl border border-white/5 flex flex-col h-[600px]">
            <div className="absolute -left-20 -top-20 w-60 h-60 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-60 h-60 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 ring-1 ring-white/10 shadow-lg shadow-cyan-900/10">
                        <Swords size={18} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Top Victories</h2>
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Ranked by Total Wins</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                     <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-white/40 flex items-center gap-2">
                        <TrendingUp size={10} />
                        WEEKLY
                     </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar relative z-10">
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/[0.02] animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-white/5" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 bg-white/5 rounded" />
                                <div className="h-2 w-16 bg-white/5 rounded" />
                            </div>
                            <div className="w-12 h-4 bg-white/5 rounded" />
                        </div>
                    ))
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                        <Shield size={24} />
                        <span className="text-xs font-mono uppercase">Unavailable</span>
                    </div>
                ) : (
                    leaders.map((player, index) => (
                        <LeaderboardRow 
                            key={player.id || index}
                            rank={index + 1}
                            userId={player.id}
                            username={player.username}
                            avatar={player.avatar}
                            level={player.level || 1}
                            wins={player.wins || 0}
                            winRate={player.winRate}
                            isCurrentUser={user?.id === player.id} 
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Leaderboard;