import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronRight, MessageSquare, ChevronDown } from 'lucide-react';
import { ConversationModal } from '../components/ConversationModal';
import { DashboardService } from '../services/api';

type LeadType = 'all' | 'qualified' | 'unqualified' | 'freebie';


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

export function Leads() {
    const [searchQuery, setSearchQuery] = useState('');
    const [leadTypeFilter, setLeadTypeFilter] = useState<LeadType>('all');
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Conversation data
    const [messages, setMessages] = useState<any[]>([]);

    // Memoize clientId to prevent re-reading from localStorage on every render
    const clientId = useMemo(() => localStorage.getItem('client_id'), []);

    // Fetch Leads
    useEffect(() => {
        const fetchLeads = async () => {
            if (!clientId) return;
            setLoading(true);
            try {
                // Map frontend filters to API params
                const statusParam = leadTypeFilter === 'all' ? undefined : leadTypeFilter;

                const data = await DashboardService.getLeads(
                    clientId,
                    1, // page
                    50, // limit
                    statusParam,
                    searchQuery || undefined
                );
                setLeads(data.leads);
            } catch (err) {
                console.error("Failed to fetch leads", err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(() => {
            fetchLeads();
        }, 500); // 500ms debounce for search

        return () => clearTimeout(debounce);
    }, [clientId, searchQuery, leadTypeFilter]);

    // Fetch Conversation when lead selected
    useEffect(() => {
        const fetchConv = async () => {
            if (!clientId || !selectedLead) return;

            try {
                const data = await DashboardService.getLeadConversation(clientId, selectedLead.id);
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


    const getInitials = (name: string, username: string): string => {
        if (name) {
            const parts = name.split(' ');
            return parts.length > 1
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : name.substring(0, 2).toUpperCase();
        }
        return username ? username.substring(0, 2).toUpperCase() : '?';
    };

    const formatTimeAgo = (dateStr: string): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        return `${diffDays} days ago`;
    };

    return (
        <>
            {/* Page Header */}
            <div className="page-header">
                <div className="page-title">
                    <h2>All Leads</h2>
                    <p>View and manage all conversations with your leads</p>
                </div>
            </div>

            {/* Filters */}
            <div className="leads-header">
                <div className="search-input">
                    <Search size={16} color="#6e7681" />
                    <input
                        type="text"
                        placeholder="Search by name or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-controls">
                    <div style={{ position: 'relative' }}>
                        <button
                            className="dropdown-btn"
                            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                        >
                            {leadTypeFilter === 'all' ? 'All Types' :
                                leadTypeFilter.charAt(0).toUpperCase() + leadTypeFilter.slice(1)}
                            <ChevronDown size={14} />
                        </button>
                        {showTypeDropdown && (
                            <div className="dropdown-menu">
                                <button onClick={() => { setLeadTypeFilter('all'); setShowTypeDropdown(false); }}>All Types</button>
                                <button onClick={() => { setLeadTypeFilter('qualified'); setShowTypeDropdown(false); }}>Qualified</button>
                                <button onClick={() => { setLeadTypeFilter('unqualified'); setShowTypeDropdown(false); }}>Unqualified</button>
                                {/* <button onClick={() => { setLeadTypeFilter('freebie'); setShowTypeDropdown(false); }}>Freebie</button> */}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Leads Count */}
            <div className="leads-count">
                Showing <span>{leads.length}</span> leads
            </div>

            {/* Leads Table */}
            <div className="leads-table">
                <div className="table-header">
                    <span>Lead</span>
                    <span>Status</span>
                    <span>Last Message</span>
                    <span>Messages</span>
                    <span>Source</span>
                    <span></span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading leads...</div>
                ) : leads.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare />
                        <p>No leads found</p>
                    </div>
                ) : (
                    leads.map((lead) => (
                        <div
                            key={lead.id}
                            className="table-row"
                            onClick={() => setSelectedLead(lead)}
                        >
                            <div className="lead-info">
                                <div className="lead-avatar">
                                    {lead.profile_pic ? (
                                        <img src={lead.profile_pic} alt={lead.name || lead.username} />
                                    ) : (
                                        getInitials(lead.name || '', lead.username || '')
                                    )}
                                </div>
                                <div>
                                    <div className="lead-name">{lead.name || 'Unknown'}</div>
                                    <div className="lead-username">@{lead.username || 'unknown'}</div>
                                </div>
                            </div>

                            <div>
                                <span className={`status-badge ${STATUS_CLASS[lead.status] || 'new'}`}>
                                    {STATUS_MAP[lead.status] || lead.status || 'New'}
                                </span>
                            </div>

                            <div>
                                <div className="message-preview">{lead.last_message || 'No messages yet'}</div>
                                <div className="message-time">{formatTimeAgo(lead.last_interaction)}</div>
                            </div>

                            <div className="message-count">
                                <MessageSquare size={14} />
                                {lead.message_count || 0}
                            </div>

                            <div className="source-tag">
                                {lead.source || 'DM'}
                            </div>

                            <div className="arrow-icon">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Conversation Modal */}
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
