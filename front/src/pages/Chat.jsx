import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { io } from 'socket.io-client';
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { authenticatedFetch, API_BASE } from "@/utils/api";

import ChatSidebar from "@/components/chat/ChatSideBar";
import ChatWindow from "@/components/chat/ChatWindow";

export default function Chat() {
    const { user } = useAuth();
    const { friends, sendGameInvite } = useAppData();

    const [chatSocket, setChatSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [messageCache, setMessageCache] = useState({});
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());

    const typingTimeoutRef = useRef(null);
    const activeConversationIdRef = useRef(activeConversationId);

    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    const updateCache = useCallback((userId, updateFn) => {
        if (!userId) return;
        setMessageCache(prev => {
            const id = String(userId);
            const currentMessages = prev[id] || [];
            const newMessages = updateFn(currentMessages);
            return { ...prev, [id]: newMessages };
        });
    }, []);

    const refreshActiveChat = useCallback(async () => {
        const currentId = activeConversationIdRef.current;
        if (!currentId) return;
        try {
            const res = await authenticatedFetch(`/api/chat/messages/${currentId}`);
            if (res.ok) {
                const data = await res.json();
                setMessageCache(prev => ({ ...prev, [String(currentId)]: data }));
            }
        } catch (e) { console.error("Sync failed", e); }
    }, []);

    const allChatEntries = useMemo(() => {
        const convMap = new Map();
        if (Array.isArray(conversations)) {
            conversations.forEach(c => {
                const partnerId = c.friend?.id || c.user?.id;
                if (partnerId) convMap.set(String(partnerId), c);
            });
        }

        const entries = friends.map(friend => {
            const fId = String(friend.id);
            const existingConv = convMap.get(fId);
            if (existingConv) {
                return { ...existingConv, friend: friend, hasHistory: true };
            } else {
                return { id: `new-${fId}`, friend: friend, lastMessage: null, unreadCount: 0, hasHistory: false };
            }
        });

        const filtered = entries.filter(entry => 
            entry.friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.friend.displayName && entry.friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return filtered.sort((a, b) => {
            const unreadA = a.unreadCount || 0;
            const unreadB = b.unreadCount || 0;
            if (unreadA > 0 && unreadB === 0) return -1;
            if (unreadA === 0 && unreadB > 0) return 1;

            const dateA = new Date(a.lastMessage?.createdAt || 0).getTime();
            const dateB = new Date(b.lastMessage?.createdAt || 0).getTime();
            if (dateA !== dateB) return dateB - dateA;

            if (a.friend.isOnline !== b.friend.isOnline) return a.friend.isOnline ? -1 : 1;
            return a.friend.username.localeCompare(b.friend.username);
        });
    }, [conversations, friends, searchTerm]);

    const activeConversation = useMemo(() => 
        allChatEntries.find(c => String(c?.friend?.id) === String(activeConversationId)), 
    [allChatEntries, activeConversationId]);

    const activeMessages = useMemo(() => {
        const msgs = (activeConversationId ? messageCache[String(activeConversationId)] : []) || [];
        return [...msgs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [messageCache, activeConversationId]);

    const fetchConversations = async () => {
        try {
            const res = await authenticatedFetch('/api/chat/conversations');
            if (res.ok) setConversations(await res.json());
        } catch (err) { console.error("Failed to fetch conversations", err); }
    };

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('accessToken');
        const baseUrl = API_BASE !== undefined ? API_BASE : '';
        const socketUrl = `${baseUrl}/chat`;
        
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket'],
            secure: true,
            rejectUnauthorized: false,
            path: '/socket.io'
        });

        newSocket.on('connect', () => console.log('Chat Socket Connected'));
        
        newSocket.on('message:receive', (message) => {
            const senderIdStr = String(message.senderId);
            
            updateCache(senderIdStr, (prev) => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
            
            if (String(activeConversationIdRef.current) === senderIdStr) {
                newSocket.emit('message:read', { messageId: message.id });
                updateCache(senderIdStr, (prev) => 
                    prev.map(m => m.id === message.id ? { ...m, isRead: true } : m)
                );
            } else {
                setConversations(prev => {
                    const index = prev.findIndex(c => String(c.friend?.id || c.user?.id) === senderIdStr);
                    if (index !== -1) {
                        const updated = { ...prev[index], lastMessage: message, unreadCount: (prev[index].unreadCount || 0) + 1 };
                        const newArr = [...prev];
                        newArr.splice(index, 1);
                        return [updated, ...newArr];
                    } else {
                        return [{ friend: { id: senderIdStr }, lastMessage: message, unreadCount: 1 }, ...prev];
                    }
                });
            }
        });

        newSocket.on('message:read', (data) => {
            const targetId = String(data?.messageId || data?.id);
            if (!targetId) return;


            setMessageCache(prevCache => {
                const newCache = { ...prevCache };
                let found = false;

                Object.keys(newCache).forEach(friendId => {
                    const messages = newCache[friendId];
                    const msgIndex = messages.findIndex(m => String(m.id) === targetId);

                    if (msgIndex !== -1) {
                        const newMessages = [...messages];
                        newMessages[msgIndex] = { ...newMessages[msgIndex], isRead: true, read: true };
                        newCache[friendId] = newMessages;
                        found = true;
                    }
                });

                if (!found && activeConversationIdRef.current) {
                    refreshActiveChat();
                }
                
                return found ? newCache : prevCache;
            });
        });

        newSocket.on('typing:start', ({ userId }) => setTypingUsers(prev => new Set(prev).add(String(userId))));
        newSocket.on('typing:stop', ({ userId }) => setTypingUsers(prev => {
            const next = new Set(prev);
            next.delete(String(userId));
            return next;
        }));

        setChatSocket(newSocket);
        fetchConversations();

        return () => newSocket.disconnect();
    }, [user, updateCache, refreshActiveChat]);

    useEffect(() => {
        if (!activeConversationId) return;

        const loadMessages = async () => {
            const idStr = String(activeConversationId);
            const hasCache = !!messageCache[idStr] && messageCache[idStr].length > 0;
            
            if (!hasCache) setIsLoadingMessages(true);

            try {
                const res = await authenticatedFetch(`/api/chat/messages/${idStr}`);
                if (res.ok) {
                    const data = await res.json();
                    const msgs = Array.isArray(data) ? data : [];
                    setMessageCache(prev => ({ ...prev, [idStr]: msgs }));

                    await authenticatedFetch(`/api/chat/messages/${idStr}/read-all`, { method: 'PATCH' });

                    setConversations(prev => prev.map(c => 
                        String(c.friend?.id || c.user?.id) === idStr ? { ...c, unreadCount: 0 } : c
                    ));

                    if (chatSocket) {
                        const unreadFromFriend = msgs.filter(m => 
                            !m.isRead && 
                            !m.read && 
                            String(m.senderId) === idStr
                        );
                        
                        unreadFromFriend.forEach(m => {
                            chatSocket.emit('message:read', { messageId: m.id });
                        });
                    }
                }
            } catch (err) { console.error("Fetch error", err); } 
            finally { setIsLoadingMessages(false); }
        };

        loadMessages();
    }, [activeConversationId, chatSocket]); 

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!inputText.trim() || !activeConversationId || !chatSocket) return;

        const content = inputText;
        setInputText('');
        handleTypingStop();

        const receiverId = String(activeConversationId);
        const tempId = `temp-${Date.now()}`;
        
        const tempMsg = {
            id: tempId,
            senderId: user?.id || "me", 
            receiverId: receiverId,
            content: content,
            createdAt: new Date().toISOString(),
            isRead: false,
            read: false,
            isTemp: true
        };

        updateCache(receiverId, (prev) => [...prev, tempMsg]);

        setConversations(prev => {
            const index = prev.findIndex(c => String(c.friend?.id || c.user?.id) === receiverId);
            const updated = index !== -1 ? { ...prev[index] } : { friend: { id: receiverId } };
            updated.lastMessage = tempMsg;
            if (index === -1) return [updated, ...prev]; 
            const newArr = [...prev];
            newArr.splice(index, 1);
            return [updated, ...newArr];
        });

        chatSocket.emit('message:send', { receiverId: receiverId, content }, (response) => {
            if (response && !response.error) {
                updateCache(receiverId, (prev) => 
                    prev.map(m => m.id === tempId ? { ...response, ...m, id: response.id || m.id, isTemp: false } : m)
                );
            } else {
                updateCache(receiverId, (prev) => 
                    prev.map(m => m.id === tempId ? { ...m, isError: true } : m)
                );
            }
        });
    };

    const handleTyping = (e) => {
        setInputText(e.target.value);
        if (!chatSocket || !activeConversationId) return;
        
        if (!isTyping) {
            setIsTyping(true);
            chatSocket.emit('typing:start', { receiverId: activeConversationId });
        }
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(handleTypingStop, 2000);
    };

    const handleTypingStop = () => {
        if (chatSocket && activeConversationId && isTyping) {
            setIsTyping(false);
            chatSocket.emit('typing:stop', { receiverId: activeConversationId });
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-[#0bc1021]/60 backdrop-blur-xl overflow-hidden border border-white/10 rounded-xl shadow-2xl my-4 mx-4 md:mx-6 relative">
            <ChatSidebar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                chatEntries={allChatEntries}
                activeId={activeConversationId}
                onSelect={setActiveConversationId}
                typingUsers={typingUsers}
            />
            
            <ChatWindow 
                activeConversation={activeConversation}
                messages={activeMessages}
                currentUser={user}
                isLoading={isLoadingMessages}
                typingUsers={typingUsers}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                inputText={inputText}
                onInviteGame={() => sendGameInvite(activeConversationId)}
                onBack={() => setActiveConversationId(null)}
            />
        </div>
    );
};