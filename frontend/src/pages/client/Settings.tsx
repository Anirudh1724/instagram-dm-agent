import { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Settings as SettingsIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getInstagramConnectUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Redirect to Instagram OAuth
      const connectUrl = getInstagramConnectUrl();
      window.location.href = connectUrl;
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to start Instagram connection. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: 'Instagram Disconnected',
      description: 'Your Instagram account has been disconnected.',
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and integrations
        </p>
      </motion.div>

      {/* Instagram Connection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Instagram Connection</h2>
            <p className="text-sm text-muted-foreground">
              Connect your Instagram account to enable AI messaging
            </p>
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="space-y-4">
          {isConnected ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium">Connected</p>
                  <p className="text-sm text-muted-foreground">Your Instagram account is connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">No account connected</p>
                  <p className="text-sm text-muted-foreground">Connect to start receiving leads</p>
                </div>
              </div>
              <Button onClick={handleConnect} disabled={isConnecting} className="gap-2">
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Instagram className="w-4 h-4" />
                )}
                Connect Instagram
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Configure how you receive updates
            </p>
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>New Lead Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when new leads arrive</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Booking Confirmations</Label>
              <p className="text-sm text-muted-foreground">Alerts when leads book appointments</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Receive weekly analytics summary</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>AI Performance Alerts</Label>
              <p className="text-sm text-muted-foreground">Notify when AI metrics drop below target</p>
            </div>
            <Switch />
          </div>
        </div>
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 space-y-6"
      >
        <h2 className="text-lg font-semibold">Account Information</h2>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" defaultValue={user?.email || ''} className="bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business">Business Name</Label>
            <Input id="business" defaultValue={user?.name || ''} className="bg-secondary/50" />
          </div>
        </div>

        <Button>Save Changes</Button>
      </motion.div>
    </div>
  );
}
