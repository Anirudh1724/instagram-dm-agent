import { useState, useEffect } from 'react';
import { Instagram, CheckCircle, XCircle, LogOut, RefreshCw } from 'lucide-react';

interface ConnectionStatus {
    connected: boolean;
    instagram_account_id?: string;
    business_name?: string;
    profile_picture?: string;
    instagram_username?: string;
    connected_at?: string;
}

export function Settings() {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);

    const clientId = localStorage.getItem('client_id');

    useEffect(() => {
        fetchConnectionStatus();
    }, []);

    const fetchConnectionStatus = async () => {
        if (!clientId) return;

        try {
            const response = await fetch(`/api/auth/instagram/status/${clientId}`);
            const data = await response.json();
            setConnectionStatus(data);
        } catch (err) {
            console.error('Failed to fetch connection status', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = () => {
        if (!clientId) {
            alert('Client ID not found. Please log in again.');
            return;
        }
        setConnecting(true);
        // Redirect to OAuth flow
        window.location.href = `/api/auth/instagram/connect?client_id=${clientId}&redirect_after=/client/settings`;
    };

    const handleDisconnect = async () => {
        if (!clientId) return;

        if (!confirm('Disconnect Instagram? The AI agent will stop responding to your DMs.')) {
            return;
        }

        try {
            await fetch(`/api/auth/instagram/disconnect/${clientId}`, { method: 'POST' });
            setConnectionStatus({ connected: false });
        } catch (err) {
            console.error('Failed to disconnect', err);
            alert('Failed to disconnect. Please try again.');
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="page-header">
                <div className="page-title">
                    <h2>Settings</h2>
                    <p>Manage your account and Instagram connection</p>
                </div>
            </div>

            {/* Instagram Connection Card */}
            <div className="activity-section" style={{ maxWidth: '600px' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Instagram size={20} />
                    Instagram Connection
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <RefreshCw className="animate-spin" size={24} />
                        <span className="ml-2">Loading...</span>
                    </div>
                ) : connectionStatus?.connected ? (
                    /* Connected State */
                    <div className="space-y-4">
                        <div
                            className="flex items-center gap-4 p-4 rounded-lg"
                            style={{
                                background: 'rgba(29, 185, 84, 0.1)',
                                border: '1px solid rgba(29, 185, 84, 0.3)'
                            }}
                        >
                            {connectionStatus.profile_picture ? (
                                <img
                                    src={connectionStatus.profile_picture}
                                    alt="Profile"
                                    style={{ width: '56px', height: '56px', borderRadius: '50%' }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Instagram size={28} color="white" />
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={18} color="#1db954" />
                                    <span style={{ color: '#1db954', fontWeight: 600 }}>Connected</span>
                                </div>
                                <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.25rem' }}>
                                    {connectionStatus.instagram_username
                                        ? `@${connectionStatus.instagram_username}`
                                        : connectionStatus.business_name || 'Instagram Account'}
                                </p>
                                {connectionStatus.connected_at && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                        Connected on {new Date(connectionStatus.connected_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            ✓ The AI agent is actively responding to your Instagram DMs
                        </p>

                        <button
                            onClick={handleDisconnect}
                            className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                cursor: 'pointer',
                            }}
                        >
                            <LogOut size={16} />
                            Disconnect Instagram
                        </button>
                    </div>
                ) : (
                    /* Not Connected State */
                    <div className="space-y-4">
                        <div
                            className="flex items-center gap-4 p-4 rounded-lg"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            <XCircle size={24} color="#ef4444" />
                            <div>
                                <p style={{ color: '#ef4444', fontWeight: 500 }}>Not Connected</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    Connect your Instagram to enable the AI agent
                                </p>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Connect your Instagram Business account to let the AI agent automatically:
                        </p>
                        <ul style={{ color: 'var(--text-muted)', fontSize: '0.875rem', paddingLeft: '1.5rem', listStyle: 'disc' }}>
                            <li>Respond to DMs 24/7</li>
                            <li>Qualify leads</li>
                            <li>Book appointments</li>
                            <li>Send follow-ups</li>
                        </ul>

                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg transition-all transform hover:scale-[1.02]"
                            style={{
                                background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '1rem',
                                border: 'none',
                                cursor: connecting ? 'wait' : 'pointer',
                                opacity: connecting ? 0.7 : 1,
                            }}
                        >
                            <Instagram size={24} />
                            {connecting ? 'Connecting...' : 'Connect Instagram'}
                        </button>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
                            You'll be redirected to Instagram to authorize the connection
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
