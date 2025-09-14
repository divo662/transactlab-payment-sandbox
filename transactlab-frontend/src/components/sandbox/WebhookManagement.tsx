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
  const [initialLoading, setInitialLoading] = useState(true);
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
      setInitialLoading(false);
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
        events: form.events
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
        eventType: 'webhook.test'
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

  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 sm:h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Security Notice Skeleton */}
        <div className="border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-200 rounded-lg w-10 h-10 animate-pulse"></div>
                <div className="ml-4 space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          
          {/* Content Skeleton */}
          <div className="border rounded-lg p-4 sm:p-6">
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading webhooks...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Webhook Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Configure and manage webhook endpoints for real-time event notifications</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={fetchWebhooks} 
            disabled={loading}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="hidden sm:inline">Create Webhook</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4 flex-shrink-0" />
        <AlertDescription className="text-xs sm:text-sm">
          <strong>Security Notice:</strong> Webhook secrets are used to verify the authenticity of incoming webhooks. 
          Keep your secrets secure and never expose them in client-side code or logs.
        </AlertDescription>
      </Alert>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Webhook className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Webhooks</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalWebhooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.activeWebhooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <XCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Failed</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.failedWebhooks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Webhook Overview</TabsTrigger>
          <TabsTrigger value="events" className="text-xs sm:text-sm">Event Management</TabsTrigger>
          <TabsTrigger value="deliveries" className="text-xs sm:text-sm">Deliveries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Webhooks List */}
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-sm sm:text-lg">
                <Webhook className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Your Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {webhooks.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Webhook className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No webhooks yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">Create your first webhook to start receiving real-time notifications</p>
                  <Button onClick={() => setShowCreateModal(true)} className="text-xs sm:text-sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Create Webhook
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {webhooks.map((webhook: any) => {
                    const statusBadge = getStatusBadge(webhook);
                    return (
                      <div key={webhook.id || webhook._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 gap-3 sm:gap-4">
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          <div className="flex items-center space-x-2 sm:space-x-2">
                            {getStatusIcon(webhook)}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{webhook.name}</h3>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{webhook.url}</p>
                            </div>
                          </div>
                          <Badge className={`${statusBadge.className} text-xs flex-shrink-0`}>
                            {statusBadge.text}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-end sm:justify-start space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copy(webhook.url)}
                            className="h-8 w-8 p-0"
                            title="Copy URL"
                          >
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onTest(webhook)}
                            disabled={loading}
                            className="h-8 px-2 text-xs sm:text-sm"
                            title="Test Webhook"
                          >
                            <TestTube className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Test</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleActive(webhook)}
                            disabled={loading}
                            className="h-8 w-8 p-0"
                            title={webhook.isActive ? "Deactivate" : "Activate"}
                          >
                            {webhook.isActive ? <Lock className="w-3 h-3 sm:w-4 sm:h-4" /> : <Unlock className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWebhook(webhook);
                              setShowWebhookModal(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="Settings"
                          >
                            <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
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

        <TabsContent value="events" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-sm sm:text-lg">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Available Events
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {availableEvents.map((event) => (
                  <div key={event.id} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{event.label}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{event.description}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
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

        <TabsContent value="deliveries" className="space-y-4 sm:space-y-6">
          {/* Delivery Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Successful</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {webhooks.reduce((sum, w) => sum + (w.successfulDeliveries || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                    <XCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {webhooks.reduce((sum, w) => sum + (w.failedDeliveries || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                    <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {webhooks.reduce((sum, w) => sum + (w.pendingDeliveries || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Deliveries */}
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-sm sm:text-lg">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Recent Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {webhooks.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Database className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No deliveries yet</h3>
                  <p className="text-sm sm:text-base text-gray-600">Create webhooks to start tracking deliveries</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {webhooks.map((webhook: any) => {
                    const deliveries = webhook.recentDeliveries || [];
                    return (
                      <div key={webhook.id || webhook._id} className="border rounded-lg p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Webhook className="w-4 h-4 text-blue-600" />
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base">{webhook.name}</h3>
                            <Badge className={`${getStatusBadge(webhook).className} text-xs`}>
                              {getStatusBadge(webhook).text}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {webhook.deliveryCount || 0} total deliveries
                          </div>
                        </div>
                        
                        {deliveries.length === 0 ? (
                          <p className="text-xs sm:text-sm text-gray-500 italic">No recent deliveries</p>
                        ) : (
                          <div className="space-y-2">
                            {deliveries.slice(0, 3).map((delivery: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                  {delivery.status === 'success' ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : delivery.status === 'failed' ? (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-yellow-500" />
                                  )}
                                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                                    {delivery.eventType || 'Unknown Event'}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {delivery.status || 'pending'}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {delivery.timestamp ? 
                                    new Date(delivery.timestamp).toLocaleString() : 
                                    'Unknown time'
                                  }
                                </div>
                              </div>
                            ))}
                            {deliveries.length > 3 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{deliveries.length - 3} more deliveries
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Create New Webhook</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)} className="p-1">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <form onSubmit={onCreate} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="name" className="text-xs sm:text-sm">Webhook Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm(v => ({...v, name: e.target.value}))}
                    placeholder="My Payment Webhook"
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="url" className="text-xs sm:text-sm">Webhook URL *</Label>
                  <Input
                    id="url"
                    value={form.url}
                    onChange={e => setForm(v => ({...v, url: e.target.value}))}
                    placeholder="https://your-domain.com/webhooks"
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={e => setForm(v => ({...v, description: e.target.value}))}
                  placeholder="Optional description for this webhook"
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm">Events to Subscribe To *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
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
                        className="mt-1 w-3 h-3 sm:w-4 sm:h-4"
                      />
                      <label htmlFor={event.id} className="text-xs sm:text-sm">
                        <div className="font-medium">{event.label}</div>
                        <div className="text-gray-500 text-xs">{event.id}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="secret" className="text-xs sm:text-sm">Webhook Secret</Label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                      id="secret"
                      value={form.secret}
                      onChange={e => setForm(v => ({...v, secret: e.target.value}))}
                      placeholder="Leave empty to auto-generate"
                      className="text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setForm(v => ({...v, secret: generateWebhookSecret()}))}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="timeout" className="text-xs sm:text-sm">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={form.timeout}
                    onChange={e => setForm(v => ({...v, timeout: parseInt(e.target.value) || 30}))}
                    min="5"
                    max="300"
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="retryPolicy" className="text-xs sm:text-sm">Retry Policy</Label>
                <Select value={form.retryPolicy} onValueChange={value => setForm(v => ({...v, retryPolicy: value}))}>
                  <SelectTrigger className="text-xs sm:text-sm">
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
                  className="w-3 h-3 sm:w-4 sm:h-4"
                />
                <label htmlFor="isActive" className="text-xs sm:text-sm font-medium">
                  Activate webhook immediately
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto text-xs sm:text-sm">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto text-xs sm:text-sm">
                  {loading && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />}
                  Create Webhook
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Details Modal */}
      {showWebhookModal && selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Webhook Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowWebhookModal(false)} className="p-1">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Name</Label>
                <p className="text-sm sm:text-base text-gray-900">{selectedWebhook.name}</p>
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">URL</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-1">
                  <p className="text-xs sm:text-sm text-gray-900 font-mono break-all flex-1">{selectedWebhook.url}</p>
                  <Button variant="ghost" size="sm" onClick={() => copy(selectedWebhook.url)} className="w-fit text-xs sm:text-sm">
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Status</Label>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(selectedWebhook)}
                  <Badge className={`${getStatusBadge(selectedWebhook).className} text-xs`}>
                    {getStatusBadge(selectedWebhook).text}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Events</Label>
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                  {(selectedWebhook.events || []).map((event: string) => (
                    <Badge key={event} variant="outline" className="text-xs">{event}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Last Delivery</Label>
                <p className="text-sm sm:text-base text-gray-900">
                  {selectedWebhook.lastDelivery ? 
                    new Date(selectedWebhook.lastDelivery).toLocaleString() : 
                    'Never'
                  }
                </p>
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Delivery Count</Label>
                <p className="text-sm sm:text-base text-gray-900">{selectedWebhook.deliveryCount || 0}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowWebhookModal(false)} className="w-full sm:w-auto text-xs sm:text-sm">
                  Close
                </Button>
                <Button onClick={() => onTest(selectedWebhook)} disabled={loading} className="w-full sm:w-auto text-xs sm:text-sm">
                  <TestTube className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Test Webhook
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documentation CTA */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <ExternalLink className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Ready to Get Started?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Explore our comprehensive documentation to learn how to integrate TransactLab 
              into your applications with detailed guides, API references, and code examples.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.open('https://transactlab-payment-sandbox.vercel.app/transactlab-docs', '_blank')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Read Our Documentation
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://transactlab-payment-sandbox.vercel.app/transactlab-docs', '_blank')}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 px-6 py-3"
              >
                View API Reference
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManagement;
