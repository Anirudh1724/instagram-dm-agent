/**
 * API Service Layer
 * Centralized API calls with authentication handling
 */

const API_BASE = '';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
    return localStorage.getItem('leadai_token');
};

// Get client ID from localStorage
const getClientId = (): string | null => {
    return localStorage.getItem('leadai_client_id');
};

// API request helper with auth
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || error.message || 'Request failed');
    }

    return response.json();
}

// ============================================
// AUTH API
// ============================================

export interface LoginResponse {
    success: boolean;
    client_id?: string;
    business_name?: string;
    token?: string;
    is_admin?: boolean;
}

export async function loginClient(email: string, password: string): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function loginAdmin(email: string, password: string): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function logout(): Promise<void> {
    const token = getAuthToken();
    if (token) {
        await apiRequest('/api/auth/logout', {
            method: 'POST',
        }).catch(() => { });
    }
    localStorage.removeItem('leadai_token');
    localStorage.removeItem('leadai_client_id');
    localStorage.removeItem('leadai_user');
}

export async function verifyToken(): Promise<{ valid: boolean; client_id?: string; business_name?: string }> {
    const token = getAuthToken();
    if (!token) return { valid: false };

    return apiRequest(`/api/auth/verify?token=${token}`);
}

// ============================================
// DASHBOARD API
// ============================================

export interface DashboardStats {
    leadsContacted: number;
    leadsContactedChange: number;
    uniqueLeads: number;
    uniqueLeadsChange: number;
    messagesSent: number;
    messagesSentChange: number;
    responseRate: number;
    responseRateChange: number;
    bookings: number;
    bookingsChange: number;
    chartData?: Array<{
        name: string;
        leads: number;
        messages: number;
        conversions: number;
    }>;
    funnelData?: Array<{
        name: string;
        value: number;
        fill: string;
    }>;
}

export async function getDashboard(period: string = 'daily'): Promise<DashboardStats> {
    const clientId = getClientId();
    const token = getAuthToken();
    const response = await apiRequest<any>(`/api/client/dashboard?period=${period}&token=${token}`);

    // Map backend response to frontend format
    return {
        leadsContacted: response.total_leads || 0,
        leadsContactedChange: response.leads_change || 0,
        uniqueLeads: response.unique_leads || 0,
        uniqueLeadsChange: response.unique_leads_change || 0,
        messagesSent: response.messages_sent || 0,
        messagesSentChange: response.messages_change || 0,
        responseRate: response.response_rate || 0,
        responseRateChange: response.response_rate_change || 0,
        bookings: response.bookings || 0,
        bookingsChange: response.bookings_change || 0,
        chartData: response.chart_data || [],
        funnelData: response.funnel_data || [],
    };
}

export interface Activity {
    id: string;
    customer_name: string;
    customer_username: string;
    last_message: string;
    last_message_time: string;
    status: string;
}

export async function getActivity(limit: number = 10): Promise<Activity[]> {
    const token = getAuthToken();
    const response = await apiRequest<{ conversations: Activity[] }>(`/api/client/activity?limit=${limit}&token=${token}`);
    return response.conversations || [];
}

// ============================================
// LEADS API
// ============================================

export interface Lead {
    id: string;
    name: string;
    username: string;
    avatar: string;
    status: 'new' | 'engaged' | 'qualified' | 'booked' | 'converted';
    lastMessage: string;
    lastMessageTime: string;
    responseTime?: number;
    conversationCount: number;
    isFollowup?: boolean;
    showsBookingIntent?: boolean;
    tags: string[];
}

export async function getLeads(
    options: { limit?: number; offset?: number; search?: string; status?: string } = {}
): Promise<{ leads: Lead[]; total: number }> {
    const clientId = getClientId();
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.search) params.append('search', options.search);
    if (options.status) params.append('status', options.status);

    const response = await apiRequest<any>(`/api/clients/${clientId}/leads?${params}&token=${token}`);

    // Map backend response to frontend format
    const leads: Lead[] = (response.leads || []).map((lead: any) => ({
        id: lead.customer_id || lead.id,
        name: lead.customer_name || lead.name || 'Unknown',
        username: lead.customer_username || lead.username || '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.customer_name || lead.name || 'user'}`,
        status: mapStatus(lead.stage || lead.status),
        lastMessage: lead.last_message || '',
        lastMessageTime: formatTime(lead.last_message_time),
        responseTime: lead.avg_response_time,
        conversationCount: lead.message_count || 0,
        isFollowup: lead.is_followup || false,
        showsBookingIntent: lead.shows_booking_intent || false,
        tags: lead.tags || [],
    }));

    return { leads, total: response.total || leads.length };
}

export async function getFollowupLeads(limit: number = 50): Promise<{ leads: Lead[]; total: number }> {
    const clientId = getClientId();
    const token = getAuthToken();
    const response = await apiRequest<any>(`/api/clients/${clientId}/leads/followup?limit=${limit}&token=${token}`);

    const leads: Lead[] = (response.leads || []).map((lead: any) => ({
        id: lead.customer_id || lead.id,
        name: lead.customer_name || lead.name || 'Unknown',
        username: lead.customer_username || lead.username || '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.customer_name || lead.name || 'user'}`,
        status: mapStatus(lead.stage || lead.status),
        lastMessage: lead.last_message || '',
        lastMessageTime: formatTime(lead.last_message_time),
        responseTime: lead.avg_response_time,
        conversationCount: lead.message_count || 0,
        isFollowup: true,
        showsBookingIntent: lead.shows_booking_intent || false,
        tags: lead.tags || ['Needs Follow Up'],
    }));

    return { leads, total: response.total || leads.length };
}

export async function getBookingLeads(limit: number = 50): Promise<{ leads: Lead[]; total: number }> {
    const clientId = getClientId();
    const token = getAuthToken();
    const response = await apiRequest<any>(`/api/clients/${clientId}/leads/booking?limit=${limit}&token=${token}`);

    const leads: Lead[] = (response.leads || []).map((lead: any) => ({
        id: lead.customer_id || lead.id,
        name: lead.customer_name || lead.name || 'Unknown',
        username: lead.customer_username || lead.username || '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${lead.customer_name || lead.name || 'user'}`,
        status: mapStatus(lead.stage || lead.status),
        lastMessage: lead.last_message || '',
        lastMessageTime: formatTime(lead.last_message_time),
        responseTime: lead.avg_response_time,
        conversationCount: lead.message_count || 0,
        isFollowup: false,
        showsBookingIntent: true,
        tags: lead.tags || ['Booking Intent'],
    }));

    return { leads, total: response.total || leads.length };
}

export interface Message {
    id: string;
    content: string;
    sender: 'ai' | 'lead';
    timestamp: string;
}

export async function getConversation(customerId: string): Promise<Message[]> {
    const clientId = getClientId();
    const token = getAuthToken();
    const response = await apiRequest<any>(`/api/clients/${clientId}/leads/${customerId}/conversation?token=${token}`);

    return (response.messages || []).map((msg: any, index: number) => ({
        id: msg.id || `msg-${index}`,
        content: msg.text || msg.content || '',
        sender: msg.role === 'assistant' || msg.is_from_business ? 'ai' : 'lead',
        timestamp: formatTime(msg.timestamp),
    }));
}

// ============================================
// ADMIN API
// ============================================

export interface Client {
    id: string;
    businessName: string;
    email: string;
    instagramHandle: string;
    isConnected: boolean;
    leadsCount: number;
    conversionRate: number;
    createdAt: string;
    aiPrompts?: {
        greeting: string;
        qualification: string;
        booking: string;
    };
}

export async function getClients(): Promise<Client[]> {
    const response = await apiRequest<{ clients: any[] }>('/admin/clients', {
        headers: {
            'X-Admin-Key': localStorage.getItem('leadai_admin_key') || '',
        },
    });

    return (response.clients || []).map((client: any) => ({
        id: client.client_id || client.id,
        businessName: client.business_name || '',
        email: client.login_email || client.email || '',
        instagramHandle: client.instagram_handle || `@${client.business_name?.toLowerCase().replace(/\s+/g, '_') || ''}`,
        isConnected: !!client.meta_access_token || !!client.instagram_account_id,
        leadsCount: client.leads_count || 0,
        conversionRate: client.conversion_rate || 0,
        createdAt: client.created_at || new Date().toISOString().split('T')[0],
        aiPrompts: {
            greeting: client.first_message || '',
            qualification: client.qualification_prompt || '',
            booking: client.dm_prompt || '',
        },
    }));
}

export async function getClient(clientId: string): Promise<Client | null> {
    try {
        const response = await apiRequest<any>(`/admin/clients/${clientId}`, {
            headers: {
                'X-Admin-Key': localStorage.getItem('leadai_admin_key') || '',
            },
        });

        return {
            id: response.client_id || clientId,
            businessName: response.business_name || '',
            email: response.login_email || '',
            instagramHandle: response.instagram_handle || '',
            isConnected: !!response.meta_access_token,
            leadsCount: response.leads_count || 0,
            conversionRate: response.conversion_rate || 0,
            createdAt: response.created_at || '',
            aiPrompts: {
                greeting: response.first_message || '',
                qualification: response.qualification_prompt || '',
                booking: response.dm_prompt || '',
            },
        };
    } catch {
        return null;
    }
}

export async function createClient(data: Partial<Client> & { password?: string }): Promise<{ success: boolean; client_id?: string }> {
    const payload = {
        client_id: data.id || data.businessName?.toLowerCase().replace(/\s+/g, '_'),
        business_name: data.businessName,
        login_email: data.email,
        login_password: data.password,
        first_message: data.aiPrompts?.greeting || '',
        qualification_prompt: data.aiPrompts?.qualification || '',
        dm_prompt: data.aiPrompts?.booking || '',
    };

    return apiRequest('/admin/clients', {
        method: 'POST',
        headers: {
            'X-Admin-Key': localStorage.getItem('leadai_admin_key') || '',
        },
        body: JSON.stringify(payload),
    });
}

export async function updateClient(clientId: string, data: Partial<Client>): Promise<{ success: boolean }> {
    const payload = {
        client_id: clientId,
        business_name: data.businessName,
        login_email: data.email,
        first_message: data.aiPrompts?.greeting || '',
        qualification_prompt: data.aiPrompts?.qualification || '',
        dm_prompt: data.aiPrompts?.booking || '',
    };

    return apiRequest(`/admin/clients/${clientId}`, {
        method: 'PUT',
        headers: {
            'X-Admin-Key': localStorage.getItem('leadai_admin_key') || '',
        },
        body: JSON.stringify(payload),
    });
}

export async function deleteClient(clientId: string): Promise<{ success: boolean }> {
    return apiRequest(`/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
            'X-Admin-Key': localStorage.getItem('leadai_admin_key') || '',
        },
    });
}

// ============================================
// INSTAGRAM OAUTH
// ============================================

export function getInstagramConnectUrl(): string {
    const clientId = getClientId();
    return `/api/auth/instagram/connect?client_id=${clientId}`;
}

// ============================================
// HELPERS
// ============================================

function mapStatus(stage: string): Lead['status'] {
    const statusMap: Record<string, Lead['status']> = {
        greeting: 'new',
        discovery: 'engaged',
        qualifying: 'engaged',
        qualified: 'qualified',
        unqualified: 'engaged',
        booking: 'booked',
        booked: 'booked',
        converted: 'converted',
    };
    return statusMap[stage?.toLowerCase()] || 'new';
}

function formatTime(timestamp: string | undefined): string {
    if (!timestamp) return '';

    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    } catch {
        return timestamp;
    }
}
