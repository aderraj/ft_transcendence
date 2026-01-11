import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticatedFetch, API_BASE } from '@/utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] =  useState(null);
    const [loading, setLoading] = useState(true);

    const processUserData = (data) => {
        return {
            ...data,
            displayName: data.displayName || data.username || "Commander",
            avatar: data.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback",

            levelLabel: `Level ${data.level || 1}`, 
            rankTitle: data.title || "Rookie" 
        };
    };

    const fetchProfile = async () => {
        try {
            const res = await authenticatedFetch('/api/leaderboard/me');
            
            if (res.ok) {
                const text = await res.text();
                if (!text) return false;
                
                try {
                    const userData = JSON.parse(text);
                    setUser(processUserData(userData));
                    return true;
                } catch (e) {
                    console.error("Auth: Failed to parse user data", e);
                    return false;
                }
            } 
            return false;
        } catch (err) {
            console.error("Auth: Profile fetch error", err);
            return false;
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            
            if (token) {
                const success = await fetchProfile();
                if (!success) {
                    localStorage.removeItem('accessToken');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (formData) => {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Invalid Credentials');
        }
        
        const data = await res.json();

        if (data.requires2FA) {
            return { requires2FA: true, userId: data.userId };
        }

        if (data.access_token) {
            localStorage.setItem('accessToken', data.access_token);
            await fetchProfile();
            return { success: true };
        }

        throw new Error("Unexpected server response");
    };

    const verifyTwoFactor = async (userId, code) => {
        const res = await fetch(`${API_BASE}/api/auth/2fa/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, code: code })
        });
        if (!res.ok) throw new Error('Invalid Code');

        const data = await res.json();

        if (data.access_token) {
            localStorage.setItem('accessToken', data.access_token);
            await fetchProfile();
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, verifyTwoFactor, logout, refreshProfile: fetchProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);