import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/StatCard';
import { AdminService } from '../../services/api';

export function AdminDashboard() {
    const navigate = useNavigate();
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

    // Calculate generic stats based on clients list (mock aggregation for now)
    const stats = {
        totalClients: clients.length,
        totalLeads: 0, // Needs aggregate analytics API
        messagesSent: 0, // Needs aggregate analytics API
        bookings: 0      // Needs aggregate analytics API
    };

    const getInitials = (name: string) => {
        return (name || '?').substring(0, 2).toUpperCase();
    };

    return (
        <div className="dashboard-container">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-title">
                    <h2>Admin Dashboard</h2>
                    <p>System Overview & Performance</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard
                    title="Total Clients"
                    value={stats.totalClients}
                    change="+"
                    changeType="positive"
                    icon="users"
                    delay={0}
                />
                <StatCard
                    title="Total Leads"
                    value="-"
                    change="N/A"
                    changeType="neutral"
                    icon="trending"
                    delay={50}
                />
                <StatCard
                    title="Messages Sent"
                    value="-"
                    change="N/A"
                    changeType="neutral"
                    icon="messages"
                    delay={100}
                />
                <StatCard
                    title="Bookings"
                    value="-"
                    change="N/A"
                    changeType="neutral"
                    icon="calendar"
                    delay={150}
                />
            </div>

            {/* Active Clients Table Section */}
            <div className="activity-section">
                <h3>All Clients</h3>

                <div className="leads-table">
                    <div className="table-header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                        <span>Client</span>
                        <span>Industry</span>
                        <span>Status</span>
                        <span>Leads</span>
                        <span>Messages</span>
                        <span>API Status</span>
                    </div>

                    {loading ? (
                        <div className="p-4 text-gray-500">Loading clients...</div>
                    ) : clients.length === 0 ? (
                        <div className="p-4 text-gray-500">No clients found.</div>
                    ) : (
                        clients.map((client) => (
                            <div
                                key={client.client_id}
                                className="table-row"
                                style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', cursor: 'pointer' }}
                                onClick={() => navigate(`/admin/clients/${client.client_id}`)}
                            >
                                <div className="lead-info">
                                    <div className="lead-avatar">
                                        {getInitials(client.business_name)}
                                    </div>
                                    <div className="lead-name">{client.business_name || client.client_id}</div>
                                </div>

                                <div>
                                    <span className="source-tag">{client.industry || 'General'}</span>
                                </div>

                                <div>
                                    <span className={`status-badge ${client.has_token ? 'qualified' : 'lost'}`}>
                                        {client.has_token ? 'Active' : 'Setup Required'}
                                    </span>
                                </div>

                                <div className="stat-value" style={{ fontSize: '0.9rem' }}>
                                    -
                                </div>

                                <div className="stat-value" style={{ fontSize: '0.9rem' }}>
                                    -
                                </div>

                                <div>
                                    {client.has_token ? (
                                        <span className="text-teal-500 text-xs">Connected</span>
                                    ) : (
                                        <span className="text-red-500 text-xs">Missing Token</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
