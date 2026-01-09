import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticatedFetch } from '@/utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] =  useState(null);
    const [loading, setLoading] = useState(true);

    useEffect( () => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const res = await authenticatedFetch('/api/auth/me');
                    if (res.ok) {
                        const userData = await res.json();
                        setUser(mapUserData(userData));
                    }
                    else 
                        localStorage.removeItem('accessToken');

                }
                catch (err) {
                    console.log("Auth initialization failed:", err);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (formData) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error('Invalid Credentials');
        
        const data = await res.json();

        localStorage.setItem('accessToken', data.access_token);
        
        const profileRes = await authenticatedFetch('/api/auth/me');
        const profileData = await profileRes.json();
        console.log(profileData);

        setUser(mapUserData(profileData));
        return true;
    };


    const logout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
    };

   
    const mapUserData = (data) => ( {
        username: data.username || "Commander",
        level: "Level " + data.elo || "1",
        title: data.title || "Rookie",
        avatar: data.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"
    });

    return (
        <AuthContext.Provider value={ {user, loading, login, logout} }>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);