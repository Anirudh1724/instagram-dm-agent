import { Instagram, LayoutDashboard, Users, Clock, Calendar, Settings, LogOut, PieChart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
    onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/client/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/client/insights', icon: PieChart, label: 'Insights' },
        { path: '/client/leads', icon: Users, label: 'Leads' },
        { path: '/client/followup-leads', icon: Clock, label: 'Followup Leads' },
        { path: '/client/booking-leads', icon: Calendar, label: 'Booking Leads' },
    ];

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        <Instagram size={20} color="white" />
                    </div>
                    <div className="logo-text">
                        <h1>DM Agent</h1>
                        <span>Automation Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                        {isActive(item.path) && <div className="active-indicator" />}
                    </button>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="sidebar-footer">
                <button className="nav-item" onClick={() => navigate('/client/settings')}>
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
                <button className="nav-item" onClick={onLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
