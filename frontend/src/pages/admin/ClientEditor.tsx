import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Trash2, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getClient, createClient, updateClient, deleteClient, Client } from '@/lib/api';

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
            });
          }
        } catch (err) {
          toast({
            title: 'Error',
            description: 'Failed to load client data.',
            variant: 'destructive',
          });
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
        aiPrompts: {
          greeting: formData.greeting,
          qualification: formData.qualification,
          booking: formData.booking,
        },
      };

      if (isNew) {
        clientData.password = formData.password;
        await createClient(clientData);
        toast({
          title: 'Client Created',
          description: 'The client has been successfully created.',
        });
      } else {
        await updateClient(id!, clientData);
        toast({
          title: 'Client Updated',
          description: 'The client has been successfully updated.',
        });
      }

      navigate('/admin/clients');
    } catch (err) {
      toast({
        title: 'Error',
        description: `Failed to ${isNew ? 'create' : 'update'} client.`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This cannot be undone.')) return;

    try {
      await deleteClient(id!);
      toast({
        title: 'Client Deleted',
        description: 'The client has been successfully deleted.',
      });
      navigate('/admin/clients');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete client.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clients')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isNew ? 'Add Client' : 'Edit Client'}</h1>
          <p className="text-muted-foreground">
            {isNew ? 'Create a new client account' : 'Update client settings'}
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <Separator className="bg-border/50" />

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. FitLife Coaching"
                required
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Login Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                required
                className="bg-secondary/50"
              />
            </div>

            {isNew && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required={isNew}
                  className="bg-secondary/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram Handle</Label>
              <Input
                id="instagram"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                placeholder="@yourbusiness"
                className="bg-secondary/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Agent Type *</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, agentType: 'text' })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${formData.agentType === 'text'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/50'
                    }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">Text Agent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, agentType: 'voice' })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${formData.agentType === 'voice'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/50'
                    }`}
                >
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">Voice Agent</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.agentType === 'text'
                  ? 'Text agents handle Instagram DM conversations.'
                  : 'Voice agents handle inbound phone calls.'
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* AI Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">AI Configuration</h2>
          <Separator className="bg-border/50" />

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting Message</Label>
              <Textarea
                id="greeting"
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                placeholder="Hey! Thanks for reaching out! 💪"
                className="bg-secondary/50 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification Prompt</Label>
              <Textarea
                id="qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="What are your main goals?"
                className="bg-secondary/50 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking">Booking Prompt</Label>
              <Textarea
                id="booking"
                value={formData.booking}
                onChange={(e) => setFormData({ ...formData, booking: e.target.value })}
                placeholder="Would you like to schedule a free consultation?"
                className="bg-secondary/50 min-h-[80px]"
              />
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between"
        >
          {!isNew && (
            <Button type="button" variant="destructive" onClick={handleDelete} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Client
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/clients')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isNew ? 'Create Client' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
