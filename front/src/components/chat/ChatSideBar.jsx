import React from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ChatSidebar({ 
    searchTerm, 
    onSearchChange, 
    chatEntries, 
    activeId, 
    onSelect, 
    typingUsers 
}) {
    
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (date.toDateString() === new Date().toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className={cn(
            "w-full md:w-80 border-r border-white/10 flex flex-col bg-transparent transition-all",
            activeId ? "hidden md:flex" : "flex"
        )}>
            <div className="p-4 border-b border-white/10">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search friends..." 
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-cyan-500/50" 
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1 p-2">
                    {chatEntries.length === 0 ? (
                         <div className="p-8 text-center text-gray-500 text-sm">
                            {searchTerm ? "No friends found." : "No friends added yet."}
                        </div>
                    ) : (
                        chatEntries.map((entry) => {
                            const entryId = String(entry.friend.id);
                            const isUnread = (entry.unreadCount || 0) > 0;
                            const isActive = String(activeId) === entryId;

                            return (
                                <button
                                    key={entryId}
                                    onClick={() => onSelect(entryId)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-300 relative overflow-hidden group",
                                        isActive ? "bg-white/10" : "bg-transparent hover:bg-white/5",
                                        isUnread ? "bg-cyan-500/5 border-l-2 border-cyan-400" : "border-l-2 border-transparent"
                                    )}
                                >
                                    {isUnread && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none animate-pulse" />
                                    )}

                                    <div className="relative z-10">
                                        <Avatar className={cn("border transition-colors", isUnread ? "border-cyan-400" : "border-white/10")}>
                                            <AvatarImage src={entry.friend.avatar} />
                                            <AvatarFallback className="bg-cyan-900 text-cyan-100">
                                                {entry.friend.displayName?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        {entry.friend.isOnline && (
                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#0b1021]" />
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-hidden z-10">
                                        <div className="flex justify-between items-center">
                                            <span className={cn(
                                                "truncate text-sm transition-all",
                                                isUnread ? "font-bold text-white" : "font-medium text-gray-200",
                                                isActive && "text-white"
                                            )}>
                                                {entry.friend.displayName}
                                            </span>
                                            <span className={cn("text-[10px]", isUnread ? "text-cyan-400 font-bold" : "text-gray-500")}>
                                                {formatTime(entry.lastMessage?.createdAt)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center mt-1">
                                            <div className={cn("text-xs truncate max-w-[140px] h-4", isUnread ? "text-gray-100 font-medium" : "text-gray-400")}>
                                                {typingUsers.has(entryId) ? (
                                                    <span className="text-cyan-400 italic animate-pulse">Typing...</span>
                                                ) : (
                                                    entry.lastMessage ? (
                                                        <span>{entry.lastMessage.content}</span>
                                                    ) : (
                                                        <span className="text-white/20 italic flex items-center gap-1">
                                                            <MessageSquare size={10}/> Start chat
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                            
                                            {isUnread && (
                                                <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] bg-cyan-600 text-white border-none shadow-[0_0_10px_rgba(8,145,178,0.5)] animate-in zoom-in duration-300">
                                                    {entry.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}