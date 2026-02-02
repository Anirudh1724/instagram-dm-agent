import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, Loader2, Star } from 'lucide-react';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { LeadCard } from '@/components/dashboard/LeadCard';
import { getBookingLeads, Lead } from '@/lib/api';

export default function BookingLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const response = await getBookingLeads(50);
        setLeads(response.leads);
      } catch (err) {
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const bookedLeads = leads.filter(l => l.status === 'booked' || l.status === 'converted');
  const intentLeads = leads.filter(l => l.showsBookingIntent && l.status !== 'booked' && l.status !== 'converted');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cinematic Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-4"
      >
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight">Booking Pipeline</h1>
          <p className="text-white/40 font-light text-sm">
            High-intent leads and confirmed appointments
          </p>
        </div>
        <DateRangeFilter />
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-zinc-900/40 border border-white/5 p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-pink-500/10 text-pink-400">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{leads.length}</p>
            <p className="text-xs font-bold text-white/30 uppercase tracking-wider">Total Pipeline</p>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900/40 border border-white/5 p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{bookedLeads.length}</p>
            <p className="text-xs font-bold text-white/30 uppercase tracking-wider">Confirmed</p>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900/40 border border-white/5 p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{intentLeads.length}</p>
            <p className="text-xs font-bold text-white/30 uppercase tracking-wider">Showing Intent</p>
          </div>
        </div>
      </div>

      {/* Confirmed Bookings */}
      {bookedLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <h2 className="text-lg font-bold text-white">Confirmed Appointments</h2>
          </div>
          <div className="space-y-2">
            {bookedLeads.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} delay={index * 0.05} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Intent Leads */}
      {intentLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
            <h2 className="text-lg font-bold text-white">Potential Bookings</h2>
          </div>
          <div className="space-y-2">
            {intentLeads.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} delay={index * 0.05} />
            ))}
          </div>
        </motion.div>
      )}

      {leads.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/5 p-12 text-center opacity-50">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-white/30" />
          </div>
          <p>No booking leads found.</p>
        </div>
      )}
    </div>
  );
}
