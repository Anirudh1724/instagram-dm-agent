import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, Loader2, Phone, MessageSquare, Check, X, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { getClients, deleteClient, updateClient, Client } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      toast({
        title: 'Error',
        description: 'Failed to load clients. Make sure you have admin access.',
        variant: 'destructive',
      });
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = (clientId: string) => {
    setDeleteId(clientId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteClient(deleteId);
      toast({ title: 'Client Deleted', description: 'The client has been successfully deleted.' });
      fetchClients();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete client.', variant: 'destructive' });
    } finally {
      setIsDeleteConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (clientId: string, newStatus: 'active' | 'inactive') => {
    try {
      await updateClient(clientId, { status: newStatus });
      toast({ title: 'Status Updated', description: `Client status changed to ${newStatus}.` });
      fetchClients();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };



  const togglePasswordVisibility = (clientId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const filteredClients = clients.filter(client =>
    client.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Client Registry
          </h1>
          <p className="text-muted-foreground mt-1">Manage network entities and configuration</p>
        </div>
        <Button 
          onClick={() => navigate('/admin/clients/new')} 
          className="gap-2 bg-white text-black hover:bg-gray-200 border-0 font-semibold shadow-lg shadow-white/10 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add Entity
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search registry..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/50 border-white/10 focus:border-white/20 transition-colors"
        />
      </motion.div>

      {/* Registry Table */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden shadow-2xl"
      >
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="text-white/60 font-medium uppercase tracking-wider text-xs py-4 pl-6">Business Name</TableHead>
              <TableHead className="text-white/60 font-medium uppercase tracking-wider text-xs py-4">Type</TableHead>
              <TableHead className="text-white/60 font-medium uppercase tracking-wider text-xs py-4">Username</TableHead>
              <TableHead className="text-white/60 font-medium uppercase tracking-wider text-xs py-4">Mobile Number</TableHead>
              <TableHead className="text-white/60 font-medium uppercase tracking-wider text-xs py-4">Password</TableHead>
              <TableHead className="text-white/60 font-medium uppercase tracking-wider text-xs py-4">Status</TableHead>
              <TableHead className="text-white/60 font-medium uppercase tracking-wider text-xs py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                {/* Business Name */}
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 border border-white/10">
                      <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-900 text-white font-bold">
                        {client.businessName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <span className="font-semibold text-white">{client.businessName}</span>
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell className="py-4">
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

                {/* Username */}
                <TableCell className="py-4">
                  <span className="text-sm text-white/80">
                     @{client.instagramHandle.replace('@', '')}
                  </span>
                </TableCell>

                {/* Mobile Number */}
                <TableCell className="py-4">
                  <span className="text-sm text-white/80">
                    {client.mobileNumber || <span className="text-white/30 italic">Not available</span>}
                  </span>
                </TableCell>

                {/* Password */}
                <TableCell className="py-4">
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

                {/* Status */}
                <TableCell className="py-4">
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

                {/* Actions */}
                <TableCell className="py-4 pr-6 text-right">
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
              </TableRow>
            ))}

            {filteredClients.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground hover:bg-transparent">
                  No active clients in the registry
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
