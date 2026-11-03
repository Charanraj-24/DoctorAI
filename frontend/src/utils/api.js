import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const authAPI = {
    register: (data) => API.post('/auth/register', data),
    login: (data) => API.post('/auth/login', data),
    me: () => API.get('/auth/me'),
    updateProfile: (data) => API.put('/auth/profile', data),
};

export const chatAPI = {
    getSessions: () => API.get('/chat/sessions'),
    getSession: (id) => API.get(`/chat/sessions/${id}`),
    createSession: (title) => API.post('/chat/sessions', { title }),
    sendMessage: (id, message) => API.post(`/chat/sessions/${id}/message`, { message }),
    deleteSession: (id) => API.delete(`/chat/sessions/${id}`),
};

export const healthAPI = {
    getCheckins: (userId) => API.get('/health/checkins', { params: userId ? { userId } : {} }),
    createCheckin: (data) => API.post('/health/checkins', data),
    getStats: (userId) => API.get('/health/stats', { params: userId ? { userId } : {} }),
};

export const partnerAPI = {
    connect: (shareCode) => API.post('/partner/connect', { shareCode }),
    disconnect: () => API.post('/partner/disconnect'),
    getPartnerData: () => API.get('/partner/data'),
    sendEmergency: (location) => API.post('/partner/emergency', { location }),
    pollIncoming: () => API.get('/partner/emergency/incoming'),
    acknowledge: (id) => API.put(`/partner/emergency/${id}/acknowledge`),
    resolve: (id) => API.put(`/partner/emergency/${id}/resolve`),
    getStatus: () => API.get('/partner/emergency/status'),
    getHistory: () => API.get('/partner/emergency/history'),
};

export default API;