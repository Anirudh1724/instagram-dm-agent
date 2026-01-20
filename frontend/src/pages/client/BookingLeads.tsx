import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, Loader2 } from 'lucide-react';
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
        console.error('Failed to fetch booking leads:', err);
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
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold">Booking Leads</h1>
        <p className="text-muted-foreground">
          Leads showing booking intent or with confirmed appointments
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/20 text-primary">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{leads.length}</p>
            <p className="text-sm text-muted-foreground">Total Booking Leads</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-success/20 text-success">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{bookedLeads.length}</p>
            <p className="text-sm text-muted-foreground">Confirmed Bookings</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-warning/20 text-warning">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{intentLeads.length}</p>
            <p className="text-sm text-muted-foreground">Showing Intent</p>
          </div>
        </div>
      </motion.div>

      {/* Confirmed Bookings Section */}
      {bookedLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Confirmed Bookings
          </h2>
          {bookedLeads.map((lead, index) => (
            <LeadCard key={lead.id} lead={lead} delay={index * 0.05} />
          ))}
        </motion.div>
      )}

      {/* Intent Section */}
      {intentLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Showing Booking Intent
          </h2>
          {intentLeads.map((lead, index) => (
            <LeadCard key={lead.id} lead={lead} delay={index * 0.05} />
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {leads.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No booking leads yet</h3>
          <p className="text-muted-foreground">
            Leads with booking intent will appear here
          </p>
        </motion.div>
      )}
    </div>
  );
}
