// RecentActivity component

interface Activity {
    type: 'message' | 'meeting' | 'converted' | 'followup' | 'new-lead';
    text: string;
    time: string;
    name?: string;
}

interface RecentActivityProps {
    activities: Activity[];
};

export function RecentActivity({ activities }: RecentActivityProps) {
    const getAvatarInitial = (text: string): string => {
        // Extract name from text like "Sophia received followup message"
        const match = text.match(/^([A-Z][a-z]+)/);
        return match ? match[1].charAt(0) : '?';
    };

    return (
        <div className="activity-section">
            <h3>Recent Activity</h3>
            <div className="activity-list">
                {activities.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#8b949e' }}>
                        <p>No recent activity. When leads message you, activity will appear here.</p>
                    </div>
                ) : (
                    activities.map((activity, index) => {
                        const initial = getAvatarInitial(activity.text);

                        return (
                            <div key={index} className="activity-item">
                                <div className="activity-avatar">
                                    {initial}
                                </div>
                                <div className="activity-content">
                                    <div className="activity-text" dangerouslySetInnerHTML={{
                                        __html: activity.text.replace(/^([A-Z][a-z]+)/, '<strong>$1</strong>')
                                    }} />
                                    <div className="activity-time">{activity.time}</div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
