import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, MoreVertical, ShieldCheck, AlertCircle } from 'lucide-react';
import { AdminService } from '../../services/api';

export function Clients() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const data = await AdminService.getClients();
                setClients(data.clients || []);
            } catch (err) {
                console.error("Failed to fetch clients", err);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, []);

    const filteredClients = clients.filter(client =>
        (client.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.client_id || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (name: string) => (name || '?').substring(0, 2).toUpperCase();

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="page-header">
                <div className="page-title">
                    <h2>Clients</h2>
                    <p>Manage your client accounts and subscriptions</p>
                </div>
                <button
                    className="nav-item active"
                    onClick={() => navigate('/admin/clients/new')}
                    style={{ width: 'auto', padding: '0.75rem 1.5rem', background: 'var(--accent-orange)', color: 'white', border: 'none' }}
                >
                    <Plus size={18} />
                    <span>Add Client</span>
                </button>
            </div>

            {/* Filters */}
            <div className="leads-header">
                <div className="search-input">
                    <Search size={16} color="#6e7681" />
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-controls">
                    <button className="dropdown-btn">
                        <Filter size={16} />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Clients Table */}
            <div className="leads-table">
                <div className="table-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 0.5fr' }}>
                    <span>Client Name</span>
                    <span>Industry</span>
                    <span>Status</span>
                    <span>API Token</span>
                    <span>Joined</span>
                    <span></span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading clients...</div>
                ) : filteredClients.length === 0 ? (
                    <div className="empty-state">
                        <p>No clients found</p>
                    </div>
                ) : (
                    filteredClients.map((client) => (
                        <div
                            key={client.client_id}
                            className="table-row"
                            style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 0.5fr', cursor: 'pointer' }}
                            onClick={() => navigate(`/admin/clients/${client.client_id}`)}
                        >
                            <div className="lead-info">
                                <div className="lead-avatar" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                    {getInitials(client.business_name)}
                                </div>
                                <div>
                                    <div className="lead-name">{client.business_name || client.client_id}</div>
                                    <div className="lead-username" style={{ fontSize: '0.75rem' }}>ID: {client.client_id}</div>
                                </div>
                            </div>

                            <div className="message-preview">
                                {client.industry || 'General'}
                            </div>

                            <div>
                                <span className={`status-badge ${client.has_token ? 'qualified' : 'lost'}`}>
                                    {client.has_token ? 'Active' : 'Incomplete'}
                                </span>
                            </div>

                            <div>
                                {client.has_token ? (
                                    <div className="flex items-center gap-1 text-teal-500 text-sm">
                                        <ShieldCheck size={14} /> Configured
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-red-500 text-sm">
                                        <AlertCircle size={14} /> Missing
                                    </div>
                                )}
                            </div>

                            <div className="message-time">
                                -
                            </div>

                            <div className="arrow-icon">
                                <MoreVertical size={16} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
