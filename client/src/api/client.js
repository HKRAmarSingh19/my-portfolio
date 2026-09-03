import axios from 'axios';

// In dev (Vite proxy) the API lives on the same origin at /api. When the
// frontend is deployed separately (e.g. Vercel) and the API on Render, set
// VITE_API_URL to the full API origin (e.g. https://portfolio-api.onrender.com).
// The trailing /api is added here so all the route strings stay origin-relative.
//
// Normalise the base so it always ends in a single "/" — otherwise a
// VITE_API_URL without a trailing slash (e.g. "...onrender.com") would bake in
// "...onrender.comapi", which is not a resolvable host (ERR_NAME_NOT_RESOLVED).
const rawBase = (import.meta.env.VITE_API_URL || '/').trim();
const API_BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

const api = axios.create({
  baseURL: `${API_BASE}api`,
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
  googleLogin: (code, redirectUri) => api.post('/auth/google', { code, redirectUri }),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/update-details', data),
  logout: () => api.post('/auth/logout'),
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

export const instagramApi = {
  getAll: (params) => api.get('/instagram', { params }),
  getMeta: () => api.get('/instagram/meta'),
  sync: () => api.post('/instagram/sync'),
  delete: (id) => api.delete(`/instagram/${id}`),
};

export const linkedInApi = {
  getAll: (params) => api.get('/linkedin', { params }),
  getMeta: () => api.get('/linkedin/meta'),
  create: (data) => api.post('/linkedin', data),
  delete: (id) => api.delete(`/linkedin/${id}`),
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
  uploadVideo: (formData, onUploadProgress) =>
    api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    }),
  // Polled while a video uploads so the admin sees live server→S3 progress.
  getVideoProgress: (uploadId) => api.get(`/upload/video/progress/${uploadId}`),
};

export default api;

