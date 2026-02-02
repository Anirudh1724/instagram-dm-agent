export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  agentType?: 'text' | 'voice';
  voiceDirection?: 'inbound' | 'outbound';
  password?: string;
}

export type LeadStatus = 'new' | 'engaged' | 'qualified' | 'booked' | 'converted';

export interface Lead {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: LeadStatus;
  lastMessage: string;
  lastMessageTime: string;
  responseTime?: number;
  conversationCount: number;
  isFollowup?: boolean;
  showsBookingIntent?: boolean;
  tags: string[];
}

export interface Client {
  id: string;
  businessName: string;
  email: string;
  instagramHandle: string;
  agentType: 'text' | 'voice';
  voiceDirection?: 'inbound' | 'outbound';
  mobileNumber?: string;
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
}

export interface Message {
  id: string;
  content: string;
  sender: 'ai' | 'lead';
  timestamp: string;
}

export interface Conversation {
  leadId: string;
  messages: Message[];
}
