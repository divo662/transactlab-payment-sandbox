import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Rocket, 
  User, 
  Code, 
  Wrench, 
  Globe, 
  FileText,
  ChevronDown,
  ArrowRight,
  CreditCard,
  Users,
  Settings,
  Shield,
  Webhook,
  BarChart3,
  Circle,
  FileIcon,
  BookOpen,
  CheckSquare,
  AlertCircle,
  Clock
} from "lucide-react";

const TransactLabDocs: React.FC = () => {
  const [activeTab, setActiveTab] = useState("payments");
  const [activeSection, setActiveSection] = useState("verify-assets");
  const [activeNavItem, setActiveNavItem] = useState("use-cases");

  const navigationItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "get-started", label: "Get Started", icon: Rocket },
    { id: "api-reference", label: "API Reference" },
    { id: "use-cases", label: "Use Cases" },
    { id: "sandbox", label: "Sandbox" },
    { id: "webhooks", label: "Webhooks" },
    { id: "authentication", label: "Authentication" },
    { id: "payment-methods", label: "Payment Methods" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "customers", label: "Customers" },
    { id: "products", label: "Products" },
    { id: "refunds", label: "Refunds" },
    { id: "analytics", label: "Analytics" },
    { id: "errors", label: "Errors" },
    { id: "faqs", label: "FAQs" },
  ];

  const categoryItems = [
    { id: "sdk", label: "SDK", icon: Code },
    { id: "api-reference", label: "API Reference", icon: FileIcon },
    { id: "developer-tools", label: "Developer Tools", icon: Wrench },
    { id: "testing", label: "Testing", icon: CheckSquare },
    { id: "changelog", label: "Changelog", icon: FileText },
  ];

  const productItems = [
    { id: "payment-processing", label: "Payment Processing", icon: CreditCard, hasDropdown: false },
    { id: "subscription-management", label: "Subscription Management", icon: Settings, hasDropdown: false },
    { id: "customer-management", label: "Customer Management", icon: Users, hasDropdown: false },
    { id: "fraud-detection", label: "Fraud Detection", icon: Shield, hasDropdown: true },
  ];

  const useCaseTabs = [
    { id: "lending", label: "Lending" },
    { id: "payments", label: "Payments" },
    { id: "wealth-management", label: "Wealth Management" },
    { id: "accounting", label: "Accounting" },
    { id: "banking", label: "Banking" },
  ];

  const lendingUseCases = [
    {
      id: "verify-assets",
      title: "Verify borrowers' assets digitally",
      description: "Provides a consolidated report with account balances, uncategorized and categorized transactions, and account identity information."
    },
    {
      id: "check-balances",
      title: "Check balances in real-time",
      description: "Monitor account balances and transaction history to assess borrower financial health and repayment capacity."
    },
    {
      id: "authenticate-accounts",
      title: "Instantly authenticate accounts",
      description: "Verify account ownership and authenticity to prevent fraud and ensure legitimate loan applications."
    },
    {
      id: "verify-identities",
      title: "Verify borrowers' identities",
      description: "Cross-reference personal information with bank account data to confirm borrower identity and reduce risk."
    }
  ];

  const paymentsUseCases = [
    {
      id: "payment-processing",
      title: "Process payments securely",
      description: "Handle credit card, bank transfer, and alternative payment methods with fraud protection and real-time processing."
    },
    {
      id: "subscription-billing",
      title: "Manage subscription billing",
      description: "Automate recurring payments, handle plan changes, and manage subscription lifecycles with webhook notifications."
    },
    {
      id: "refund-management",
      title: "Handle refunds and disputes",
      description: "Process full and partial refunds, manage chargebacks, and track dispute resolution workflows."
    }
  ];

  const getCurrentUseCases = () => {
    switch (activeTab) {
      case "lending":
        return lendingUseCases;
      case "payments":
        return paymentsUseCases;
      default:
        return lendingUseCases;
    }
  };

  const renderHomeContent = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to TransactLab</h1>
        <p className="text-xl mb-6">The complete payment sandbox platform for developers</p>
        <Button className="bg-white text-blue-600 hover:bg-gray-100">
          Get Started <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <CreditCard className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Payment Processing</h3>
          <p className="text-gray-600">Process payments with credit cards, bank transfers, and alternative methods</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <Users className="w-8 h-8 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Customer Management</h3>
          <p className="text-gray-600">Manage customer data, subscriptions, and payment methods</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <Shield className="w-8 h-8 text-purple-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Fraud Protection</h3>
          <p className="text-gray-600">Advanced fraud detection and prevention tools</p>
        </div>
      </div>
    </div>
  );

  const renderGetStartedContent = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Get Started with TransactLab</h1>
        <p className="text-lg text-gray-600">Set up your payment processing in minutes</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold">Create Account</h3>
            </div>
            <p className="text-gray-600 mb-4">Sign up for a free TransactLab account and verify your email</p>
            <Button className="w-full">Sign Up Now</Button>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold">Get API Keys</h3>
            </div>
            <p className="text-gray-600 mb-4">Generate your publishable and secret keys from the dashboard</p>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div>Publishable Key: pk_test_...</div>
              <div>Secret Key: sk_test_...</div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold">Make Your First Payment</h3>
            </div>
            <p className="text-gray-600 mb-4">Create a checkout session and process a test payment</p>
            <Button variant="outline" className="w-full">View Code Example</Button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Code Example</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono overflow-x-auto">
            <div>// Initialize TransactLab</div>
            <div>const transactlab = new TransactLab(&#123;</div>
            <div className="ml-4">apiKey: 'pk_test_your_key_here'</div>
            <div>&#125;);</div>
            <div className="mt-4">// Create checkout session</div>
            <div>const session = await transactlab.sessions.create(&#123;</div>
            <div className="ml-4">amount: 2000,</div>
            <div className="ml-4">currency: 'usd',</div>
            <div className="ml-4">success_url: 'https://yoursite.com/success'</div>
            <div>&#125;);</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TL</span>
                </div>
                <span className="text-xl font-bold text-gray-900">TransactLab</span>
                <span className="text-gray-400">docs</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search here..."
                  className="w-64 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get API Keys
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8 py-8">
          {/* Left Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-6">
              {/* Main Navigation */}
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => setActiveNavItem(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeNavItem === item.id
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </button>
                    {activeNavItem === item.id && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-700 rounded-r"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Category Navigation */}
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* All Products Section */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">ALL PRODUCTS</p>
                {productItems.map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.hasDropdown && <ChevronDown className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="max-w-4xl">
              {/* Dynamic Content Based on Active Navigation */}
              {activeNavItem === "home" && renderHomeContent()}
              {activeNavItem === "get-started" && renderGetStartedContent()}
              {activeNavItem === "use-cases" && (
                <div className="space-y-8">
                  {/* Page Header */}
                  <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Use Cases</h1>
                    <p className="text-sm text-gray-500">Last updated December 15th, 2024</p>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex space-x-1 mb-8">
                    {useCaseTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? "bg-gray-900 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Section Title */}
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 capitalize">
                      {activeTab === "lending" ? "Lending" : activeTab === "payments" ? "Payments" : "Use Cases"}
                    </h2>
                  </div>

                  {/* Use Cases Content */}
                  <div className="space-y-12">
                    {getCurrentUseCases().map((useCase, index) => (
                      <div key={useCase.id} className="border-b border-gray-200 pb-12 last:border-b-0">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{useCase.title}</h3>
                        <p className="text-lg text-gray-700 leading-relaxed">{useCase.description}</p>
                        
                        {/* Additional content based on use case */}
                        {activeTab === "lending" && (
                          <div className="mt-6 grid md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-6 rounded-lg">
                              <h4 className="font-semibold text-blue-900 mb-2">Key Features</h4>
                              <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-center space-x-2">
                                  <CheckSquare className="w-4 h-4" />
                                  <span>Account balance verification</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                  <CheckSquare className="w-4 h-4" />
                                  <span>Transaction categorization</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                  <CheckSquare className="w-4 h-4" />
                                  <span>Identity verification</span>
                                </li>
                              </ul>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg">
                              <h4 className="font-semibold text-green-900 mb-2">Benefits</h4>
                              <ul className="space-y-2 text-sm text-green-800">
                                <li className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4" />
                                  <span>Real-time processing</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                  <Shield className="w-4 h-4" />
                                  <span>Fraud prevention</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                  <BarChart3 className="w-4 h-4" />
                                  <span>Risk assessment</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {activeTab === "payments" && (
                          <div className="mt-6">
                            <div className="bg-gray-50 p-6 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-3">Implementation Guide</h4>
                              <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-blue-600">1</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Set up API keys</p>
                                    <p className="text-sm text-gray-600">Generate your publishable and secret keys in the TransactLab dashboard</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-blue-600">2</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Create checkout session</p>
                                    <p className="text-sm text-gray-600">Initialize a payment session with amount, currency, and customer details</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-blue-600">3</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">Handle webhooks</p>
                                    <p className="text-sm text-gray-600">Process payment events and update your application state</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeNavItem === "api-reference" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">API Reference</h1>
                    <p className="text-lg text-gray-600">Complete API documentation for TransactLab</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Authentication</h3>
                      <p className="text-gray-600 mb-4">Learn how to authenticate your API requests</p>
                      <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                        <div>Authorization: Bearer sk_test_...</div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Base URL</h3>
                      <p className="text-gray-600 mb-4">All API requests are made to:</p>
                      <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                        <div>https://api.transactlab.com/v1</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "sandbox" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Sandbox Environment</h1>
                    <p className="text-lg text-gray-600">Test your integration with our sandbox environment</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
                      <h3 className="text-lg font-semibold text-yellow-800">Sandbox Mode</h3>
                    </div>
                    <p className="text-yellow-700 mb-4">Use our sandbox environment to test payments without processing real transactions.</p>
                    <div className="bg-yellow-100 p-4 rounded">
                      <p className="text-sm text-yellow-800 font-semibold">Test Credit Cards:</p>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• 4242424242424242 - Visa (successful)</li>
                        <li>• 4000000000000002 - Visa (declined)</li>
                        <li>• 5555555555554444 - Mastercard (successful)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "webhooks" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Webhooks</h1>
                    <p className="text-lg text-gray-600">Receive real-time notifications about payment events</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Setting up Webhooks</h3>
                      <p className="text-gray-600 mb-4">Configure webhook endpoints to receive payment notifications</p>
                      <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                        <div>POST /webhooks</div>
                        <div>Content-Type: application/json</div>
                        <div>&#123;</div>
                        <div className="ml-4">"event": "payment.succeeded",</div>
                        <div className="ml-4">"data": &#123;</div>
                        <div className="ml-8">"id": "pay_1234567890"</div>
                        <div className="ml-4">&#125;</div>
                        <div>&#125;</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "authentication" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Authentication</h1>
                    <p className="text-lg text-gray-600">Learn how to authenticate your API requests</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">API Keys</h3>
                      <p className="text-gray-600 mb-4">Use your secret API key to authenticate requests to our API</p>
                      <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                        <div>curl -X POST https://api.transactlab.com/v1/sessions \</div>
                        <div>  -H "Authorization: Bearer sk_test_your_secret_key" \</div>
                        <div>  -H "Content-Type: application/json" \</div>
                        <div>  -d '&#123;"amount": 2000, "currency": "usd"&#125;'</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "payment-methods" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Payment Methods</h1>
                    <p className="text-lg text-gray-600">Supported payment methods and how to use them</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-6">
                      <CreditCard className="w-8 h-8 text-blue-600 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Credit Cards</h3>
                      <p className="text-gray-600">Visa, Mastercard, American Express, Discover</p>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <Settings className="w-8 h-8 text-green-600 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Bank Transfers</h3>
                      <p className="text-gray-600">ACH, Wire transfers, SEPA</p>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "subscriptions" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Subscriptions</h1>
                    <p className="text-lg text-gray-600">Manage recurring payments and subscription billing</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Creating Subscriptions</h3>
                      <p className="text-gray-600 mb-4">Set up recurring billing for your customers</p>
                      <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                        <div>POST /subscriptions</div>
                        <div>&#123;</div>
                        <div className="ml-4">"customer_id": "cus_1234567890",</div>
                        <div className="ml-4">"price_id": "price_1234567890",</div>
                        <div className="ml-4">"interval": "month"</div>
                        <div>&#125;</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "customers" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Customers</h1>
                    <p className="text-lg text-gray-600">Manage customer data and payment methods</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Customer Management</h3>
                      <p className="text-gray-600 mb-4">Create, update, and manage customer information</p>
                      <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                        <div>POST /customers</div>
                        <div>&#123;</div>
                        <div className="ml-4">"email": "customer@example.com",</div>
                        <div className="ml-4">"name": "John Doe",</div>
                        <div className="ml-4">"phone": "+1234567890"</div>
                        <div>&#125;</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "products" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Products</h1>
                    <p className="text-lg text-gray-600">Create and manage products and pricing</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Product Catalog</h3>
                      <p className="text-gray-600 mb-4">Manage your product catalog and pricing plans</p>
                      <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                        <div>POST /products</div>
                        <div>&#123;</div>
                        <div className="ml-4">"name": "Premium Plan",</div>
                        <div className="ml-4">"description": "Monthly subscription",</div>
                        <div className="ml-4">"amount": 2999</div>
                        <div>&#125;</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "refunds" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Refunds</h1>
                    <p className="text-lg text-gray-600">Process refunds and handle disputes</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">Processing Refunds</h3>
                      <p className="text-gray-600 mb-4">Issue full or partial refunds to customers</p>
                      <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                        <div>POST /refunds</div>
                        <div>&#123;</div>
                        <div className="ml-4">"payment_id": "pay_1234567890",</div>
                        <div className="ml-4">"amount": 1000</div>
                        <div>&#125;</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "analytics" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Analytics</h1>
                    <p className="text-lg text-gray-600">Track your payment performance and insights</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <BarChart3 className="w-8 h-8 text-blue-600 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Payment Analytics</h3>
                      <p className="text-gray-600">Monitor transaction volume, success rates, and revenue trends</p>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <Shield className="w-8 h-8 text-red-600 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Fraud Detection</h3>
                      <p className="text-gray-600">Track fraud attempts and security metrics</p>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "errors" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Error Handling</h1>
                    <p className="text-lg text-gray-600">Common errors and how to handle them</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-2">400 - Bad Request</h3>
                      <p className="text-gray-600">Invalid request parameters or missing required fields</p>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-2">401 - Unauthorized</h3>
                      <p className="text-gray-600">Invalid or missing API key</p>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-2">402 - Payment Required</h3>
                      <p className="text-gray-600">Payment was declined by the card issuer</p>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "faqs" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                    <p className="text-lg text-gray-600">Find answers to common questions</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-2">How do I get started with TransactLab?</h3>
                      <p className="text-gray-600">Sign up for a free account, get your API keys, and make your first payment in minutes.</p>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-2">What payment methods do you support?</h3>
                      <p className="text-gray-600">We support credit cards, bank transfers, digital wallets, and cryptocurrency payments.</p>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-2">Is there a sandbox environment?</h3>
                      <p className="text-gray-600">Yes, we provide a full sandbox environment for testing your integration before going live.</p>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-2">How do webhooks work?</h3>
                      <p className="text-gray-600">Webhooks send real-time notifications about payment events to your specified endpoint.</p>
                    </div>
                    
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-2">What are your rates?</h3>
                      <p className="text-gray-600">Our rates start at 2.9% + $0.30 per successful transaction. Volume discounts available.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar - On this page */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">On this page</h3>
              <nav className="space-y-2">
                {activeNavItem === "use-cases" && getCurrentUseCases().map((useCase, index) => (
                  <a
                    key={useCase.id}
                    href={`#${useCase.id}`}
                    onClick={() => setActiveSection(useCase.id)}
                    className={`block text-sm transition-colors ${
                      activeSection === useCase.id
                        ? "text-blue-600 font-medium border-l-2 border-blue-600 pl-3 -ml-3"
                        : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    {useCase.title}
                  </a>
                ))}
                
                {activeNavItem === "get-started" && (
                  <>
                    <a href="#create-account" className="block text-sm text-blue-600 hover:text-blue-800">Create Account</a>
                    <a href="#get-api-keys" className="block text-sm text-blue-600 hover:text-blue-800">Get API Keys</a>
                    <a href="#first-payment" className="block text-sm text-blue-600 hover:text-blue-800">Make First Payment</a>
                    <a href="#code-example" className="block text-sm text-blue-600 hover:text-blue-800">Code Example</a>
                  </>
                )}
                
                {activeNavItem === "api-reference" && (
                  <>
                    <a href="#authentication" className="block text-sm text-blue-600 hover:text-blue-800">Authentication</a>
                    <a href="#base-url" className="block text-sm text-blue-600 hover:text-blue-800">Base URL</a>
                    <a href="#endpoints" className="block text-sm text-blue-600 hover:text-blue-800">Endpoints</a>
                    <a href="#rate-limits" className="block text-sm text-blue-600 hover:text-blue-800">Rate Limits</a>
                  </>
                )}
                
                {activeNavItem === "sandbox" && (
                  <>
                    <a href="#test-cards" className="block text-sm text-blue-600 hover:text-blue-800">Test Credit Cards</a>
                    <a href="#sandbox-mode" className="block text-sm text-blue-600 hover:text-blue-800">Sandbox Mode</a>
                    <a href="#testing" className="block text-sm text-blue-600 hover:text-blue-800">Testing Guide</a>
                  </>
                )}
                
                {activeNavItem === "webhooks" && (
                  <>
                    <a href="#setup" className="block text-sm text-blue-600 hover:text-blue-800">Setting up Webhooks</a>
                    <a href="#events" className="block text-sm text-blue-600 hover:text-blue-800">Webhook Events</a>
                    <a href="#security" className="block text-sm text-blue-600 hover:text-blue-800">Security</a>
                  </>
                )}
                
                {activeNavItem === "faqs" && (
                  <>
                    <a href="#getting-started" className="block text-sm text-blue-600 hover:text-blue-800">Getting Started</a>
                    <a href="#payment-methods" className="block text-sm text-blue-600 hover:text-blue-800">Payment Methods</a>
                    <a href="#sandbox" className="block text-sm text-blue-600 hover:text-blue-800">Sandbox</a>
                    <a href="#webhooks" className="block text-sm text-blue-600 hover:text-blue-800">Webhooks</a>
                    <a href="#rates" className="block text-sm text-blue-600 hover:text-blue-800">Rates</a>
                  </>
                )}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TransactLabDocs;
