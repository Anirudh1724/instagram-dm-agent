import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, TrendingUp, Activity, CheckCircle, XCircle, Loader2, Plus, ShieldCheck, Phone, MessageSquare, Check, X, MoreVertical, Eye, EyeOff } from 'lucide-react';
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
import { getClients, updateClient, deleteClient, Client } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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

  const handleStatusChange = async (clientId: string, newStatus: 'active' | 'inactive') => {
    try {
      await updateClient(clientId, { status: newStatus });
      toast({ title: 'Status Updated', description: `Client status changed to ${newStatus}.` });
      // update local state
      setClients(clients.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const handleDelete = (clientId: string) => {
    setDeleteId(clientId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteClient(deleteId);
      toast({ title: 'Client Deleted', description: 'The client has been successfully deleted.' });
      setClients(clients.filter(c => c.id !== deleteId));
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete client.', variant: 'destructive' });
    } finally {
      setIsDeleteConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const togglePasswordVisibility = (clientId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

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
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5 pl-8">Business Name</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5">Type</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5">Username</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5">Mobile Number</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5">Password</TableHead>
                <TableHead className="text-xs font-bold text-cyan-200/40 uppercase tracking-widest py-5">Status</TableHead>
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
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-5 border-0",
                          client.agentType === 'voice' 
                            ? "bg-blue-500/10 text-blue-400" 
                            : "bg-emerald-500/10 text-emerald-400"
                        )}
                      >
                        {client.agentType === 'voice' ? <Phone className="w-3 h-3 mr-1" /> : <MessageSquare className="w-3 h-3 mr-1" />}
                        {client.agentType === 'voice' ? 'Voice' : 'Text'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-white/70 font-medium">
                        @{client.instagramHandle.replace('@', '')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-white/70 font-medium">
                        {client.mobileNumber || <span className="text-white/30 italic">Not available</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/70 font-medium font-mono min-w-[80px]">
                          {visiblePasswords[client.id] ? (client.password || '••••••••') : '••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 hover:bg-white/10 text-white/40 hover:text-white"
                          onClick={() => togglePasswordVisibility(client.id)}
                        >
                          {visiblePasswords[client.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2 gap-2 hover:bg-white/10">
                            <div className={cn(
                              "w-2 h-2 rounded-full shadow-[0_0_8px]",
                              client.status === 'active' 
                                ? "bg-emerald-500 shadow-emerald-500/50" 
                                : "bg-gray-500 shadow-gray-500/50"
                            )} />
                            <span className={cn(
                              "capitalize text-xs font-medium",
                              client.status === 'active' ? "text-emerald-400" : "text-gray-400"
                            )}>
                              {client.status || 'Active'}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[140px] bg-zinc-900 border-white/10 text-white">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">Set Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'active')} className="gap-2 focus:bg-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            Active
                            {client.status === 'active' && <Check className="w-3 h-3 ml-auto opacity-50" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'inactive')} className="gap-2 focus:bg-gray-500/20">
                            <div className="w-2 h-2 rounded-full bg-gray-500" />
                            Inactive
                            {client.status === 'inactive' && <Check className="w-3 h-3 ml-auto opacity-50" />}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4 text-white/60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                          <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)}>
                            Edit Configuration
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-red-500/10" onClick={() => handleDelete(client.id)}>
                            Delete Entity
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white border ring-1 ring-white/5 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-red-400 flex items-center gap-2">
              <X className="w-5 h-5" />
              Delete Entity?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action cannot be undone. This will permanently remove the client and all associated data from the registry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 rounded-xl font-bold tracking-wide"
            >
              DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
