import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSandbox } from '@/contexts/SandboxContext';
import { 
  Copy, 
  Key, 
  RefreshCw, 
  Trash2, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Settings,
  Lock,
  Unlock,
  Plus,
  Edit,
  Save,
  X,
  Loader2,
  Zap,
  Database,
  Users,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ApiKeyManagement: React.FC = () => {
  const { getApiKeys, createApiKey, deactivateApiKey, updateApiKey, rotateApiKey } = useSandbox();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [newSecretKey, setNewSecretKey] = useState('');
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    expiresAt: '',
    rateLimit: '',
    allowedIps: '',
  });
  const [showKeyValue, setShowKeyValue] = useState<{[key: string]: boolean}>({});
  const [form, setForm] = useState({ 
    name: '', 
    expiresAt: '', 
    webhookUrl: '',
    permissions: ['payments:read', 'payments:write'],
    description: '',
    allowedIps: '',
    rateLimit: '1000'
  });
  const [stats, setStats] = useState({
    totalKeys: 0,
    activeKeys: 0,
    expiredKeys: 0
  });

  const normalizeKeys = (res: any) => Array.isArray(res?.data) ? res.data : (res?.data?.apiKeys || []);

  const calculateStats = (keysData: any[]) => {
    const totalKeys = keysData.length;
    const activeKeys = keysData.filter(k => k.isActive !== false).length;
    const expiredKeys = keysData.filter(k => k.expiresAt && new Date(k.expiresAt) < new Date()).length;
    
    setStats({
      totalKeys,
      activeKeys,
      expiredKeys
    });
  };

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await getApiKeys();
      const keysData = normalizeKeys(res);
      setApiKeys(keysData);
      calculateStats(keysData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => { 
    void fetchKeys(); 
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createApiKey({
        name: form.name,
        permissions: form.permissions,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
        webhookUrl: form.webhookUrl || undefined
      });
      
      if (res?.success) { 
        toast({ 
          title: 'API Key Created', 
          description: 'Your new API key has been generated successfully' 
        }); 
        setNewApiKey(res.data.apiKey);
        setNewSecretKey(res.data.secretKey);
        setShowKeyModal(true);
        setForm({ 
          name: '', 
          expiresAt: '', 
          webhookUrl: '',
          permissions: ['payments:read', 'payments:write'],
          description: '',
          allowedIps: '',
          rateLimit: '1000'
        }); 
        setShowCreateModal(false);
        await fetchKeys(); 
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive'
      });
    } finally { 
      setLoading(false); 
    }
  };

  const onDeactivate = async (apiKey: string) => {
    if (!confirm('Are you sure you want to deactivate this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await deactivateApiKey(apiKey);
      if (res?.success) { 
        toast({ 
          title: 'API Key Deactivated', 
          description: 'The API key has been deactivated successfully' 
        }); 
        await fetchKeys(); 
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate API key',
        variant: 'destructive'
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyValue(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => 
    toast({ title: 'Copied to clipboard', description: 'API key copied successfully' })
  );

  const maskApiKey = (key: string, show: boolean) => {
    if (show) return key;
    return key.slice(0, 8) + '•'.repeat(key.length - 12) + key.slice(-4);
  };

  const getKeyStatus = (key: any) => {
    if (!key.isActive) return { status: 'inactive', color: 'bg-gray-100 text-gray-800', icon: Lock };
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return { status: 'expired', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (key.expiresAt && new Date(key.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) return { status: 'expiring', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    return { status: 'active', color: 'bg-green-100 text-green-800', icon: CheckCircle };
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

        {/* Security Alert Skeleton */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
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

        {/* API Keys Section Skeleton */}
        <div className="border rounded-lg p-4 sm:p-6">
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-64 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading API keys...</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">API Key Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Secure API key and webhook management for your applications</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={() => void fetchKeys()} 
            disabled={loading}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)} 
            className="bg-[#0a164d] hover:bg-[#0a164d]/90 w-full sm:w-auto text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2"/>
            <span className="hidden sm:inline">Create API Key</span>
            <span className="sm:hidden">Create Key</span>
          </Button>
        </div>
      </div>

      {/* Security Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <Shield className="w-4 h-4 text-orange-600 flex-shrink-0" />
        <AlertDescription className="text-orange-800 text-xs sm:text-sm">
          <strong>Security Notice:</strong> API keys provide full access to your account. Keep them secure and never share them in client-side code or public repositories.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Key className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Keys</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalKeys}</p>
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Keys</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.activeKeys}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Expired Keys</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.expiredKeys}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Section */}
      <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-sm sm:text-lg">
                <Key className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                Your API Keys
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-600">Manage your API keys and their permissions</p>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-3 sm:space-y-4">
                {apiKeys.map((key: any) => {
                  const keyStatus = getKeyStatus(key);
                  const StatusIcon = keyStatus.icon;
                  const isVisible = showKeyValue[key.apiKey] || false;
                  
                  return (
                    <div key={key.apiKey} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{key.name}</h3>
                            <Badge className={`${keyStatus.color} text-xs`}>
                              {keyStatus.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                            <span className="font-mono text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded break-all">
                              {maskApiKey(key.apiKey, isVisible)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleKeyVisibility(key.apiKey)}
                              className="w-fit h-8 px-2"
                            >
                              {isVisible ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                            </Button>
                          </div>
                          {key.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{key.description}</p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-2 text-xs text-gray-500">
                            <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                            {key.expiresAt && (
                              <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>
                            )}
                            {key.rateLimit && (
                              <span className="break-all">Rate Limit: {typeof key.rateLimit === 'object' ? (key.rateLimit.requestsPerHour || key.rateLimit.requestsPerMinute || 'N/A') : key.rateLimit}/hour</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end sm:justify-start space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copy(key.apiKey)}
                          className="h-8 w-8 p-0"
                          title="Copy API Key"
                        >
                          <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedKey(key);
                            setEditForm({
                              name: key.name || '',
                              expiresAt: key.expiresAt ? new Date(key.expiresAt).toISOString().slice(0,16) : '',
                              rateLimit: typeof key.rateLimit === 'object' ? String(key.rateLimit.requestsPerHour || '') : String(key.rateLimit || ''),
                              allowedIps: Array.isArray(key.allowedIps) ? key.allowedIps.join(', ') : (key.allowedIps || ''),
                            });
                            setShowSettings(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="Settings"
                        >
                          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                          title="Deactivate API Key"
                          variant="outline"
                          size="sm"
                          onClick={() => onDeactivate(key.apiKey)}
                          disabled={key.isActive === false}
                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {apiKeys.length === 0 && (
                  <div className="text-center py-8 sm:py-12 text-gray-500">
                    <Key className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-40" />
                    <p className="text-base sm:text-lg font-medium">No API keys found</p>
                    <p className="text-xs sm:text-sm">Create your first API key to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">Create New API Key</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            <form onSubmit={onCreate} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-xs sm:text-sm">Key Name *</Label>
                  <Input 
                    value={form.name} 
                    onChange={e => setForm(v => ({...v, name: e.target.value}))} 
                    placeholder="My API Key"
                    required 
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Expiration Date (optional)</Label>
                  <Input 
                    type="datetime-local" 
                    value={form.expiresAt} 
                    onChange={e => setForm(v => ({...v, expiresAt: e.target.value}))} 
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm">Description</Label>
                <Textarea 
                  value={form.description} 
                  onChange={e => setForm(v => ({...v, description: e.target.value}))} 
                  placeholder="Describe what this API key will be used for..."
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm">Permissions *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                  {[
                    { id: 'payments:read', label: 'Read Payments', description: 'View payment data' },
                    { id: 'payments:write', label: 'Create Payments', description: 'Create new payments' },
                    { id: 'customers:read', label: 'Read Customers', description: 'View customer data' },
                    { id: 'customers:write', label: 'Manage Customers', description: 'Create/update customers' },
                    { id: 'webhooks:read', label: 'Read Webhooks', description: 'View webhook data' },
                    { id: 'webhooks:write', label: 'Manage Webhooks', description: 'Create/update webhooks' }
                  ].map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2 sm:space-x-3">
                      <input
                        type="checkbox"
                        id={permission.id}
                        checked={form.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm(v => ({...v, permissions: [...v.permissions, permission.id]}));
                          } else {
                            setForm(v => ({...v, permissions: v.permissions.filter(p => p !== permission.id)}));
                          }
                        }}
                        className="mt-1 w-3 h-3 sm:w-4 sm:h-4"
                      />
                      <div className="min-w-0 flex-1">
                        <label htmlFor={permission.id} className="text-xs sm:text-sm font-medium text-gray-900">
                          {permission.label}
                        </label>
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-xs sm:text-sm">Allowed IP Addresses (optional)</Label>
                  <Input 
                    value={form.allowedIps} 
                    onChange={e => setForm(v => ({...v, allowedIps: e.target.value}))} 
                    placeholder="192.168.1.1, 10.0.0.0/8"
                    className="text-xs sm:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated list of IP addresses or CIDR blocks</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Rate Limit (requests per hour)</Label>
                  <Input 
                    type="number"
                    value={form.rateLimit} 
                    onChange={e => setForm(v => ({...v, rateLimit: e.target.value}))} 
                    placeholder="1000"
                    min="1"
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm">Webhook URL (optional)</Label>
                <Input 
                  value={form.webhookUrl} 
                  onChange={e => setForm(v => ({...v, webhookUrl: e.target.value}))} 
                  placeholder="https://example.com/webhooks"
                  className="text-xs sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">URL to receive webhook notifications</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#0a164d] hover:bg-[#0a164d]/90 w-full sm:w-auto text-xs sm:text-sm"
                >
                  {loading ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" /> : <Key className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />}
                  Create API Key
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Key Settings Modal */}
      {showSettings && selectedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">Manage API Key</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)} className="p-1">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-xs sm:text-sm">Key Name</Label>
                  <Input 
                    value={editForm.name} 
                    onChange={e=>setEditForm(v=>({...v,name:e.target.value}))} 
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Extend Expiry</Label>
                  <Input 
                    type="datetime-local" 
                    value={editForm.expiresAt} 
                    onChange={e=>setEditForm(v=>({...v,expiresAt:e.target.value}))} 
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-xs sm:text-sm">Rate Limit (requests/hour)</Label>
                  <Input 
                    type="number" 
                    value={editForm.rateLimit} 
                    onChange={e=>setEditForm(v=>({...v,rateLimit:e.target.value}))} 
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Allowed IPs</Label>
                  <Input 
                    value={editForm.allowedIps} 
                    onChange={e=>setEditForm(v=>({...v,allowedIps:e.target.value}))} 
                    placeholder="192.168.1.1, 10.0.0.0/8" 
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={async ()=>{
                      try{
                        const payload:any = {
                          name: editForm.name || undefined,
                        };
                        if (editForm.expiresAt) payload.expiresAt = new Date(editForm.expiresAt);
                        if (editForm.rateLimit) payload.rateLimit = Number(editForm.rateLimit);
                        if (editForm.allowedIps) payload.allowedIps = editForm.allowedIps.split(',').map(s=>s.trim()).filter(Boolean);
                        try {
                          await updateApiKey(selectedKey.apiKey, payload);
                          toast({ title: 'Updated', description: 'API key updated successfully' });
                          setShowSettings(false);
                          await fetchKeys();
                          return;
                        } catch (err:any) {
                          const msg = String(err?.message || '');
                          const is404 = err?.status === 404 || /not found/i.test(msg) || /Route .* not found/i.test(msg);
                          if (!is404) throw err;
                          // Update route not available: do not auto-create a new key; inform user instead
                          toast({
                            title: 'Update not available',
                            description: 'Extending expiry or editing keys is not supported yet in Sandbox. Create a new key with the desired settings and deactivate this one.',
                            variant: 'destructive'
                          });
                          return;
                        }
                      } catch(e){
                        toast({ title: 'Error', description: 'Failed to update API key', variant: 'destructive' });
                      }
                    }}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Save
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={async ()=>{
                      try{
                        try {
                          const res = await rotateApiKey(selectedKey.apiKey);
                          if(res?.success){
                            setNewApiKey(res.data.apiKey);
                            setNewSecretKey(res.data.secretKey || '');
                            setShowKeyModal(true);
                            toast({ title: 'Key rotated', description: 'New key generated. Save it now.' });
                            setShowSettings(false);
                            await fetchKeys();
                            return;
                          }
                        } catch (err:any) {
                          const msg = String(err?.message || '');
                          const is404 = err?.status === 404 || /not found/i.test(msg) || /Route .* not found/i.test(msg);
                          if (!is404) throw err;
                        }

                        // Fallback: emulate rotation by creating a new key and deactivating the old one
                        const res = await createApiKey({
                          name: selectedKey.name,
                          permissions: selectedKey.permissions || ['payments:read','payments:write'],
                          expiresAt: selectedKey.expiresAt,
                          webhookUrl: selectedKey.webhookUrl
                        });
                        if(res?.success){
                          setNewApiKey(res.data.apiKey);
                          setNewSecretKey(res.data.secretKey || '');
                          setShowKeyModal(true);
                          await deactivateApiKey(selectedKey.apiKey);
                          toast({ title: 'Key rotated', description: 'Generated a new key and deactivated the old one.' });
                          setShowSettings(false);
                          await fetchKeys();
                        } else {
                          throw new Error('Failed to create new key for rotation');
                        }
                      }catch(e){
                        toast({ title: 'Error', description: 'Failed to rotate key', variant: 'destructive' });
                      }
                    }}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Rotate Key
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Created Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold text-green-600">API Key Created Successfully</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyModal(false)}
                className="p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <AlertDescription className="text-red-800 text-xs sm:text-sm">
                  <strong>Important:</strong> This is the only time you'll see this API key. Copy it now and store it securely.
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-xs sm:text-sm">Your API Key (public)</Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                  <Input 
                    value={newApiKey} 
                    readOnly 
                    className="font-mono text-xs sm:text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copy(newApiKey)}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm">Your Secret Key (server only)</Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                  <Input 
                    value={newSecretKey} 
                    readOnly 
                    className="font-mono text-xs sm:text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copy(newSecretKey)}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Use this as <code>x-sandbox-secret</code> for server-to-server requests. Never expose it in the browser.</p>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Server Usage Example</h3>
                <pre className="text-xs sm:text-sm text-gray-600 bg-white p-2 sm:p-3 rounded border overflow-x-auto">
{`curl -X POST "http://localhost:5000/api/v1/sandbox/sessions" \\
  -H "x-sandbox-secret: ${newSecretKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":500000, "currency":"NGN", "description":"Demo", "customerEmail":"dev@example.com"}'`}
                </pre>
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => setShowKeyModal(false)}
                  className="bg-[#0a164d] hover:bg-[#0a164d]/90 w-full sm:w-auto text-xs sm:text-sm"
                >
                  I've Saved My API Key
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagement;
