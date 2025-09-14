import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSandbox } from '@/contexts/SandboxContext';
import { 
  Copy, 
  Key, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Lock,
  Unlock,
  Zap,
  Database,
  Users,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ApiKeyManagement: React.FC = () => {
  const { getApiKey, updateApiKey, regenerateApiKey, toggleApiKeyStatus } = useSandbox();
  const { toast } = useToast();
  
  const [apiKey, setApiKey] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    webhookUrl: '',
    webhookSecret: '',
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000
    }
  });

  const loadApiKey = async () => {
    try {
      setInitialLoading(true);
      const response = await getApiKey();
      if (response.success) {
        setApiKey(response.data);
        setSettings({
          webhookUrl: response.data.webhookUrl || '',
          webhookSecret: response.data.webhookSecret || '',
          rateLimit: {
            requestsPerMinute: response.data.rateLimit?.requestsPerMinute || 60,
            requestsPerHour: response.data.rateLimit?.requestsPerHour || 1000,
            requestsPerDay: response.data.rateLimit?.requestsPerDay || 10000
          }
        });
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API key',
        variant: 'destructive'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadApiKey();
  }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const handleRegenerateKeys = async () => {
    try {
      setLoading(true);
      const response = await regenerateApiKey();
      if (response.success) {
        setApiKey(response.data);
        toast({
          title: 'Success',
          description: 'API keys regenerated successfully',
        });
      }
    } catch (error) {
      console.error('Error regenerating keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate API keys',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      const response = await toggleApiKeyStatus();
      if (response.success) {
        setApiKey(response.data);
        toast({
          title: 'Success',
          description: `API key ${response.data.isActive ? 'activated' : 'deactivated'} successfully`,
        });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle API key status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const response = await updateApiKey(settings);
      if (response.success) {
        setApiKey(response.data);
        setShowSettings(false);
        toast({
          title: 'Success',
          description: 'API key settings updated successfully',
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update API key settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* API Key Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key Input Skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Secret Key Input Skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex gap-2 pt-4 border-t">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Information Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No API key found. Please refresh the page or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">API Key Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your permanent TransactLab API key
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Configure</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {apiKey.isActive ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Deactivate</span>
                <span className="sm:hidden">Disable</span>
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Activate</span>
                <span className="sm:hidden">Enable</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* API Key Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <span className="text-lg sm:text-xl">Your API Key</span>
            </div>
            <Badge variant={apiKey.isActive ? 'default' : 'secondary'} className="w-fit">
              {apiKey.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div>
            <Label className="text-sm font-medium">API Key</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <Input
                value={apiKey.apiKey}
                readOnly
                className="font-mono text-xs sm:text-sm flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiKey.apiKey, 'API Key')}
                className="w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 sm:mr-2" />
                <span className="sm:inline hidden">Copy</span>
              </Button>
            </div>
          </div>

          {/* Secret Key */}
          <div>
            <Label className="text-sm font-medium">Secret Key</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={apiKey.secretKey}
                readOnly
                className="font-mono text-xs sm:text-sm flex-1"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSecret(!showSecret)}
                  className="flex-1 sm:flex-none"
                >
                  {showSecret ? <EyeOff className="h-4 w-4 sm:mr-2" /> : <Eye className="h-4 w-4 sm:mr-2" />}
                  <span className="sm:inline hidden">{showSecret ? 'Hide' : 'Show'}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(apiKey.secretKey, 'Secret Key')}
                  className="flex-1 sm:flex-none"
                >
                  <Copy className="h-4 w-4 sm:mr-2" />
                  <span className="sm:inline hidden">Copy</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Zap className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Requests Made</p>
                <p className="text-lg sm:text-2xl font-bold truncate">{apiKey.usageCount || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Status</p>
                <p className="text-sm font-medium capitalize">
                  {apiKey.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Database className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Environment</p>
                <p className="text-sm font-medium capitalize">{apiKey.environment}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              onClick={handleRegenerateKeys}
              disabled={loading}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Regenerate Keys</span>
              <span className="sm:hidden">New Keys</span>
            </Button>
            <Button
              onClick={() => window.open('https://docs.transactlab.com/api', '_blank')}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">API Documentation</span>
              <span className="sm:hidden">Docs</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span className="text-lg sm:text-xl">API Key Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Webhook URL */}
            <div>
              <Label htmlFor="webhookUrl" className="text-sm font-medium">Webhook URL</Label>
              <Input
                id="webhookUrl"
                value={settings.webhookUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://your-app.com/webhooks"
                className="mt-1"
              />
            </div>

            {/* Webhook Secret */}
            <div>
              <Label htmlFor="webhookSecret" className="text-sm font-medium">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                type="password"
                value={settings.webhookSecret}
                onChange={(e) => setSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
                placeholder="Optional webhook secret"
                className="mt-1"
              />
            </div>

            {/* Rate Limits */}
            <div>
              <Label className="text-sm font-medium">Rate Limits</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="rpm" className="text-xs font-medium text-gray-600">Per Minute</Label>
                  <Input
                    id="rpm"
                    type="number"
                    value={settings.rateLimit.requestsPerMinute}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, requestsPerMinute: parseInt(e.target.value) || 60 }
                    }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rph" className="text-xs font-medium text-gray-600">Per Hour</Label>
                  <Input
                    id="rph"
                    type="number"
                    value={settings.rateLimit.requestsPerHour}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, requestsPerHour: parseInt(e.target.value) || 1000 }
                    }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rpd" className="text-xs font-medium text-gray-600">Per Day</Label>
                  <Input
                    id="rpd"
                    type="number"
                    value={settings.rateLimit.requestsPerDay}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, requestsPerDay: parseInt(e.target.value) || 10000 }
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <Button
                onClick={handleSaveSettings}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Save Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-lg sm:text-xl">Usage Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900 mb-1">API Key</p>
              <p>Use this key in your client-side applications and public requests.</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="font-medium text-red-900 mb-1">Secret Key</p>
              <p>Use this key only on your server for sensitive operations. Never expose it in client-side code.</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-900 mb-1">Environment</p>
              <p>This is a sandbox key for testing. Use it to test your integration before going live.</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="font-medium text-yellow-900 mb-1">Rate Limits</p>
              <p>Your current rate limits are shown above. Contact support if you need higher limits.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyManagement;