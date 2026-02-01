import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function UpgradePlan() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex gap-4 mb-4"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-sm font-bold tracking-wide">TEXT AGENT ACTIVE</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40">
           <Sparkles className="w-3 h-3" />
           <span className="text-sm font-bold tracking-wide">VOICE AGENT LOCKED</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center mb-8 relative overflow-hidden mx-auto"
      >
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
        <Zap className="w-10 h-10 text-blue-400" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-6"
      >
        Unlock Voice Intelligence
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-white/60 mb-8 leading-relaxed"
      >
        Your current plan includes our powerful **Text Agent**. <br />
        To activate **Voice Capabilities** and handle real-time calls, please upgrade your subscription.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10"
      >
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">Enterprise Security</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium">Real-time Processing</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 w-full justify-center"
      >
        <Button
          size="lg"
          className="bg-white text-black hover:bg-gray-200 font-bold px-8 h-12 rounded-xl w-full sm:w-auto"
          onClick={() => window.open('https://cal.com/lumoscale', '_blank')}
        >
          Contact Sales
        </Button>
      </motion.div>
    </div>
  );
}
