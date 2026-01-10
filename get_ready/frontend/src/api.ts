import axios from 'axios';
import config from './config';

const API_URL = `${config.API_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (username: string, password: string) => 
    api.post('/auth/login', { username, password }),
  register: (data: { email: string; username: string; password: string; displayName?: string }) => 
    api.post('/auth/register', data),
  testLogin: () => api.post('/auth/test-login'),
  getMe: () => api.get('/auth/me'),
};

// Users
export const usersApi = {
  getAll: (take = 20, skip = 0) => api.get(`/users?take=${take}&skip=${skip}`),
  getMe: () => api.get('/users/me'),
  updateMe: (data: { username?: string; displayName?: string }) => api.put('/users/me', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeAvatar: () => api.delete('/users/me/avatar'),
  getAvatarUrl: (filename: string) => `/api/users/avatar/${filename}`,
  getById: (id: string) => api.get(`/users/${id}`),
  getByUsername: (username: string) => api.get(`/users/username/${username}`),
};

// Friends
export const friendsApi = {
  getAll: () => api.get('/friends'),
  getPending: () => api.get('/friends/requests/pending'),
  getSent: () => api.get('/friends/requests/sent'),
  sendRequest: (userId: string) => api.post(`/friends/request/${userId}`),
  acceptRequest: (requestId: string) => api.post(`/friends/request/${requestId}/accept`),
  declineRequest: (requestId: string) => api.post(`/friends/request/${requestId}/decline`),
  cancelRequest: (requestId: string) => api.delete(`/friends/request/${requestId}`),
  remove: (friendId: string) => api.delete(`/friends/${friendId}`),
};

// Leaderboard
export const leaderboardApi = {
  get: (take = 50, skip = 0) => api.get(`/leaderboard?take=${take}&skip=${skip}`),
  getMyStats: () => api.get('/leaderboard/me'),
  getUserStats: (userId: string) => api.get(`/leaderboard/user/${userId}`),
  getMyHistory: () => api.get('/leaderboard/me/history'),
  getUserHistory: (userId: string) => api.get(`/leaderboard/user/${userId}/history`),
  getTopWinners: () => api.get('/leaderboard/top-winners'),
};

export default api;
