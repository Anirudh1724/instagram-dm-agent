import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { LeadCard } from '@/components/dashboard/LeadCard';
import { getFollowupLeads, Lead } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function FollowupLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await getFollowupLeads(50);
      setLeads(response.leads);
    } catch (err) {
      console.error('Failed to fetch followup leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleRefresh = () => {
    fetchLeads(true);
  };

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
          <h1 className="text-3xl font-bold">Follow-up Leads</h1>
          <p className="text-muted-foreground">
            Leads that need re-engagement to keep the conversation going
          </p>
        </div>
        <Button className="gap-2" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh List
        </Button>
      </motion.div>

      {/* Alert Banner */}
      {leads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 border-warning/30 bg-warning/5"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-warning/20 text-warning">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-warning">Action Required</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {leads.length} leads haven't responded in over 24 hours.
                These leads may need a gentle nudge to continue the conversation.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-warning/20 text-warning">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{leads.length}</p>
            <p className="text-sm text-muted-foreground">Needs Follow-up</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/20 text-primary">
            <RefreshCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">--</p>
            <p className="text-sm text-muted-foreground">Re-engaged Today</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success/20 text-success">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">--</p>
            <p className="text-sm text-muted-foreground">Recovery Rate</p>
          </div>
        </div>
      </motion.div>

      {/* Leads List */}
      <div className="space-y-3">
        {leads.map((lead, index) => (
          <LeadCard key={lead.id} lead={lead} delay={index * 0.05} />
        ))}

        {leads.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <RefreshCcw className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              No leads currently need follow-up
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
