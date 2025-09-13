import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Play,
  CreditCard,
  Users,
  Settings,
  Shield,
  Zap,
  Database,
  Webhook,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

const Docs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const navigationItems = [
    { id: "overview", label: "Home", icon: Home },
    { id: "get-started", label: "Get Started", icon: Rocket },
    { id: "customers", label: "Customers", icon: User },
    { id: "api-reference", label: "API Reference", icon: Code },
    { id: "developer-tools", label: "Developer Tools", icon: Wrench },
    { id: "coverage", label: "Coverage", icon: Globe },
    { id: "changelog", label: "Changelog", icon: FileText },
  ];

  const productCategories = [
    {
      title: "Payment Processing",
      description: "Create checkout sessions, process payments, and handle transactions",
      icon: CreditCard,
      features: ["Checkout Sessions", "Payment Processing", "Transaction Management", "Refunds"]
    },
    {
      title: "Customer Management", 
      description: "Manage customer data, preferences, and payment methods",
      icon: Users,
      features: ["Customer CRUD", "Payment Methods", "Customer Analytics", "Data Export"]
    },
    {
      title: "Subscription Management",
      description: "Handle recurring payments, plans, and subscription lifecycle",
      icon: Settings,
      features: ["Plans & Pricing", "Subscriptions", "Invoices", "Renewals"]
    },
    {
      title: "Security & Fraud",
      description: "Advanced fraud detection and security features",
      icon: Shield,
      features: ["Fraud Detection", "Risk Assessment", "Security Settings", "Analytics"]
    },
    {
      title: "Webhooks & Events",
      description: "Real-time notifications and event-driven workflows",
      icon: Webhook,
      features: ["Webhook Configuration", "Event Testing", "Delivery Tracking", "Event Types"]
    },
    {
      title: "Analytics & Reporting",
      description: "Comprehensive analytics and reporting capabilities",
      icon: BarChart3,
      features: ["Transaction Analytics", "Fraud Reports", "Performance Metrics", "Custom Reports"]
    }
  ];

  const testCards = [
    {
      type: "Success",
      number: "4242 4242 4242 4242",
      description: "Successful payment",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      type: "Insufficient Funds",
      number: "4000 0000 0000 9995", 
      description: "Payment declined",
      icon: XCircle,
      color: "text-red-600"
    },
    {
      type: "3D Secure Required",
      number: "4000 0027 6000 3184",
      description: "Additional authentication needed",
      icon: AlertTriangle,
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TL</span>
                </div>
                <span className="text-xl font-bold text-gray-900">TransactLab</span>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">docs</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search here..."
                  className="w-64 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get API Keys
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Navigation</p>
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSection === item.id
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">All Products</p>
                {productCategories.map((category, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                  >
                    <category.icon className="w-4 h-4" />
                    <span>{category.title}</span>
                  </button>
                ))}
              </div>
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-2">
                <p>© TransactLab</p>
                <div className="flex space-x-4">
                  <a href="#" className="hover:text-gray-700">Support</a>
                  <a href="#" className="hover:text-gray-700">Status</a>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeSection === "overview" && (
              <>
                {/* Hero Section */}
                <section className="mb-12">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-8 md:p-12">
                    <div className="relative z-10">
                      <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        Start building payment experiences into your apps
                      </h1>
                      <p className="text-xl text-blue-100 mb-8 max-w-2xl">
                        Find all the guides and resources to get your business set up and integrated with TransactLab APIs.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                          Sign up
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                          Get started here
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
                      <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 rounded-full blur-3xl"></div>
                    </div>
                  </div>
                </section>

                {/* Quick Start Section */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start</h2>
                  
                  {/* Products Grid */}
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {productCategories.slice(0, 3).map((product, index) => (
                      <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <product.icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <CardTitle className="text-lg">{product.title}</CardTitle>
                          </div>
                          <CardDescription>{product.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {product.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {/* Test Data Section */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Credit Cards</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {testCards.map((card, index) => (
                      <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <card.icon className={`w-6 h-6 ${card.color}`} />
                            <CardTitle className="text-lg">{card.type}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                              {card.number}
                            </div>
                            <p className="text-sm text-gray-600">{card.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeSection === "get-started" && (
              <div className="space-y-8">
                <header>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">Get Started</h1>
                  <p className="text-gray-600">Get up and running with TransactLab in minutes</p>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <span>Quick Setup</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-600">1</span>
                          </div>
                          <div>
                            <p className="font-medium">Create Account</p>
                            <p className="text-sm text-gray-600">Sign up and get your sandbox workspace</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-600">2</span>
                          </div>
                          <div>
                            <p className="font-medium">Generate API Keys</p>
                            <p className="text-sm text-gray-600">Get your publishable and secret keys</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-600">3</span>
                          </div>
                          <div>
                            <p className="font-medium">Create Your First Session</p>
                            <p className="text-sm text-gray-600">Start processing payments</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Code className="w-5 h-5 text-green-600" />
                        <span>Code Example</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Create a checkout session
const response = await fetch(
  'https://transactlab-backend.onrender.com/api/v1/sandbox/sessions',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 500,
      currency: 'NGN',
      description: 'Test Payment',
      customerEmail: 'customer@example.com'
    })
  }
);

const session = await response.json();
// Redirect to checkout URL
window.location.href = session.data.checkoutUrl;`}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Docs;



