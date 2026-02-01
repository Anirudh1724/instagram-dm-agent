import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Clock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { LeadCard } from '@/components/dashboard/LeadCard';
import { getFollowupLeads, Lead } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function FollowupLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await getFollowupLeads(50);
      setLeads(response.leads);
    } catch (err) {
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <p className="text-amber-500/50 text-xs font-bold uppercase tracking-widest">Scanning Follow-ups...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-4"
      >
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight">Follow-up Required</h1>
          <p className="text-white/40 font-light text-sm">
            Re-engage with <span className="text-amber-400 font-bold">{leads.length}</span> stalled conversations
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRangeFilter />
          <Button
            variant="outline"
          className="bg-transparent border-amber-500/20 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 gap-2 h-10 px-4 rounded-xl"
          onClick={() => fetchLeads(true)}
          disabled={refreshing}
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh List
        </Button>
        </div>
      </motion.div>

      {/* Alert Banner (Dark Glass) */}
      {leads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-4 backdrop-blur-sm"
        >
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-amber-400">Action Required</h3>
            <p className="text-sm text-amber-200/50 mt-1 leading-relaxed">
              {leads.length} leads haven't responded in over 24 hours. These leads are at risk of churning without a gentle nudge.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats - Horizontal Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Response', value: leads.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Re-engaged Today', value: '0', icon: RefreshCcw, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Response Time', value: '--', icon: ArrowRight, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + (i * 0.1) }}
            className="rounded-xl bg-zinc-900/40 border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-colors"
          >
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs font-bold text-white/30 uppercase tracking-wider">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leads List */}
      <div className="space-y-2">
        {leads.length > 0 ? (
          leads.map((lead, index) => (
            <LeadCard key={lead.id} lead={lead} delay={index * 0.05} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/5 p-12 text-center opacity-50">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <RefreshCcw className="w-6 h-6 text-white/30" />
            </div>
            <p>No follow-ups needed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
