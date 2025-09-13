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

  const navigationItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "get-started", label: "Get Started", icon: Rocket },
    { id: "definitions", label: "Definitions" },
    { id: "use-cases", label: "Use Cases", active: true },
    { id: "creating-app", label: "Creating an app" },
    { id: "environments", label: "Environments" },
    { id: "sandbox", label: "Sandbox" },
    { id: "webhooks", label: "Webhooks" },
    { id: "go-live", label: "Go Live Checklist" },
    { id: "quick-start", label: "Quick Start" },
    { id: "errors", label: "Errors" },
    { id: "faqs", label: "FAQs" },
  ];

  const categoryItems = [
    { id: "customers", label: "Customer", icon: User },
    { id: "api-reference", label: "API Reference", icon: FileIcon },
    { id: "developer-tools", label: "Developer tools", icon: Wrench },
    { id: "coverage", label: "Coverage", icon: Globe },
    { id: "changelog", label: "Changelog", icon: FileText },
  ];

  const productItems = [
    { id: "payment-processing", label: "Payment Processing", icon: CreditCard, hasDropdown: false },
    { id: "customer-management", label: "Customer Management", icon: Users, hasDropdown: false },
    { id: "identity-verification", label: "Identity Verification", icon: Shield, hasDropdown: true },
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
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                        item.active
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </button>
                    {item.active && (
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
          </main>

          {/* Right Sidebar - On this page */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">On this page</h3>
              <nav className="space-y-2">
                {getCurrentUseCases().map((useCase, index) => (
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
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TransactLabDocs;
