import { Instagram, LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
    onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path + '/'));

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { path: '/admin/clients', icon: Users, label: 'Clients' },
    ];

    return (
        // Override accent color for admin panel to Orange
        <aside className="sidebar" style={{ '--accent-primary': 'var(--accent-orange)' } as React.CSSProperties}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                        <Instagram size={20} color="white" />
                    </div>
                    <div className="logo-text">
                        <h1>DM Agent</h1>
                        <span>Admin Panel</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const active = item.exact
                        ? location.pathname === item.path
                        : isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            className={`nav-item ${active ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                            {active && <div className="active-indicator" />}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button
                    className="nav-item"
                    onClick={() => navigate('/admin/settings')}
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
                <button
                    className="nav-item"
                    onClick={onLogout}
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
