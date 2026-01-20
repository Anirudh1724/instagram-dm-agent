import { motion } from 'framer-motion';
import { MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { Lead } from '@/lib/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  delay?: number;
}

export function LeadCard({ lead, onClick, delay = 0 }: LeadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.01 }}
      className="glass-card-hover p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12 border-2 border-border">
          <AvatarImage src={lead.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {lead.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground">{lead.name}</h4>
              <p className="text-sm text-muted-foreground">{lead.username}</p>
            </div>
            <StatusBadge status={lead.status} />
          </div>

          <p className="text-sm text-muted-foreground line-clamp-1">
            {lead.lastMessage}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {lead.lastMessageTime}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {lead.conversationCount} messages
            </span>
            {lead.responseTime && (
              <span className={cn(
                'px-2 py-0.5 rounded-full',
                lead.responseTime <= 5 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              )}>
                ~{lead.responseTime}s response
              </span>
            )}
          </div>

          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-md bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="shrink-0">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
