import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { getDashboard, DashboardStats } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await getDashboard('daily');
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Failed to load dashboard data');
        // Set default stats on error
        setStats({
          leadsContacted: 0,
          leadsContactedChange: 0,
          uniqueLeads: 0,
          uniqueLeadsChange: 0,
          messagesSent: 0,
          messagesSentChange: 0,
          responseRate: 0,
          responseRateChange: 0,
          bookings: 0,
          bookingsChange: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your leads today
        </p>
      </motion.div>

      {error && (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
          {error} - Showing default values
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Leads Contacted"
          value={(stats?.leadsContacted || 0).toLocaleString()}
          change={stats?.leadsContactedChange || 0}
          icon={Users}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Unique Leads"
          value={(stats?.uniqueLeads || 0).toLocaleString()}
          change={stats?.uniqueLeadsChange || 0}
          icon={Users}
          delay={0.1}
        />
        <StatCard
          title="Messages Sent"
          value={(stats?.messagesSent || 0).toLocaleString()}
          change={stats?.messagesSentChange || 0}
          icon={MessageSquare}
          delay={0.2}
        />
        <StatCard
          title="Response Rate"
          value={`${stats?.responseRate || 0}%`}
          change={stats?.responseRateChange || 0}
          icon={TrendingUp}
          variant="success"
          delay={0.3}
        />
        <StatCard
          title="Bookings"
          value={stats?.bookings || 0}
          change={stats?.bookingsChange || 0}
          icon={Calendar}
          variant="warning"
          delay={0.4}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart data={stats?.chartData} />
        <ConversionFunnel data={stats?.funnelData} />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
