import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertTriangle, Brain, Zap, Target, Loader2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDashboard, DashboardStats } from '@/lib/api';

const defaultFunnelData = [
  { name: 'New Leads', value: 0, fill: 'hsl(187, 85%, 53%)' },
  { name: 'Engaged', value: 0, fill: 'hsl(160, 84%, 39%)' },
  { name: 'Qualified', value: 0, fill: 'hsl(38, 92%, 50%)' },
  { name: 'Booked', value: 0, fill: 'hsl(280, 65%, 60%)' },
  { name: 'Converted', value: 0, fill: 'hsl(340, 75%, 55%)' },
];

const defaultWeeklyData = [
  { name: 'Week 1', leads: 0, conversions: 0, revenue: 0 },
  { name: 'Week 2', leads: 0, conversions: 0, revenue: 0 },
  { name: 'Week 3', leads: 0, conversions: 0, revenue: 0 },
  { name: 'Week 4', leads: 0, conversions: 0, revenue: 0 },
];

const aiMetrics = [
  { name: 'Response Time', value: 5.2, target: 8, unit: 's', status: 'good' },
  { name: 'Qualification Rate', value: 68, target: 60, unit: '%', status: 'good' },
  { name: 'Booking Conversion', value: 24, target: 20, unit: '%', status: 'good' },
  { name: 'Message Quality', value: 94, target: 90, unit: '%', status: 'good' },
];

const leakPoints = [
  { stage: 'New → Engaged', dropoff: 27, reason: 'No initial response', severity: 'high' },
  { stage: 'Engaged → Qualified', dropoff: 15, reason: 'Price concerns', severity: 'medium' },
  { stage: 'Qualified → Booked', dropoff: 8, reason: 'Scheduling conflicts', severity: 'low' },
];

export default function Insights() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDashboard('weekly');
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const funnelData = stats?.funnelData && stats.funnelData.length > 0 ? stats.funnelData : defaultFunnelData;
  const weeklyData = defaultWeeklyData; // Would come from API in production

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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Insights & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and AI performance metrics
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          <TabsTrigger value="ai">AI Metrics</TabsTrigger>
          <TabsTrigger value="leaks">Leak Detection</TabsTrigger>
        </TabsList>

        {/* Weekly Report */}
        <TabsContent value="weekly" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Total Leads</h3>
              </div>
              <p className="text-3xl font-bold">{stats?.leadsContacted || 0}</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                {stats?.leadsContactedChange || 0}% vs last week
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-success/20 text-success">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Bookings</h3>
              </div>
              <p className="text-3xl font-bold">{stats?.bookings || 0}</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                {stats?.bookingsChange || 0}% vs last week
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-warning/20 text-warning">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">Response Rate</h3>
              </div>
              <p className="text-3xl font-bold">{stats?.responseRate || 0}%</p>
              <p className="text-sm text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                {stats?.responseRateChange || 0}% vs last week
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold mb-6">Weekly Performance Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" />
                  <YAxis stroke="hsl(215, 20%, 55%)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 10%)',
                      border: '1px solid hsl(217, 33%, 17%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="leads" fill="hsl(187, 85%, 53%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversions" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="monthly" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold mb-6">Monthly Conversion Path</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funnelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={150}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: 'hsl(215, 20%, 55%)' }}
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 10%)',
                      border: '1px solid hsl(217, 33%, 17%)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </TabsContent>

        {/* AI Metrics */}
        <TabsContent value="ai" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">AI Performance Metrics</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiMetrics.map((metric, index) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{metric.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Target: {metric.target}{metric.unit}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">{metric.value}</span>
                    <span className="text-lg text-muted-foreground mb-1">{metric.unit}</span>
                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-success/20 text-success">
                      ✓ On Target
                    </span>
                  </div>
                  <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + 0.1 * index }}
                      className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Leak Detection */}
        <TabsContent value="leaks" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-warning/20 text-warning">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Funnel Leak Points</h3>
            </div>

            <div className="space-y-4">
              {leakPoints.map((leak, index) => (
                <motion.div
                  key={leak.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-4 rounded-lg border ${leak.severity === 'high'
                      ? 'border-destructive/30 bg-destructive/5'
                      : leak.severity === 'medium'
                        ? 'border-warning/30 bg-warning/5'
                        : 'border-muted bg-secondary/30'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{leak.stage}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{leak.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${leak.severity === 'high' ? 'text-destructive' :
                          leak.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                        }`}>
                        -{leak.dropoff}%
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${leak.severity === 'high' ? 'bg-destructive/20 text-destructive' :
                          leak.severity === 'medium' ? 'bg-warning/20 text-warning' :
                            'bg-muted text-muted-foreground'
                        }`}>
                        {leak.severity} priority
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
