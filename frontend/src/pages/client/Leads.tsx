import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X, MessageSquare, Send, Loader2, Calendar, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LeadCard } from '@/components/dashboard/LeadCard';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getLeads, getConversation, Lead, Message } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type LeadFilter = 'all' | 'qualified' | 'unqualified' | 'freebie';
type DateFilter = 'all' | 'today' | 'yesterday' | 'custom';

const statusFilters: { label: string; value: LeadFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Unqualified', value: 'unqualified' },
  { label: 'Freebie', value: 'freebie' },
];

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<LeadFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const response = await getLeads({
          limit: 50,
          search: searchQuery || undefined,
          status: activeFilter !== 'all' ? activeFilter : undefined,
        });

        // Apply date filter client-side
        let filteredLeads = response.leads;
        if (dateFilter !== 'all') {
          // Date filtering logic (simplified for mockup)
          filteredLeads = filteredLeads.filter(lead => {
            const leadTime = lead.lastMessageTime;
            if (dateFilter === 'today') return leadTime.includes('min') || leadTime.includes('hour') || leadTime === 'Just now';
            return true;
          });
        }
        setLeads(filteredLeads);
      } catch (err) {
        console.error('Failed to fetch leads:', err);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchLeads, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, activeFilter, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedLead) {
        setMessages([]);
        return;
      }
      try {
        setMessagesLoading(true);
        const msgs = await getConversation(selectedLead.id);
        setMessages(msgs);
      } catch (err) {
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [selectedLead]);

  return (
    <div className="space-y-6">
      {/* Cinematic Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-white/5 pb-4"
      >
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight">Active Leads</h1>
          <p className="text-white/40 font-light text-sm">
            Tracking <span className="text-emerald-400 font-bold">{leads.length}</span> active conversations
          </p>
        </div>
      </motion.div>

      {/* Glass Filter Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-zinc-900/40 border border-white/5 p-4 space-y-4 backdrop-blur-md"
      >
        <div className="flex flex-col md:flex-row gap-4">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-black/20 border-white/5 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:bg-black/40 transition-all rounded-xl"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border',
                  activeFilter === filter.value
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    : 'bg-transparent text-white/40 border-white/5 hover:bg-white/5 hover:text-white/60'
                )}
              >
                {filter.label}
              </button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 px-3 bg-transparent border-white/5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl">
                  <Calendar className="w-4 h-4 mr-2" />
                  Filter Date
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                <DropdownMenuItem onClick={() => setDateFilter('all')} className="hover:bg-white/10 focus:bg-white/10 text-white/70 focus:text-white">All Time</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateFilter('today')} className="hover:bg-white/10 focus:bg-white/10 text-white/70 focus:text-white">Today</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Leads Registry */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-white/20 text-xs uppercase tracking-widest font-bold">Retrieving Data...</p>
          </div>
        ) : leads.length > 0 ? (
          leads.map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              delay={index * 0.05}
              onClick={() => setSelectedLead(lead)}
            />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-white/10 p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-white/20" />
            </div>
            <h3 className="font-bold text-white mb-1">No Leads Found</h3>
            <p className="text-white/40 text-sm">Adjust filters to find what you're looking for.</p>
          </motion.div>
        )}
      </div>

      {/* Conversation Modal (Dark Mode) */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col bg-zinc-950 border-white/10 text-white p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
          {selectedLead && (
            <>
              <DialogHeader className="p-6 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border border-white/10">
                      <AvatarImage src={selectedLead.avatar} />
                      <AvatarFallback className="bg-zinc-800 text-zinc-400">{selectedLead.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="flex items-center gap-3 text-lg font-bold">
                      {selectedLead.name}
                      <StatusBadge status={selectedLead.status} />
                    </DialogTitle>
                    <p className="text-sm text-white/40">@{selectedLead.username}</p>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 p-6 bg-black/20">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex',
                          message.sender === 'ai' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div className={cn("flex flex-col max-w-[80%]", message.sender === 'ai' ? 'items-end' : 'items-start')}>
                          <div
                            className={cn(
                              'p-4 rounded-2xl text-sm leading-relaxed shadow-lg',
                              message.sender === 'ai'
                                ? 'bg-emerald-600 text-white rounded-tr-sm'
                                : 'bg-zinc-800 text-white/90 rounded-tl-sm'
                            )}
                          >
                            {message.content}
                          </div>
                          <span className="text-[10px] text-white/20 mt-2 px-1">{message.timestamp}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <MessageSquare className="w-12 h-12 mb-2" />
                    <p>No messages recorded</p>
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 bg-zinc-900/50 border-t border-white/5 backdrop-blur-md">
                <div className="flex gap-3">
                  <Input
                    placeholder="Type AI response manually..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="bg-black/40 border-white/10 text-white h-11 rounded-xl focus:border-emerald-500/50"
                  />
                  <Button size="icon" className="shrink-0 h-11 w-11 rounded-xl bg-emerald-600 hover:bg-emerald-500">
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
