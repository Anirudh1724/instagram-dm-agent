import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, TrendingUp, Activity, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getClients, Client } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and client management</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={clients.length}
          change={0}
          icon={Building2}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Active Leads"
          value={totalLeads.toLocaleString()}
          change={0}
          icon={Users}
          delay={0.1}
        />
        <StatCard
          title="Avg. Conversion"
          value={`${avgConversion}%`}
          change={0}
          icon={TrendingUp}
          variant="success"
          delay={0.2}
        />
        <StatCard
          title="Connected"
          value={`${connectedClients}/${clients.length}`}
          icon={Activity}
          variant="success"
          delay={0.3}
        />
      </div>

      {/* Clients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">All Clients</h2>
            <p className="text-sm text-muted-foreground">Manage and monitor client accounts</p>
          </div>
          <Button onClick={() => navigate('/admin/clients/new')}>
            Add New Client
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead>Business</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="border-b border-border hover:bg-secondary/30"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.businessName}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.instagramHandle}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="font-medium">{client.leadsCount}</TableCell>
                    <TableCell>
                      <span className={client.conversionRate > 20 ? 'text-success' : 'text-warning'}>
                        {client.conversionRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No clients found. Add your first client to get started.
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
