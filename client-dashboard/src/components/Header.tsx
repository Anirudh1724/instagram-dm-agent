import { Instagram, LayoutDashboard, Users, Bell, Settings, Clock, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
    businessName: string;
    onLogout: () => void;
}

export function Header({ businessName, onLogout }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <div className="logo">
                        <div className="logo-icon">
                            <Instagram size={20} color="white" />
                        </div>
                        <div className="logo-text">
                            <h1>DM Automator</h1>
                            <span>Lead Management Dashboard</span>
                        </div>
                    </div>

                    <nav className="nav">
                        <button
                            className={`nav-btn ${isActive('/') ? 'active' : ''}`}
                            onClick={() => navigate('/')}
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </button>
                        <button
                            className={`nav-btn ${isActive('/leads') ? 'active' : ''}`}
                            onClick={() => navigate('/leads')}
                        >
                            <Users size={18} />
                            Leads
                        </button>
                        <button
                            className={`nav-btn ${isActive('/followup-leads') ? 'active' : ''}`}
                            onClick={() => navigate('/followup-leads')}
                        >
                            <Clock size={18} />
                            Followup Leads
                        </button>
                        <button
                            className={`nav-btn ${isActive('/booking-leads') ? 'active' : ''}`}
                            onClick={() => navigate('/booking-leads')}
                        >
                            <Calendar size={18} />
                            Booking Leads
                        </button>
                    </nav>
                </div>


                <div className="header-right">
                    <button className="icon-btn">
                        <Bell size={18} />
                    </button>
                    <button className="icon-btn">
                        <Settings size={18} />
                    </button>
                    <div className="avatar" onClick={onLogout} title="Click to logout">
                        {businessName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
}
