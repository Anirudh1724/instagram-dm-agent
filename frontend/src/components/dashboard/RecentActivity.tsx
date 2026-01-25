import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Calendar, CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getActivity, Activity } from '@/lib/api';

const iconStyles = {
  message: 'bg-primary/20 text-primary',
  booking: 'bg-warning/20 text-warning',
  conversion: 'bg-success/20 text-success',
  new_lead: 'bg-info/20 text-info',
  missed: 'bg-destructive/20 text-destructive',
  answered: 'bg-primary/20 text-primary',
  voicemail: 'bg-secondary/20 text-secondary-foreground',
};

const getActivityIcon = (status: string) => {
  if (status === 'booked' || status === 'booking') return Calendar;
  if (status === 'converted') return CheckCircle;
  if (status === 'new' || status === 'greeting') return UserPlus;
  if (status === 'missed') return Loader2; // using Loader2 as placeholder or maybe PhoneOff if available? Let's check imports
  if (status === 'answered') return MessageSquare; // Phone icon would be better
  return MessageSquare;
};

const getActivityType = (status: string): keyof typeof iconStyles => {
  if (status === 'booked' || status === 'booking') return 'booking';
  if (status === 'converted') return 'conversion';
  if (status === 'new' || status === 'greeting') return 'new_lead';
  if (status === 'missed') return 'missed';
  if (status === 'answered') return 'answered';
  if (status === 'voicemail') return 'voicemail';
  return 'message';
};

interface RecentActivityProps {
  mode?: 'text' | 'voice';
}

export function RecentActivity({ mode = 'text' }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const data = await getActivity(5, mode);
        setActivities(data);
      } catch (err) {
        console.error('Failed to fetch activity:', err);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [mode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest updates from your {mode === 'text' ? 'leads' : 'calls'}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.status);
            const type = getActivityType(activity.status);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.customer_name}`} />
                  <AvatarFallback>{activity.customer_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${iconStyles[type]}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <p className="text-sm font-medium truncate">
                      {activity.customer_name || 'Unknown'} {activity.customer_username && activity.customer_username !== 'Voice Caller' ? `(${activity.customer_username})` : ''}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {activity.last_message || 'No message'}
                  </p>
                </div>

                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.last_message_time || ''}
                </span>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No recent activity
        </div>
      )}
    </motion.div>
  );
}
