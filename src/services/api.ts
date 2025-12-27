import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh');
        if (!refresh) throw new Error("No refresh token");
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh });
        const { access } = response.data;
        localStorage.setItem('access', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: any) => api.post('/auth/register/', data),
  login: (username: string, password: string) => api.post('/auth/login/', { username, password }),
  getCurrentUser: () => api.get('/auth/me/'),
};

export const bankAPI = {
  getMyAccount: () => api.get('/bank-accounts/'),
  createAccount: (data: any) => api.post('/bank-accounts/', data),
  updateAccount: (id: number, data: any) => api.patch(`/bank-accounts/${id}/`, data),
  deleteAccount: (id: number) => api.delete(`/bank-accounts/${id}/`),
  updateBalance: (id: number, amount: number, operation: 'ADD' | 'SET') =>
    api.post(`/bank-accounts/${id}/update_balance/`, { amount, operation }),
};

export const mutualFundAPI = {
  getAllSchemes: () => api.get('/mutual-funds/'),
  getScheme: (id: number) => api.get(`/mutual-funds/${id}/`),
  createScheme: (data: any) => api.post('/mutual-funds/', data),
  updateScheme: (id: number, data: any) => api.patch(`/mutual-funds/${id}/`, data),
  deleteScheme: (id: number) => api.delete(`/mutual-funds/${id}/`),
  updateNAV: (id: number, nav: number) => api.post(`/mutual-funds/${id}/update_nav/`, { nav }),
  purchaseFund: (scheme_id: number, amount: number) =>
    api.post('/mutual-funds/purchase/', { scheme_id, amount }),
};

export const portfolioAPI = {
  getMyPortfolio: () => api.get('/portfolio/'),
  getPortfolioSummary: () => api.get('/portfolio/summary/'),
};

export const transactionAPI = {
  getMyTransactions: () => api.get('/transactions/'),
};

export const userAPI = {
  getAllUsers: () => api.get('/users/'),
  getUserPortfolio: (userId: number) => api.get(`/users/${userId}/portfolio/`),
};

export default api;