import React from 'react';
import { Camera, Loader2, Calendar, Trophy, UserPlus, UserCheck, Clock } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function ProfileHeader({ 
    profile, 
    isOwnProfile, 
    isUploading, 
    onAvatarClick, 
    fileInputRef, 
    onFileChange,
    relationshipStatus,
    onFriendAction
}) {
    const getRankTitle = (level = 1) => {
        if (level >= 50) return "Grandmaster";
        if (level >= 30) return "Diamond II";
        if (level >= 10) return "Gold I";
        return "Rookie";
    };

    const currentExp = profile?.experience || 0;
    const expPercentage = Math.min((currentExp / 1000) * 100, 100);
    const joinDate = profile?.createdAt 
        ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
        : 'Unknown Date';

    return (
        <div className="relative overflow-hidden rounded-3xl bg-[#0bc1021]/60 backdrop-blur-xl border border-white/10 p-8 flex flex-col items-center text-center shadow-2xl">

            <div className="relative group mb-6">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
                <Avatar className="h-32 w-32 border-4 border-[#0b1021] shadow-xl relative z-10">
                    <AvatarImage src={profile?.avatar} className="object-cover bg-black" />
                    <AvatarFallback className="bg-cyan-900 text-cyan-100 text-4xl">
                        {profile?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                
                {isOwnProfile && (
                    <button 
                        onClick={onAvatarClick}
                        className="absolute bottom-0 right-0 p-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-lg transition-all hover:scale-110 z-20"
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={onFileChange} 
                    className="hidden" 
                    accept="image/*" 
                />
            </div>

            <h2 className="text-2xl font-bold text-white tracking-wide mb-1">
                {profile?.displayName || profile?.username}
            </h2>
            <p className="text-sm text-cyan-400 font-mono mb-4">@{profile?.username}</p>

            {!isOwnProfile && (
                <div className="mb-6">
                    {relationshipStatus === 'NONE' && (
                        <Button 
                            onClick={() => onFriendAction('add')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-wide flex items-center gap-2"
                        >
                            <UserPlus size={16} /> Add Friend
                        </Button>
                    )}
                    {relationshipStatus === 'SENT' && (
                        <Button 
                            onClick={() => onFriendAction('cancel')}
                            className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border border-yellow-500/50 flex items-center gap-2"
                        >
                            <Clock size={16} /> Request Sent
                        </Button>
                    )}
                    {relationshipStatus === 'RECEIVED' && (
                        <Button 
                            onClick={() => onFriendAction('accept')}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold flex items-center gap-2"
                        >
                            <UserCheck size={16} /> Accept Request
                        </Button>
                    )}
                    {relationshipStatus === 'FRIEND' && (
                        <Button 
                            onClick={() => onFriendAction('remove')}
                            variant="ghost"
                            className="bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 flex items-center gap-2"
                        >
                            <UserCheck size={16} className="text-emerald-400" /> Friends
                        </Button>
                    )}
                </div>
            )}

            <div className="w-full space-y-2">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy size={64} />
                    </div>
                    
                    <div className="flex justify-between items-end mb-4 relative z-10">
                        <div className="text-left">
                            <div className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-1">
                                {getRankTitle(profile?.level)}
                            </div>
                            <div className="text-4xl font-black text-white italic tracking-tighter">
                                LVL {profile?.level || 1}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 relative z-10">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-white/40">
                            <span>Progress</span>
                            <span>{currentExp} / 1000 XP</span>
                        </div>
                        <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000" 
                                style={{ width: `${expPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs text-white/20 font-mono">
                <Calendar className="h-3 w-3" /> Joined {joinDate}
            </div>
        </div>
    );
}