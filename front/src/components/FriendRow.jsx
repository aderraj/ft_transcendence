import React from "react";
import { UserMinus } from 'lucide-react';

const FriendRow = ({ name, status, statusColor, isOffline, avatar, onRemove, onClick }) => (
    <div 
        onClick={onClick} 
        className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group ${isOffline ? 'opacity-40 hover:opacity-100' : ''}`}
    >
        <div className="relative">
            <img 
                src={avatar || "/default-avatar.png"} 
                alt={name}
                className="w-9 h-9 rounded-full object-cover bg-gray-800 border border-white/10 group-hover:border-cyan-400/50 transition-colors"
            />
            {!isOffline && (
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#050b14] ${statusColor.replace('text-', 'bg-')}`}></div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white/80 group-hover:text-white truncate transition-colors">{name}</div>
            <div className={`text-[9px] font-mono uppercase tracking-wider truncate ${statusColor}`}>{status}</div>
        </div>
        <button 
            onClick={(e) => {
                e.stopPropagation(); 
                onRemove(); 
            }}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            title="Remove Friend"
        >
            <UserMinus size={14} />
        </button>
    </div>
);

export default FriendRow;