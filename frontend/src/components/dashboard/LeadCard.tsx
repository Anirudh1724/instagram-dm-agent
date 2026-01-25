import { motion } from 'framer-motion';
import { MessageSquare, Clock, ExternalLink, ChevronRight } from 'lucide-react';
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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group relative"
      onClick={onClick}
    >
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className={cn(
        "relative rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-4 cursor-pointer transition-all duration-300",
        "hover:bg-zinc-900/60 hover:border-white/10 hover:shadow-xl hover:shadow-black/20",
        "group-hover:translate-x-1"
      )}>
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10 border border-white/10 shadow-sm">
            <AvatarImage src={lead.avatar} />
            <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs font-bold">
              {lead.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Identity */}
            <div className="md:col-span-3">
              <h4 className="font-bold text-white text-sm truncate">{lead.name}</h4>
              <p className="text-xs text-white/40 truncate">@{lead.username}</p>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <StatusBadge status={lead.status} />
            </div>

            {/* Message Snippet */}
            <div className="md:col-span-4 hidden md:block">
              <p className="text-xs text-white/60 line-clamp-1 italic">
                "{lead.lastMessage}"
              </p>
            </div>

            {/* Metrics */}
            <div className="md:col-span-3 flex items-center justify-end gap-3 text-xs text-white/40">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                <Clock className="w-3 h-3" />
                {lead.lastMessageTime}
              </div>
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChevronRight className="w-3 h-3 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
