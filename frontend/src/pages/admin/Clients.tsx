import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getClients, deleteClient, Client } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      await deleteClient(clientId);
      toast({
        title: 'Client Deleted',
        description: 'The client has been successfully deleted.',
      });
      fetchClients();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete client.',
        variant: 'destructive',
      });
    }
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage all client accounts</p>
        </div>
        <Button onClick={() => navigate('/admin/clients/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Client
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
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary/50"
        />
      </motion.div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client, index) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className="glass-card-hover p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {client.businessName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{client.businessName}</h3>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)}>
                    Edit Client
                  </DropdownMenuItem>
                  <DropdownMenuItem>View Analytics</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(client.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              {client.isConnected ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                  <XCircle className="w-3 h-3" />
                  Disconnected
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">{client.instagramHandle}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-2xl font-bold">{client.leadsCount}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${client.conversionRate > 20 ? 'text-success' : 'text-warning'}`}>
                  {client.conversionRate}%
                </p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/admin/clients/${client.id}`)}
            >
              Manage Client
            </Button>
          </motion.div>
        ))}

        {filteredClients.length === 0 && !loading && (
          <div className="col-span-full glass-card p-12 text-center">
            <p className="text-muted-foreground">No clients found</p>
          </div>
        )}
      </div>
    </div>
  );
}
