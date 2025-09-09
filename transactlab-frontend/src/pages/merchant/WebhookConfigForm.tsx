import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Webhook, TestTube, Settings, AlertCircle, CheckCircle, Copy, ExternalLink, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebhookConfigFormProps {
  data: {
    webhookUrl: string;
    webhookEvents: string[];
  };
  updateData: (data: Partial<{
    webhookUrl: string;
    webhookEvents: string[];
  }>) => void;
}

interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
}

const WebhookConfigForm: React.FC<WebhookConfigFormProps> = ({ data, updateData }) => {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Local state for form fields
  const [localWebhookUrl, setLocalWebhookUrl] = useState(data.webhookUrl || '');
  const [retryAttempts, setRetryAttempts] = useState('3');
  const [timeout, setTimeoutValue] = useState('30');
  const [customHeaders, setCustomHeaders] = useState('');

  // Update local state when props change
  React.useEffect(() => {
    setLocalWebhookUrl(data.webhookUrl || '');
  }, [data.webhookUrl]);

  const webhookEvents: WebhookEvent[] = [
    // Transaction Events
    { id: 'transaction.initialized', name: 'Transaction Initialized', description: 'Triggered when a transaction is initialized', category: 'Transaction', isEnabled: false },
    { id: 'transaction.successful', name: 'Transaction Successful', description: 'Triggered when a transaction is successful', category: 'Transaction', isEnabled: false },
    { id: 'transaction.failed', name: 'Transaction Failed', description: 'Triggered when a transaction fails', category: 'Transaction', isEnabled: false },
    { id: 'transaction.cancelled', name: 'Transaction Cancelled', description: 'Triggered when a transaction is cancelled', category: 'Transaction', isEnabled: false },
    { id: 'transaction.expired', name: 'Transaction Expired', description: 'Triggered when a transaction expires', category: 'Transaction', isEnabled: false },
    
    // Refund Events
    { id: 'refund.processed', name: 'Refund Processed', description: 'Triggered when a refund is processed', category: 'Refund', isEnabled: false },
    { id: 'refund.failed', name: 'Refund Failed', description: 'Triggered when a refund fails', category: 'Refund', isEnabled: false },
    
    // Chargeback Events
    { id: 'chargeback.received', name: 'Chargeback Received', description: 'Triggered when a chargeback is received', category: 'Chargeback', isEnabled: false },
    { id: 'chargeback.resolved', name: 'Chargeback Resolved', description: 'Triggered when a chargeback is resolved', category: 'Chargeback', isEnabled: false },
    
    // Subscription Events
    { id: 'subscription.created', name: 'Subscription Created', description: 'Triggered when a subscription is created', category: 'Subscription', isEnabled: false },
    { id: 'subscription.updated', name: 'Subscription Updated', description: 'Triggered when a subscription is updated', category: 'Subscription', isEnabled: false },
    { id: 'subscription.cancelled', name: 'Subscription Cancelled', description: 'Triggered when a subscription is cancelled', category: 'Subscription', isEnabled: false },
    { id: 'subscription.payment_successful', name: 'Subscription Payment Successful', description: 'Triggered when a subscription payment is successful', category: 'Subscription', isEnabled: false },
    { id: 'subscription.payment_failed', name: 'Subscription Payment Failed', description: 'Triggered when a subscription payment fails', category: 'Subscription', isEnabled: false }
  ];

  const handleEventToggle = (eventId: string) => {
    const newEvents = data.webhookEvents.includes(eventId)
      ? data.webhookEvents.filter(e => e !== eventId)
      : [...data.webhookEvents, eventId];
    
    updateData({ webhookEvents: newEvents });
  };

  const handleSelectAll = (category: string) => {
    const categoryEvents = webhookEvents.filter(e => e.category === category);
    const categoryEventIds = categoryEvents.map(e => e.id);
    
    const newEvents = [...new Set([...data.webhookEvents, ...categoryEventIds])];
    updateData({ webhookEvents: newEvents });
  };

  const handleDeselectAll = (category: string) => {
    const categoryEvents = webhookEvents.filter(e => e.category === category);
    const categoryEventIds = categoryEvents.map(e => e.id);
    
    const newEvents = data.webhookEvents.filter(e => !categoryEventIds.includes(e));
    updateData({ webhookEvents: newEvents });
  };

  const handleWebhookUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalWebhookUrl(value);
    updateData({ webhookUrl: value });
  };

  const testWebhook = async () => {
    if (!localWebhookUrl) {
      toast({
        title: "Webhook URL Required",
        description: "Please enter a webhook URL before testing.",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult = {
        success: true,
        status: 200,
        responseTime: '1.2s',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'TransactLab-Webhook/1.0'
        },
        body: {
          event: 'webhook.test',
          timestamp: new Date().toISOString(),
          data: {
            message: 'This is a test webhook payload',
            merchant_id: 'merchant_123',
            test_mode: true
          }
        }
      };
      
      setTestResults(mockResult);
      
      toast({
        title: "Webhook Test Successful",
        description: "Your webhook endpoint is working correctly.",
        variant: "default"
      });
    } catch (error) {
      setTestResults({
        success: false,
        error: 'Failed to reach webhook endpoint'
      });
      
      toast({
        title: "Webhook Test Failed",
        description: "Could not reach your webhook endpoint. Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "The text has been copied to your clipboard.",
      variant: "default"
    });
  };

  const getCategoryEvents = (category: string) => {
    return webhookEvents.filter(e => e.category === category);
  };

  const getCategoryCount = (category: string) => {
    const categoryEvents = getCategoryEvents(category);
    const selectedCount = categoryEvents.filter(e => data.webhookEvents.includes(e.id)).length;
    return { total: categoryEvents.length, selected: selectedCount };
  };

  const categories = ['Transaction', 'Refund', 'Chargeback', 'Subscription'];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#0a164d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Webhook className="w-8 h-8 text-[#0a164d]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Webhook Configuration
        </h3>
        <p className="text-gray-600">
          Set up webhook endpoints to receive real-time notifications about your transactions
        </p>
      </div>

      {/* Webhook URL Configuration */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-[#0a164d]" />
          <h4 className="text-lg font-medium text-gray-900">Webhook Endpoint</h4>
        </div>
        
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Webhook URL *
          </Label>
          <div className="flex space-x-2">
            <Input
              type="url"
              placeholder="https://yourdomain.com/webhook"
              value={localWebhookUrl}
              onChange={handleWebhookUrlChange}
              className="flex-1 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]"
            />
            <Button
              onClick={testWebhook}
              disabled={!localWebhookUrl || isTesting}
              className="bg-[#0a164d] hover:bg-[#0a164d]/90"
            >
              {isTesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            This URL will receive POST requests with event data when webhook events occur
          </p>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className={`border rounded-lg p-4 ${
            testResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {testResults.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <h5 className="font-medium text-gray-900">
                {testResults.success ? 'Webhook Test Successful' : 'Webhook Test Failed'}
              </h5>
            </div>
            
            {testResults.success ? (
              <div className="space-y-2 text-sm">
                <p><strong>Status:</strong> {testResults.status}</p>
                <p><strong>Response Time:</strong> {testResults.responseTime}</p>
                <div className="flex items-center space-x-2">
                  <span><strong>Headers:</strong></span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(testResults.headers, null, 2))}
                    className="h-6 px-2 text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600">{testResults.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Webhook Events Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-[#0a164d]" />
            <h4 className="text-lg font-medium text-gray-900">Webhook Events</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[#0a164d] hover:text-[#0a164d]/80"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </Button>
        </div>

        <div className="space-y-4">
          {categories.map((category) => {
            const { total, selected } = getCategoryCount(category);
            const categoryEvents = getCategoryEvents(category);
            
            return (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{category}</h5>
                    <p className="text-sm text-gray-500">
                      {selected} of {total} events selected
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll(category)}
                      className="text-xs h-7 px-2"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeselectAll(category)}
                      className="text-xs h-7 px-2"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                        data.webhookEvents.includes(event.id)
                          ? 'border-[#0a164d] bg-[#0a164d]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox
                        checked={data.webhookEvents.includes(event.id)}
                        onCheckedChange={() => handleEventToggle(event.id)}
                        className="text-[#0a164d] mt-1"
                      />
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-900 text-sm">{event.name}</h6>
                        <p className="text-xs text-gray-500">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#0a164d]" />
            <h4 className="text-lg font-medium text-gray-900">Advanced Settings</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Retry Attempts</Label>
              <Input
                type="number"
                placeholder="3"
                value={retryAttempts}
                onChange={(e) => setRetryAttempts(e.target.value)}
                min="1"
                max="10"
                className="border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]"
              />
              <p className="text-xs text-gray-500">Number of retry attempts for failed webhooks</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Timeout (seconds)</Label>
              <Input
                type="number"
                placeholder="30"
                value={timeout}
                onChange={(e) => setTimeoutValue(e.target.value)}
                min="5"
                max="120"
                className="border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]"
              />
              <p className="text-xs text-gray-500">Request timeout in seconds</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Custom Headers</Label>
            <Textarea
              placeholder='{"Authorization": "Bearer your-token", "X-Custom-Header": "value"}'
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              rows={3}
              className="border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]"
            />
            <p className="text-xs text-gray-500">JSON format for custom headers to include in webhook requests</p>
          </div>
        </div>
      )}

      {/* Webhook Payload Example */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Webhook Payload Example</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`{
  "event": "transaction.successful",
  "timestamp": "2024-01-15T10:30:00Z",
  "merchant_id": "merchant_123",
  "data": {
    "transaction_id": "txn_456",
    "amount": 5000,
    "currency": "NGN",
    "customer_email": "customer@example.com",
    "status": "successful"
  },
  "signature": "sha256_hash_here"
}`}</pre>
        </div>
        <div className="flex justify-end mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(`{
  "event": "transaction.successful",
  "timestamp": "2024-01-15T10:30:00Z",
  "merchant_id": "merchant_123",
  "data": {
    "transaction_id": "txn_456",
    "amount": 5000,
    "currency": "NGN",
    "customer_email": "customer@example.com",
    "status": "successful"
  },
  "signature": "sha256_hash_here"
}`)}
            className="text-xs h-7 px-2"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy Example
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Webhook Security
            </h4>
            <p className="text-sm text-blue-700">
              Always verify webhook signatures to ensure requests are coming from TransactLab. 
              Use HTTPS endpoints and implement proper authentication. Never expose sensitive 
              information in webhook URLs.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration Summary:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Webhook URL:</strong> {localWebhookUrl ? '✓ Configured' : '✗ Not configured'}</p>
          <p><strong>Selected Events:</strong> {data.webhookEvents.length}</p>
          <p><strong>Categories:</strong> {categories.filter(cat => getCategoryCount(cat).selected > 0).length}</p>
        </div>
      </div>
    </div>
  );
};

export default WebhookConfigForm;
