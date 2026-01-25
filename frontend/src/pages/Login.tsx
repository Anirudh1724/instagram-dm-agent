import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ShieldCheck, Users, ArrowRight, Loader2, Sparkles, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

type Step = 'select' | 'login';

export default function Login() {
  const [step, setStep] = useState<Step>('select');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
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

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password, selectedRole!);
      if (success) {
        navigate(selectedRole === 'admin' ? '/admin' : '/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-black" />

      {/* Aurora / Spotlight Effect */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-sky-900/20 blur-[120px] rounded-full opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-900/10 blur-[100px] rounded-full opacity-30 pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl mx-6">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-10"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-lg shadow-black/50 backdrop-blur-md mb-6">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse delay-75" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-150" />
                  </div>
                  <span className="text-[10px] font-medium tracking-widest text-white/60">ONLINE</span>
                </div>

                <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-sm">
                  Lumoscale
                </h1>
                <p className="text-lg text-white/50 tracking-wide font-light">
                  Voice & Text Agents
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Admin Card */}
                <button
                  onClick={() => handleRoleSelect('admin')}
                  className="group relative h-[320px] rounded-2xl bg-zinc-900/40 border border-white/10 overflow-hidden backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-900/20"
                >
                  {/* Top Accent Line */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

                  {/* Internal Glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-30 group-hover:opacity-50 transition-opacity" />

                  <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-900/10 group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                      </div>
                      <div className="px-2 py-1 rounded bg-cyan-950/50 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 tracking-wider">
                        SECURE
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <h3 className="text-2xl font-bold text-white group-hover:text-cyan-100 transition-colors">
                        Admin Console
                      </h3>
                      <p className="text-sm text-cyan-200/40 font-medium leading-relaxed">
                        Full platform control. <br />
                        Analytics & system management.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Client Card */}
                <button
                  onClick={() => handleRoleSelect('client')}
                  className="group relative h-[320px] rounded-2xl bg-zinc-900/40 border border-white/10 overflow-hidden backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/20"
                >
                  {/* Top Accent Line */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

                  {/* Internal Glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-30 group-hover:opacity-50 transition-opacity" />

                  <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-900/10 group-hover:scale-110 transition-transform duration-500">
                        <Users className="w-7 h-7 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      </div>
                      <div className="px-2 py-1 rounded bg-emerald-950/50 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 tracking-wider">
                        PORTAL
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <h3 className="text-2xl font-bold text-white group-hover:text-emerald-100 transition-colors">
                        Client Dashboard
                      </h3>
                      <p className="text-sm text-emerald-200/40 font-medium leading-relaxed">
                        Manage conversations. <br />
                        View bookings & reports.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="relative rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-2xl p-10 shadow-2xl overflow-hidden ring-1 ring-white/5">
                {/* Accent Glow based on Role */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-${selectedRole === 'admin' ? 'cyan-500' : 'emerald-500'} to-transparent opacity-100 shadow-[0_0_20px_rgba(${selectedRole === 'admin' ? '6,182,212' : '16,185,129'},0.5)]`} />

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-8">
                    <button
                      onClick={() => {
                        setStep('select');
                        setSelectedRole(null);
                        setError('');
                      }}
                      className="group text-xs font-medium text-white/40 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <div className={`p-1 rounded-full bg-white/5 group-hover:bg-${selectedRole === 'admin' ? 'cyan-500' : 'emerald-500'} group-hover:text-black transition-all`}>
                        <ArrowRight className="w-3 h-3 rotate-180" />
                      </div>
                      BACK
                    </button>
                    <div className="flex gap-2 items-center">
                      <span className={`text-[10px] uppercase font-bold tracking-widest ${selectedRole === 'admin' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                        {selectedRole === 'admin' ? 'SECURE' : 'ENCRYPTED'}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedRole === 'admin' ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'} animate-pulse`} />
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                    {selectedRole === 'admin' ? 'Admin Access' : 'Client Access'}
                  </h2>
                  <p className="text-white/40 text-sm font-light">
                    Enter credentials to authenticate
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-white/70 ml-1">Email Identity</Label>
                      <div className="relative group">
                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-${selectedRole === 'admin' ? 'cyan-500' : 'emerald-500'} to-${selectedRole === 'admin' ? 'blue-600' : 'green-600'} rounded-lg opacity-0 group-focus-within:opacity-70 transition duration-500 blur-sm`} />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="relative bg-zinc-100 border-transparent text-zinc-900 h-12 focus:border-transparent focus:ring-0 placeholder:text-zinc-400 transition-all font-medium rounded-lg"
                          placeholder="name@lumoscale.ai"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-white/70 ml-1">Password Key</Label>
                      <div className="relative group">
                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-${selectedRole === 'admin' ? 'cyan-500' : 'emerald-500'} to-${selectedRole === 'admin' ? 'blue-600' : 'green-600'} rounded-lg opacity-0 group-focus-within:opacity-70 transition duration-500 blur-sm`} />
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="relative bg-zinc-100 border-transparent text-zinc-900 h-12 focus:border-transparent focus:ring-0 placeholder:text-zinc-400 transition-all font-medium rounded-lg"
                          placeholder="••••••••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center rounded-lg flex items-center justify-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full h-12 font-bold tracking-wide text-black transition-all hover:scale-[1.02] active:scale-[0.98] rounded-lg shadow-lg ${selectedRole === 'admin'
                      ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 shadow-cyan-500/20'
                      : 'bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 shadow-emerald-500/20'
                      }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>VERIFYING...</span>
                      </div>
                    ) : (
                      'INITIATE SESSION'
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
