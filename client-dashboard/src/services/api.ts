import axios from 'axios';

// API Base URL (proxy configured in Vite)
const API_URL = '/api';
const ADMIN_API_URL = '/admin';

// Create generic axios instance
const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Auth Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        const adminKey = localStorage.getItem('admin_key');

        // Ensure headers object exists
        config.headers = config.headers || {};

        // If request is for Admin API, add Admin Key
        if (config.url?.startsWith('/admin') && adminKey) {
            config.headers.set('x-admin-key', adminKey);
        }
        // For client API requests, add Bearer token
        else if (token && config.url?.startsWith('/api')) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 (Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Optional: Auto logout if 401 (but careful with login page)
            if (!window.location.pathname.includes('/login')) {
                // Clear storage and redirect?
                // localStorage.removeItem('auth_token');
                // localStorage.removeItem('client_id');
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --- Auth Service ---
export const AuthService = {
    async login(email: string, password: string): Promise<any> {
        const response = await api.post(`${API_URL}/auth/login`, { email, password });
        return response.data;
    },

    async logout(): Promise<void> {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                await api.post(`${API_URL}/auth/logout`, null, {
                    params: { token }
                });
            } catch (e) {
                // Ignore logout errors
            }
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('client_id');
        localStorage.removeItem('business_name');
        localStorage.removeItem('admin_key');
    },

    verifyAdminKey(key: string): boolean {
        // Simple check (mock) or we could call an endpoint
        // For development, we'll verify against hardcoded default or try to list clients
        return key === 'admin';
    },

    async verifySession(token: string): Promise<boolean> {
        try {
            const response = await api.get(`${API_URL}/auth/verify`, {
                params: { token }
            });
            return response.data.valid;
        } catch {
            return false;
        }
    }
};

// --- Dashboard Service (Client) ---
export const DashboardService = {
    async getAnalytics(clientId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily') {
        // Use new singular endpoint that derives client_id from session
        const response = await api.get(`${API_URL}/client/dashboard`, {
            params: { period }
        });
        return response.data;
    },

    async getActivity(clientId: string, limit: number = 10) {
        // Use new singular endpoint that derives client_id from session
        const response = await api.get(`${API_URL}/client/activity`, {
            params: { limit }
        });
        return response.data;
    },

    async getLeads(clientId: string, page: number = 1, limit: number = 50, status?: string, search?: string) {
        const offset = (page - 1) * limit;
        const response = await api.get(`${API_URL}/clients/${clientId}/leads`, {
            params: { limit, offset, status, search }
        });
        return response.data;
    },

    async getFollowupLeads(clientId: string, limit: number = 50) {
        const response = await api.get(`${API_URL}/clients/${clientId}/leads/followup`, {
            params: { limit }
        });
        return response.data;
    },

    async getBookingLeads(clientId: string, limit: number = 50) {
        const response = await api.get(`${API_URL}/clients/${clientId}/leads/booking`, {
            params: { limit }
        });
        return response.data;
    },

    async getLeadConversation(clientId: string, customerId: string) {
        const response = await api.get(`${API_URL}/clients/${clientId}/leads/${customerId}/conversation`);
        return response.data;
    }
};

// --- Admin Service ---
export const AdminService = {
    async getClients() {
        const response = await api.get(`${ADMIN_API_URL}/clients`);
        return response.data;
    },

    async getClient(clientId: string) {
        const response = await api.get(`${ADMIN_API_URL}/clients/${clientId}`);
        return response.data;
    },

    async updateClient(clientId: string, data: any) {
        const response = await api.put(`${ADMIN_API_URL}/clients/${clientId}`, data);
        return response.data;
    },

    async createClient(data: any) {
        const response = await api.post(`${ADMIN_API_URL}/clients`, data);
        return response.data;
    }
};

export default api;
