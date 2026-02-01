import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Trash2, MessageSquare, Phone, ShieldCheck, Sparkles, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getClient, createClient, updateClient, deleteClient, Client } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ClientEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    instagramHandle: '',
    agentType: 'text' as 'text' | 'voice',
    greeting: '',
    qualification: '',
    booking: '',
    mobileNumber: '',
    followup: '',
  });

  useEffect(() => {
    if (!isNew && id) {
      const fetchClient = async () => {
        try {
          setLoading(true);
          const client = await getClient(id);
          if (client) {
            setFormData({
              businessName: client.businessName || '',
              email: client.email || '',
              password: '',
              instagramHandle: client.instagramHandle || '',
              agentType: client.agentType || 'text',
              greeting: client.aiPrompts?.greeting || '',
              qualification: client.aiPrompts?.qualification || '',
              booking: client.aiPrompts?.booking || '',
              mobileNumber: client.mobileNumber || '',
              followup: client.aiPrompts?.followup || '',
            });
          }
        } catch (err) {
          toast({ title: 'Error', description: 'Failed to load client data.', variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      };
      fetchClient();
    }
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const clientData: Partial<Client> & { password?: string } = {
        businessName: formData.businessName,
        email: formData.email,
        instagramHandle: formData.instagramHandle,
        agentType: formData.agentType,
        mobileNumber: formData.mobileNumber,
        aiPrompts: {
          greeting: formData.greeting,
          qualification: formData.qualification,
          booking: formData.booking,
          followup: formData.followup,
        },
      };

      if (isNew) {
        clientData.password = formData.password;
        await createClient(clientData);
        toast({ title: 'Client Created', description: 'The client has been successfully created.' });
      } else {
        await updateClient(id!, clientData);
        toast({ title: 'Client Updated', description: 'The client has been successfully updated.' });
      }
      navigate('/admin/clients');
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || `Failed to ${isNew ? 'create' : 'update'} client.`, 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This cannot be undone.')) return;
    try {
      await deleteClient(id!);
      toast({ title: 'Client Deleted', description: 'The client has been successfully deleted.' });
      navigate('/admin/clients');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete client.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="text-cyan-500/50 text-xs font-bold uppercase tracking-widest">Accessing Secure Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/clients')}
            className="rounded-xl hover:bg-white/5 text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              {isNew ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                  Onboard New Entity
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  Edit Configuration
                </>
              )}
            </h1>
            <p className="text-white/40 font-light text-sm tracking-wide">
              {isNew ? 'Initialize secure environment for new client.' : `System reconfiguration for ${formData.businessName}`}
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Config Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Identity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl p-8 space-y-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-lg">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Identity Matrix</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest">Business Credentials</p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wider pl-1">Business Name</Label>
                <Input
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Wayne Enterprises"
                  required
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:border-cyan-500/50 focus:bg-black/40 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider pl-1">Authorized Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@wayne.com"
                    required
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:border-cyan-500/50 focus:bg-black/40 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider pl-1">
                    {formData.agentType === 'voice' ? 'Mobile Number' : 'Instagram Handle'}
                  </Label>
                  <Input
                    value={formData.agentType === 'voice' ? formData.mobileNumber : formData.instagramHandle}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [formData.agentType === 'voice' ? 'mobileNumber' : 'instagramHandle']: e.target.value 
                    })}
                    placeholder={formData.agentType === 'voice' ? "+1 (555) 000-0000" : "@wayne_tech"}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:border-cyan-500/50 focus:bg-black/40 transition-all font-medium"
                  />
                </div>
              </div>

              {isNew && (
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider pl-1">Access Key (Password)</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    required={isNew}
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:border-cyan-500/50 focus:bg-black/40 transition-all font-medium font-mono"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Config Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl p-8 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-900/50 to-purple-800/50 border border-white/10 shadow-lg">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Neural Configuration</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest">AI Personality & Logic</p>
              </div>
            </div>

            <div className="space-y-6">
              {formData.agentType === 'text' && (
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider pl-1">Initial Greeting Protocol</Label>
                  <Textarea
                    value={formData.greeting}
                    onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                    placeholder="Define the first point of contact..."
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 min-h-[100px] rounded-xl focus:border-purple-500/50 focus:bg-black/40 transition-all leading-relaxed"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wider pl-1">
                  {formData.agentType === 'voice' ? 'Main Prompt' : 'Qualification Logic'}
                </Label>
                <Textarea
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder={formData.agentType === 'voice' ? "Core logic for voice agent..." : "Criteria for lead qualification..."}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/20 min-h-[100px] rounded-xl focus:border-purple-500/50 focus:bg-black/40 transition-all leading-relaxed"
                />
              </div>

              {formData.agentType === 'voice' ? (
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider pl-1">Follow Up Prompt</Label>
                  <Textarea
                    value={formData.followup}
                    onChange={(e) => setFormData({ ...formData, followup: e.target.value })}
                    placeholder="Logic for follow-up calls..."
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 min-h-[100px] rounded-xl focus:border-purple-500/50 focus:bg-black/40 transition-all leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-white/60 text-xs uppercase tracking-wider pl-1">Booking Conversion Protocol</Label>
                  <Textarea
                    value={formData.booking}
                    onChange={(e) => setFormData({ ...formData, booking: e.target.value })}
                    placeholder="Closing statement/action..."
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/20 min-h-[100px] rounded-xl focus:border-purple-500/50 focus:bg-black/40 transition-all leading-relaxed"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Agent Type */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl p-6 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-lg">Agent Core</h3>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, agentType: 'text' })}
                className={cn(
                  "w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 relative overflow-hidden group",
                  formData.agentType === 'text'
                    ? "bg-emerald-500/10 border-emerald-500/20 text-white"
                    : "bg-black/20 border-white/5 text-white/40 hover:bg-white/5"
                )}
              >
                <div className={cn("p-2 rounded-lg transition-colors", formData.agentType === 'text' ? "bg-emerald-500 text-black" : "bg-white/10")}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Text Module</p>
                  <p className="text-[10px] opacity-60">DM & Chat Processing</p>
                </div>
                {formData.agentType === 'text' && (
                  <motion.div layoutId="activeType" className="absolute inset-0 border-2 border-emerald-500/20 rounded-xl" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, agentType: 'voice' })}
                className={cn(
                  "w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 relative overflow-hidden group",
                  formData.agentType === 'voice'
                    ? "bg-blue-500/10 border-blue-500/20 text-white"
                    : "bg-black/20 border-white/5 text-white/40 hover:bg-white/5"
                )}
              >
                <div className={cn("p-2 rounded-lg transition-colors", formData.agentType === 'voice' ? "bg-blue-500 text-white" : "bg-white/10")}>
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Voice Module</p>
                  <p className="text-[10px] opacity-60">Inbound Call Logic</p>
                </div>
                {formData.agentType === 'voice' && (
                  <motion.div layoutId="activeType" className="absolute inset-0 border-2 border-blue-500/20 rounded-xl" />
                )}
              </button>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <Button type="submit" disabled={saving} className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 text-lg tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]">
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              {isNew ? 'INITIALIZE SYSTEM' : 'SAVE CONFIGURATION'}
            </Button>

            {!isNew && (
              <Button type="button" variant="ghost" onClick={handleDelete} className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                <Trash2 className="w-4 h-4 mr-2" />
                Terminate Account
              </Button>
            )}
          </motion.div>
        </div>
      </form>
    </div>
  );
}
