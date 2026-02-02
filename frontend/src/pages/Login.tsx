import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

// Import generated images (using public folder path assumption or direct import if configured)
// Since we can't import dynamic paths easily in Vite without setup, we'll assume they are moved to public or imported.
// For this environment, we will use the absolute paths converted to relative for the demo or simple styling.
// BETTER APPROACH: We will use the images as background-image in style or img tags.

const GIRL_AVATAR = "/assets/girl.png";
const BOY_AVATAR = "/assets/boy.png";


const VOICE_TRANSCRIPT = [
  { sender: 'user', text: "Can you check my appointment?" },
  { sender: 'agent', text: "Sure! Checking your schedule now..." },
  { sender: 'agent', text: "I found a slot at 4 PM tomorrow." },
  { sender: 'user', text: "That works perfectly, thanks!" },
  { sender: 'agent', text: "Great, I've confirmed it for you." }
];

const CHAT_TRANSCRIPT = [
  { sender: 'user', text: "What are your support hours?" },
  { sender: 'agent', text: "We're available 24/7 for you." },
  { sender: 'user', text: "Do you integrate with CRM?" },
  { sender: 'agent', text: "Yes, we support Salesforce and Hubspot natively." }
];

export default function Login() {
  const [role, setRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password, role);
      if (success) {
        setTimeout(() => {
          navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        }, 1000);
      } else {
        setError('Invalid credentials');
        setIsLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-black overflow-hidden font-sans">

      {/* LEFT PANEL: Visualizations (55%) */}
      <div className="hidden lg:flex flex-col relative w-[55%] h-screen bg-zinc-950 border-r border-white/5 overflow-hidden">

        {/* --- TOP HALF: VOICE AGENT (GIRL) --- */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 to-zinc-950" />

          <div className="relative z-10 flex gap-8 items-center w-full max-w-3xl px-8">

            {/* Avatar Container */}
            <div className="relative group">
              {/* Pulse Effect for "Speaking" */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl"
              />
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                {/* Placeholder for local dev if image path fails, but using the generated path in artifact dir */}
                {/* NOTE: In a real app, move these to /public. For now, we assume user can see them via artifact viewer or we simulate with colored divs if broken */}
                <img
                  src={GIRL_AVATAR}
                  alt="Voice Agent"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-cyan-900');
                  }}
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-[9px] text-cyan-400 font-bold tracking-widest uppercase whitespace-nowrap">
                Voice Intelligence
              </div>
            </div>

            {/* Transcript Area */}
            <div className="flex-1 space-y-3">
              <h3 className="text-cyan-500/50 text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Live Transcript
              </h3>
              <div className="space-y-3">
                {VOICE_TRANSCRIPT.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 1.5, duration: 0.5 }}
                    className={cn(
                      "flex gap-3 text-sm font-medium",
                      msg.sender === 'agent' ? "text-cyan-100" : "text-zinc-500"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] uppercase font-bold w-12 text-right pt-1 opacity-50",
                      msg.sender === 'agent' ? "text-cyan-400" : "text-zinc-600"
                    )}>
                      {msg.sender}
                    </span>
                    <span className="bg-white/5 px-3 py-1.5 rounded-lg rounded-tl-none border border-white/5">
                      {msg.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM HALF: TEXT AGENT (BOY) --- */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-zinc-950" />

          <div className="relative z-10 flex flex-row-reverse gap-8 items-center w-full max-w-3xl px-8">

            {/* Avatar Container */}
            <div className="relative">
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <img
                  src={BOY_AVATAR}
                  alt="Text Agent"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-emerald-900');
                  }}
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-[9px] text-emerald-400 font-bold tracking-widest uppercase whitespace-nowrap">
                Chat Intelligence
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 space-y-3 text-right">
              <h3 className="text-emerald-500/50 text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2 justify-end">
                Live Chat Stream
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <div className="space-y-3 relative h-40">
                <AnimatePresence>
                  {CHAT_TRANSCRIPT.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 1 + i * 1.5, duration: 0.5 }}
                      className={cn(
                        "flex gap-3 justify-end items-center absolute w-full",
                      )}
                      style={{ bottom: `${(CHAT_TRANSCRIPT.length - 1 - i) * 35}px` }}
                    >
                      <span className={cn(
                        "px-4 py-2 rounded-2xl font-medium text-sm backdrop-blur-md shadow-lg border",
                        msg.sender === 'agent'
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100 rounded-tr-none"
                          : "bg-zinc-800/80 border-white/10 text-zinc-400 rounded-br-none"
                      )}>
                        {msg.text}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: Login Form (45%) */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950/80 backdrop-blur-3xl relative z-10 border-l border-white/5">
        <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">

          <div className="text-center space-y-2 mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Lumoscale
            </h2>
            <p className="text-zinc-500 text-sm">Unified Neural Interface</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-zinc-900/80 p-1 rounded-lg border border-white/10 inline-flex items-center">
              <button
                onClick={() => setRole('client')}
                className={cn(
                  "px-6 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                  role === 'client' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <UserCircle className="w-3 h-3" />
                Client Portal
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={() => setRole('admin')}
                className={cn(
                  "px-6 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                  role === 'admin' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <ShieldCheck className="w-3 h-3" />
                Admin Console
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Identity</Label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900/50 border-white/10 h-12 focus:border-white/20 focus:ring-0 text-white font-medium transition-all rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Access Key</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-900/50 border-white/10 h-12 focus:border-white/20 focus:ring-0 text-white font-medium transition-all rounded-xl"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs text-center font-medium bg-red-500/5 p-3 rounded-lg border border-red-500/10 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-12 font-bold tracking-wide text-black hover:scale-[1.01] active:scale-[0.99] transition-all rounded-xl",
                role === 'admin' ? "bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20 shadow-lg" : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 shadow-lg"
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <span className="flex items-center gap-2">INITIATE SESSION <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </form>

        </div>
      </div>

    </div>
  );
}
