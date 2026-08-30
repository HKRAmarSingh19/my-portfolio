import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('portfolio_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      localStorage.removeItem('portfolio_token');
      localStorage.removeItem('portfolio_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/update-details', data),
};

export const projectsApi = {
  getAll: (params) => api.get('/projects', { params }),
  getBySlug: (slugOrId) => api.get(`/projects/${slugOrId}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const blogApi = {
  getAll: (params) => api.get('/blog', { params }),
  getBySlug: (slugOrId) => api.get(`/blog/${slugOrId}`),
  create: (data) => api.post('/blog', data),
  update: (id, data) => api.put(`/blog/${id}`, data),
  delete: (id) => api.delete(`/blog/${id}`),
};

export const skillsApi = {
  getAll: (params) => api.get('/skills', { params }),
  create: (data) => api.post('/skills', data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
};

export const experienceApi = {
  getAll: (params) => api.get('/experience', { params }),
  create: (data) => api.post('/experience', data),
  update: (id, data) => api.put(`/experience/${id}`, data),
  delete: (id) => api.delete(`/experience/${id}`),
};

export const galleryApi = {
  getAll: (params) => api.get('/gallery', { params }),
  getById: (id) => api.get(`/gallery/${id}`),
  create: (data) => api.post('/gallery', data),
  update: (id, data) => api.put(`/gallery/${id}`, data),
  delete: (id) => api.delete(`/gallery/${id}`),
};

export const messagesApi = {
  send: (data) => api.post('/contact/submit', data),
  getAll: (params) => api.get('/messages', { params }),
  toggleRead: (id, read) => api.patch(`/messages/${id}/read`, { read }),
  toggleStar: (id) => api.patch(`/messages/${id}/star`),
  delete: (id) => api.delete(`/messages/${id}`),
};

export const statsApi = {
  getStats: () => api.get('/stats'),
};

export const profileApi = {
  // Public read for the homepage hero.
  get: () => api.get('/profile'),
  // Writes reuse the authenticated auth endpoint.
  update: (data) => api.put('/auth/update-details', data),
};

export const uploadApi = {
  uploadImage: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadImages: (formData) =>
    api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadVideo: (formData) =>
    api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;

