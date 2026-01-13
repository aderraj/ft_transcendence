import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { ArrowLeft, Gamepad2, Loader2, AlertCircle, Send, Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function ChatWindow({
    activeConversation,
    messages,
    currentUser,
    isLoading,
    typingUsers,
    onSendMessage,
    onTyping,
    inputText,
    onInviteGame,
    onBack
}) {
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, typingUsers]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleProfileClick = () => {
        if (activeConversation?.friend?.id) {
            navigate(`/profile/${activeConversation.friend.id}`, { state: { from: 'chat' } });
        }
    };

    if (!activeConversation) {
        return (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-400 bg-transparent">
                <div className="relative mb-6">
                     <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
                     <div className="relative w-24 h-24 bg-[#0b1021] rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl">
                        <Send className="h-10 w-10 text-cyan-400 -rotate-12 translate-x-[-2px]" />
                     </div>
                </div>
                <h3 className="text-xl font-bold text-white tracking-widest uppercase mb-2">Pong Messenger</h3>
                <p className="text-sm text-gray-500 max-w-xs text-center leading-relaxed">
                    Select a friend from the list to start chatting.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full">
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div 
                        className="flex items-center gap-3 cursor-pointer group select-none"
                        onClick={handleProfileClick}
                        title="View Profile"
                    >
                        <Avatar className="h-9 w-9 border border-white/10 group-hover:border-cyan-400/50 transition-colors">
                            <AvatarImage src={activeConversation.friend?.avatar} />
                            <AvatarFallback className="bg-cyan-900 text-cyan-100">
                                {activeConversation.friend?.displayName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-sm text-gray-100 group-hover:text-cyan-400 transition-colors">
                                {activeConversation.friend?.displayName}
                            </h3>
                            <p className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-gray-300">
                                {activeConversation.friend?.isOnline ? (
                                    <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_5px_#10b981]" /> Online</>
                                ) : 'Offline'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={onInviteGame} title="Invite to Game" className="text-gray-400 hover:text-cyan-400 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all">
                        <Gamepad2 className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4 bg-black/20">
                {isLoading && messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 opacity-50">
                        <Avatar className="h-20 w-20 grayscale opacity-20">
                            <AvatarImage src={activeConversation.friend?.avatar} />
                        </Avatar>
                        <div className="text-center">
                            <p className="text-sm">No messages yet.</p>
                            <p className="text-xs">Say hello to {activeConversation.friend?.displayName}!</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 pb-4">
                        {messages.map((msg, index) => {
                            const isMe = String(msg.senderId) === String(currentUser?.id) || msg.senderId === "me";
                            const isLast = index === messages.length - 1;

                            return (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", 
                                        isMe ? "justify-end" : "justify-start"
                                    )}
                                    ref={isLast ? scrollRef : null}
                                >
                                    <div className={cn(
                                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm break-words relative group flex flex-col",
                                        isMe
                                            ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-tr-none border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                            : "bg-[#1a1f2e] text-gray-100 rounded-tl-none border border-white/10 backdrop-blur-sm"
                                    )}>
                                        <p>{msg.content}</p>
                                        <div className={cn(
                                            "flex items-center justify-end gap-1 mt-1",
                                            isMe ? "text-cyan-100/70" : "text-gray-400/70"
                                        )}>
                                            <span className="text-[10px] font-mono tracking-tighter">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                            {isMe && (
                                                <span className="ml-1">
                                                    {msg.isError ? (
                                                        <AlertCircle size={12} className="text-red-400" title="Failed to send" />
                                                    ) : msg.isTemp ? (
                                                        <span className="text-[10px] grayscale">🕒</span>
                                                    ) : msg.isRead ? (
                                                        <CheckCheck size={14} className="text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                                                    ) : (
                                                        <Check size={14} className="text-white/40" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {typingUsers.has(String(activeConversation.friend?.id)) && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm backdrop-blur-sm">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            <div className="p-4 bg-white/5 border-t border-white/10 shrink-0 backdrop-blur-md">
                <form
                    onSubmit={onSendMessage}
                    className="flex items-center gap-3 max-w-4xl mx-auto"
                >
                    <Input
                        value={inputText}
                        onChange={onTyping}
                        placeholder={`Message ${activeConversation.friend?.displayName}...`}
                        className="flex-1 bg-black/40 border-white/10 text-gray-100 placeholder:text-gray-500 focus-visible:ring-cyan-500/50 rounded-xl h-11"
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!inputText.trim()}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl h-11 w-11 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                    >
                        <Send className="h-5 w-5 ml-0.5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}