import { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Settings as SettingsIcon, CheckCircle, XCircle, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getInstagramConnectUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function Settings() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const connectUrl = getInstagramConnectUrl();
      window.location.href = connectUrl;
    } catch (error) {
      toast({ title: 'Connection Failed', description: 'Failed to start Instagram connection.', variant: 'destructive' });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({ title: 'Disconnected', description: 'Instagram account disconnected.' });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-4"
      >
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-white/40 font-light text-sm">
            Integrations and account configuration
          </p>
        </div>
      </motion.div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Instagram Connect - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl p-8 space-y-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-900/30">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Instagram Integration</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest">Connect Account</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-black/20 border border-white/5">
            {isConnected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <div>
                    <p className="text-white font-medium">Active Connection</p>
                    <p className="text-xs text-emerald-400">@lumoscale</p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleDisconnect} className="border-red-500/30 text-red-400 hover:bg-red-500/10">Disconnect</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-white/20 mt-2" />
                  <p className="text-sm text-white/60 leading-relaxed">Connect your professional Instagram account to enable AI auto-responses and lead tracking.</p>
                </div>
                <Button onClick={handleConnect} disabled={isConnecting} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/20 py-6 text-base font-bold rounded-xl">
                  {isConnecting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Instagram className="w-5 h-5 mr-2" />}
                  Connect Instagram
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Profile */}
          <div className="rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl p-8 space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 shadow-lg">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Account Details</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest">Profile Configuration</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Business Name</Label>
                <Input defaultValue={user?.name || ''} className="bg-black/20 border-white/10 text-white rounded-xl h-11 focus:border-white/20 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Email Address</Label>
                <Input defaultValue={user?.email || ''} className="bg-black/20 border-white/10 text-white rounded-xl h-11 focus:border-white/20 transition-all font-medium" />
              </div>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white h-11 rounded-xl">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl p-8"
      >
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-blue-500" />
          Notification Preferences
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { label: 'New Lead Alerts', desc: 'Instant notification on new inquiry' },
            { label: 'Booking Confirmations', desc: 'Alerts for scheduled appointments' },
            { label: 'Weekly Reports', desc: 'Digest of performance metrics' },
            { label: 'AI Intervention', desc: 'When AI needs human assistance' }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="font-bold text-white text-sm">{item.label}</p>
                <p className="text-xs text-white/40">{item.desc}</p>
              </div>
              <Switch />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
