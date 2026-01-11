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


export const authenticatedFileUpload = async (endpoint, formData, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = { ...options.headers };

  if (token)
      headers['Authorization'] = `Bearer ${token}`;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    method: options.method || 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  return response;
};