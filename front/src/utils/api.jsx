export const API_BASE = 'https://localhost:3001';

export const authenticatedFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token)
    headers['Authorization'] = `Bearer ${token}`;


  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  return response;
};