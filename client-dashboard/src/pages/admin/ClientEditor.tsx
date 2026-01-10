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
    login_password: ''
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
                            {/* Instagram/Meta API Credentials */}
                            <div className="grid gap-4 p-4 bg-[#161b22] rounded-lg border border-[#30363d]">
                                <div className="flex items-center gap-2 text-orange-400 mb-2">
                                    <span className="text-lg font-semibold">🔗 Instagram API Setup</span>
                                </div>
                                <p className="text-xs text-gray-400 -mt-2 mb-2">
                                    The Graph API ID is automatically detected when the first message arrives. You only need to provide the access token.
                                </p>

                                <div className="grid gap-2">
                                    <label className="text-gray-400 text-sm">Instagram App ID <span className="text-gray-600">(Optional)</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2827074154305715 (from Instagram settings)"
                                        value={config.instagram_account_id}
                                        className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                        onChange={(e) => setConfig({ ...config, instagram_account_id: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500">The ID you see in Instagram Business settings. Leave blank if unsure - will be auto-detected.</p>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-gray-400 text-sm">Access Token <span className="text-red-400">*</span></label>
                                    <input
                                        type="password"
                                        placeholder={!isNew && !config.meta_access_token ? "Configured (Hidden)" : "Paste your Meta API access token"}
                                        value={config.meta_access_token}
                                        className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                        onChange={(e) => setConfig({ ...config, meta_access_token: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500">From Meta Developer Console → Your App → Access Token</p>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-gray-400 text-sm">App Secret <span className="text-gray-600">(For webhook verification)</span></label>
                                    <input
                                        type="password"
                                        placeholder={!isNew && !config.meta_verify_token ? "Configured (Hidden)" : "Paste your app secret"}
                                        value={config.meta_verify_token}
                                        className="search-input w-full p-3 bg-[#1e293b] border border-[#30363d] text-white rounded-md"
                                        onChange={(e) => setConfig({ ...config, meta_verify_token: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500">Used to verify webhook requests from Meta</p>
                                </div>
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
