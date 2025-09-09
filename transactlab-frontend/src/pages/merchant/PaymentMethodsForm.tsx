import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Settings, ArrowRight, ArrowLeft, Shield, Key, Globe } from 'lucide-react';

interface PaymentMethodsFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
  onBack?: () => void;
}

interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  logo: string;
  supportedMethods: string[];
  isEnabled: boolean;
  config: {
    apiKey: string;
    secretKey: string;
    webhookUrl: string;
    mode: 'test' | 'live';
  };
}

const PaymentMethodsForm: React.FC<PaymentMethodsFormProps> = ({ onComplete, initialData = {}, onBack }) => {
  const [gateways, setGateways] = useState<PaymentGateway[]>([
    {
      id: 'paystack',
      name: 'Paystack',
      description: 'Leading payment gateway for African businesses',
      logo: '🟡',
      supportedMethods: ['card', 'bank_transfer', 'mobile_money', 'ussd'],
      isEnabled: false,
      config: { apiKey: '', secretKey: '', webhookUrl: '', mode: 'test' }
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'Unified payments infrastructure for Africa',
      logo: '🟠',
      supportedMethods: ['card', 'bank_transfer', 'mobile_money', 'ussd'],
      isEnabled: false,
      config: { apiKey: '', secretKey: '', webhookUrl: '', mode: 'test' }
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Global payment processing platform',
      logo: '🔵',
      supportedMethods: ['card', 'bank_transfer', 'wallet'],
      isEnabled: false,
      config: { apiKey: '', secretKey: '', webhookUrl: '', mode: 'test' }
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'International digital payments',
      logo: '🔷',
      supportedMethods: ['card', 'wallet', 'bank_transfer'],
      isEnabled: false,
      config: { apiKey: '', secretKey: '', webhookUrl: '', mode: 'test' }
    }
  ]);

  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check if at least one gateway is enabled and configured
    const hasEnabledGateway = gateways.some(gateway => 
      gateway.isEnabled && 
      gateway.config.apiKey && 
      gateway.config.secretKey
    );
    setIsValid(hasEnabledGateway);
  }, [gateways]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleSubmit = () => {
    if (isValid) {
      const enabledGateways = gateways.filter(gateway => gateway.isEnabled);
      // Only send payment gateway data, not webhook configuration
      onComplete({ paymentGateways: enabledGateways });
    }
  };

  const toggleGateway = (gatewayId: string) => {
    setGateways(prev => prev.map(gateway => 
      gateway.id === gatewayId 
        ? { ...gateway, isEnabled: !gateway.isEnabled }
        : gateway
    ));
  };

  const openConfigModal = (gateway: PaymentGateway) => {
    setSelectedGateway(gateway);
    setIsConfigModalOpen(true);
  };

  const updateGatewayConfig = (gatewayId: string, config: Partial<PaymentGateway['config']>) => {
    setGateways(prev => prev.map(gateway => 
      gateway.id === gatewayId 
        ? { ...gateway, config: { ...gateway.config, ...config } }
        : gateway
    ));
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return '💳';
      case 'bank_transfer': return '🏦';
      case 'mobile_money': return '📱';
      case 'ussd': return '📞';
      case 'wallet': return '👛';
      case 'crypto': return '₿';
      default: return '💰';
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'card': return 'Cards';
      case 'bank_transfer': return 'Bank Transfer';
      case 'mobile_money': return 'Mobile Money';
      case 'ussd': return 'USSD';
      case 'wallet': return 'Digital Wallets';
      case 'crypto': return 'Cryptocurrency';
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#0a164d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-[#0a164d]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Payment Gateway Configuration
        </h3>
        <p className="text-gray-600">
          Set up and configure payment gateways for your business
        </p>
      </div>

      {/* Payment Gateways */}
      <div className="space-y-4">
        {gateways.map((gateway) => (
          <Card key={gateway.id} className={`transition-all ${
            gateway.isEnabled ? 'border-[#0a164d] bg-[#0a164d]/5' : 'border-gray-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{gateway.logo}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{gateway.name}</h4>
                      {gateway.isEnabled && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{gateway.description}</p>
                    
                    {/* Supported Methods */}
                    <div className="flex flex-wrap gap-2">
                      {gateway.supportedMethods.map((method) => (
                        <span key={method} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                          {getMethodIcon(method)} {getMethodName(method)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    checked={gateway.isEnabled}
                    onCheckedChange={() => toggleGateway(gateway.id)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openConfigModal(gateway)}
                    className="border-[#0a164d] text-[#0a164d] hover:bg-[#0a164d]/10"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-3">Configuration Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Enabled Gateways:</span>
              <span className="font-medium text-blue-800">
                {gateways.filter(g => g.isEnabled).length} of {gateways.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Configured Gateways:</span>
              <span className="font-medium text-blue-800">
                {gateways.filter(g => g.isEnabled && g.config.apiKey && g.config.secretKey).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Reminders */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-1">
              Security Reminders
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Never share your API keys or secret keys</li>
              <li>• Use test mode for development and testing</li>
              <li>• Regularly rotate your API keys</li>
              <li>• Monitor your webhook endpoints for security</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Tips */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Start with one gateway and expand as needed</li>
          <li>• Test thoroughly in test mode before going live</li>
          <li>• Ensure webhook URLs are secure (HTTPS)</li>
          <li>• Keep backup payment methods for redundancy</li>
          <li>• Consider local gateways for better conversion rates</li>
        </ul>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Required Configuration:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className={`flex items-center space-x-2 ${gateways.some(g => g.isEnabled) ? 'text-green-600' : 'text-red-600'}`}>
            <span>{gateways.some(g => g.isEnabled) ? '✓' : '✗'}</span>
            <span>At least one gateway enabled</span>
          </li>
          <li className={`flex items-center space-x-2 ${gateways.some(g => g.isEnabled && g.config.apiKey && g.config.secretKey) ? 'text-green-600' : 'text-red-600'}`}>
            <span>{gateways.some(g => g.isEnabled && g.config.apiKey && g.config.secretKey) ? '✓' : '✗'}</span>
            <span>API keys configured for enabled gateways</span>
          </li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={!isValid}
          className="bg-[#0a164d] hover:bg-[#0a164d]/90 disabled:opacity-50 ml-auto"
        >
          Complete Setup
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Configuration Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configure {selectedGateway?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGateway && (
            <div className="space-y-4">
              {/* API Key */}
              <div>
                <Label htmlFor="apiKey" className="text-sm font-medium text-gray-700">
                  API Key *
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter API key"
                  value={selectedGateway.config.apiKey}
                  onChange={(e) => updateGatewayConfig(selectedGateway.id, { apiKey: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Secret Key */}
              <div>
                <Label htmlFor="secretKey" className="text-sm font-medium text-gray-700">
                  Secret Key *
                </Label>
                <Input
                  id="secretKey"
                  type="password"
                  placeholder="Enter secret key"
                  value={selectedGateway.config.secretKey}
                  onChange={(e) => updateGatewayConfig(selectedGateway.id, { secretKey: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Webhook URL */}
              <div>
                <Label htmlFor="webhookUrl" className="text-sm font-medium text-gray-700">
                  Webhook URL
                </Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://yourdomain.com/webhook"
                  value={selectedGateway.config.webhookUrl}
                  onChange={(e) => updateGatewayConfig(selectedGateway.id, { webhookUrl: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Mode */}
              <div>
                <Label htmlFor="mode" className="text-sm font-medium text-gray-700">
                  Mode
                </Label>
                <Select
                  value={selectedGateway.config.mode}
                  onValueChange={(value: 'test' | 'live') => updateGatewayConfig(selectedGateway.id, { mode: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test Mode</SelectItem>
                    <SelectItem value="live">Live Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsConfigModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="bg-[#0a164d] hover:bg-[#0a164d]/90"
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethodsForm;
