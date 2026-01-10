import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { authenticatedFetch } from '@/utils/api';

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [state, setState] = useState({
    friends: [],
    pendingRequests: [],
    stats: { totalMatches: 0, winRate: 0, rank: 'Unranked' },
    history: [],
    isLoaded: false, 
  });

  const fetchAllData = useCallback(async () => {
    if (!user) return;

    try {
      console.log("🚀 Fetching App Data..."); 

      const [friendsRes, requestsRes] = await Promise.all([
        authenticatedFetch('/api/friends'),
        authenticatedFetch('/api/friends/requests/pending')
      ]);

      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();

      const mockStats = { totalMatches: 1240, winRate: 68, rank: "Diamond II" };
      const mockHistory = [
        { id: 1, result: "VICTORY", opponent: "CyberPunk_99", score: "11 - 4", date: "2 mins ago", isWin: true },
        { id: 2, result: "DEFEAT", opponent: "Neon_Samurai", score: "9 - 11", date: "1 hour ago", isWin: false },
        { id: 3, result: "VICTORY", opponent: "GlitchWalker", score: "11 - 2", date: "Yesterday", isWin: true },
      ];

      setState(prev => ({
        ...prev,
        friends: Array.isArray(friendsData) ? friendsData : [],
        pendingRequests: Array.isArray(requestsData) ? requestsData : [],
        stats: mockStats,
        history: mockHistory,
        isLoaded: true
      }));

    } catch (error) {
      console.error("❌ Global Data Fetch Error:", error);
    }
  }, [user]); // Logic depends on user existing

  useEffect(() => {
    if (user?.username || user?.id) {
      fetchAllData();
    } else {
      setState({ friends: [], pendingRequests: [], stats: {}, history: [], isLoaded: false });
    }
  }, [user?.username, user?.id]); 

  return (
    <AppDataContext.Provider value={{ ...state, refreshData: fetchAllData }}>
      {children}
    </AppDataContext.Provider>
  );
};