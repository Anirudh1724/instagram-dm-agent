import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MessageSquare, TrendingUp, Calendar, Loader2, Phone, Zap, ArrowUpRight, Activity, LogOut, User } from 'lucide-react';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DataAssistant } from '@/components/dashboard/DataAssistant';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { getDashboard, DashboardStats } from '@/lib/api';
import { DateRange } from "react-day-picker";
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const { mode, isLogoutConfirmOpen, setIsLogoutConfirmOpen } = useDashboard();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await getDashboard('daily', mode, dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), user?.voiceDirection);
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Failed to load dashboard data');
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
  }, [mode, dateRange]); // Added dateRange to dependencies

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 animate-spin border-t-emerald-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-500/50" />
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-400 animate-pulse uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Bento Grid Items Definition
  const isVoice = mode === 'voice';
  const isOutbound = isVoice && user?.voiceDirection === 'outbound';

  const statItems = [
    {
      title: !isVoice ? "Leads Contacted" : (isOutbound ? "Calls Dialed" : "Calls Received"),
      value: (stats?.leadsContacted || 0).toLocaleString(),
      change: stats?.leadsContactedChange,
      icon: !isVoice ? Users : Phone,
      colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
      gradient: "from-emerald-500/10 to-transparent"
    },
    {
      title: !isVoice ? "Unique Leads" : (isOutbound ? "Connected Calls" : "Unique Callers"),
      value: (stats?.uniqueLeads || 0).toLocaleString(),
      change: stats?.uniqueLeadsChange,
      icon: Users,
      colSpan: "col-span-1",
      gradient: "from-blue-500/10 to-transparent"
    },
    {
      title: !isVoice ? "Messages Sent" : (isOutbound ? "Voicemails Left" : "Calls Answered"),
      value: (stats?.messagesSent || 0).toLocaleString(),
      change: stats?.messagesSentChange,
      icon: MessageSquare,
      colSpan: "col-span-1",
      gradient: "from-purple-500/10 to-transparent"

    },
    {
      title: !isVoice ? "Response Rate" : (isOutbound ? "Connection Rate" : "Answer Rate"),
      value: `${stats?.responseRate || 0}%`,
      change: stats?.responseRateChange,
      icon: TrendingUp,
      colSpan: "col-span-1 md:col-span-1 lg:col-span-1",
      highlight: true,
      gradient: "from-emerald-500/20 to-emerald-500/5"
    },
    {
      title: !isVoice ? "Bookings" : "Meetings Booked",
      value: stats?.bookings || 0,
      change: stats?.bookingsChange,
      icon: Calendar,
      colSpan: "col-span-1 md:col-span-1 lg:col-span-1",
      highlight: true,
      gradient: "from-amber-500/20 to-amber-500/5"
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cinematic Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-white/5"
      >
        <div className="space-y-1 relative">
          <div className="absolute -left-6 top-1 w-1 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
          <h1 className="text-3xl font-bold text-white tracking-tighter">
            Good Evening, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-emerald-100/50 font-light text-sm">
            Your {mode === 'text' ? 'Text Agents' : (user?.voiceDirection === 'outbound' ? 'Outbound Voice Agents' : 'Inbound Voice Agents')} are active and performing.
          </p>
        </div>

        <DateRangeFilter />


        {/* User Profile & Logout (Moved from Sidebar) */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <p className="text-xs text-white/40">{user?.email}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl ring-1 ring-white/10 hover:ring-white/20 p-0 overflow-hidden shadow-lg">
                <Avatar className="h-full w-full rounded-xl">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-zinc-800 text-emerald-400 font-black tracking-tighter text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-900 border-white/10 text-white" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsLogoutConfirmOpen(true)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>


      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {error} - Showing cached/default values
        </div>
      )}

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statItems.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-white/5 backdrop-blur-xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10 hover:border-white/10",
              stat.colSpan
            )}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30 group-hover:opacity-50 transition-opacity", stat.gradient)} />

            <div className="relative z-10 flex flex-col justify-between h-full gap-2">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80 group-hover:scale-110 transition-transform shadow-inner">
                  <stat.icon className="w-5 h-5" />
                </div>
                {(stat.change !== undefined) && (
                  <div className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border", (stat.change || 0) >= 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30")}>
                    {(stat.change || 0) > 0 ? <ArrowUpRight className="w-3 h-3" /> : null}
                    {Math.abs(stat.change || 0)}%
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{stat.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart (2/3 width) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-3xl bg-zinc-900/60 border border-white/5 backdrop-blur-xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Activity Pulse</h3>
              <p className="text-sm text-white/40">Real-time engagement metrics</p>
            </div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/5">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <ActivityChart data={stats?.chartData} />
        </motion.div>

        {/* Funnel (1/3 width) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 rounded-3xl bg-zinc-900/60 border border-white/5 backdrop-blur-xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Conversion</h3>
            <p className="text-sm text-white/40">Funnel efficiency</p>
          </div>
          <ConversionFunnel data={stats?.funnelData} />
        </motion.div>
      </div>

      {/* Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-3xl bg-zinc-900/60 border border-white/5 backdrop-blur-xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="mb-6 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xl font-bold text-white">Live Operations Feed</h3>
        </div>
        <RecentActivity mode={mode} />
      </motion.div>

      {/* AI Data Assistant */}
      <DataAssistant />
    </div>
  );
}
