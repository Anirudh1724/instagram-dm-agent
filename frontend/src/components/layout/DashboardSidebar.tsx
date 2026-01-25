import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  Bot,
  UserCog,
  Building2,
  RefreshCcw,
  ShieldCheck,
  Zap,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const clientNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'All Leads', path: '/leads' },
  { icon: RefreshCcw, label: 'Follow-up Leads', path: '/followup' },
  { icon: Calendar, label: 'Booking Leads', path: '/bookings' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Building2, label: 'Clients', path: '/admin/clients' },
  { icon: BarChart3, label: 'Insights', path: '/admin/insights' },
  { icon: UserCog, label: 'Client Editor', path: '/admin/clients/new' },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode, setMode } = useDashboard();

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : clientNavItems;
  const accentBg = isAdmin ? 'bg-cyan-500/10' : 'bg-emerald-500/10';

  return (
    <aside
      className="w-[280px] min-h-screen relative z-50 ml-4 my-4 rounded-2xl overflow-hidden backdrop-blur-xl bg-zinc-900/60 border border-white/5 shadow-2xl flex flex-col"
    >
      {/* Gradient Glow */}
      <div className={cn("absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50")} />

      {/* Logo */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 shadow-lg relative overflow-hidden group", accentBg)}>
            <div className={cn("absolute inset-0 bg-white/5 rounded-xl animate-pulse")} />
            <span className={cn("text-xl font-black tracking-tighter z-10", isAdmin ? "text-cyan-400" : "text-emerald-400")}>
              LS
            </span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide">Lumoscale</h1>
            <div className="flex items-center gap-2">
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isAdmin ? "bg-cyan-500" : "bg-emerald-500")} />
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                {isAdmin ? 'Admin Console' : 'Client Mode'}
              </p>
            </div>
          </div>
        </div>

        {/* Agent Toggle (Client Only) - Top Placement */}
        {!isAdmin && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
            <button
              onClick={() => setMode('text')}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition-all duration-300 overflow-hidden",
                mode === 'text' ? "text-emerald-400" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {mode === 'text' && (
                <motion.div layoutId="modePill" className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-lg" />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-wider">TEXT</span>
              </div>
            </button>

            <button
              onClick={() => setMode('voice')}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition-all duration-300 overflow-hidden",
                mode === 'voice' ? "text-blue-400" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {mode === 'voice' && (
                <motion.div layoutId="modePill" className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-lg" />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Phone className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-wider">VOICE</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 h-14 px-5 font-medium transition-all duration-300 relative overflow-hidden group',
                isActive
                  ? 'bg-white/5 text-white shadow-lg'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
              onClick={() => navigate(item.path)}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full shadow-[0_0_10px_currentColor]", isAdmin ? 'bg-cyan-500' : 'bg-emerald-500')} />
              )}

              <item.icon className={cn('w-5 h-5 transition-colors', isActive ? (isAdmin ? 'text-cyan-400' : 'text-emerald-400') : 'group-hover:text-white')} />
              <span className="tracking-wide text-sm">{item.label}</span>

              {isActive && (
                <div
                  className={cn("absolute inset-0 opacity-10", isAdmin ? 'bg-cyan-500' : 'bg-emerald-500')}
                />
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-8 mt-auto text-center">
        <p className="text-[10px] text-white/10 font-mono">v2.4.0 (Stable)</p>
      </div>
    </aside>
  );
}
