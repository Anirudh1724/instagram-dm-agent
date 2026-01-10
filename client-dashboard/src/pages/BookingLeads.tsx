import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, MessageSquare, Calendar, CheckCircle } from 'lucide-react';
import { ConversationModal } from '../components/ConversationModal';
import { DashboardService } from '../services/api';

export function BookingLeads() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [messages, setMessages] = useState<any[]>([]);

    // Memoize clientId to prevent re-reading from localStorage on every render
    const clientId = useMemo(() => localStorage.getItem('client_id'), []);

    useEffect(() => {
        const fetchLeads = async () => {
            if (!clientId) return;
            setLoading(true);
            try {
                const data = await DashboardService.getBookingLeads(clientId, 50);
                setLeads(data.leads);
            } catch (err) {
                console.error("Failed to fetch booking leads", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, [clientId]);

    // Fetch Conversation
    useEffect(() => {
        const fetchConv = async () => {
            if (!clientId || !selectedLead) return;

            try {
                const data = await DashboardService.getLeadConversation(clientId, selectedLead.customer_id);
                setMessages(data.messages);
            } catch (err) {
                console.error("Failed to fetch conversation", err);
                setMessages([]);
            } finally {

            }
        };

        if (selectedLead) {
            fetchConv();
        } else {
            setMessages([]);
        }
    }, [clientId, selectedLead]);


    const getInitials = (name: string, username: string) => {
        if (name) {
            const parts = name.split(' ');
            return parts.length > 1
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : name.substring(0, 2).toUpperCase();
        }
        return username ? username.substring(0, 2).toUpperCase() : '?';
    };

    const formatTimeAgo = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        return `${diffDays} days ago`;
    };

    const filteredLeads = leads.filter(lead => {
        const matchSearch =
            (lead.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lead.username || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch;
    });

    return (
        <>
            <div className="page-header">
                <div className="page-title">
                    <h2>Booking Intent</h2>
                    <p>Leads showing interest in booking or have booked</p>
                </div>
            </div>

            <div className="leads-header">
                <div className="search-input">
                    <Search size={16} color="#6e7681" />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="leads-table">
                <div className="table-header">
                    <span>Lead</span>
                    <span>Status</span>
                    <span>Intent Detected</span>
                    <span>Last Response</span>
                    <span>Count</span>
                    <span></span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading booking leads...</div>
                ) : filteredLeads.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare />
                        <p>No high-intent leads found</p>
                    </div>
                ) : (
                    filteredLeads.map((lead) => (
                        <div
                            key={lead.customer_id}
                            className="table-row"
                            onClick={() => setSelectedLead(lead)}
                        >
                            <div className="lead-info">
                                <div className="lead-avatar">
                                    {lead.profile_pic ? (
                                        <img src={lead.profile_pic} alt={lead.name} />
                                    ) : (
                                        getInitials(lead.name, lead.username)
                                    )}
                                </div>
                                <div>
                                    <div className="lead-name">{lead.name || 'Unknown'}</div>
                                    <div className="lead-username">@{lead.username || 'unknown'}</div>
                                </div>
                            </div>

                            <div>
                                <span className={`status-badge ${lead.status === 'Meeting Booked' ? 'converted' : 'meeting-booked'}`}>
                                    {lead.status === 'Meeting Booked' ? (
                                        <span className="flex items-center gap-1">
                                            <CheckCircle size={12} /> Booked
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} /> Interested
                                        </span>
                                    )}
                                </span>
                            </div>

                            <div className="text-gray-400 text-sm">
                                {lead.stage === 'booking' ? 'Asked for availability' : 'Payment/details discussed'}
                            </div>

                            <div>
                                <div className="message-preview">{lead.last_message || 'N/A'}</div>
                                <div className="message-time">{formatTimeAgo(lead.last_interaction)}</div>
                            </div>

                            <div className="message-count">
                                <MessageSquare size={14} />
                                {lead.message_count || 0}
                            </div>

                            <div className="arrow-icon">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedLead && (
                <ConversationModal
                    lead={selectedLead}
                    messages={messages}
                    onClose={() => setSelectedLead(null)}
                    onBlockChange={() => { }}
                />
            )}
        </>
    );
}
