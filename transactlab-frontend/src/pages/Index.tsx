import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Code, Webhook, Database, Zap, Shield, Globe, Rocket } from "lucide-react";

const Index = () => {
  useEffect(() => {
    document.title = "TransactLab - Developer Sandbox for Payment Testing";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-[#0a164d]">
                TransactLab
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#home" className="text-gray-700 hover:text-[#0a164d] font-medium">Home</a>
              <a href="#features" className="text-gray-700 hover:text-[#0a164d] font-medium">Features</a>
              <a href="#sandbox" className="text-gray-700 hover:text-[#0a164d] font-medium">Sandbox</a>
              <a href="#developers" className="text-gray-700 hover:text-[#0a164d] font-medium">Developers</a>
              <a href="#pricing" className="text-gray-700 hover:text-[#0a164d] font-medium">Pricing</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/auth/login">
                <Button variant="outline" className="border-gray-200">
                  Login
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button className="bg-[#0a164d] hover:bg-[#0a164d]/90 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-[#0a164d] via-blue-700 to-[#0a164d] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium mb-6 backdrop-blur-sm">
            <Zap className="w-4 h-4 mr-2" />
            Developer Sandbox Platform
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Developer Sandbox for{" "}
            <span className="relative">
              Payment Testing
              <svg className="absolute -top-2 -right-8 w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </span>{" "}
            and{" "}
            <span className="relative">
              Integration
              <svg className="absolute -top-2 -right-8 w-8 h-8 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            TransactLab provides a production-ready sandbox environment that emulates real payment processors like Paystack, Stripe, and Flutterwave - designed specifically for developers to test, debug, and perfect their payment integrations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/auth/login">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-[#0a164d] px-8 py-3 text-lg font-semibold">
                Get Started
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg backdrop-blur-sm">
                Create Account
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <p className="text-sm font-semibold text-blue-200 uppercase tracking-wider mb-4">
              SUPPORTS POPULAR PAYMENT GATEWAYS
            </p>
            <div className="flex justify-center items-center space-x-8 opacity-80">
              <span className="text-white font-semibold">Paystack</span>
              <span className="text-white font-semibold">Stripe</span>
              <span className="text-white font-semibold">Flutterwave</span>
              <span className="text-white font-semibold">PayPal</span>
              <span className="text-white font-semibold">Square</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sandbox Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Developer Sandbox Environment
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              TransactLab provides a comprehensive testing environment that mirrors real payment processors, enabling developers to build and test payment integrations without the risk of real transactions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">API Testing</h3>
              <p className="text-gray-600">
                Test payment APIs with real-time simulated responses that match actual payment gateway behavior, including success, failure, and pending states.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Webhook className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Webhook Simulation</h3>
              <p className="text-gray-600">
                Simulate webhook delivery for all payment events, allowing you to test your webhook handling logic in a controlled environment.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sample Data</h3>
              <p className="text-gray-600">
                Access pre-generated test data including customer profiles, transaction histories, and payment methods for comprehensive testing scenarios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sandbox Tools Section */}
      <section id="sandbox" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Sandbox Tools for Developers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to test, debug, and perfect your payment integrations before going live.
          </p>
        </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                API Key Management & Testing
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                Generate test API keys, manage authentication, and test your API calls with comprehensive logging and debugging tools.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Secure Test Keys</h4>
                    <p className="text-gray-600">Generate unlimited test API keys with full access to sandbox features and no risk of real transactions.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Globe className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Webhook Testing</h4>
                    <p className="text-gray-600">Test webhook delivery, retry logic, and error handling with configurable endpoints and event simulation.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Rocket className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Integration Testing</h4>
                    <p className="text-gray-600">Test complete payment flows, subscription management, and refund processes with realistic data.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div className="font-mono">POST /api/v1/transactions</div>
                      <div className="text-xs mt-1">Status: 200 OK</div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Benefits Section */}
      <section id="developers" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Developers Choose TransactLab
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by developers, for developers. Get the tools you need to ship payment integrations with confidence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
                  </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Setup</h3>
              <p className="text-gray-600 text-sm">
                Get started in minutes with instant sandbox access and pre-configured test environments.
              </p>
                  </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
                </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Zero Risk</h3>
              <p className="text-gray-600 text-sm">
                Test with confidence knowing no real money is involved and all transactions are simulated.
              </p>
                </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-green-600" />
                  </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Realistic Testing</h3>
              <p className="text-gray-600 text-sm">
                Experience production-like behavior with realistic API responses, webhooks, and error scenarios.
              </p>
                </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-orange-600" />
                  </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ship Faster</h3>
              <p className="text-gray-600 text-sm">
                Reduce development time and catch issues early with comprehensive testing tools.
              </p>
                </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0a164d] to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Test Your Payment Integration?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers who trust TransactLab for their payment testing needs. Start building with confidence today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-[#0a164d] px-8 py-3 text-lg font-semibold">
                Get Started Free
              </Button>
            </Link>
            <Link to="/sandbox">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg">
                Explore Sandbox
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Choose the plan that fits your development and testing needs
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <CardContent className="p-0 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">$0</div>
                <p className="text-gray-600 mb-6">Perfect for getting started</p>
                <ul className="text-left space-y-2 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    100 transactions/month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Basic analytics
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Email support
                  </li>
                </ul>
                <Link to="/auth/register">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-shadow border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <CardContent className="p-0 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">$29</div>
                <p className="text-gray-600 mb-6">For growing businesses</p>
                <ul className="text-left space-y-2 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    10,000 transactions/month
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Advanced analytics
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Priority support
                  </li>
                </ul>
                <Link to="/auth/register">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Start Pro Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <CardContent className="p-0 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">Custom</div>
                <p className="text-gray-600 mb-6">For large organizations</p>
                <ul className="text-left space-y-2 mb-8">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Unlimited transactions
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Custom integrations
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Dedicated support
                  </li>
                </ul>
                <Link to="/auth/login">
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">TransactLab</h3>
              <p className="text-gray-400 text-sm">
                The developer sandbox for payment gateway testing and integration development.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#sandbox" className="hover:text-white">Sandbox</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Developers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/docs" className="hover:text-white">Documentation</a></li>
                <li><a href="/sandbox" className="hover:text-white">API Reference</a></li>
                <li><a href="/checkout-demo" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/auth/login" className="hover:text-white">Login</a></li>
                <li><a href="/auth/register" className="hover:text-white">Sign Up</a></li>
                <li><a href="#support" className="hover:text-white">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 TransactLab. All rights reserved. Built for developers, by developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
