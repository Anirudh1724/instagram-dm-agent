import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MessageSquare, Image, Clock, Trash2 } from 'lucide-react';
import { AdminService } from '../../services/api';

const DEFAULT_CONFIG = {
    client_id: '',
    business_name: '',
    industry: '',
    dm_prompt: '',
    story_prompt: '',
    followup_prompt: '',
    meta_access_token: '', // Only for creation
    meta_verify_token: '',
    instagram_account_id: '',
    login_email: '',
    login_password: '',
    // OAuth-related fields
    oauth_connected: false,
    profile_picture: '',
    instagram_username: '',
    connected_at: '',
};


export function ClientEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        if (id && id !== 'new') {
            const fetchClient = async () => {
                setLoading(true);
                try {
                    const data = await AdminService.getClient(id);
                    setConfig({ ...DEFAULT_CONFIG, ...data });
                } catch (err) {
                    console.error("Failed to fetch client", err);
                    alert("Failed to load client data");
                } finally {
                    setLoading(false);
                }
            };
            fetchClient();
        } else {
            setIsNew(true);
        }
    }, [id]);

    const handleSave = async () => {
        if (!config.client_id || !config.business_name) {
            alert("Client ID and Business Name are required");
            return;
        }

        setSaving(true);
        try {
            if (isNew) {
                await AdminService.createClient(config);
            } else {
                await AdminService.updateClient(config.client_id, config);
            }
            navigate('/admin/clients');
        } catch (err: any) {
            console.error("Failed to save", err);
            alert("Failed to save: " + (err.response?.data?.detail || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this client?")) return;
        setSaving(true);
        try {
            // AdminService.deleteClient not defined in api.ts yet, skipping delete implementations
            // For now just alert
            alert("Delete functionality not fully implemented in frontend service yet");
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <button
                        onClick={() => navigate('/admin/clients')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={16} />
                        Back to Clients
                    </button>
                    <div className="page-title">
                        <h2>{isNew ? 'Create New Client' : `Edit: ${config.business_name}`}</h2>
                        <p>Configure agent behavior and business details</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {!isNew && (
                        <button
                            className="nav-item"
                            onClick={handleDelete}
                            style={{ width: 'auto', padding: '0.75rem', background: '#e11d48', color: 'white', border: 'none' }}
                        >
                            <Trash2 size={18} />
                        </button>
                    )}

                    <button
                        className="nav-item active"
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            width: 'auto',
                            padding: '0.75rem 1.5rem',
                            background: 'var(--accent-orange)',
                            color: 'white',
                            border: 'none',
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        <Save size={18} />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Main Config Form */}
                <div className="flex flex-col gap-8">

                    {/* Business Info */}
                    <div className="activity-section">
                        <h3>Business Information</h3>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <label className="text-gray-400 text-sm">Client ID (Unique)</label>
                                <input
                                    type="text"
                                    value={config.client_id}
                                    disabled={!isNew}
                                    className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                    onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-gray-400 text-sm">Business Name</label>
                                <input
                                    type="text"
                                    value={config.business_name}
                                    className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                    onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-gray-400 text-sm">Industry</label>
                                <input
                                    type="text"
                                    value={config.industry}
                                    className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                    onChange={(e) => setConfig({ ...config, industry: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Credentials (Only visible mostly on create or edit special fields) */}
                    <div className="activity-section">
                        <h3>Credentials & Dashboard Login</h3>
                        <div className="grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-gray-400 text-sm">Dashboard Email</label>
                                    <input
                                        type="email"
                                        value={config.login_email}
                                        className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                        onChange={(e) => setConfig({ ...config, login_email: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-gray-400 text-sm">Dashboard Password</label>
                                    <input
                                        type="password"
                                        placeholder={isNew ? "Required" : "Leave empty to keep unchanged"}
                                        value={config.login_password}
                                        className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                        onChange={(e) => setConfig({ ...config, login_password: e.target.value })}
                                    />
                                </div>
                            </div>
                            {/* Instagram Connection - OAuth Flow */}
                            <div className="grid gap-4 p-4 bg-[#161b22] rounded-lg border border-[#30363d]">
                                <div className="flex items-center gap-2 text-orange-400 mb-2">
                                    <span className="text-lg font-semibold">🔗 Instagram Connection</span>
                                </div>

                                {/* Show connection status if connected */}
                                {config.oauth_connected || config.meta_access_token ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                            {config.profile_picture && (
                                                <img
                                                    src={config.profile_picture}
                                                    alt="Profile"
                                                    className="w-12 h-12 rounded-full"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-400 font-semibold">✓ Connected</span>
                                                </div>
                                                <p className="text-sm text-gray-400">
                                                    {config.instagram_username ? `@${config.instagram_username}` : config.business_name}
                                                </p>
                                                {config.connected_at && (
                                                    <p className="text-xs text-gray-500">
                                                        Connected on {new Date(config.connected_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Disconnect Instagram? The agent will stop responding to DMs.")) {
                                                        // Call disconnect API
                                                        fetch(`/api/auth/instagram/disconnect/${config.client_id}`, { method: 'POST' })
                                                            .then(() => {
                                                                setConfig({
                                                                    ...config,
                                                                    oauth_connected: false,
                                                                    meta_access_token: '',
                                                                    profile_picture: '',
                                                                    connected_at: ''
                                                                });
                                                            });
                                                    }
                                                }}
                                                className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-sm hover:bg-red-500/30 transition-colors"
                                            >
                                                Disconnect
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Your Instagram account is connected. The agent will automatically respond to DMs.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-400">
                                            Connect your Instagram Business account to enable the DM agent.
                                        </p>

                                        {isNew ? (
                                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                                <p className="text-sm text-yellow-400">
                                                    💡 Save the client first, then connect Instagram.
                                                </p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    // Redirect to OAuth flow
                                                    window.location.href = `/api/auth/instagram/connect?client_id=${config.client_id}&redirect_after=/admin/clients/${config.client_id}`;
                                                }}
                                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02]"
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                                </svg>
                                                Connect Instagram
                                            </button>
                                        )}

                                        <details className="text-xs text-gray-500">
                                            <summary className="cursor-pointer hover:text-gray-400">
                                                Or enter credentials manually (advanced)
                                            </summary>
                                            <div className="mt-4 space-y-4 p-4 bg-[#0d1117] rounded-lg">
                                                <div className="grid gap-2">
                                                    <label className="text-gray-400 text-sm">Instagram Account ID</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 17841234567890"
                                                        value={config.instagram_account_id}
                                                        className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                                        onChange={(e) => setConfig({ ...config, instagram_account_id: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-gray-400 text-sm">Access Token</label>
                                                    <input
                                                        type="password"
                                                        placeholder="Paste your Meta API access token"
                                                        value={config.meta_access_token}
                                                        className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                                        onChange={(e) => setConfig({ ...config, meta_access_token: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Prompts Config */}
                    <div className="activity-section">
                        <h3>Agent Personalities & Prompts</h3>
                        <div className="grid gap-8">

                            {/* DM Prompt */}
                            <div className="grid gap-3">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <MessageSquare size={18} />
                                    <label className="font-semibold">DM Response Prompt</label>
                                </div>
                                <p className="text-xs text-gray-400">Instructions for how the agent should handle direct messages.</p>
                                <textarea
                                    value={config.dm_prompt}
                                    rows={6}
                                    className="w-full p-4 bg-[#1e293b] border border-[#30363d] text-white rounded-md leading-relaxed"
                                    onChange={(e) => setConfig({ ...config, dm_prompt: e.target.value })}
                                />
                            </div>

                            {/* Story Prompt */}
                            <div className="grid gap-3">
                                <div className="flex items-center gap-2 text-pink-400">
                                    <Image size={18} />
                                    <label className="font-semibold">Story Reply Prompt</label>
                                </div>
                                <textarea
                                    value={config.story_prompt}
                                    rows={4}
                                    className="w-full p-4 bg-[#1e293b] border border-[#30363d] text-white rounded-md leading-relaxed"
                                    onChange={(e) => setConfig({ ...config, story_prompt: e.target.value })}
                                />
                            </div>

                            {/* Followup Prompt */}
                            <div className="grid gap-3">
                                <div className="flex items-center gap-2 text-teal-400">
                                    <Clock size={18} />
                                    <label className="font-semibold">Follow-up Logic</label>
                                </div>
                                <textarea
                                    value={config.followup_prompt}
                                    rows={4}
                                    className="w-full p-4 bg-[#1e293b] border border-[#30363d] text-white rounded-md leading-relaxed"
                                    onChange={(e) => setConfig({ ...config, followup_prompt: e.target.value })}
                                />
                            </div>

                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="flex flex-col gap-6">
                    <div className="activity-section">
                        <h3>Quick Tips</h3>
                        <ul className="text-sm text-gray-400 list-disc pl-4 space-y-2">
                            <li>Client ID must be unique (e.g. 'vastulogy_main').</li>
                            <li>Dashboard Login credentials are for the client to access their dashboard.</li>
                            <li>Meta Access Token is required for the agent to function.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
