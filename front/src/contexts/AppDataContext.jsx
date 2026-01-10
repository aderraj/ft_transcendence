import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { authenticatedFetch } from '@/utils/api';
import { io } from 'socket.io-client';

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  
  const socketRef = useRef(null);
  const isFetchingRef = useRef(false);

  const [state, setState] = useState({
    friends: [],
    pendingRequests: [],
    stats: { totalMatches: 0, winRate: 0, rank: 'Unranked' },
    history: [],
    isLoaded: false, 
  });

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

  useEffect(() => {
    if (!user) return;
    if (socketRef.current && socketRef.current.connected) return;

    const attemptConnection = () => {
        const token = localStorage.getItem('accessToken'); 

        if (!token) {
            setTimeout(() => {
                const retryToken = localStorage.getItem('accessToken');
                if (retryToken) connectSocket(retryToken);
            }, 500);
            return;
        }

        connectSocket(token);
    };

    const connectSocket = (authToken) => {
        if (socketRef.current) return;

        try {
            const socketUrl = 'https://localhost:3001/friends'; 
            
            const socket = io(socketUrl, {
                auth: { token: authToken },
                transports: ['websocket'],
                secure: true,
                rejectUnauthorized: false
            });

            socket.on('friend:status', (data) => {
                if (data && data.userId) {
                    updateFriendStatus(data.userId, data.isOnline);
                }
            });

            socketRef.current = socket;

        } catch (error) {}
    };

    attemptConnection();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, updateFriendStatus]);

  const fetchAllData = useCallback(async () => {
    if (!user || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [friendsRes, requestsRes] = await Promise.all([
         authenticatedFetch('/api/friends'),
         authenticatedFetch('/api/friends/requests/pending')
      ]);

      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();

      const mockStats = { totalMatches: 1240, winRate: 68, rank: "Diamond II" };
      const mockHistory = [];

      setState(prev => ({
        ...prev,
        friends: Array.isArray(friendsData) ? friendsData : [],
        pendingRequests: Array.isArray(requestsData) ? requestsData : [],
        stats: mockStats,
        history: mockHistory,
        isLoaded: true
      }));

    } catch (error) {
      setState(prev => ({ ...prev, isLoaded: true }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchAllData();
  }, [user, fetchAllData]);

  return (
    <AppDataContext.Provider value={{ ...state, refreshData: fetchAllData }}>
      {children}
    </AppDataContext.Provider>
  );
};