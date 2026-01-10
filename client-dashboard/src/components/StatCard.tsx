import { Users, UserCheck, MessageSquare, TrendingUp, Calendar } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: 'users' | 'usercheck' | 'messages' | 'trending' | 'calendar';
    delay?: number;
}

const iconMap = {
    users: Users,
    usercheck: UserCheck,
    messages: MessageSquare,
    trending: TrendingUp,
    calendar: Calendar,
};

const colorMap = {
    users: 'teal',
    usercheck: 'orange',
    messages: 'blue',
    trending: 'red',
    calendar: 'green',
};

export function StatCard({ title, value, change, changeType, icon, delay = 0 }: StatCardProps) {
    const Icon = iconMap[icon];
    const color = colorMap[icon];

    return (
        <div
            className="stat-card"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`stat-icon ${color}`}>
                <Icon size={22} />
            </div>
            <div className="stat-content">
                <span className="stat-title">{title}</span>
                <span className="stat-value">{value}</span>
                <span className={`stat-change ${changeType}`}>{change}</span>
            </div>
        </div>
    );
}
