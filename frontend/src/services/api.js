import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Let axios set the appropriate Content-Type per request (JSON vs FormData)
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = async (username, email, password) => {
  const response = await api.post('/auth/register', { username, email, password });
  if (response.data.success) {
    localStorage.setItem('token', response.data.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.success) {
    localStorage.setItem('token', response.data.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Content APIs
export const uploadText = async (text, expiryMinutes, options = {}) => {
  const formData = new FormData();
  formData.append('text', text);
  if (expiryMinutes) formData.append('expiryMinutes', expiryMinutes);
  if (options.password) formData.append('password', options.password);
  if (options.isOneTimeView) formData.append('isOneTimeView', 'true');
  if (options.maxViews) formData.append('maxViews', options.maxViews);

  const response = await api.post('/upload', formData);
  return response.data;
};

export const uploadFile = async (file, expiryMinutes, options = {}, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  if (expiryMinutes) formData.append('expiryMinutes', expiryMinutes);
  if (options.password) formData.append('password', options.password);
  if (options.isOneTimeView) formData.append('isOneTimeView', 'true');
  if (options.maxViews) formData.append('maxViews', options.maxViews);

  const response = await api.post('/upload', formData, { onUploadProgress });
  return response.data;
};

export const getContent = async (contentId, password = null) => {
  const response = await api.post(`/content/${contentId}`, { password });
  return response.data;
};

export const deleteContent = async (contentId) => {
  const response = await api.delete(`/content/${contentId}`);
  return response.data;
};

export const getMyUploads = async () => {
  const response = await api.get('/my-uploads');
  return response.data;
};

export default api;
