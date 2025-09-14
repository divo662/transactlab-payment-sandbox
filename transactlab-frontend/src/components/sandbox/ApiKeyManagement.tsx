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
  Loader2,
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading API key...</span>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-muted-foreground">
            Manage your permanent TransactLab API key
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={loading}
          >
            {apiKey.isActive ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* API Key Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your API Key
            <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
              {apiKey.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div>
            <Label className="text-sm font-medium">API Key</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={apiKey.apiKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiKey.apiKey, 'API Key')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Secret Key */}
          <div>
            <Label className="text-sm font-medium">Secret Key</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={apiKey.secretKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiKey.secretKey, 'Secret Key')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Requests Made</p>
                <p className="text-2xl font-bold">{apiKey.usageCount || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm font-medium capitalize">
                  {apiKey.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Environment</p>
                <p className="text-sm font-medium capitalize">{apiKey.environment}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleRegenerateKeys}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Regenerate Keys
            </Button>
            <Button
              onClick={() => window.open('https://docs.transactlab.com/api', '_blank')}
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              API Documentation
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
              API Key Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Webhook URL */}
            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                value={settings.webhookUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://your-app.com/webhooks"
              />
            </div>

            {/* Webhook Secret */}
            <div>
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <Input
                id="webhookSecret"
                type="password"
                value={settings.webhookSecret}
                onChange={(e) => setSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
                placeholder="Optional webhook secret"
              />
            </div>

            {/* Rate Limits */}
            <div>
              <Label className="text-sm font-medium">Rate Limits</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="rpm" className="text-xs">Per Minute</Label>
                  <Input
                    id="rpm"
                    type="number"
                    value={settings.rateLimit.requestsPerMinute}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, requestsPerMinute: parseInt(e.target.value) || 60 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="rph" className="text-xs">Per Hour</Label>
                  <Input
                    id="rph"
                    type="number"
                    value={settings.rateLimit.requestsPerHour}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, requestsPerHour: parseInt(e.target.value) || 1000 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="rpd" className="text-xs">Per Day</Label>
                  <Input
                    id="rpd"
                    type="number"
                    value={settings.rateLimit.requestsPerDay}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      rateLimit: { ...prev.rateLimit, requestsPerDay: parseInt(e.target.value) || 10000 }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Save Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
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
            Usage Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>API Key:</strong> Use this key in your client-side applications and public requests.
            </p>
            <p>
              <strong>Secret Key:</strong> Use this key only on your server for sensitive operations. Never expose it in client-side code.
            </p>
            <p>
              <strong>Environment:</strong> This is a sandbox key for testing. Use it to test your integration before going live.
            </p>
            <p>
              <strong>Rate Limits:</strong> Your current rate limits are shown above. Contact support if you need higher limits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyManagement;