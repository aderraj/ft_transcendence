import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { authenticatedFetch} from "@/utils/api";

import ChatSidebar from "@/components/chat/ChatSideBar";
import ChatWindow from "@/components/chat/ChatWindow";

export default function Chat() {
    const { user } = useAuth();
    const { friends, sendGameInvite, refreshData, chatSocket } = useAppData();

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

    const updateCache = useCallback((partnerId, updateFn) => {
        if (!partnerId) return;
        setMessageCache(prev => {
            const id = String(partnerId);
            const currentMessages = prev[id] || [];
            const newMessages = updateFn(currentMessages);
            return { ...prev, [id]: newMessages };
        });
    }, []);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await authenticatedFetch('/api/chat/conversations');
            if (res.ok) setConversations(await res.json());
        } catch (err) { console.error("Failed to fetch conversations", err); }
    }, []);

    useEffect(() => {
        if (!user || !chatSocket) return;

        const handleMessageUpdate = (message, isIncoming) => {
            const currentUserId = String(user.id);
            const msgSenderId = String(message.senderId);
            const isMyMessage = msgSenderId === currentUserId;
            
            let partnerId = isMyMessage ? message.receiverId : message.senderId;
            const partnerIdStr = String(partnerId);

            const currentActiveId = String(activeConversationIdRef.current);
            const isActive = currentActiveId === partnerIdStr;

            updateCache(partnerIdStr, (prev) => {
                if (prev.some(m => m.id === message.id)) return prev; 
                
                if (isMyMessage) {
                    const tempIndex = prev.findIndex(m => 
                        m.isTemp && m.content === message.content
                    );
                    
                    if (tempIndex !== -1) {
                        const newArr = [...prev];
                        newArr[tempIndex] = message; 
                        return newArr;
                    }
                }

                return [...prev, message];
            });

            if (isIncoming && isActive) {
                chatSocket.emit('message:read', { messageId: message.id });
                updateCache(partnerIdStr, (prev) => 
                    prev.map(m => m.id === message.id ? { ...m, isRead: true } : m)
                );
            }

            setConversations(prev => {
                const index = prev.findIndex(c => String(c.friend?.id || c.user?.id) === partnerIdStr);
                
                if (index !== -1) {
                    const existing = prev[index];
                    
                    const shouldIncrement = isIncoming && !isActive;
                    const newUnreadCount = shouldIncrement 
                        ? (existing.unreadCount || 0) + 1 
                        : (isActive ? 0 : existing.unreadCount);

                    const updated = { 
                        ...existing, 
                        lastMessage: message, 
                        unreadCount: newUnreadCount 
                    };
                    
                    const newArr = [...prev];
                    newArr.splice(index, 1);
                    return [updated, ...newArr];
                } else {
                    const friendData = isMyMessage 
                        ? { id: partnerIdStr, username: 'User' } 
                        : { 
                            id: partnerIdStr, 
                            username: message.sender?.username || 'New', 
                            displayName: message.sender?.displayName,
                            avatar: message.sender?.avatar 
                          };

                    return [{ 
                        friend: friendData, 
                        lastMessage: message, 
                        unreadCount: (isIncoming && !isActive) ? 1 : 0 
                    }, ...prev];
                }
            });
        };

        const onReceive = (message) => handleMessageUpdate(message, true);
        const onSent = (message) => handleMessageUpdate(message, false);

        const onRead = (data) => {
            const targetMsgId = data?.messageId ? String(data.messageId) : null;
            if (!targetMsgId) return;

            setMessageCache(prevCache => {
                const newCache = { ...prevCache };
                let cacheChanged = false;

                Object.keys(newCache).forEach(friendId => {
                    const messages = newCache[friendId];
                    const msgIndex = messages.findIndex(m => String(m.id) === targetMsgId);

                    if (msgIndex !== -1 && !messages[msgIndex].isRead) {
                        const newMessages = [...messages];
                        newMessages[msgIndex] = { ...newMessages[msgIndex], isRead: true, read: true };
                        newCache[friendId] = newMessages;
                        cacheChanged = true;
                    }
                });
                return cacheChanged ? newCache : prevCache;
            });
        };

        const onTypingStart = ({ userId }) => setTypingUsers(prev => new Set(prev).add(String(userId)));
        const onTypingStop = ({ userId }) => setTypingUsers(prev => {
             const next = new Set(prev);
             next.delete(String(userId));
             return next;
        });

        chatSocket.on('message:receive', onReceive);
        chatSocket.on('message:sent', onSent);
        chatSocket.on('message:read', onRead);
        
        chatSocket.on('typing:start', (data) => onTypingStart({ userId: data.userId || data.senderId }));
        chatSocket.on('typing:stop', (data) => onTypingStop({ userId: data.userId || data.senderId }));
        chatSocket.on('chat:typing', (data) => data.isTyping ? onTypingStart(data) : onTypingStop(data));

        fetchConversations();

        return () => {
            chatSocket.off('message:receive', onReceive);
            chatSocket.off('message:sent', onSent);
            chatSocket.off('message:read', onRead);
            chatSocket.off('typing:start');
            chatSocket.off('typing:stop');
            chatSocket.off('chat:typing');
            if (refreshData) refreshData();
        };
    }, [user, chatSocket, updateCache, fetchConversations, refreshData]);

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
                            !m.isRead && !m.read && String(m.senderId) === idStr
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
        
        if (isTyping) {
            setIsTyping(false);
            chatSocket.emit('typing:stop', { receiverId: activeConversationId });
        }

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
            const updated = index !== -1 
                ? { ...prev[index] } 
                : { friend: { id: receiverId, username: activeConversation?.friend?.username || 'Chat' } }; 
            
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
        typingTimeoutRef.current = setTimeout(() => {
            if (chatSocket && activeConversationId) {
                setIsTyping(false);
                chatSocket.emit('typing:stop', { receiverId: activeConversationId });
            }
        }, 2000);
    };

    const allChatEntries = useMemo(() => {
        const entriesMap = new Map();

        if (Array.isArray(conversations)) {
            conversations.forEach(c => {
                const partner = c.friend || c.user; 
                if (!partner?.id) return;
                const pId = String(partner.id);
                entriesMap.set(pId, { ...c, friend: partner, id: c.id || `conv-${pId}`, hasHistory: true });
            });
        }

        friends.forEach(friend => {
            const fId = String(friend.id);
            if (!entriesMap.has(fId)) {
                entriesMap.set(fId, { id: `new-${fId}`, friend: friend, lastMessage: null, unreadCount: 0, hasHistory: false });
            } else {
                const existing = entriesMap.get(fId);
                entriesMap.set(fId, { ...existing, friend: { ...existing.friend, ...friend } });
            }
        });

        const entries = Array.from(entriesMap.values());
        
        const filtered = entries.filter(entry => 
            (entry.friend.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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

            const onlineA = a.friend.isOnline ? 1 : 0;
            const onlineB = b.friend.isOnline ? 1 : 0;
            if (onlineA !== onlineB) return onlineB - onlineA;

            return (a.friend.username || "").localeCompare(b.friend.username || "");
        });
    }, [conversations, friends, searchTerm]);

    const activeConversation = useMemo(() => 
        allChatEntries.find(c => String(c?.friend?.id) === String(activeConversationId)), 
    [allChatEntries, activeConversationId]);

    const activeMessages = useMemo(() => {
        const msgs = (activeConversationId ? messageCache[String(activeConversationId)] : []) || [];
        return [...msgs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [messageCache, activeConversationId]);

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