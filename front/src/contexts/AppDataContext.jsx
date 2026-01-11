import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { authenticatedFetch } from '@/utils/api';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const friendsSocketRef = useRef(null);
  const isFetchingRef = useRef(false);

  const [state, setState] = useState({
    users: [],
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    gameInvites: [],
    stats: { totalMatches: 0, winRate: 0, rank: 'Unranked' },
    history: [],
    isLoaded: false, 
  });


  const fetchAndPatchFriend = async (friendId) => {
    try {
        const res = await authenticatedFetch(`/api/users/${friendId}`);
        if (res.ok) {
            const userData = await res.json();
            setState(prev => ({
                ...prev,
                friends: prev.friends.map(f => 
                    f.id === friendId ? { ...f, avatar: userData.avatar } : f
                )
            }));
        }
    } catch (e) { }
  };

  const fetchAndPatchPendingRequest = async (requestId, userId) => {
    try {
        const res = await authenticatedFetch(`/api/users/${userId}`);
        if (res.ok) {
            const userData = await res.json();
            setState(prev => ({
                ...prev,
                pendingRequests: prev.pendingRequests.map(req => 
                    req.id === requestId 
                    ? { ...req, sender: { ...req.sender, avatar: userData.avatar } }
                    : req
                )
            }));
        }
    } catch (e) { }
  };


  const updateFriendStatus = useCallback((userId, isOnline) => {
    setState(prev => ({
        ...prev,
        friends: prev.friends.map(friend => 
            friend.id === userId 
            ? { ...friend, isOnline: isOnline, status: isOnline ? 'Online' : 'Offline' } 
            : friend
        )
    }));
  }, []);

  const addGameInvite = useCallback((invite) => {
    setState(prev => {
        if (prev.gameInvites.some(i => i.senderId === invite.senderId)) return prev;
        return { ...prev, gameInvites: [invite, ...prev.gameInvites] };
    });
  }, []);

  const removeGameInvite = useCallback((senderId) => {
    setState(prev => ({
        ...prev,
        gameInvites: prev.gameInvites.filter(i => i.senderId !== senderId)
    }));
  }, []);

  useEffect(() => {
    if (!user) return;
    if (friendsSocketRef.current) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io('https://localhost:3001/friends', {
        auth: { token },
        transports: ['websocket'],
        secure: true,
        rejectUnauthorized: false
    });

    socket.on('friend:status', (data) => {
        if (data?.userId) updateFriendStatus(data.userId, data.isOnline);
    });

    socket.on('friend:request_received', (data) => {
        const cachedUser = state.users.find(u => u.id === data.senderId);
        
        const newRequest = {
            id: data.requestId, 
            senderId: data.senderId,
            sender: {
                id: data.senderId,
                username: data.senderUsername,
                displayName: data.senderDisplayName,
                avatar: cachedUser?.avatar || '/default-avatar.png', 
            },
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };

        setState(prev => {
             if (prev.pendingRequests.some(r => r.id === newRequest.id)) return prev;
             return { ...prev, pendingRequests: [newRequest, ...prev.pendingRequests] };
        });

        if (!cachedUser?.avatar) {
            fetchAndPatchPendingRequest(data.requestId, data.senderId);
        }
    });

    socket.on('friend:request_accepted', (data) => {
        setState(prev => {
            const fromPending = prev.pendingRequests.find(r => r.senderId === data.userId)?.sender;
            const fromSent = prev.sentRequests.find(r => r.receiverId === data.userId)?.receiver;
            const fromCache = prev.users.find(u => u.id === data.userId);
            const resolvedAvatar = fromPending?.avatar || fromSent?.avatar || fromCache?.avatar;

            const newFriend = {
                id: data.userId,
                username: data.username,
                displayName: data.displayName,
                avatar: resolvedAvatar || '/default-avatar.png',
                isOnline: true, 
                status: 'Online'
            };

            if (!resolvedAvatar)
                fetchAndPatchFriend(data.userId);

            return {
                ...prev,
                pendingRequests: prev.pendingRequests.filter(r => r.senderId !== data.userId),
                sentRequests: prev.sentRequests.filter(r => r.receiverId !== data.userId),
                friends: [...prev.friends, newFriend]
            };
        });
    });

    socket.on('friend:game_invite_received', (data) => {
        addGameInvite({
            id: `invite-${Date.now()}`,
            senderId: data.senderId,
            senderName: data.senderDisplayName || data.senderUsername || "Unknown"
        });
    });

    socket.on('friend:game_start', (data) => {
        if (data.roomId) navigate(`/game/${data.roomId}`);
    });

    socket.on('friend:game_invite_declined', (data) => { /* Toast */ });

    friendsSocketRef.current = socket;

    return () => {
        if (friendsSocketRef.current) {
            friendsSocketRef.current.disconnect();
            friendsSocketRef.current = null;
        }
    };
  }, [user, navigate, updateFriendStatus, addGameInvite, state.users]);


  const fetchAllData = useCallback(async () => {
    if (!user || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [friendsRes, receivedRes, sentRes, statsRes, historyRes, usersRes] = await Promise.all([
         authenticatedFetch('/api/friends'),
         authenticatedFetch('/api/friends/requests/pending'),
         authenticatedFetch('/api/friends/requests/sent'),
         authenticatedFetch('/api/leaderboard/me'),
         authenticatedFetch('/api/leaderboard/me/history?take=5'),
         authenticatedFetch('/api/users?take=100')
      ]);

      const friendsData = await friendsRes.json();
      const receivedData = await receivedRes.json();
      const sentData = await sentRes.json();
      const statsData = await statsRes.json();
      const historyData = await historyRes.json();
      const usersData = await usersRes.json();

      const processedStats = {
          totalMatches: statsData.totalGames || 0,
          winRate: statsData.winRate || 0,
          rank: statsData.title || `Rank #${statsData.rank || '-'}` 
      };

      const processedHistory = Array.isArray(historyData) ? historyData.map(match => ({
           id: match.id,
           result: match.winnerId === user.id ? "VICTORY" : "DEFEAT",
           opponent: match.winnerId === user.id ? match.loser?.username : match.winner?.username,
           score: `${match.winnerScore} - ${match.loserScore}`,
           date: new Date(match.createdAt).toLocaleDateString(),
           isWin: match.winnerId === user.id
      })) : [];

      setState(prev => ({
        ...prev,
        friends: Array.isArray(friendsData) ? friendsData : [],
        pendingRequests: Array.isArray(receivedData) ? receivedData : [],
        sentRequests: Array.isArray(sentData) ? sentData : [],
        users: usersData.users || [],
        stats: processedStats,
        history: processedHistory,
        isLoaded: true
      }));

    } catch (error) {
      console.error("Data Sync Error:", error);
      setState(prev => ({ ...prev, isLoaded: true }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [user]);

  const respondToGameInvite = (senderId, accepted) => {
    if (friendsSocketRef.current) {
        friendsSocketRef.current.emit('friend:respond_game_invite', { senderId, accepted });
        removeGameInvite(senderId);
    }
  };

  const sendGameInvite = (friendId) => {
    if (friendsSocketRef.current) {
        friendsSocketRef.current.emit('friend:invite_game', { friendId });
        return { success: true };
    }
    return { success: false };
  };

  const acceptFriendRequest = async (requestId) => {
    if (friendsSocketRef.current) {
        friendsSocketRef.current.emit('friend:accept_request', { requestId }, (response) => {
            if (response.success) {
                setState(prev => ({
                   ...prev,
                   pendingRequests: prev.pendingRequests.filter(r => r.id !== requestId)
                }));
            }
        });
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
        const res = await authenticatedFetch(`/api/friends/request/${requestId}/decline`, { method: 'POST' });
        if (res.ok) {
            setState(prev => ({ ...prev, pendingRequests: prev.pendingRequests.filter(r => r.id !== requestId) }));
        }
    } catch (e) { console.error(e); }
  };

  const sendFriendRequest = async (userId) => {
    try {
        const res = await authenticatedFetch(`/api/friends/request/${userId}`, { method: 'POST' });
        if (res.ok) {
            const newReq = await res.json();
            setState(prev => ({ ...prev, sentRequests: [...prev.sentRequests, newReq] }));
            return { success: true };
        }
    } catch (e) { console.error(e); }
    return { success: false };
  };

  const removeFriend = async (friendId) => {
    try {
        const res = await authenticatedFetch(`/api/friends/${friendId}`, { method: 'DELETE' });
        if (res.ok) {
            setState(prev => ({ ...prev, friends: prev.friends.filter(f => f.id !== friendId) }));
        }
    } catch (e) { console.error(e); }
  };

  const cancelFriendRequest = async (requestId) => {
    try {
        const res = await authenticatedFetch(`/api/friends/request/${requestId}`, { method: 'DELETE' });
        if (res.ok) {
            setState(prev => ({ ...prev, sentRequests: prev.sentRequests.filter(r => r.id !== requestId) }));
        }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (user) fetchAllData();
  }, [user, fetchAllData]);

  return (
    <AppDataContext.Provider value={{ 
        ...state, 
        refreshData: fetchAllData,
        respondToGameInvite,
        sendGameInvite,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest,
        removeFriend
    }}>
      {children}
    </AppDataContext.Provider>
  );
};