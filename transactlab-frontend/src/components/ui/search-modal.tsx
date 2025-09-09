import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Command, 
  ArrowRight, 
  Key, 
  CreditCard, 
  Webhook, 
  History, 
  Users, 
  Package, 
  Repeat, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  TestTube, 
  Settings,
  Zap,
  Database,
  Globe,
  Shield,
  TrendingUp,
  Activity,
  FileText,
  Play
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Dialog, DialogContent } from './dialog';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  path: string;
  category: string;
  icon?: React.ComponentType<any>;
  color?: string;
}

const searchData: SearchResult[] = [
  // Dashboard
  { id: 'dashboard', title: 'Dashboard', description: 'Main dashboard overview', path: '/dashboard', category: 'Main' },
  { id: 'index', title: 'Home', description: 'Welcome page and landing', path: '/', category: 'Main' },
  
  // Merchant Transactions
  { id: 'merchant-transactions', title: 'Merchant Transactions', description: 'Manage merchant-specific transactions', path: '/merchant/transactions', category: 'Payments' },
  { id: 'new-transaction', title: 'New Transaction', description: 'Create a new payment transaction', path: '/merchant/transactions/new', category: 'Payments' },
  
  // Merchant
  { id: 'merchant-dashboard', title: 'Merchant Dashboard', description: 'Merchant-specific dashboard', path: '/merchant/dashboard', category: 'Merchant' },
  { id: 'onboarding', title: 'Merchant Onboarding', description: 'Complete merchant verification', path: '/merchant/onboarding', category: 'Merchant' },
  { id: 'verification', title: 'Verification Documents', description: 'Upload verification documents', path: '/merchant/verification', category: 'Merchant' },
  { id: 'payment-setup', title: 'Payment Setup', description: 'Configure payment methods', path: '/merchant/payment-setup', category: 'Merchant' },
  { id: 'business-profile', title: 'Business Profile', description: 'Manage business information', path: '/merchant/business-profile', category: 'Merchant' },
  { id: 'business-address', title: 'Business Address', description: 'Update business address', path: '/merchant/business-address', category: 'Merchant' },
  
  // Analytics
  { id: 'analytics', title: 'Analytics', description: 'View detailed analytics and reports', path: '/analytics', category: 'Analytics' },
  
  // Customers
  { id: 'customers', title: 'Customers', description: 'Manage customer information', path: '/customers', category: 'Management' },
  
  // Settings
  { id: 'profile', title: 'Profile Settings', description: 'Update your profile information', path: '/settings/profile', category: 'Settings' },
  { id: 'security', title: 'Security Settings', description: 'Manage security preferences', path: '/settings/security', category: 'Settings' },
  
  // Admin
  { id: 'admin-users', title: 'Admin Users', description: 'Manage system users', path: '/admin/users', category: 'Admin' },
  { id: 'audit-logs', title: 'Audit Logs', description: 'View system audit logs', path: '/admin/audit-logs', category: 'Admin' },
  
  // Sandbox & Development
  { id: 'sandbox', title: 'Sandbox Overview', description: 'Development and testing environment overview', path: '/sandbox', category: 'Sandbox', icon: Database, color: 'text-blue-600' },
  { id: 'sandbox-api-keys', title: 'API Key Management', description: 'Create and manage API keys for sandbox testing', path: '/sandbox/api-keys', category: 'Sandbox', icon: Key, color: 'text-green-600' },
  { id: 'sandbox-sessions', title: 'Session Management', description: 'Manage payment sessions and checkout flows', path: '/sandbox/sessions', category: 'Sandbox', icon: CreditCard, color: 'text-purple-600' },
  { id: 'sandbox-webhooks', title: 'Webhook Management', description: 'Configure and test webhook endpoints', path: '/sandbox/webhooks', category: 'Sandbox', icon: Webhook, color: 'text-orange-600' },
  { id: 'sandbox-transactions', title: 'Transaction History', description: 'View and manage transaction history', path: '/sandbox/transactions', category: 'Sandbox', icon: History, color: 'text-indigo-600' },
  { id: 'sandbox-customers', title: 'Customer Management', description: 'Manage customer data and profiles', path: '/sandbox/customers', category: 'Sandbox', icon: Users, color: 'text-pink-600' },
  { id: 'sandbox-products', title: 'Product Catalog', description: 'Create and manage products and pricing plans', path: '/sandbox/products', category: 'Sandbox', icon: Package, color: 'text-cyan-600' },
  { id: 'sandbox-subscriptions', title: 'Subscription Management', description: 'Manage recurring subscriptions and billing', path: '/sandbox/subscriptions', category: 'Sandbox', icon: Repeat, color: 'text-emerald-600' },
  { id: 'sandbox-checkout', title: 'Checkout Page', description: 'Payment checkout and processing', path: '/sandbox/checkout', category: 'Sandbox', icon: CreditCard, color: 'text-blue-600' },
  { id: 'sandbox-checkout-success', title: 'Checkout Success', description: 'Payment completion confirmation page', path: '/sandbox/checkout/success', category: 'Sandbox', icon: CheckCircle, color: 'text-green-600' },
  { id: 'sandbox-checkout-error', title: 'Checkout Error', description: 'Payment failure and error handling', path: '/sandbox/checkout/error', category: 'Sandbox', icon: XCircle, color: 'text-red-600' },
  
  // Sandbox Features & Actions
  { id: 'create-api-key', title: 'Create API Key', description: 'Generate new API key for sandbox testing', path: '/sandbox/api-keys', category: 'Sandbox Actions', icon: Key, color: 'text-green-600' },
  { id: 'create-session', title: 'Create Payment Session', description: 'Start a new payment session', path: '/sandbox/sessions', category: 'Sandbox Actions', icon: CreditCard, color: 'text-purple-600' },
  { id: 'create-webhook', title: 'Create Webhook', description: 'Set up webhook endpoint for events', path: '/sandbox/webhooks', category: 'Sandbox Actions', icon: Webhook, color: 'text-orange-600' },
  { id: 'create-customer', title: 'Create Customer', description: 'Add new customer to sandbox', path: '/sandbox/customers', category: 'Sandbox Actions', icon: Users, color: 'text-pink-600' },
  { id: 'create-product', title: 'Create Product', description: 'Add new product to catalog', path: '/sandbox/products', category: 'Sandbox Actions', icon: Package, color: 'text-cyan-600' },
  { id: 'create-subscription', title: 'Create Subscription', description: 'Set up recurring subscription', path: '/sandbox/subscriptions', category: 'Sandbox Actions', icon: Repeat, color: 'text-emerald-600' },
  { id: 'test-payment', title: 'Test Payment', description: 'Simulate payment processing', path: '/sandbox/sessions', category: 'Sandbox Actions', icon: TestTube, color: 'text-blue-600' },
  { id: 'test-webhook', title: 'Test Webhook', description: 'Send test webhook event', path: '/sandbox/webhooks', category: 'Sandbox Actions', icon: TestTube, color: 'text-orange-600' },
  { id: 'view-transactions', title: 'View Transactions', description: 'Browse transaction history', path: '/sandbox/transactions', category: 'Sandbox Actions', icon: History, color: 'text-indigo-600' },
  { id: 'view-customers', title: 'View Customers', description: 'Browse customer list', path: '/sandbox/customers', category: 'Sandbox Actions', icon: Users, color: 'text-pink-600' },
  { id: 'view-products', title: 'View Products', description: 'Browse product catalog', path: '/sandbox/products', category: 'Sandbox Actions', icon: Package, color: 'text-cyan-600' },
  { id: 'view-subscriptions', title: 'View Subscriptions', description: 'Browse active subscriptions', path: '/sandbox/subscriptions', category: 'Sandbox Actions', icon: Repeat, color: 'text-emerald-600' },
  
  // Sandbox Analytics & Reports
  { id: 'sandbox-analytics', title: 'Sandbox Analytics', description: 'View sandbox usage analytics and metrics', path: '/sandbox/analytics', category: 'Sandbox Analytics', icon: BarChart3, color: 'text-blue-600' },
  { id: 'transaction-analytics', title: 'Transaction Analytics', description: 'Payment and transaction insights', path: '/sandbox/transactions', category: 'Sandbox Analytics', icon: TrendingUp, color: 'text-indigo-600' },
  { id: 'customer-analytics', title: 'Customer Analytics', description: 'Customer behavior and metrics', path: '/sandbox/customers', category: 'Sandbox Analytics', icon: Activity, color: 'text-pink-600' },
  { id: 'product-analytics', title: 'Product Analytics', description: 'Product performance and revenue metrics', path: '/sandbox/products', category: 'Sandbox Analytics', icon: BarChart3, color: 'text-cyan-600' },
  { id: 'subscription-analytics', title: 'Subscription Analytics', description: 'Recurring revenue and churn analysis', path: '/sandbox/subscriptions', category: 'Sandbox Analytics', icon: TrendingUp, color: 'text-emerald-600' },
  { id: 'webhook-analytics', title: 'Webhook Analytics', description: 'Webhook delivery and success rates', path: '/sandbox/webhooks', category: 'Sandbox Analytics', icon: Activity, color: 'text-orange-600' },
  
  // Sandbox Testing & Development
  { id: 'sandbox-testing', title: 'Sandbox Testing', description: 'Test payment flows and integrations', path: '/sandbox', category: 'Sandbox Testing', icon: TestTube, color: 'text-blue-600' },
  { id: 'payment-simulation', title: 'Payment Simulation', description: 'Simulate various payment scenarios', path: '/sandbox/sessions', category: 'Sandbox Testing', icon: Play, color: 'text-purple-600' },
  { id: 'webhook-testing', title: 'Webhook Testing', description: 'Test webhook delivery and events', path: '/sandbox/webhooks', category: 'Sandbox Testing', icon: TestTube, color: 'text-orange-600' },
  { id: 'api-testing', title: 'API Testing', description: 'Test API endpoints and responses', path: '/sandbox/api-keys', category: 'Sandbox Testing', icon: Settings, color: 'text-green-600' },
  { id: 'integration-testing', title: 'Integration Testing', description: 'Test third-party integrations', path: '/sandbox', category: 'Sandbox Testing', icon: Globe, color: 'text-blue-600' },
  { id: 'error-testing', title: 'Error Testing', description: 'Test error handling and edge cases', path: '/sandbox/checkout/error', category: 'Sandbox Testing', icon: XCircle, color: 'text-red-600' },
  { id: 'playground', title: 'Playground', description: 'Test features and functionality', path: '/playground', category: 'Development' },
  { id: 'dev-tools', title: 'Developer Tools', description: 'Development utilities and tools', path: '/dev-tools', category: 'Development' },
  { id: 'api-docs', title: 'API Documentation', description: 'API reference and examples', path: '/api-docs', category: 'Development' },
  
  // Payment Methods
  { id: 'payment-methods-page', title: 'Payment Methods', description: 'Manage payment methods', path: '/payments/methods', category: 'Payments' },
  
  // Auth Pages
  { id: 'login', title: 'Login', description: 'Sign in to your account', path: '/auth/login', category: 'Authentication' },
  { id: 'register', title: 'Register', description: 'Create a new account', path: '/auth/register', category: 'Authentication' },
  { id: 'forgot-password', title: 'Forgot Password', description: 'Reset your password', path: '/auth/forgot-password', category: 'Authentication' },
  { id: 'reset-password', title: 'Reset Password', description: 'Set new password', path: '/auth/reset-password', category: 'Authentication' },
  { id: 'email-verification', title: 'Email Verification', description: 'Verify your email address', path: '/auth/email-verification', category: 'Authentication' },
  
  // Additional Features
  { id: 'notifications', title: 'Notifications', description: 'Manage notifications and alerts', path: '/notifications', category: 'Features' },
  { id: 'help', title: 'Help & Support', description: 'Get help and support', path: '/help', category: 'Features' },
  { id: 'about', title: 'About', description: 'About TransactLab', path: '/about', category: 'Features' },
  { id: 'contact', title: 'Contact', description: 'Contact support team', path: '/contact', category: 'Features' },
  { id: 'privacy', title: 'Privacy Policy', description: 'Privacy policy and terms', path: '/privacy', category: 'Features' },
  { id: 'terms', title: 'Terms of Service', description: 'Terms and conditions', path: '/terms', category: 'Features' },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const filtered = searchData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
    
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(results.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleResultSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden [&>button]:hidden">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search for features, pages, and more..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 shadow-none text-lg placeholder:text-gray-400 focus-visible:ring-0 text-gray-900 flex-1 px-3 py-2"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="h-96 overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-6 h-full flex flex-col justify-center">
              <div className="text-center text-gray-500 mb-6">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Search TransactLab</p>
                <p className="text-sm">Search for features, pages, and functionality</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Command className="h-3 w-3" />
                  <span>Press Cmd+K to search anytime</span>
                </div>
              </div>
              
              {/* Popular Searches */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Sandbox Features</h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'popular-api-key', title: 'Create API Key', description: 'Quick access to API key management', path: '/sandbox/api-keys', category: 'Popular', icon: Key, color: 'text-green-600' },
                    { id: 'popular-session', title: 'Create Payment Session', description: 'Quick access to session management', path: '/sandbox/sessions', category: 'Popular', icon: CreditCard, color: 'text-purple-600' },
                    { id: 'popular-webhook', title: 'Manage Webhooks', description: 'Quick access to webhook management', path: '/sandbox/webhooks', category: 'Popular', icon: Webhook, color: 'text-orange-600' },
                    { id: 'popular-transactions', title: 'View Transactions', description: 'Quick access to transaction history', path: '/sandbox/transactions', category: 'Popular', icon: History, color: 'text-indigo-600' },
                    { id: 'popular-customers', title: 'Customer Management', description: 'Quick access to customer management', path: '/sandbox/customers', category: 'Popular', icon: Users, color: 'text-pink-600' },
                    { id: 'popular-products', title: 'Product Catalog', description: 'Quick access to product catalog', path: '/sandbox/products', category: 'Popular', icon: Package, color: 'text-cyan-600' }
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultSelect(item)}
                      className="flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${item.color.split('-')[1]}-100`}>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 h-full flex flex-col items-center justify-center text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-sm">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="divide-y">
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                <div key={category}>
                  <div className="px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {category}
                  </div>
                  {categoryResults.map((result, index) => {
                    const globalIndex = results.findIndex(r => r.id === result.id);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <div
                        key={result.id}
                        className={`px-6 py-4 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleResultSelect(result)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                result.color ? `bg-${result.color.split('-')[1]}-100` : 'bg-blue-100'
                              }`}>
                                {result.icon ? (
                                  <result.icon className={`h-4 w-4 ${result.color || 'text-blue-600'}`} />
                                ) : (
                                  <Search className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{result.title}</h4>
                                <p className="text-sm text-gray-500">{result.description}</p>
                              </div>
                            </div>
                          </div>
                          <ArrowRight className={`h-4 w-4 text-gray-400 transition-colors ${
                            isSelected ? 'text-blue-500' : ''
                          }`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="p-4 border-t bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Use ↑↓ to navigate, Enter to select</span>
              <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
