import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSandbox } from '@/contexts/SandboxContext';
import { 
  Copy, 
  RefreshCw, 
  TestTube, 
  Webhook, 
  Plus, 
  Settings, 
  Activity, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  Database,
  Zap,
  Globe,
  Lock,
  Unlock,
  Edit,
  Save,
  X,
  Loader2,
  Server,
  Users,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WebhookManagement: React.FC = () => {
  const { getWebhooks, createWebhook, testWebhook } = useSandbox();
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalWebhooks: 0,
    activeWebhooks: 0,
    failedWebhooks: 0,
    totalDeliveries: 0,
    successRate: 0
  });
  const [form, setForm] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: '',
    description: '',
    isActive: true,
    retryPolicy: 'exponential',
    timeout: 30
  });

  const availableEvents = [
    { id: 'payment.completed', label: 'Payment Completed', description: 'Triggered when a payment is successfully completed' },
    { id: 'payment.failed', label: 'Payment Failed', description: 'Triggered when a payment fails' },
    { id: 'payment.refunded', label: 'Payment Refunded', description: 'Triggered when a payment is refunded' },
    { id: 'customer.created', label: 'Customer Created', description: 'Triggered when a new customer is created' },
    { id: 'customer.updated', label: 'Customer Updated', description: 'Triggered when customer details are updated' },
    { id: 'subscription.created', label: 'Subscription Created', description: 'Triggered when a subscription is created' },
    { id: 'subscription.updated', label: 'Subscription Updated', description: 'Triggered when subscription details are updated' },
    { id: 'subscription.cancelled', label: 'Subscription Cancelled', description: 'Triggered when a subscription is cancelled' },
    { id: 'invoice.created', label: 'Invoice Created', description: 'Triggered when an invoice is created' },
    { id: 'invoice.paid', label: 'Invoice Paid', description: 'Triggered when an invoice is paid' }
  ];

  const normalizeWebhooks = (res: any) => Array.isArray(res?.data) ? res.data : (res?.data?.webhooks || []);

  const calculateStats = () => {
    const total = webhooks.length;
    const active = webhooks.filter(w => w.isActive !== false).length;
    const failed = webhooks.filter(w => w.lastDeliveryStatus === 'failed').length;
    const totalDeliveries = webhooks.reduce((sum, w) => sum + (w.deliveryCount || 0), 0);
    const successRate = totalDeliveries > 0 ? 
      ((totalDeliveries - failed) / totalDeliveries * 100) : 0;

    setStats({
      totalWebhooks: total,
      activeWebhooks: active,
      failedWebhooks: failed,
      totalDeliveries,
      successRate: Math.round(successRate)
    });
  };

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await getWebhooks();
      const normalized = normalizeWebhooks(res);
      setWebhooks(normalized);
      calculateStats();
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch webhooks',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    void fetchWebhooks(); 
  }, []);

  useEffect(() => {
    calculateStats();
  }, [webhooks]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createWebhook({ 
        name: form.name, 
        url: form.url, 
        events: form.events,
        secret: form.secret,
        description: form.description,
        isActive: form.isActive,
        retryPolicy: form.retryPolicy,
        timeout: form.timeout
      });
      
      if (res?.success) { 
        toast({ 
          title: 'Webhook Created', 
          description: 'Your webhook has been created successfully' 
        }); 
        setForm({ 
          name: '', 
          url: '', 
          events: [], 
          secret: '', 
          description: '', 
          isActive: true, 
          retryPolicy: 'exponential', 
          timeout: 30 
        }); 
        setShowCreateModal(false);
        await fetchWebhooks(); 
      } else {
        throw new Error(res?.message || 'Failed to create webhook');
      }
    } catch (error: any) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create webhook',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const onTest = async (webhook: any) => {
    setLoading(true);
    try {
      const res = await testWebhook(webhook.id || webhook._id, { 
        webhookUrl: webhook.url, 
        eventType: 'webhook.test',
        payload: {
          test: true,
          timestamp: new Date().toISOString(),
          webhookId: webhook.id || webhook._id
        }
      });
      
      if (res?.success) {
        toast({ 
          title: 'Test Webhook Sent', 
          description: 'Test webhook has been sent successfully' 
        });
        await fetchWebhooks();
      } else {
        throw new Error(res?.message || 'Failed to send test webhook');
      }
    } catch (error: any) {
      console.error('Error testing webhook:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test webhook',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const onToggleActive = async (webhook: any) => {
    setLoading(true);
    try {
      // This would be an API call to toggle webhook status
      // For now, we'll just update locally
      const updatedWebhooks = webhooks.map(w => 
        w.id === webhook.id || w._id === webhook._id 
          ? { ...w, isActive: !w.isActive }
          : w
      );
      setWebhooks(updatedWebhooks);
      
      toast({
        title: webhook.isActive ? 'Webhook Deactivated' : 'Webhook Activated',
        description: `Webhook has been ${webhook.isActive ? 'deactivated' : 'activated'} successfully`
      });
    } catch (error: any) {
      console.error('Error toggling webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to update webhook status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ 
        title: 'Copied to Clipboard', 
        description: 'Webhook URL has been copied' 
      });
    });
  };

  const getStatusIcon = (webhook: any) => {
    if (!webhook.isActive) return <XCircle className="w-4 h-4 text-gray-400" />;
    if (webhook.lastDeliveryStatus === 'failed') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (webhook.lastDeliveryStatus === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusBadge = (webhook: any) => {
    if (!webhook.isActive) return { text: 'Inactive', className: 'bg-gray-100 text-gray-800' };
    if (webhook.lastDeliveryStatus === 'failed') return { text: 'Failed', className: 'bg-red-100 text-red-800' };
    if (webhook.lastDeliveryStatus === 'success') return { text: 'Active', className: 'bg-green-100 text-green-800' };
    return { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
  };

  const generateWebhookSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Webhook Management</h1>
          <p className="text-gray-600 mt-1">Configure and manage webhook endpoints for real-time event notifications</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={fetchWebhooks} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Webhook
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Webhook secrets are used to verify the authenticity of incoming webhooks. 
          Keep your secrets secure and never expose them in client-side code or logs.
        </AlertDescription>
      </Alert>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Webhook className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Webhooks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWebhooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeWebhooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failedWebhooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Webhook Overview</TabsTrigger>
          <TabsTrigger value="events">Event Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Webhooks List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Webhook className="w-5 h-5 mr-2" />
                Your Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-12">
                  <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks yet</h3>
                  <p className="text-gray-600 mb-4">Create your first webhook to start receiving real-time notifications</p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Webhook
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((webhook: any) => {
                    const statusBadge = getStatusBadge(webhook);
                    return (
                      <div key={webhook.id || webhook._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(webhook)}
                            <div>
                              <h3 className="font-medium text-gray-900">{webhook.name}</h3>
                              <p className="text-sm text-gray-600">{webhook.url}</p>
                            </div>
                          </div>
                          <Badge className={statusBadge.className}>
                            {statusBadge.text}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copy(webhook.url)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onTest(webhook)}
                            disabled={loading}
                          >
                            <TestTube className="w-4 h-4 mr-2" />
                            Test
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleActive(webhook)}
                            disabled={loading}
                          >
                            {webhook.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWebhook(webhook);
                              setShowWebhookModal(true);
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Available Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableEvents.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Zap className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{event.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <Badge variant="outline" className="mt-2">
                          {event.id}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Create New Webhook</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={onCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Webhook Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm(v => ({...v, name: e.target.value}))}
                    placeholder="My Payment Webhook"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="url">Webhook URL *</Label>
                  <Input
                    id="url"
                    value={form.url}
                    onChange={e => setForm(v => ({...v, url: e.target.value}))}
                    placeholder="https://your-domain.com/webhooks"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={e => setForm(v => ({...v, description: e.target.value}))}
                  placeholder="Optional description for this webhook"
                  rows={3}
                />
              </div>

              <div>
                <Label>Events to Subscribe To *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {availableEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={event.id}
                        checked={form.events.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm(v => ({...v, events: [...v.events, event.id]}));
                          } else {
                            setForm(v => ({...v, events: v.events.filter(ev => ev !== event.id)}));
                          }
                        }}
                        className="mt-1"
                      />
                      <label htmlFor={event.id} className="text-sm">
                        <div className="font-medium">{event.label}</div>
                        <div className="text-gray-500 text-xs">{event.id}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="secret">Webhook Secret</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="secret"
                      value={form.secret}
                      onChange={e => setForm(v => ({...v, secret: e.target.value}))}
                      placeholder="Leave empty to auto-generate"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setForm(v => ({...v, secret: generateWebhookSecret()}))}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={form.timeout}
                    onChange={e => setForm(v => ({...v, timeout: parseInt(e.target.value) || 30}))}
                    min="5"
                    max="300"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="retryPolicy">Retry Policy</Label>
                <Select value={form.retryPolicy} onValueChange={value => setForm(v => ({...v, retryPolicy: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exponential">Exponential Backoff</SelectItem>
                    <SelectItem value="linear">Linear Backoff</SelectItem>
                    <SelectItem value="fixed">Fixed Interval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm(v => ({...v, isActive: e.target.checked}))}
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Activate webhook immediately
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Webhook
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Details Modal */}
      {showWebhookModal && selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Webhook Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowWebhookModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Name</Label>
                <p className="text-gray-900">{selectedWebhook.name}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">URL</Label>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-900 font-mono text-sm">{selectedWebhook.url}</p>
                  <Button variant="ghost" size="sm" onClick={() => copy(selectedWebhook.url)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedWebhook)}
                  <Badge className={getStatusBadge(selectedWebhook).className}>
                    {getStatusBadge(selectedWebhook).text}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Events</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(selectedWebhook.events || []).map((event: string) => (
                    <Badge key={event} variant="outline">{event}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Last Delivery</Label>
                <p className="text-gray-900">
                  {selectedWebhook.lastDelivery ? 
                    new Date(selectedWebhook.lastDelivery).toLocaleString() : 
                    'Never'
                  }
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Delivery Count</Label>
                <p className="text-gray-900">{selectedWebhook.deliveryCount || 0}</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowWebhookModal(false)}>
                  Close
                </Button>
                <Button onClick={() => onTest(selectedWebhook)} disabled={loading}>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Webhook
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookManagement;
