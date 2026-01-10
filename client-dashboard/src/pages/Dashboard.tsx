import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StatCard } from '../components/StatCard';
import { LeadsChart, LeadDistributionChart } from '../components/Charts';
import { RecentActivity } from '../components/RecentActivity';
import { DashboardService } from '../services/api';

type Period = 'daily' | 'weekly' | 'monthly';

export function Dashboard() {
    const [period, setPeriod] = useState<Period>('daily');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);

    // Track if we're currently fetching to prevent duplicate requests
    const isFetching = useRef(false);

    // Memoize clientId to prevent re-reading from localStorage on every render
    const clientId = useMemo(() => localStorage.getItem('client_id'), []);

    // Memoize the fetch function
    const fetchData = useCallback(async () => {
        if (!clientId || isFetching.current) return;

        isFetching.current = true;
        setLoading(true);
        setError(null);

        try {
            const [analyticsData, activityData] = await Promise.all([
                DashboardService.getAnalytics(clientId, period),
                DashboardService.getActivity(clientId)
            ]);

            // Map API response to Component State
            setStats({
                leadsContacted: analyticsData.leads_contacted || 0,
                uniqueLeads: analyticsData.unique_leads || 0,
                messagesSent: analyticsData.messages_sent || 0,
                responseRate: analyticsData.response_rate || 0,
                bookings: 0,

                // Changes
                leadsChange: analyticsData.leads_change || '+0%',
                uniqueChange: analyticsData.unique_change || '+0%',
                messagesChange: analyticsData.messages_change || '+0%',
                responseChange: analyticsData.response_change || '+0%'
            });

            // Chart Data - pass the raw array to LeadsChart
            setChartData(analyticsData.chart_data || []);

            // Transform conversations to activity format
            const conversations = activityData.conversations || [];
            const transformedActivities = conversations.map((conv: any) => {
                const name = conv.name || conv.username || 'Unknown';
                const lastMessage = conv.messages?.[conv.messages.length - 1];
                const messagePreview = lastMessage?.content?.substring(0, 50) || 'New conversation';

                return {
                    type: 'message' as const,
                    text: `${name} - ${messagePreview}`,
                    time: conv.last_interaction ? new Date(conv.last_interaction).toLocaleString() : 'Recently',
                    name: name
                };
            });
            setActivities(transformedActivities);


        } catch (err: any) {
            console.error("Failed to fetch dashboard data", err);
            setError(err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [clientId, period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!clientId) return <div className="p-8 text-white">Error: No Client ID found. Please login again.</div>;
    if (loading && !stats) return <div className="p-8 text-white">Loading dashboard...</div>;
    if (error && !stats) return <div className="p-8 text-white">Error: {error}</div>;

    // Calculate distribution (Mock or if API provides it later)
    // For now derive from stats or use placeholders as analytics API doesn't fully return breakdown yet
    const unique = stats?.uniqueLeads || 0;
    const leadDistribution = {
        qualified: Math.floor(unique * 0.4),
        unqualified: Math.floor(unique * 0.35),
        freebie: Math.floor(unique * 0.25),
    };

    return (
        <>
            {/* Page Header */}
            <div className="page-header">
                <div className="page-title">
                    <h2>Dashboard</h2>
                    <p>Monitor your AI agent's performance and engagement</p>
                </div>
                <div className="period-toggle">
                    <button className={`period-btn ${period === 'daily' ? 'active' : ''}`} onClick={() => setPeriod('daily')}>Daily</button>
                    <button className={`period-btn ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>Weekly</button>
                    <button className={`period-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
                </div>
            </div>

            {stats && (
                <div className="stats-grid">
                    <StatCard
                        title="Leads Contacted"
                        value={stats.leadsContacted.toLocaleString()}
                        change={stats.leadsChange} // e.g. "+12"
                        changeType={stats.leadsChange.includes('-') ? 'negative' : 'positive'}
                        icon="users"
                        delay={0}
                    />
                    <StatCard
                        title="Unique Leads"
                        value={stats.uniqueLeads.toLocaleString()}
                        change={stats.uniqueChange}
                        changeType={stats.uniqueChange.includes('-') ? 'negative' : 'positive'}
                        icon="usercheck"
                        delay={50}
                    />
                    <StatCard
                        title="Messages Sent"
                        value={stats.messagesSent.toLocaleString()}
                        change={stats.messagesChange}
                        changeType={stats.messagesChange.includes('-') ? 'negative' : 'positive'}
                        icon="messages"
                        delay={100}
                    />
                    <StatCard
                        title="Response Rate"
                        value={`${stats.responseRate}%`}
                        change={stats.responseChange}
                        changeType={stats.responseChange.includes('-') ? 'negative' : 'positive'}
                        icon="trending"
                        delay={150}
                    />
                    <StatCard
                        title="Bookings"
                        value={stats.bookings.toLocaleString()}
                        change="+0%"
                        changeType="positive"
                        icon="calendar"
                        delay={200}
                    />
                </div>
            )}

            {/* Charts Grid */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Leads & Meetings Trend</h3>
                    <div className="chart-container">
                        {chartData && <LeadsChart data={chartData} />}
                    </div>
                </div>
                <div className="chart-card">
                    <h3>Lead Distribution</h3>
                    <div className="chart-container">
                        <LeadDistributionChart
                            qualified={leadDistribution.qualified}
                            unqualified={leadDistribution.unqualified}
                            freebie={leadDistribution.freebie}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <RecentActivity activities={activities} />
        </>
    );
}
