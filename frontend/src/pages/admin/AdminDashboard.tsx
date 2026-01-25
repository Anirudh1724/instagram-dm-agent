import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, TrendingUp, Activity, CheckCircle, XCircle, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getClients, Client } from '@/lib/api';
import { useDashboard } from '@/contexts/DashboardContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
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
import { LogOut, User } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isLogoutConfirmOpen, setIsLogoutConfirmOpen } = useDashboard();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await getClients();
        setClients(data);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const totalLeads = clients.reduce((sum, c) => sum + c.leadsCount, 0);
  const avgConversion = clients.length > 0
    ? (clients.reduce((sum, c) => sum + c.conversionRate, 0) / clients.length).toFixed(1)
    : '0';
  const connectedClients = clients.filter(c => c.isConnected).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 animate-spin border-t-cyan-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-500/50" />
            </div>
          </div>
          <p className="text-sm font-medium text-cyan-400 animate-pulse uppercase tracking-widest">Secure Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2 relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-transparent rounded-full opacity-50" />
          <h1 className="text-4xl font-bold text-white tracking-tight">Admin Command</h1>
          <p className="text-cyan-200/50 font-light tracking-wide text-sm">System Overview & Client Management</p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/admin/clients/new')}
            className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            ONBOARD CLIENT
          </Button>

          <div className="flex items-center gap-4 border-l border-white/10 pl-4 ml-2">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-bold text-white">{user?.name}</p>
              <p className="text-xs text-cyan-400/60 uppercase tracking-widest">{user?.role}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-xl ring-1 ring-white/10 hover:ring-white/20 p-0 overflow-hidden shadow-lg shadow-cyan-900/10">
                  <Avatar className="h-full w-full rounded-xl">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-zinc-800 text-cyan-400 font-black tracking-tighter text-sm">
                      {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-zinc-900 border-white/10 text-white" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground uppercase tracking-widest">
                      {user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => setIsLogoutConfirmOpen(true)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 cursor-pointer font-bold tracking-wide">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>TERMINATE SESSION</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Stats - Premium Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Clients", value: clients.length, icon: Building2, delay: 0 },
          { title: "Active Leads", value: totalLeads.toLocaleString(), icon: Users, delay: 0.1 },
          { title: "Avg. Conversion", value: `${avgConversion}%`, icon: TrendingUp, delay: 0.2 },
          { title: "System Health", value: `${connectedClients}/${clients.length}`, icon: Activity, delay: 0.3 }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            className="group relative overflow-hidden rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-md p-6 hover:bg-zinc-900/60 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-cyan-200/40 text-xs font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-900/20 group-hover:scale-110 transition-transform">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Clients Table - Glass Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />
            Client Registry
          </h2>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 tracking-widest uppercase">
            {clients.length} Entities
          </div>
        </div>

        <div className="p-2">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-white/5">
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5 pl-8">Business Entity</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5">Instagram</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5">Status</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5">Metrics</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5">Performance</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group border-white/5 transition-all hover:bg-white/[0.03]"
                  >
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-cyan-500/30 transition-colors">
                          <span className="text-sm font-bold text-white/70">{client.businessName.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{client.businessName}</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">{client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-white/70 font-medium">
                        @{client.instagramHandle}
                      </span>
                    </TableCell>
                    <TableCell>
                      {client.isConnected ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Offline
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-white">{client.leadsCount}</span>
                        <span className="text-[10px] text-white/30 uppercase">Total Leads</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-bold text-white/50">{client.conversionRate}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-1000", client.conversionRate > 20 ? 'bg-cyan-400' : 'bg-amber-400')}
                            style={{ width: `${Math.min(client.conversionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        MANAGE
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white/20" />
                      </div>
                      <p className="text-white/40 font-medium">No active clients in the registry</p>
                      <Button onClick={() => navigate('/admin/clients/new')} className="mt-2 text-cyan-400 variant-link">
                        + Initialize First Client
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}
