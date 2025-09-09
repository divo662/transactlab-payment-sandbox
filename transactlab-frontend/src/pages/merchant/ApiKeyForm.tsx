import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Key, Eye, EyeOff, Copy, RefreshCw, Shield, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyFormProps {
  data: {
    apiKeyName: string;
    apiKeyPermissions: string[];
  };
  updateData: (data: Partial<{
    apiKeyName: string;
    apiKeyPermissions: string[];
  }>) => void;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isDangerous: boolean;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ data, updateData }) => {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const permissions: Permission[] = [
    // Read Permissions
    { id: 'read:transactions', name: 'Read Transactions', description: 'View transaction details and history', category: 'Read', isDangerous: false },
    { id: 'read:customers', name: 'Read Customers', description: 'View customer information and profiles', category: 'Read', isDangerous: false },
    { id: 'read:payments', name: 'Read Payments', description: 'View payment information and status', category: 'Read', isDangerous: false },
    { id: 'read:analytics', name: 'Read Analytics', description: 'View business analytics and reports', category: 'Read', isDangerous: false },
    
    // Write Permissions
    { id: 'write:transactions', name: 'Create Transactions', description: 'Create new transactions and payments', category: 'Write', isDangerous: true },
    { id: 'write:customers', name: 'Manage Customers', description: 'Create, update, and delete customers', category: 'Write', isDangerous: true },
    { id: 'write:refunds', name: 'Process Refunds', description: 'Create and process refunds', category: 'Write', isDangerous: true },
    { id: 'write:webhooks', name: 'Manage Webhooks', description: 'Configure webhook endpoints', category: 'Write', isDangerous: true },
    
    // Admin Permissions
    { id: 'admin:merchant', name: 'Merchant Admin', description: 'Full access to merchant settings', category: 'Admin', isDangerous: true },
    { id: 'admin:users', name: 'User Management', description: 'Manage team members and permissions', category: 'Admin', isDangerous: true },
    { id: 'admin:billing', name: 'Billing Admin', description: 'Access to billing and subscription management', category: 'Admin', isDangerous: true }
  ];

  const generateApiKey = async () => {
    if (!data.apiKeyName.trim()) {
      toast({
        title: "API Key Name Required",
        description: "Please enter a name for your API key.",
        variant: "destructive"
      });
      return;
    }

    if (data.apiKeyPermissions.length === 0) {
      toast({
        title: "Permissions Required",
        description: "Please select at least one permission for your API key.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API key generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newApiKey: ApiKey = {
        id: `key_${Date.now()}`,
        name: data.apiKeyName,
        key: `tl_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        permissions: data.apiKeyPermissions,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        expiresAt: null
      };

      setApiKeys(prev => [newApiKey, ...prev]);
      
      // Reset form
      updateData({ apiKeyName: '', apiKeyPermissions: [] });
      setShowCreateForm(false);
      
      toast({
        title: "API Key Generated Successfully",
        description: "Your new API key has been created. Make sure to copy it now as it won't be shown again.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Failed to Generate API Key",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKey(showApiKey === keyId ? null : keyId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "The API key has been copied to your clipboard.",
      variant: "default"
    });
  };

  const regenerateApiKey = async (keyId: string) => {
    try {
      // Simulate regeneration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId 
          ? { ...key, key: `tl_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}` }
          : key
      ));
      
      toast({
        title: "API Key Regenerated",
        description: "Your API key has been regenerated. Update your integrations with the new key.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Failed to Regenerate",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteApiKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== keyId));
    toast({
      title: "API Key Deleted",
      description: "The API key has been permanently deleted.",
      variant: "default"
    });
  };

  const toggleApiKeyStatus = (keyId: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, isActive: !key.isActive } : key
    ));
  };

  const getPermissionCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const getPermissionDisplayName = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission?.name || permissionId;
  };

  const getPermissionDescription = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission?.description || '';
  };

  const isPermissionDangerous = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission?.isDangerous || false;
  };

  const categories = ['Read', 'Write', 'Admin'];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#0a164d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="w-8 h-8 text-[#0a164d]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          API Key Management
        </h3>
        <p className="text-gray-600">
          Generate and manage API keys for secure access to TransactLab APIs
        </p>
      </div>

      {/* Create New API Key */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Create New API Key</h4>
          <Button
            variant="outline"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="border-gray-300 hover:border-[#0a164d] hover:text-[#0a164d]"
          >
            {showCreateForm ? 'Cancel' : 'New API Key'}
          </Button>
        </div>

        {showCreateForm && (
          <div className="space-y-4">
            {/* API Key Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                API Key Name *
              </Label>
              <Input
                type="text"
                placeholder="e.g., Production API, Test Environment, Mobile App"
                value={data.apiKeyName}
                onChange={(e) => updateData({ apiKeyName: e.target.value })}
                className="border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]"
              />
              <p className="text-xs text-gray-500">
                Give your API key a descriptive name to help you identify its purpose
              </p>
            </div>

            {/* Permissions Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Permissions *
              </Label>
              
              <div className="space-y-4">
                {categories.map((category) => {
                  const categoryPermissions = getPermissionCategory(category);
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{category} Permissions</h5>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const categoryPermissionIds = categoryPermissions.map(p => p.id);
                              const newPermissions = [...new Set([...data.apiKeyPermissions, ...categoryPermissionIds])];
                              updateData({ apiKeyPermissions: newPermissions });
                            }}
                            className="text-xs h-7 px-2"
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const categoryPermissionIds = categoryPermissions.map(p => p.id);
                              const newPermissions = data.apiKeyPermissions.filter(p => !categoryPermissionIds.includes(p));
                              updateData({ apiKeyPermissions: newPermissions });
                            }}
                            className="text-xs h-7 px-2"
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                              data.apiKeyPermissions.includes(permission.id)
                                ? 'border-[#0a164d] bg-[#0a164d]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Checkbox
                              checked={data.apiKeyPermissions.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                const newPermissions = checked
                                  ? [...data.apiKeyPermissions, permission.id]
                                  : data.apiKeyPermissions.filter(p => p !== permission.id);
                                updateData({ apiKeyPermissions: newPermissions });
                              }}
                              className="text-[#0a164d] mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h6 className="font-medium text-gray-900 text-sm">{permission.name}</h6>
                                {permission.isDangerous && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Dangerous
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateApiKey}
              disabled={!data.apiKeyName.trim() || data.apiKeyPermissions.length === 0 || isGenerating}
              className="w-full bg-[#0a164d] hover:bg-[#0a164d]/90"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating API Key...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Generate API Key
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Existing API Keys */}
      {apiKeys.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Your API Keys</h4>
          
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="font-medium text-gray-900">{apiKey.name}</h5>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        apiKey.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {apiKey.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">API Key:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {showApiKey === apiKey.id 
                          ? apiKey.key 
                          : `${apiKey.key.substring(0, 12)}...${apiKey.key.substring(apiKey.key.length - 8)}`
                        }
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApiKeyVisibility(apiKey.id)}
                        className="h-6 px-2 text-xs"
                      >
                        {showApiKey === apiKey.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="h-6 px-2 text-xs"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><strong>Created:</strong> {new Date(apiKey.createdAt).toLocaleDateString()}</p>
                      <p><strong>Permissions:</strong> {apiKey.permissions.length} selected</p>
                      {apiKey.lastUsed && (
                        <p><strong>Last Used:</strong> {new Date(apiKey.lastUsed).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Switch
                      checked={apiKey.isActive}
                      onCheckedChange={() => toggleApiKeyStatus(apiKey.id)}
                      className="data-[state=checked]:bg-[#0a164d]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateApiKey(apiKey.id)}
                      className="h-8 px-2 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Permissions List */}
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.permissions.map((permissionId) => (
                      <span
                        key={permissionId}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isPermissionDangerous(permissionId)
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {getPermissionDisplayName(permissionId)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-800 mb-1">
              API Key Security
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Keep your API keys secure and never share them publicly</li>
              <li>• Use environment variables in production code</li>
              <li>• Rotate keys regularly and revoke unused keys</li>
              <li>• Monitor API usage for suspicious activity</li>
              <li>• Be cautious with dangerous permissions like admin access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">API Key Summary:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Total API Keys:</strong> {apiKeys.length}</p>
          <p><strong>Active Keys:</strong> {apiKeys.filter(k => k.isActive).length}</p>
          <p><strong>Selected Permissions:</strong> {data.apiKeyPermissions.length}</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyForm;
