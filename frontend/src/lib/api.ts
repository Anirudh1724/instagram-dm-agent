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
        let msg = error.detail || error.message || 'Request failed';

        if (Array.isArray(msg)) {
            // Handle Pydantic validation errors
            msg = msg.map((e: any) => e.msg).join(', ');
        } else if (typeof msg === 'object') {
            msg = JSON.stringify(msg);
        }

        throw new Error(msg);
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
    agent_type?: 'text' | 'voice';
    voice_direction?: 'inbound' | 'outbound';
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

export async function verifyToken(): Promise<{ valid: boolean; client_id?: string; business_name?: string; agent_type?: 'text' | 'voice' }> {
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

export async function getDashboard(period: string = 'daily', type: 'text' | 'voice' = 'text'): Promise<DashboardStats> {
    const clientId = getClientId();
    const token = getAuthToken();

    if (type === 'voice') {
        // Mock data for Voice Agent Dashboard
        return {
            leadsContacted: Math.floor(Math.random() * 50) + 20, // Calls Received
            leadsContactedChange: Math.floor(Math.random() * 20) - 5,
            uniqueLeads: Math.floor(Math.random() * 40) + 10, // Unique Callers
            uniqueLeadsChange: Math.floor(Math.random() * 10) + 2,
            messagesSent: Math.floor(Math.random() * 30) + 5, // Calls Answered
            messagesSentChange: Math.floor(Math.random() * 5) + 1,
            responseRate: Math.floor(Math.random() * 30) + 40, // Answer Rate
            responseRateChange: Math.floor(Math.random() * 5) - 2,
            bookings: Math.floor(Math.random() * 5), // Meetings Booked
            bookingsChange: Math.floor(Math.random() * 2),
            chartData: [
                { name: 'Mon', leads: 40, messages: 24, conversions: 2 },
                { name: 'Tue', leads: 30, messages: 13, conversions: 1 },
                { name: 'Wed', leads: 20, messages: 18, conversions: 3 },
                { name: 'Thu', leads: 27, messages: 19, conversions: 2 },
                { name: 'Fri', leads: 18, messages: 10, conversions: 1 },
                { name: 'Sat', leads: 23, messages: 15, conversions: 4 },
                { name: 'Sun', leads: 34, messages: 20, conversions: 3 },
            ],
            funnelData: [
                { name: 'Total Calls', value: 100, fill: '#8884d8' },
                { name: 'Answered', value: 75, fill: '#83a6ed' },
                { name: 'Qualified', value: 50, fill: '#8dd1e1' },
                { name: 'Booked', value: 25, fill: '#82ca9d' },
            ],
        };
    }

    // Mock data for Text Agent Dashboard
    return {
        leadsContacted: Math.floor(Math.random() * 100) + 50, // Leads Reached
        leadsContactedChange: Math.floor(Math.random() * 20) + 5,
        uniqueLeads: Math.floor(Math.random() * 80) + 20, // Engaged Leads
        uniqueLeadsChange: Math.floor(Math.random() * 15) + 3,
        messagesSent: Math.floor(Math.random() * 500) + 100, // Messages Sent
        messagesSentChange: Math.floor(Math.random() * 50) + 10,
        responseRate: Math.floor(Math.random() * 20) + 25, // Response Rate
        responseRateChange: Math.floor(Math.random() * 5) - 1,
        bookings: Math.floor(Math.random() * 10) + 2, // Bookings
        bookingsChange: Math.floor(Math.random() * 3) + 1,
        chartData: [
            { name: 'Mon', leads: 45, messages: 120, conversions: 3 },
            { name: 'Tue', leads: 52, messages: 135, conversions: 4 },
            { name: 'Wed', leads: 48, messages: 110, conversions: 2 },
            { name: 'Thu', leads: 61, messages: 150, conversions: 5 },
            { name: 'Fri', leads: 55, messages: 140, conversions: 4 },
            { name: 'Sat', leads: 38, messages: 90, conversions: 2 },
            { name: 'Sun', leads: 42, messages: 95, conversions: 3 },
        ],
        funnelData: [
            { name: 'Total Leads', value: 100, fill: '#10b981' }, // Emerald for Text
            { name: 'Contacted', value: 80, fill: '#34d399' },
            { name: 'Responded', value: 45, fill: '#6ee7b7' },
            { name: 'Qualified', value: 20, fill: '#a7f3d0' },
        ],
    };

    /*
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
    */
}

export interface Activity {
    id: string;
    customer_name: string;
    customer_username: string;
    last_message: string;
    last_message_time: string;
    status: string;
}

export async function getActivity(limit: number = 10, type: 'text' | 'voice' = 'text'): Promise<Activity[]> {
    const token = getAuthToken();

    if (type === 'voice') {
        const statuses = ['missed', 'answered', 'voicemail', 'booked'];
        return Array.from({ length: limit }).map((_, i) => {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            return {
                id: `voice-${i}`,
                customer_name: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
                customer_username: 'Voice Caller',
                last_message: status === 'missed' ? 'Missed Call' : `Duration: ${Math.floor(Math.random() * 10)}m ${Math.floor(Math.random() * 60)}s`,
                last_message_time: `${Math.floor(Math.random() * 59) + 1}m ago`,
                status: status,
            };
        });
    }

    // Mock data for Text Agent Activity
    const statuses = ['new', 'engaged', 'qualified', 'booked'];
    return Array.from({ length: limit }).map((_, i) => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        return {
            id: `text-${i}`,
            customer_name: `User ${Math.floor(Math.random() * 1000)}`,
            customer_username: `@user_${Math.floor(Math.random() * 1000)}`,
            last_message: status === 'booked' ? 'Meeting confirmed for tomorrow' : 'Interested in learning more about pricing',
            last_message_time: `${Math.floor(Math.random() * 10) + 1}m ago`,
            status: status,
        };
    });

    /*
    const response = await apiRequest<{ conversations: Activity[] }>(`/api/client/activity?limit=${limit}&token=${token}`);
    return response.conversations || [];
    */
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
    // Mock data based on options
    const mockLeads: Lead[] = Array.from({ length: 50 }).map((_, i) => {
        const statuses: Lead['status'][] = ['new', 'engaged', 'qualified', 'booked', 'converted'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        return {
            id: `lead-${i}`,
            name: `Mock Lead ${i + 1}`,
            username: `mock_user_${i + 1}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=mock_${i}`,
            status: status,
            lastMessage: i % 2 === 0 ? 'Thanks for the info!' : 'Can we schedule a call?',
            lastMessageTime: i < 5 ? 'Just now' : `${Math.floor(Math.random() * 24)} hours ago`,
            responseTime: Math.floor(Math.random() * 120),
            conversationCount: Math.floor(Math.random() * 20),
            isFollowup: Math.random() > 0.8,
            showsBookingIntent: Math.random() > 0.9,
            tags: Math.random() > 0.7 ? ['VIP', 'Hot Lead'] : [],
        };
    });

    let filtered = mockLeads;
    if (options.status && options.status !== 'all') {
        filtered = filtered.filter(l => l.status === options.status);
    }
    if (options.search) {
        const lowerSearch = options.search.toLowerCase();
        filtered = filtered.filter(l => l.name.toLowerCase().includes(lowerSearch) || l.username.toLowerCase().includes(lowerSearch));
    }

    return { leads: filtered, total: filtered.length };
}

export async function getFollowupLeads(limit: number = 50): Promise<{ leads: Lead[]; total: number }> {
    // Mock data for Follow-up Leads
    const leads: Lead[] = Array.from({ length: 12 }).map((_, i) => ({
        id: `followup-${i}`,
        name: `Lead ${i + 1}`,
        username: `lead_${i + 1}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=followup_${i}`,
        status: i % 3 === 0 ? 'engaged' : 'qualified',
        lastMessage: i % 2 === 0 ? 'Sent proposal, waiting for response.' : 'Asked for more details about pricing.',
        lastMessageTime: `${i + 2}h ago`,
        responseTime: Math.floor(Math.random() * 60) + 10,
        conversationCount: Math.floor(Math.random() * 10) + 2,
        isFollowup: true,
        showsBookingIntent: false,
        tags: ['Needs Follow Up', i % 2 === 0 ? 'High Priority' : 'Warm Lead'],
    }));

    return { leads, total: leads.length };
}

export async function getBookingLeads(limit: number = 50): Promise<{ leads: Lead[]; total: number }> {
    // Mock data for Booking Leads
    const leads: Lead[] = Array.from({ length: 8 }).map((_, i) => ({
        id: `booking-${i}`,
        name: `Booking Prospect ${i + 1}`,
        username: `prospect_${i + 1}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=booking_${i}`,
        status: 'booked',
        lastMessage: 'Confirmed meeting time for tomorrow at 2 PM.',
        lastMessageTime: `${i * 15 + 5}m ago`,
        responseTime: Math.floor(Math.random() * 30) + 5,
        conversationCount: Math.floor(Math.random() * 15) + 5,
        isFollowup: false,
        showsBookingIntent: true,
        tags: ['Booking Intent', 'Scheduled'],
    }));

    return { leads, total: leads.length };
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
    agentType: 'text' | 'voice';
    voiceDirection?: 'inbound' | 'outbound';
    mobileNumber?: string;
    status: 'active' | 'inactive';
    password?: string;
    aiPrompts?: {
        greeting: string;
        qualification: string;
        booking: string;
        followup?: string;
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
        agentType: client.agent_type || 'text',
        voiceDirection: client.voice_direction || 'inbound',
        mobileNumber: client.mobile_number || '',
        status: client.status || 'active',
        password: client.login_password || '',
        aiPrompts: {
            greeting: client.first_message || '',
            qualification: client.qualification_prompt || '',
            booking: client.dm_prompt || '',
            followup: client.followup_prompt || '',
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
            agentType: response.agent_type || 'text',
            voiceDirection: response.voice_direction || 'inbound',
            mobileNumber: response.mobile_number || '',
            status: response.status || 'active',
            password: response.login_password || '',
            aiPrompts: {
                greeting: response.first_message || '',
                qualification: response.qualification_prompt || '',
                booking: response.dm_prompt || '',
                followup: response.followup_prompt || '',
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
        agent_type: data.agentType || 'text',
        voice_direction: data.voiceDirection || 'inbound',
        mobile_number: data.mobileNumber || '',
        instagram_handle: data.instagramHandle || '',
        status: data.status || 'active',
        first_message: data.aiPrompts?.greeting || '',
        qualification_prompt: data.aiPrompts?.qualification || '',
        dm_prompt: data.aiPrompts?.booking || '',
        followup_prompt: data.aiPrompts?.followup || '',
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
        agent_type: data.agentType,
        voice_direction: data.voiceDirection,
        mobile_number: data.mobileNumber || '',
        instagram_handle: data.instagramHandle || '',
        status: data.status,
        first_message: data.aiPrompts?.greeting || '',
        qualification_prompt: data.aiPrompts?.qualification || '',
        dm_prompt: data.aiPrompts?.booking || '',
        followup_prompt: data.aiPrompts?.followup || '',
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
