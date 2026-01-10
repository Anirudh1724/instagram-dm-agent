import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, MessageSquare, AlertCircle } from 'lucide-react';
import { ConversationModal } from '../components/ConversationModal';
import { DashboardService } from '../services/api';

export function FollowupLeads() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Configurable threshold for "Needs Followup" (e.g., 2 days)


    const [messages, setMessages] = useState<any[]>([]);

    // Memoize clientId to prevent re-reading from localStorage on every render
    const clientId = useMemo(() => localStorage.getItem('client_id'), []);

    useEffect(() => {
        const fetchLeads = async () => {
            if (!clientId) return;
            setLoading(true);
            try {
                const data = await DashboardService.getFollowupLeads(clientId, 50);
                setClients(data.leads);
            } catch (err) {
                console.error("Failed to fetch followup leads", err);
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
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHrs < 24) return `${diffHrs} hours ago`;
        if (diffDays === 1) return 'yesterday';
        return `${diffDays} days ago`;
    };

    // Filter leads
    const filteredLeads = clients.filter(lead => {
        const matchSearch =
            (lead.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lead.username || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch;
    });

    return (
        <>
            <div className="page-header">
                <div className="page-title">
                    <h2>Follow-up Required</h2>
                    <p>Leads that need attention or re-engagement</p>
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
                    <span>Follow-up</span>
                    <span>Last Response</span>
                    <span>Count</span>
                    <span></span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading follow-ups...</div>
                ) : filteredLeads.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare />
                        <p>No leads requiring follow-up</p>
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
                                <span className={`status-badge engaged`}>
                                    Follow-up Sent
                                </span>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-orange-400">
                                    <AlertCircle size={14} />
                                    <span>#{lead.followup_count || 0} Sent</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Last: {formatTimeAgo(lead.last_followup_at)}
                                </div>
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
