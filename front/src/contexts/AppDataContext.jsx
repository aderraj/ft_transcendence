import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { authenticatedFetch, API_BASE } from '@/utils/api';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const friendsSocketRef = useRef(null);
  
  const [chatSocket, setChatSocket] = useState(null);
  
  const isFetchingRef = useRef(false);

  const [state, setState] = useState({
    users: [],
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    gameInvites: [],
    sentGameInvites: [],
    stats: { totalMatches: 0, winRate: 0, rank: 'Unranked' },
    history: [],
    unreadChatCount: 0,
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

  const fetchGameInvites = useCallback(async () => {
      try {
          const res = await authenticatedFetch('/api/friends/game-invitations/pending');
          if (res.ok) {
              const rawData = await res.json();
              let receivedInvites = [];
              let sentInvites = [];

              if (rawData && Array.isArray(rawData.received)) {
                  receivedInvites = rawData.received;
                  sentInvites = rawData.sent || [];
              } else if (Array.isArray(rawData)) {
                  receivedInvites = rawData;
              }

              const processedInvites = receivedInvites.map(invite => ({
                  id: invite.id,
                  senderId: invite.sender?.id || invite.senderId || invite.inviter?.id || invite.inviterId,
                  senderName: invite.sender?.username || invite.sender?.displayName || invite.inviter?.username || "Unknown",
                  createdAt: invite.createdAt
              }));

              setState(prev => ({ 
                  ...prev, 
                  gameInvites: processedInvites,
                  sentGameInvites: sentInvites 
              }));
          }
      } catch (error) {
          console.error("Failed to fetch game invites", error);
      }
  }, []);

  const fetchUnreadChatCount = useCallback(async () => {
      try {
          const res = await authenticatedFetch('/api/chat/conversations');
          if (res.ok) {
              const conversations = await res.json();
              const count = Array.isArray(conversations) 
                  ? conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)
                  : 0;
              setState(prev => ({ ...prev, unreadChatCount: count }));
          }
      } catch (error) {
          console.error("Failed to fetch chat counts", error);
      }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!friendsSocketRef.current) {
        const token = localStorage.getItem('accessToken');
        const url = API_BASE || '';
        const friendsSocketUrl = url.endsWith('/') ? `${url}friends` : `${url}/friends`;

        const friendsSocket = io(friendsSocketUrl, {
            auth: { token },
            transports: ['websocket'],
            secure: friendsSocketUrl.startsWith('https'), 
            rejectUnauthorized: false 
        });

        friendsSocket.on('friend:status', (data) => {
            if (data?.userId) updateFriendStatus(data.userId, data.isOnline);
        });

        friendsSocket.on('friend:request_received', (data) => {
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
            if (!cachedUser?.avatar) fetchAndPatchPendingRequest(data.requestId, data.senderId);
        });

        friendsSocket.on('friend:request_accepted', (data) => {
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
                if (!resolvedAvatar) fetchAndPatchFriend(data.userId);
                return {
                    ...prev,
                    pendingRequests: prev.pendingRequests.filter(r => r.senderId !== data.userId),
                    sentRequests: prev.sentRequests.filter(r => r.receiverId !== data.userId),
                    friends: [...prev.friends, newFriend]
                };
            });
        });

        friendsSocket.on('friend:game_invitation_received', () => fetchGameInvites());
        friendsSocket.on('friend:game_invitation_accepted', (data) => {
            const roomId = data.roomId || (data.gameSession && data.gameSession.roomId);
            if (roomId) navigate(`/game/${roomId}`);
        });
        friendsSocket.on('friend:game_start', (data) => {
            if (data.roomId) navigate(`/game/${data.roomId}`);
        });

        friendsSocketRef.current = friendsSocket;
    }

    if (!chatSocket) {
        const token = localStorage.getItem('accessToken');
        const url = API_BASE || '';
        const chatSocketUrl = url.endsWith('/') ? `${url}chat` : `${url}/chat`;

        const newChatSocket = io(chatSocketUrl, {
            auth: { token },
            transports: ['websocket'],
            secure: chatSocketUrl.startsWith('https'),
            rejectUnauthorized: false
        });

        newChatSocket.on('message:receive', (message) => {
            if (String(message.senderId) !== String(user.id)) {
                setState(prev => ({ ...prev, unreadChatCount: prev.unreadChatCount + 1 }));
            }
        });

        newChatSocket.on('message:read', () => {
             fetchUnreadChatCount();
        });

        setChatSocket(newChatSocket);
    }

    return () => {
        if (friendsSocketRef.current) {
            friendsSocketRef.current.disconnect();
            friendsSocketRef.current = null;
        }
    };
  }, [user, navigate, updateFriendStatus, fetchGameInvites, state.users, fetchUnreadChatCount, chatSocket]);


  const fetchAllData = useCallback(async () => {
    if (!user || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [friendsRes, receivedRes, sentRes, statsRes, historyRes, usersRes, invitesRes, conversationsRes] = await Promise.all([
         authenticatedFetch('/api/friends'),
         authenticatedFetch('/api/friends/requests/pending'),
         authenticatedFetch('/api/friends/requests/sent'),
         authenticatedFetch('/api/leaderboard/me'),
         authenticatedFetch('/api/leaderboard/me/history?take=5'),
         authenticatedFetch('/api/users?take=100'),
         authenticatedFetch('/api/friends/game-invitations/pending'),
         authenticatedFetch('/api/chat/conversations') 
      ]);

      const friendsData = await friendsRes.json();
      const receivedData = await receivedRes.json();
      const sentData = await sentRes.json();
      const statsData = await statsRes.json();
      const historyData = await historyRes.json();
      const usersData = await usersRes.json();
      const rawInvites = await invitesRes.json();
      const conversationsData = await conversationsRes.json();

      const processedStats = {
          totalMatches: statsData.totalGames || 0,
          winRate: statsData.winRate || 0,
          rank: statsData.title || `Rank #${statsData.rank || '-'}` 
      };

      const processedHistory = Array.isArray(historyData) ? historyData.map(match => {
           const isPlayer1 = match.player1Id === user.id;
           const opponent = isPlayer1 ? match.player2 : match.player1;
           const opponentName = opponent?.username || opponent?.displayName || "Unknown";

           const isWin = match.winnerId === user.id;
           const isDraw = !match.winnerId && (match.finishedAt || match.status === 'FINISHED'); 

           let resultString = "DEFEAT";
           if (isDraw) resultString = "DRAW";
           else if (isWin) resultString = "VICTORY";

           let winnerScore = match.winnerId === match.player1Id ? match.player1Score : match.player2Score;
           let loserScore = match.winnerId === match.player1Id ? match.player2Score : match.player1Score;
           
           if (isDraw) {
               winnerScore = match.player1Score;
               loserScore = match.player2Score;
           }

           return {
               id: match.id,
               result: resultString,
               opponent: opponentName,
               score: `${winnerScore} - ${loserScore}`,
               date: match.finishedAt ? new Date(match.finishedAt).toLocaleDateString() : "Recent",
               isWin: isWin
           };
      }) : [];

      let receivedInvites = [];
      let sentInvites = [];
      if (rawInvites && Array.isArray(rawInvites.received)) {
          receivedInvites = rawInvites.received;
          sentInvites = rawInvites.sent || [];
      } else if (Array.isArray(rawInvites)) {
          receivedInvites = rawInvites;
      }

      const processedInvites = receivedInvites.map(invite => ({
          id: invite.id,
          senderId: invite.sender?.id || invite.senderId || invite.inviter?.id || invite.inviterId,
          senderName: invite.sender?.username || invite.sender?.displayName || invite.inviter?.username || "Unknown",
          createdAt: invite.createdAt
      }));

      const initialUnreadCount = Array.isArray(conversationsData) 
          ? conversationsData.reduce((acc, c) => acc + (c.unreadCount || 0), 0) 
          : 0;

      setState(prev => ({
        ...prev,
        friends: Array.isArray(friendsData) ? friendsData : [],
        pendingRequests: Array.isArray(receivedData) ? receivedData : [],
        sentRequests: Array.isArray(sentData) ? sentData : [],
        users: usersData.users || [],
        gameInvites: processedInvites,
        sentGameInvites: sentInvites,
        stats: processedStats,
        history: processedHistory,
        unreadChatCount: initialUnreadCount,
        isLoaded: true
      }));

    } catch (error) {
      console.error("Data Sync Error:", error);
      setState(prev => ({ ...prev, isLoaded: true }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [user]);

  const respondToGameInvite = async (invitationId, accepted) => {
      try {
          if (accepted) {
              const res = await authenticatedFetch('/api/friends/accept-game', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ invitationId })
              });
              if (res.ok) {
                  const data = await res.json();
                  setState(prev => ({ ...prev, gameInvites: prev.gameInvites.filter(i => i.id !== invitationId) }));
                  if (data.gameSession && data.gameSession.roomId) navigate(`/game/${data.gameSession.roomId}`);
              }
          } else {
              const res = await authenticatedFetch(`/api/friends/game-invitation/${invitationId}`, { method: 'DELETE' });
              if (res.ok) setState(prev => ({ ...prev, gameInvites: prev.gameInvites.filter(i => i.id !== invitationId) }));
          }
      } catch (e) { console.error("Error responding to invite:", e); }
  };

  const sendGameInvite = async (friendId) => {
      try {
          const res = await authenticatedFetch('/api/friends/invite-game', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ friendId, gameMode: 'remote' })
          });
          return { success: res.ok };
      } catch (e) { console.error("Error sending invite:", e); return { success: false }; }
  };

  const acceptFriendRequest = async (requestId) => {
    if (friendsSocketRef.current) {
        friendsSocketRef.current.emit('friend:accept_request', { requestId }, (response) => {
            if (response.success) setState(prev => ({ ...prev, pendingRequests: prev.pendingRequests.filter(r => r.id !== requestId) }));
        });
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
        const res = await authenticatedFetch(`/api/friends/request/${requestId}/decline`, { method: 'POST' });
        if (res.ok) setState(prev => ({ ...prev, pendingRequests: prev.pendingRequests.filter(r => r.id !== requestId) }));
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
        if (res.ok) setState(prev => ({ ...prev, friends: prev.friends.filter(f => f.id !== friendId) }));
    } catch (e) { console.error(e); }
  };

  const cancelFriendRequest = async (requestId) => {
    try {
        const res = await authenticatedFetch(`/api/friends/request/${requestId}`, { method: 'DELETE' });
        if (res.ok) setState(prev => ({ ...prev, sentRequests: prev.sentRequests.filter(r => r.id !== requestId) }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (user) fetchAllData();
  }, [user, fetchAllData]);

  return (
    <AppDataContext.Provider value={{ 
        ...state, 
        chatSocket,
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