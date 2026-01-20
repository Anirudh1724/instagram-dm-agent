import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X, MessageSquare, Send, Loader2, Calendar } from 'lucide-react';
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
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          filteredLeads = filteredLeads.filter(lead => {
            if (!lead.lastMessageTime) return false;

            // Parse relative time back to date (approximate)
            const leadTime = lead.lastMessageTime;
            if (dateFilter === 'today') {
              return leadTime.includes('min') || leadTime.includes('hour') || leadTime === 'Just now';
            } else if (dateFilter === 'yesterday') {
              return leadTime.includes('1 day');
            } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
              // For custom dates, we'd need actual timestamps from backend
              return true; // Pass through for now
            }
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
        console.error('Failed to fetch conversation:', err);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedLead]);

  const filteredLeads = leads;

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'custom': return customStartDate && customEndDate ? `${customStartDate} - ${customEndDate}` : 'Custom';
      default: return 'All Time';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">All Leads</h1>
          <p className="text-muted-foreground">
            Manage and track all your conversations
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold text-primary">{filteredLeads.length} leads</span>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Advanced Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Advanced Filters
                {dateFilter !== 'all' && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                    1
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                Date Range
              </div>
              <DropdownMenuItem
                onClick={() => { setDateFilter('all'); setShowDatePicker(false); }}
                className={cn(dateFilter === 'all' && 'bg-primary/10')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                All Time
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setDateFilter('today'); setShowDatePicker(false); }}
                className={cn(dateFilter === 'today' && 'bg-primary/10')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Today
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setDateFilter('yesterday'); setShowDatePicker(false); }}
                className={cn(dateFilter === 'yesterday' && 'bg-primary/10')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Yesterday
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => { setDateFilter('custom'); setShowDatePicker(true); }}
                className={cn(dateFilter === 'custom' && 'bg-primary/10')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Custom Date Range
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Custom Date Picker */}
        {showDatePicker && dateFilter === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-wrap gap-4 items-center pt-2 border-t border-border"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From:</span>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-40 bg-secondary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To:</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-40 bg-secondary/50"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowDatePicker(false); setDateFilter('all'); }}
            >
              Clear
            </Button>
          </motion.div>
        )}

        {/* Active filter indicator */}
        {dateFilter !== 'all' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Date:</span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md flex items-center gap-2">
              {getDateFilterLabel()}
              <button onClick={() => { setDateFilter('all'); setShowDatePicker(false); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                'rounded-full border transition-all',
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Leads List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredLeads.length > 0 ? (
          filteredLeads.map((lead, index) => (
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
            className="glass-card p-12 text-center"
          >
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No leads found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </div>

      {/* Conversation Modal */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col bg-card border-border">
          {selectedLead && (
            <>
              <DialogHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={selectedLead.avatar} />
                    <AvatarFallback>{selectedLead.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="flex items-center gap-3">
                      {selectedLead.name}
                      <StatusBadge status={selectedLead.status} />
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedLead.username}</p>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
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
                        <div
                          className={cn(
                            'max-w-[80%] p-3 rounded-2xl',
                            message.sender === 'ai'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary text-secondary-foreground rounded-bl-md'
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              'text-xs mt-1',
                              message.sender === 'ai' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-border pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="bg-secondary/50"
                  />
                  <Button size="icon" className="shrink-0">
                    <Send className="w-4 h-4" />
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
