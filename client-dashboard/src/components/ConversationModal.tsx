import { X, MessageSquare, Clock, Hand, AlertTriangle } from 'lucide-react';

interface Message {
    id: string;
    role: 'customer' | 'agent';
    content: string;
    timestamp: string;
    is_followup?: boolean;
}

interface Lead {
    id: string;
    username: string;
    name?: string;
    status: string;
    message_count?: number;
    followup_count?: number;
    agent_blocked?: boolean;
    profile_pic?: string;
}

interface ConversationModalProps {
    lead: Lead;
    messages: Message[];
    onClose: () => void;
    onBlockChange: (leadId: string, blocked: boolean) => void;
}

const STATUS_MAP: Record<string, string> = {
    'new': 'New',
    'engaged': 'Engaged',
    'qualified': 'Qualified',
    'meeting_booked': 'Meeting Booked',
    'converted': 'Converted',
    'lost': 'Lost',
};

const STATUS_CLASS: Record<string, string> = {
    'new': 'new',
    'engaged': 'engaged',
    'qualified': 'qualified',
    'meeting_booked': 'meeting-booked',
    'converted': 'converted',
    'lost': 'lost',
};

export function ConversationModal({ lead, messages, onClose, onBlockChange }: ConversationModalProps) {
    const getInitials = (name: string, username: string): string => {
        if (name) {
            const parts = name.split(' ');
            return parts.length > 1
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : name.substring(0, 2).toUpperCase();
        }
        return username ? username.substring(0, 2).toUpperCase() : '?';
    };

    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const handleBlockToggle = () => {
        onBlockChange(lead.id, !lead.agent_blocked);
    };

    return (
        <div className="conversation-modal-overlay" onClick={onClose}>
            <div className="conversation-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="conversation-header">
                    <div className="conversation-lead-info">
                        <div className="lead-avatar">
                            {lead.profile_pic ? (
                                <img src={lead.profile_pic} alt={lead.name || lead.username} />
                            ) : (
                                getInitials(lead.name || '', lead.username)
                            )}
                        </div>
                        <div>
                            <div className="lead-name">{lead.name || 'Unknown'}</div>
                            <div className="lead-username">@{lead.username}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            className={`handle-btn ${lead.agent_blocked ? 'blocked' : ''}`}
                            onClick={handleBlockToggle}
                        >
                            <Hand size={14} />
                            {lead.agent_blocked ? 'Resume Agent' : 'Handle Personally'}
                        </button>
                        <button className="close-btn" onClick={onClose}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="conversation-stats">
                    <MessageSquare size={14} />
                    <span>{lead.message_count || messages.length} messages</span>
                    <span className={`status-badge ${STATUS_CLASS[lead.status] || 'new'}`}>
                        {STATUS_MAP[lead.status] || 'New'}
                    </span>
                    {(lead.followup_count || 0) > 0 && (
                        <>
                            <Clock size={14} />
                            <span>{lead.followup_count} followups</span>
                        </>
                    )}
                </div>

                {/* Blocked Banner */}
                {lead.agent_blocked && (
                    <div className="blocked-banner">
                        <AlertTriangle size={14} />
                        <span>Agent paused — you're handling this conversation manually</span>
                    </div>
                )}

                {/* Messages */}
                <div className="conversation-messages">
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            <p>No messages in this conversation</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id} className={`message ${message.role}`}>
                                {message.is_followup && (
                                    <div className="followup-indicator">
                                        <Clock size={12} />
                                        <span>Automated followup</span>
                                    </div>
                                )}
                                <div className="message-bubble">
                                    {message.content}
                                </div>
                                <div className="message-timestamp">
                                    {formatTimestamp(message.timestamp)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
