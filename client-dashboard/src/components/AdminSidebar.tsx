import { useState, useEffect } from 'react';
import { Instagram, LayoutDashboard, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
    onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path + '/'));

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Close menu on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { path: '/admin/clients', icon: Users, label: 'Clients' },
    ];

    const handleNavClick = (path: string) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                style={{ background: isMobileMenuOpen ? 'var(--accent-orange)' : undefined }}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={`sidebar ${isMobileMenuOpen ? 'active' : ''}`}
                style={{ '--accent-primary': 'var(--accent-orange)' } as React.CSSProperties}
            >
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
                                onClick={() => handleNavClick(item.path)}
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
                        onClick={() => handleNavClick('/admin/settings')}
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
        </>
    );
}
