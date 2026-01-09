const API_BASE = '';

export const authenticatedFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  console.log(token);
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
    localStorage.removeItem('authToken');
    window.location.href = '/login'; // Force redirect
  }

  return response;
};