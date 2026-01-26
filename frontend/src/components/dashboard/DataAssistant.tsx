import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function DataAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Ready to analyze your performance data. What's on your mind?",
            timestamp: new Date()
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulated AI Processing
        setTimeout(() => {
            const responses = [
                "I've analyzed the last 24 hours. Lead volume is up 15%.",
                "Conversion rates are steady at 4.2%. A slight dip from yesterday.",
                "You have 3 high-value bookings scheduled for tomorrow.",
                "Your top performing agent is 'Sales-Bot-1' with a 90% response rate."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: randomResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1200);
    };


    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50, x: 50 }}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                        className="fixed bottom-24 right-6 w-[360px] h-[550px] rounded-[32px] bg-[#0a0a0a]/90 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden ring-1 ring-white/5"
                    >
                        {/* Gloss Header */}
                        <div className="relative p-5 border-b border-white/5 flex items-center justify-between z-10">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/10">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base tracking-tight">Data Copilot</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[10px] font-medium text-emerald-400/80">LIVE</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 relative z-10">
                                <Button variant="ghost" size="icon" onClick={() => setMessages([])} className="h-8 w-8 rounded-full text-white/40 hover:text-white hover:bg-white/10" title="Clear Chat">
                                    <Eraser className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full text-white/40 hover:text-white hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <ScrollArea className="flex-1 px-4 py-6">
                            <div className="space-y-6">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={cn(
                                            "flex gap-3",
                                            msg.role === 'user' ? "flex-row-reverse" : ""
                                        )}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                                                <Bot className="w-4 h-4 text-emerald-400" />
                                            </div>
                                        )}

                                        <div className={cn(
                                            "max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            msg.role === 'assistant'
                                                ? "bg-zinc-800 text-white/90 rounded-tl-sm border border-white/5"
                                                : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-medium rounded-tr-sm shadow-md shadow-emerald-900/10"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}

                                {isTyping && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-sm border border-white/5 flex gap-1.5 items-center h-10">
                                            <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        {/* Interactive Footer */}
                        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent pt-0">

                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity blur-md" />
                                <div className="relative bg-zinc-900 rounded-2xl border border-white/10 flex items-center p-1 pl-4 shadow-xl">
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask Copilot..."
                                        className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-white/20 h-10"
                                    />
                                    <Button
                                        size="icon"
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isTyping}
                                        className={cn(
                                            "h-9 w-9 rounded-xl transition-all",
                                            input.trim()
                                                ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20"
                                                : "bg-zinc-800 text-white/20"
                                        )}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Background Effects */}
                        <div className="absolute top-[20%] left-[-10%] w-[200px] h-[200px] bg-emerald-500/10 blur-[80px] pointer-events-none" />
                        <div className="absolute bottom-[20%] right-[-10%] w-[150px] h-[150px] bg-cyan-500/10 blur-[60px] pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] z-50 flex items-center justify-center transition-all duration-300 ring-1 ring-white/10",
                    isOpen
                        ? "bg-zinc-800 text-white"
                        : "bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-emerald-500/30"
                )}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="bot"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="relative w-full h-full p-1"
                        >
                            <img
                                src="/ai-avatar.png"
                                alt="AI Assistant"
                                className="w-full h-full object-cover rounded-full shadow-sm"
                            />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black animate-pulse" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </>
    );
}
