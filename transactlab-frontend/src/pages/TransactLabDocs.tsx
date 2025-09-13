import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Rocket, 
  Code, 
  Wrench, 
  FileText,
  ArrowRight,
  CreditCard,
  Users,
  Settings,
  Shield,
  Webhook,
  FileIcon,
  CheckSquare,
  AlertCircle,
  KeyRound,
  Link,
  Scale
} from "lucide-react";

const TransactLabDocs: React.FC = () => {
  const [activeNavItem, setActiveNavItem] = useState("home");

  const navigationItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "get-started", label: "Get Started", icon: Rocket },
    { id: "sdk", label: "SDK", icon: Code },
    { id: "api-reference", label: "API Reference", icon: FileIcon },
    { id: "developer-tools", label: "Developer Tools", icon: Wrench },
    { id: "testing", label: "Testing", icon: CheckSquare },
    { id: "changelog", label: "Changelog", icon: FileText },
    { id: "legal", label: "Legal", icon: Scale },
  ];


  const renderHomeContent = () => (
    <div className="space-y-12">
      {/* Announcement Banner */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
          🚀 New: Advanced fraud detection and team collaboration features
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Meet TransactLab</h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive developer sandbox platform for payment testing. Test integrations without risk, simulate real payment gateways, and build better payment systems.
        </p>
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div 
          className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300 group"
          onClick={() => setActiveNavItem("get-started")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Rocket className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Getting Started</h3>
                <p className="text-sm text-gray-500">Quick setup guide</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>

        <div 
          className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300 group"
          onClick={() => setActiveNavItem("sdk")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Code className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">SDK</h3>
                <p className="text-sm text-gray-500">Integration tools</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
        </div>

        <div 
          className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300 group"
          onClick={() => setActiveNavItem("api-reference")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <FileIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">API Reference</h3>
                <p className="text-sm text-gray-500">Complete API docs</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </div>

        <div 
          className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300 group"
          onClick={() => setActiveNavItem("developer-tools")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Developer Tools</h3>
                <p className="text-sm text-gray-500">Testing utilities</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Why TransactLab Section */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">Why TransactLab?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Zero Risk Testing</h3>
            </div>
            <p className="text-gray-600 ml-16">
              Test payment integrations without the risk of real transactions. Simulate Paystack, Stripe, Flutterwave, and other payment gateways in a secure sandbox environment.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Webhook className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Real-time Webhooks</h3>
            </div>
            <p className="text-gray-600 ml-16">
              Comprehensive webhook simulation with configurable endpoints, retry logic, and delivery tracking. Test all payment events and error scenarios.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">API Key Management</h3>
            </div>
            <p className="text-gray-600 ml-16">
              Generate unlimited test API keys for different environments. Workspace-scoped keys with rotation, revocation, and comprehensive usage analytics.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Team Collaboration</h3>
            </div>
            <p className="text-gray-600 ml-16">
              Collaborate with team members, share test scenarios, and manage workspace access. Perfect for development teams and quality assurance.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Complete Payment Flow</h3>
            </div>
            <p className="text-gray-600 ml-16">
              Test checkout sessions, subscriptions, refunds, and multiple payment methods. Simulate success, failure, and pending payment states.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Advanced Analytics</h3>
            </div>
            <p className="text-gray-600 ml-16">
              Monitor testing activity, track API usage, and analyze payment patterns. Comprehensive logging and debugging tools for better development.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to start testing?</h3>
        <p className="text-gray-600 mb-6">Join thousands of developers building better payment integrations with TransactLab.</p>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          onClick={() => setActiveNavItem("get-started")}
        >
          Get Started Now <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderGetStartedContent = () => (
    <div className="space-y-6 lg:space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <img 
            src="/transactlab/4.png" 
            alt="TransactLab Logo" 
            className="w-24 h-24 md:w-32 md:h-32 object-contain"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Get Started with TransactLab</h1>
        <p className="text-base md:text-lg text-gray-600">Complete guide to integrate TransactLab into your application</p>
      </div>

      {/* Quick Start Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Rocket className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold text-blue-900">Quick Start Overview</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold text-lg">1</span>
            </div>
            <h4 className="font-semibold text-blue-900">Sign Up</h4>
            <p className="text-sm text-blue-700">Create your account</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold text-lg">2</span>
            </div>
            <h4 className="font-semibold text-blue-900">Get API Keys</h4>
            <p className="text-sm text-blue-700">Generate your keys</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold text-lg">3</span>
            </div>
            <h4 className="font-semibold text-blue-900">Download SDK</h4>
            <p className="text-sm text-blue-700">Get your custom SDK</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold text-lg">4</span>
            </div>
            <h4 className="font-semibold text-blue-900">Start Coding</h4>
            <p className="text-sm text-blue-700">Make your first payment</p>
          </div>
        </div>
      </div>

      {/* Step 1: Account Setup */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-blue-600 font-bold text-xl">1</span>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Create Your TransactLab Account</h2>
            <p className="text-gray-600">Sign up and verify your email to get started</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Account Setup Steps:</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Visit <code className="bg-gray-100 px-2 py-1 rounded">https://transactlab-payment-sandbox.vercel.app/</code> and click "Sign Up"</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Enter your email, password, and business details</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Verify your email address via the confirmation link</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Complete your profile and business verification</span>
              </li>
            </ol>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">What You'll Get:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center"><CheckSquare className="w-4 h-4 text-green-600 mr-2" />Free sandbox environment</li>
              <li className="flex items-center"><CheckSquare className="w-4 h-4 text-green-600 mr-2" />API keys for testing</li>
              <li className="flex items-center"><CheckSquare className="w-4 h-4 text-green-600 mr-2" />Access to dashboard</li>
              <li className="flex items-center"><CheckSquare className="w-4 h-4 text-green-600 mr-2" />Customer support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step 2: API Keys */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-blue-600 font-bold text-xl">2</span>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Get Your API Keys</h2>
            <p className="text-gray-600">Generate your workspace-scoped API keys from the dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">How to Get Your Keys:</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Navigate to <strong>Developer → API Keys</strong> in your dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Click <strong>"Generate New Key"</strong> for your workspace</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Copy your <strong>Sandbox Secret Key</strong> (starts with <code>sk_test_</code>)</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Save it securely - you won't see it again!</span>
              </li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Your API Keys Look Like:</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
              <div className="text-gray-400">// Sandbox Secret Key (Server-side)</div>
              <div>sk_test_1234567890abcdef...</div>
              <div className="mt-3 text-gray-400">// Publishable Key (Client-side)</div>
              <div>pk_test_1234567890abcdef...</div>
              <div className="mt-3 text-gray-400">// Webhook Secret</div>
              <div>whsec_1234567890abcdef...</div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <h4 className="font-semibold text-yellow-800">Security Best Practices</h4>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Never expose your secret key in client-side code</li>
            <li>• Use environment variables to store your keys</li>
            <li>• Rotate your keys regularly for security</li>
            <li>• Use sandbox keys for testing, live keys for production</li>
          </ul>
        </div>
      </div>

      {/* Step 3: Download SDK */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-blue-600 font-bold text-xl">3</span>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Download Your Custom SDK</h2>
            <p className="text-gray-600">Get a pre-configured SDK package tailored to your needs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">SDK Setup Process:</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Go to <strong>Developer → SDK Setup</strong> in your dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Configure your payment defaults (amount, currency, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Set your success/cancel URLs</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Click <strong>"Download SDK Zip"</strong> to get your package</span>
              </li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-3">What's Included:</h4>
            <div className="bg-gray-50 p-4 rounded">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center"><CheckSquare className="w-4 h-4 text-green-600 mr-2" /><code>transactlab.js</code> - Core SDK</li>
                <li className="flex items-center"><CheckSquare className="w-4 h-4 text-green-600 mr-2" /><code>config.json</code> - Your configuration</li>
                <li className="flex items-center"><CheckSquare className="w-4 h-4 text-green-600 mr-2" /><code>magic-setup.js</code> - Auto-setup script</li>
                <li className="flex items-center"><CheckSquare className="w-4 h-4 text-green-600 mr-2" /><code>samples/</code> - Working examples</li>
                <li className="flex items-center"><CheckSquare className="w-4 h-4 text-green-600 mr-2" /><code>package.json</code> - Dependencies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Integration */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-blue-600 font-bold text-xl">4</span>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Integrate Into Your Application</h2>
            <p className="text-gray-600">Follow these steps to start processing payments</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Setup Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Quick Setup (5 minutes):</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
              <div className="text-gray-400"># 1. Extract and setup</div>
              <div>unzip transactlab-magic.zip</div>
              <div>cd transactlab-magic</div>
              <div className="mt-2 text-gray-400"># 2. Auto-configure environment</div>
              <div>node magic-setup.js</div>
              <div className="mt-2 text-gray-400"># 3. Install dependencies</div>
              <div>npm install express dotenv</div>
              <div className="mt-2 text-gray-400"># 4. Start the sample server</div>
              <div>node samples/express-server.js</div>
            </div>
          </div>

          {/* Code Examples */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">One-Time Payment:</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                <div className="text-gray-400">// Create a payment session</div>
                <div>const checkout = await tl.createOneTimeCheckout(&#123;</div>
                <div className="ml-4">amount: 5000, // ₦50.00</div>
                <div className="ml-4">currency: 'NGN',</div>
                <div className="ml-4">customerEmail: 'customer@example.com',</div>
                <div className="ml-4">description: 'Product purchase'</div>
                <div>&#125;);</div>
                <div className="mt-2 text-gray-400">// Redirect to checkout</div>
                <div>window.location.href = checkout.checkoutUrl;</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Subscription:</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
                <div className="text-gray-400">// Create a subscription</div>
                <div>const subscription = await tl.createSubscription(&#123;</div>
                <div className="ml-4">planId: 'plan_monthly_premium',</div>
                <div className="ml-4">customerEmail: 'customer@example.com',</div>
                <div className="ml-4">trialDays: 7, // Free trial</div>
                <div className="ml-4">chargeNow: true</div>
                <div>&#125;);</div>
                <div className="mt-2 text-gray-400">// Redirect to checkout</div>
                <div>window.location.href = subscription.checkoutUrl;</div>
              </div>
            </div>
          </div>

          {/* Testing */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckSquare className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-semibold text-green-800">Test Your Integration</h4>
            </div>
            <div className="text-sm text-green-700 space-y-2">
              <p><strong>Test Credit Cards:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• <code>4242424242424242</code> - Successful payment</li>
                <li>• <code>4000000000000002</code> - Declined payment</li>
                <li>• <code>4000000000000069</code> - Expired card</li>
              </ul>
              <p className="mt-3"><strong>Test with curl:</strong></p>
              <div className="bg-green-100 p-2 rounded text-xs font-mono">
                curl -X POST http://localhost:3000/api/create-session \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-d '&#123;"amount": 5000, "currency": "NGN", "customerEmail": "test@example.com"&#125;'
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">What's Next?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Webhooks</h3>
            <p className="text-sm text-gray-600 mb-3">Set up webhooks to receive payment notifications</p>
            <Button variant="outline" size="sm">Learn More</Button>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Go Live</h3>
            <p className="text-sm text-gray-600 mb-3">Switch to live mode when ready for production</p>
            <Button variant="outline" size="sm">Production Guide</Button>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Advanced Features</h3>
            <p className="text-sm text-gray-600 mb-3">Explore fraud detection, analytics, and more</p>
            <Button variant="outline" size="sm">Explore</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeveloperToolsContent = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Developer Tools</h1>
        <p className="text-lg text-gray-600">Comprehensive tools and utilities to help you integrate with TransactLab</p>
      </div>

      {/* Sandbox Configuration */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <KeyRound className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold">Sandbox Configuration</h2>
        </div>
        <p className="text-gray-600 mb-6">Manage your sandbox environment settings and workspace configuration.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Sandbox Data</h3>
            <p className="text-sm text-blue-700 mb-3">Get your sandbox configuration and sample data</p>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
              <div>GET /api/v1/sandbox/data</div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Sandbox Statistics</h3>
            <p className="text-sm text-purple-700 mb-3">View analytics and performance metrics</p>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
              <div>GET /api/v1/sandbox/stats</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Configuration Features:</h3>
          <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
            <li>• Workspace-scoped data isolation</li>
            <li>• Automatic sample data generation</li>
            <li>• Real-time analytics and monitoring</li>
            <li>• Test customer and transaction data</li>
            <li>• Sandbox-only environment</li>
            <li>• Development and testing tools</li>
          </ul>
        </div>
      </div>

      {/* Fraud Detection System */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-8 h-8 text-purple-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold">Fraud Detection System</h2>
        </div>
        <p className="text-gray-600 mb-6">Advanced fraud detection with customizable rules, risk scoring, and real-time analysis.</p>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-purple-900 mb-3">How Fraud Detection Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-purple-800 mb-2">1. Risk Analysis</h4>
              <p className="text-purple-700">Each transaction is analyzed against multiple fraud rules to calculate a risk score (0-100).</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">2. Rule Evaluation</h4>
              <p className="text-purple-700">Built-in rules check for high amounts, velocity, geographic anomalies, and suspicious patterns.</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">3. Action Decision</h4>
              <p className="text-purple-700">Based on risk score thresholds, transactions are allowed, flagged, or blocked automatically.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Built-in Fraud Rules</h3>
            <div className="space-y-3">
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">High Transaction Amount</h4>
                <p className="text-xs text-gray-600">Flags transactions over ₦1,000,000</p>
                <div className="text-xs text-blue-600 mt-1">Weight: 20 points</div>
              </div>
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">Velocity Check</h4>
                <p className="text-xs text-gray-600">Detects multiple transactions from same source</p>
                <div className="text-xs text-blue-600 mt-1">Weight: 25 points</div>
              </div>
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">Unusual Time</h4>
                <p className="text-xs text-gray-600">Transactions outside 6 AM - 11 PM</p>
                <div className="text-xs text-blue-600 mt-1">Weight: 15 points</div>
              </div>
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">New Customer High Amount</h4>
                <p className="text-xs text-gray-600">New customers with high transaction amounts</p>
                <div className="text-xs text-blue-600 mt-1">Weight: 30 points</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Risk Score Thresholds</h3>
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-800">Low Risk</span>
                  <span className="text-sm text-green-600">0-39 points</span>
                </div>
                <p className="text-xs text-green-700 mt-1">Transaction proceeds normally</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-yellow-800">Medium Risk</span>
                  <span className="text-sm text-yellow-600">40-59 points</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">Transaction flagged for monitoring</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-orange-800">High Risk</span>
                  <span className="text-sm text-orange-600">60-79 points</span>
                </div>
                <p className="text-xs text-orange-700 mt-1">Transaction requires manual review</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-800">Critical Risk</span>
                  <span className="text-sm text-red-600">80-100 points</span>
                </div>
                <p className="text-xs text-red-700 mt-1">Transaction blocked automatically</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Fraud Settings API</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
            <div>// Get fraud settings</div>
            <div>GET /api/v1/sandbox/fraud/settings</div>
            <div className="text-gray-400 mt-2">// Update fraud settings</div>
            <div>PUT /api/v1/sandbox/fraud/settings</div>
            <div>&#123;</div>
            <div>  "enabled": true,</div>
            <div>  "blockThreshold": 70,</div>
            <div>  "reviewThreshold": 50,</div>
            <div>  "flagThreshold": 30</div>
            <div>&#125;</div>
            <div className="text-gray-400 mt-2">// Get fraud summary</div>
            <div>GET /api/v1/sandbox/fraud/summary</div>
          </div>
        </div>
      </div>

      {/* Team Management */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-8 h-8 text-orange-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold">Team Management</h2>
        </div>
        <p className="text-gray-600 mb-6">Collaborate with team members, manage workspace access, and track team activity.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Team Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Invite Members:</strong> Send email invitations to join your workspace</li>
              <li>• <strong>Role Management:</strong> Owner and member roles with different permissions</li>
              <li>• <strong>Workspace Switching:</strong> Members can switch between multiple workspaces</li>
              <li>• <strong>Activity Logs:</strong> Track team member actions and workspace changes</li>
              <li>• <strong>Member Management:</strong> Remove members or cancel pending invitations</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Workspace Management</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Multiple Workspaces:</strong> Create and manage multiple workspaces</li>
              <li>• <strong>Workspace Renaming:</strong> Customize workspace names</li>
              <li>• <strong>Active Workspace:</strong> Switch between personal and team workspaces</li>
              <li>• <strong>Data Isolation:</strong> Each workspace has isolated API keys and data</li>
              <li>• <strong>Owner Controls:</strong> Workspace owners can manage all aspects</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Team Management (Sandbox Only)</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
            <div>// Team management is available through sandbox API only</div>
            <div className="text-gray-400 mt-2">// Invite team member</div>
            <div>POST /api/v1/sandbox/team/invite</div>
            <div>&#123; "email": "member@company.com" &#125;</div>
            <div className="text-gray-400 mt-2">// List team members</div>
            <div>GET /api/v1/sandbox/team/members</div>
            <div className="text-gray-400 mt-2">// Get teams</div>
            <div>GET /api/v1/sandbox/teams</div>
          </div>
        </div>
      </div>

      {/* Webhook Testing */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Webhook className="w-8 h-8 text-green-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold">Webhook Testing</h2>
        </div>
        <p className="text-gray-600 mb-6">Test and debug webhook endpoints with comprehensive event simulation and monitoring.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Webhook Events</h3>
            <div className="space-y-2">
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">payment.success</h4>
                <p className="text-xs text-gray-600">Triggered when payment completes successfully</p>
              </div>
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">payment.failed</h4>
                <p className="text-xs text-gray-600">Triggered when payment fails or is declined</p>
              </div>
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">subscription.created</h4>
                <p className="text-xs text-gray-600">Triggered when subscription is created</p>
              </div>
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">fraud.flagged</h4>
                <p className="text-xs text-gray-600">Triggered when transaction is flagged for fraud</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Testing Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Event Simulation:</strong> Manually trigger webhook events</li>
              <li>• <strong>Signature Verification:</strong> Test webhook signature validation</li>
              <li>• <strong>Retry Testing:</strong> Simulate failed webhook deliveries</li>
              <li>• <strong>Delivery Logs:</strong> View complete webhook delivery history</li>
              <li>• <strong>Response Monitoring:</strong> Monitor endpoint response times</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Webhook Testing API (Sandbox Only)</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
            <div>// Create webhook</div>
            <div>POST /api/v1/sandbox/webhooks</div>
            <div>&#123;</div>
            <div>  "url": "https://yourapp.com/webhooks",</div>
            <div>  "events": ["payment.success", "payment.failed"],</div>
            <div>  "secret": "whsec_1234567890abcdef"</div>
            <div>&#125;</div>
            <div className="text-gray-400 mt-2">// Test webhook</div>
            <div>POST /api/v1/sandbox/webhooks/:webhookId/test</div>
            <div className="text-gray-400 mt-2">// List webhooks</div>
            <div>GET /api/v1/sandbox/webhooks</div>
          </div>
        </div>
      </div>

      {/* Payment Links */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Link className="w-8 h-8 text-purple-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold">Payment Links</h2>
        </div>
        <p className="text-gray-600 mb-6">Generate shareable payment links for quick and easy transactions without integration.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Link Types</h3>
            <div className="space-y-3">
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">One-time Payments</h4>
                <p className="text-xs text-gray-600">Single payment links for products or services</p>
                <div className="text-xs text-blue-600 mt-1">Fixed amount, single use</div>
              </div>
              <div className="bg-white border rounded p-3">
                <h4 className="font-medium text-sm">Subscription Links</h4>
                <p className="text-xs text-gray-600">Recurring payment links for subscriptions</p>
                <div className="text-xs text-blue-600 mt-1">Recurring billing, multiple uses</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Customization Options</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Custom Branding:</strong> Add your logo and colors</li>
              <li>• <strong>Product Details:</strong> Include product descriptions and images</li>
              <li>• <strong>Customer Fields:</strong> Collect additional customer information</li>
              <li>• <strong>Success/Cancel URLs:</strong> Redirect customers after payment</li>
              <li>• <strong>Expiration Dates:</strong> Set link expiration times</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Payment Links API (Sandbox Only)</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
            <div>// Create quick payment link</div>
            <div>POST /api/v1/sandbox/links/quick</div>
            <div>&#123;</div>
            <div>  "amount": 5000,</div>
            <div>  "currency": "NGN",</div>
            <div>  "description": "Product purchase",</div>
            <div>  "customerEmail": "customer@example.com"</div>
            <div>&#125;</div>
          </div>
        </div>
      </div>

      {/* Magic SDK Generator */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Wrench className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold">Magic SDK Generator</h2>
        </div>
        <p className="text-gray-600 mb-6">Generate custom SDK packages with your specific configuration for easy integration.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">SDK Package Contents</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>transactlab.js:</strong> Main SDK library with all methods</li>
              <li>• <strong>config.json:</strong> Your custom configuration</li>
              <li>• <strong>package.json:</strong> NPM package configuration</li>
              <li>• <strong>express-server.js:</strong> Sample Express.js integration</li>
              <li>• <strong>README.md:</strong> Documentation and usage examples</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Configuration Options</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Success/Cancel URLs:</strong> Default redirect URLs</li>
              <li>• <strong>Webhook URLs:</strong> Default webhook endpoints</li>
              <li>• <strong>Frontend URL:</strong> Your application URL</li>
              <li>• <strong>Sandbox Secret:</strong> Pre-configured API keys</li>
              <li>• <strong>Encryption:</strong> Optional configuration encryption</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">SDK Generation API (Sandbox Only)</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
            <div>// Generate custom SDK</div>
            <div>POST /api/v1/magic-sdk/bake</div>
            <div>&#123;</div>
            <div>  "successUrl": "https://yourapp.com/success",</div>
            <div>  "cancelUrl": "https://yourapp.com/cancel",</div>
            <div>  "callbackUrl": "https://yourapp.com/webhooks",</div>
            <div>  "frontendUrl": "https://yourapp.com",</div>
            <div>  "sandboxSecret": "sk_test_...",</div>
            <div>  "encrypt": false</div>
            <div>&#125;</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAPIReferenceContent = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">API Reference</h1>
        <p className="text-lg text-gray-600">Complete API documentation for integrating with TransactLab</p>
      </div>

      {/* Quick Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FileIcon className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold text-blue-900">API Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold text-blue-900 mb-1">Base URL</h4>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded">https://transactlab-backend.onrender.com/api/v1/sandbox</code>
          </div>
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold text-blue-900 mb-1">Authentication</h4>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded">Server Bridge</code>
          </div>
          <div className="bg-white p-3 rounded border">
            <h4 className="font-semibold text-blue-900 mb-1">Content Type</h4>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded">application/json</code>
          </div>
        </div>
      </div>

      {/* Server Bridge Authentication */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-6">
          <KeyRound className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold">Server Bridge Authentication</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">No Client-Side Authentication Required</h3>
            <p className="text-gray-600 mb-4">TransactLab uses server bridges to handle authentication securely. Your frontend makes requests to bridge endpoints, and the server handles API authentication behind the scenes:</p>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono mb-4">
              <div className="text-gray-400"># Frontend makes simple requests to bridge endpoints</div>
              <div>POST /api/v1/checkout/process/sess_1234567890</div>
              <div className="mt-2 text-gray-400"># Server automatically handles:</div>
              <div className="ml-4"># - API key resolution from database</div>
              <div className="ml-4"># - Secret key authentication</div>
              <div className="ml-4"># - Fraud detection analysis</div>
              <div className="ml-4"># - Webhook emission</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckSquare className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="font-semibold text-green-800">Benefits of Server Bridge</h4>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• No API secrets exposed in client-side code</li>
                <li>• Automatic fraud detection on every transaction</li>
                <li>• Built-in webhook emission for real-time notifications</li>
                <li>• Secure payment processing without client authentication</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">How Server Bridges Work</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <div>
                  <span className="font-semibold">Frontend makes request:</span>
                  <div className="bg-gray-100 p-2 rounded text-xs font-mono mt-1">
                    POST /api/v1/checkout/process/sess_1234567890
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Server resolves API secret from database (SandboxConfig or SandboxApiKey)</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Server runs fraud detection analysis automatically</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Server makes authenticated request to internal API with resolved secret</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">5</span>
                <span>Server emits webhooks and returns response to frontend</span>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Bridge Endpoints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Payment Processing:</h4>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                  <div>POST /api/v1/checkout/process/:sessionId</div>
                  <div className="text-gray-600 mt-1"># Process payment with fraud detection</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Subscription Creation:</h4>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                  <div>POST /api/v1/checkout/subscription</div>
                  <div className="text-gray-600 mt-1"># Create subscription securely</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Base URLs */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Base URLs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Sandbox Environment</h3>
            <p className="text-gray-600 mb-3">Use this URL for testing and development:</p>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
              <div>https://transactlab-backend.onrender.com/api/v1/sandbox</div>
            </div>
            <p className="text-sm text-gray-500 mt-2">• Test transactions with fake cards</p>
            <p className="text-sm text-gray-500">• No real money processed</p>
            <p className="text-sm text-gray-500">• Full API functionality available</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Production Environment</h3>
            <p className="text-gray-600 mb-3">Use this URL for live transactions:</p>
            <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
              <div>https://transactlab-backend.onrender.com/api/v1/live</div>
            </div>
            <p className="text-sm text-gray-500 mt-2">• Real money transactions</p>
            <p className="text-sm text-gray-500">• Requires live API keys</p>
            <p className="text-sm text-gray-500">• Same API structure as sandbox</p>
          </div>
        </div>
      </div>

      {/* Bridge Endpoints */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">Bridge API Endpoints</h2>
        
        {/* Process Payment */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Process Payment</h3>
          <p className="text-gray-600 mb-4">Process a payment with automatic fraud detection and webhook emission:</p>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono mb-4">
            <div className="text-gray-400">POST /api/v1/checkout/process/:sessionId</div>
            <div className="mt-2 text-gray-400">Content-Type: application/json</div>
            <div className="mt-2 text-gray-400"># No authentication required - server handles it</div>
            <div className="mt-4">&#123;</div>
            <div className="ml-4"># Empty body - sessionId in URL</div>
            <div>&#125;</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">What Happens:</h4>
              <ul className="text-sm space-y-1">
                <li>• Server resolves API secret from database</li>
                <li>• Runs fraud detection analysis</li>
                <li>• Processes payment if approved</li>
                <li>• Emits webhooks for real-time updates</li>
                <li>• Returns payment status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response:</h4>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                <div>&#123;</div>
                <div className="ml-2">"success": true,</div>
                <div className="ml-2">"sessionId": "sess_1234567890",</div>
                <div className="ml-2">"status": "completed",</div>
                <div className="ml-2">"amount": 5000,</div>
                <div className="ml-2">"currency": "NGN"</div>
                <div>&#125;</div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Subscription */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Create Subscription</h3>
          <p className="text-gray-600 mb-4">Create a recurring subscription with automatic plan resolution:</p>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono mb-4">
            <div className="text-gray-400">POST /api/v1/checkout/subscription</div>
            <div className="mt-2 text-gray-400">Content-Type: application/json</div>
            <div className="mt-2 text-gray-400"># No authentication required - server handles it</div>
            <div className="mt-4">&#123;</div>
            <div className="ml-4">"planId": "plan_z2x8haem",</div>
            <div className="ml-4">"customerEmail": "customer@example.com",</div>
            <div className="ml-4">"metadata": &#123;&#125;,</div>
            <div className="ml-4">"success_url": "https://yoursite.com/success",</div>
            <div className="ml-4">"cancel_url": "https://yoursite.com/cancel",</div>
            <div className="ml-4">"chargeNow": true</div>
            <div>&#125;</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Request Parameters:</h4>
              <ul className="text-sm space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">planId</code> - Subscription plan ID (required)</li>
                <li><code className="bg-gray-100 px-1 rounded">customerEmail</code> - Customer email (required)</li>
                <li><code className="bg-gray-100 px-1 rounded">metadata</code> - Additional data (optional)</li>
                <li><code className="bg-gray-100 px-1 rounded">success_url</code> - Success redirect URL</li>
                <li><code className="bg-gray-100 px-1 rounded">cancel_url</code> - Cancel redirect URL</li>
                <li><code className="bg-gray-100 px-1 rounded">chargeNow</code> - Charge immediately (boolean)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response:</h4>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                <div>&#123;</div>
                <div className="ml-2">"success": true,</div>
                <div className="ml-2">"subscriptionId": "sub_1234567890",</div>
                <div className="ml-2">"checkoutUrl": "https://transactlab-payment-sandbox.vercel.app/checkout/sub_1234567890",</div>
                <div className="ml-2">"planId": "plan_z2x8haem"</div>
                <div>&#125;</div>
              </div>
            </div>
          </div>
        </div>

        {/* Get Checkout Session */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Get Checkout Session</h3>
          <p className="text-gray-600 mb-4">Retrieve checkout session details for public access:</p>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono mb-4">
            <div className="text-gray-400">GET /checkout/:sessionId</div>
            <div className="mt-2 text-gray-400"># Public endpoint - no authentication required</div>
          </div>

          <div className="bg-gray-100 p-3 rounded text-xs font-mono">
            <div className="text-gray-600"># Example: GET /checkout/sess_1234567890</div>
            <div>&#123;</div>
            <div className="ml-2">"success": true,</div>
            <div className="ml-2">"data": &#123;</div>
            <div className="ml-4">"sessionId": "sess_1234567890",</div>
            <div className="ml-4">"checkoutUrl": "https://transactlab-backend.onrender.com/checkout/sess_1234567890",</div>
            <div className="ml-4">"amount": "₦50.00",</div>
            <div className="ml-4">"currency": "NGN",</div>
            <div className="ml-4">"description": "Product purchase",</div>
            <div className="ml-4">"customerEmail": "customer@example.com",</div>
            <div className="ml-4">"status": "pending"</div>
            <div className="ml-2">&#125;</div>
            <div>&#125;</div>
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center mb-6">
          <Webhook className="w-6 h-6 text-green-600 mr-3" />
          <h2 className="text-xl md:text-2xl font-semibold">Webhooks</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">What are Webhooks?</h3>
            <p className="text-gray-600 mb-4">Webhooks are HTTP callbacks that notify your application when events occur in TransactLab. They provide real-time updates about payment status, subscription changes, and other important events.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Setting Up Webhooks</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <div>
                  <span className="font-semibold">Create your webhook endpoint:</span>
                  <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono mt-2">
                    <div className="text-gray-400"># Express.js example</div>
                    <div>app.post('/webhooks/transactlab', (req, res) =&gt; &#123;</div>
                    <div className="ml-4">// Handle webhook event</div>
                    <div className="ml-4">const event = req.body;</div>
                    <div className="ml-4">console.log('Received event:', event.type);</div>
                    <div className="ml-4">res.status(200).json(&#123;received: true&#125;);</div>
                    <div>&#125;);</div>
                  </div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Go to <strong>Developer → Webhooks</strong> in your dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Click <strong>"Add Webhook Endpoint"</strong> and enter your URL</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Select the events you want to receive notifications for</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">5</span>
                <span>Save your webhook and test it with the <strong>"Send Test Event"</strong> button</span>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Webhook Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Payment Events:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">session.created</code> - Checkout session created</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">session.completed</code> - Payment successful</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">session.failed</code> - Payment failed</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">session.cancelled</code> - Payment cancelled</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Subscription Events:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">subscription.created</code> - Subscription created</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">subscription.activated</code> - Subscription activated</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">subscription.cancelled</code> - Subscription cancelled</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">subscription.renewed</code> - Subscription renewed</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Webhook Security</h3>
            <p className="text-gray-600 mb-3">Always verify webhook signatures to ensure events are from TransactLab:</p>
            <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono">
              <div className="text-gray-400"># Verify webhook signature</div>
              <div>const signature = req.headers['transactlab-signature'];</div>
              <div>const isValid = tl.verifyWebhook(req.body, signature, webhookSecret);</div>
              <div className="mt-2">if (!isValid) &#123;</div>
              <div className="ml-4">return res.status(400).json(&#123;error: 'Invalid signature'&#125;);</div>
              <div>&#125;</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Sample Webhook Payload</h3>
            <div className="bg-gray-100 p-4 rounded text-xs font-mono">
              <div>&#123;</div>
              <div className="ml-2">"id": "evt_1234567890",</div>
              <div className="ml-2">"type": "session.completed",</div>
              <div className="ml-2">"created": "2024-01-15T10:30:00Z",</div>
              <div className="ml-2">"data": &#123;</div>
              <div className="ml-4">"id": "sess_1234567890",</div>
              <div className="ml-4">"status": "completed",</div>
              <div className="ml-4">"amount": 5000,</div>
              <div className="ml-4">"currency": "NGN",</div>
              <div className="ml-4">"customerEmail": "customer@example.com"</div>
              <div className="ml-2">&#125;</div>
              <div>&#125;</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Handling */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">Error Handling</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">HTTP Status Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Success Responses:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <code className="bg-green-100 px-1 rounded">200</code> - OK (Request successful)</li>
                  <li>• <code className="bg-green-100 px-1 rounded">201</code> - Created (Resource created)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Error Responses:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <code className="bg-red-100 px-1 rounded">400</code> - Bad Request (Invalid parameters)</li>
                  <li>• <code className="bg-red-100 px-1 rounded">401</code> - Unauthorized (Invalid API key)</li>
                  <li>• <code className="bg-red-100 px-1 rounded">404</code> - Not Found (Resource not found)</li>
                  <li>• <code className="bg-red-100 px-1 rounded">429</code> - Too Many Requests (Rate limited)</li>
                  <li>• <code className="bg-red-100 px-1 rounded">500</code> - Server Error (Internal error)</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Error Response Format</h3>
            <div className="bg-gray-100 p-4 rounded text-xs font-mono">
              <div>&#123;</div>
              <div className="ml-2">"error": &#123;</div>
              <div className="ml-4">"code": "invalid_request_error",</div>
              <div className="ml-4">"message": "The amount must be greater than 0",</div>
              <div className="ml-4">"type": "invalid_request_error"</div>
              <div className="ml-2">&#125;</div>
              <div>&#125;</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Common Error Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Validation Errors:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">invalid_amount</code> - Amount must be positive</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">invalid_currency</code> - Unsupported currency</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">invalid_email</code> - Invalid email format</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">missing_required_field</code> - Required field missing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Payment Errors:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">card_declined</code> - Card was declined</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">insufficient_funds</code> - Insufficient funds</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">expired_card</code> - Card has expired</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">fraud_detected</code> - Transaction flagged as fraud</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sandbox API Endpoints */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">Sandbox API Endpoints</h2>
        <p className="text-gray-600 mb-6">Complete sandbox API for testing and development. All endpoints require sandbox authentication.</p>
        
        {/* Core Sandbox Endpoints */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Core Sandbox Operations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Sessions & Payments</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                <div>POST /api/v1/sandbox/sessions</div>
                <div>GET /api/v1/sandbox/sessions/:sessionId</div>
                <div>POST /api/v1/sandbox/sessions/:sessionId/process-payment</div>
                <div>GET /api/v1/sandbox/sessions</div>
                <div>POST /api/v1/sandbox/links/quick</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Customers & Data</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                <div>POST /api/v1/sandbox/customers</div>
                <div>GET /api/v1/sandbox/customers</div>
                <div>GET /api/v1/sandbox/transactions</div>
                <div>GET /api/v1/sandbox/data</div>
                <div>GET /api/v1/sandbox/stats</div>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys & Webhooks */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">API Keys & Webhooks</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">API Key Management</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                <div>POST /api/v1/sandbox/api-keys</div>
                <div>GET /api/v1/sandbox/api-keys</div>
                <div>DELETE /api/v1/sandbox/api-keys/:apiKey</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Webhook Management</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                <div>POST /api/v1/sandbox/webhooks</div>
                <div>GET /api/v1/sandbox/webhooks</div>
                <div>POST /api/v1/sandbox/webhooks/:webhookId/test</div>
              </div>
            </div>
          </div>
        </div>

        {/* Products & Subscriptions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Products & Subscriptions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Products & Plans</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                <div>POST /api/v1/sandbox/products</div>
                <div>GET /api/v1/sandbox/products</div>
                <div>POST /api/v1/sandbox/plans</div>
                <div>GET /api/v1/sandbox/plans</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Subscriptions</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                <div>POST /api/v1/sandbox/subscriptions</div>
                <div>GET /api/v1/sandbox/subscriptions</div>
                <div>POST /api/v1/sandbox/subscriptions/:id/cancel</div>
                <div>POST /api/v1/sandbox/subscriptions/run-renewals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team & Fraud Management */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Team & Fraud Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Team Management</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                <div>POST /api/v1/sandbox/team/invite</div>
                <div>GET /api/v1/sandbox/team/members</div>
                <div>GET /api/v1/sandbox/teams</div>
                <div>DELETE /api/v1/sandbox/team/member</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Fraud Settings</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
                <div>GET /api/v1/sandbox/fraud/settings</div>
                <div>PUT /api/v1/sandbox/fraud/settings</div>
                <div>GET /api/v1/sandbox/fraud/summary</div>
                <div>GET /api/v1/sandbox/fraud/reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limits */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Rate Limits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Sandbox Environment</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>100 requests per minute</strong> per API key</li>
              <li>• <strong>1000 requests per hour</strong> per API key</li>
              <li>• Rate limits reset every minute/hour</li>
              <li>• Exceeding limits returns HTTP 429</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Production Environment</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>1000 requests per minute</strong> per API key</li>
              <li>• <strong>10000 requests per hour</strong> per API key</li>
              <li>• Higher limits for verified accounts</li>
              <li>• Contact support for custom limits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSDKContent = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">TransactLab Magic SDK</h1>
        <p className="text-lg text-gray-600">Easy payment integration for TransactLab. Get started in minutes with one-time payments and subscriptions.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Rocket className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-blue-800">Quick Start</h3>
        </div>
        <div className="text-blue-700 space-y-2">
          <p>1. <strong>Download the SDK:</strong> Generate your custom SDK from the dashboard</p>
          <p>2. <strong>Setup:</strong> Run <code className="bg-blue-100 px-2 py-1 rounded">node transactlab-magic/magic-setup.js</code></p>
          <p>3. <strong>Install:</strong> <code className="bg-blue-100 px-2 py-1 rounded">npm install express dotenv</code></p>
          <p>4. <strong>Start:</strong> <code className="bg-blue-100 px-2 py-1 rounded">node transactlab-magic/samples/express-server.js</code></p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Installation</h2>
          <p className="text-gray-600 mb-4">The TransactLab Magic SDK is a complete package that you download from your dashboard. It includes everything you need:</p>
          <div className="bg-gray-50 p-4 rounded mb-4">
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• <code>transactlab.js</code> - Core SDK with payment methods</li>
              <li>• <code>config.json</code> - Your API configuration</li>
              <li>• <code>magic-setup.js</code> - Auto-configuration script</li>
              <li>• <code>samples/</code> - Ready-to-use examples</li>
              <li>• <code>package.json</code> - Dependencies and scripts</li>
            </ul>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Initialization</h2>
          <p className="text-gray-600 mb-4">The SDK auto-loads configuration from your <code>config.json</code> file:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono mb-4">
            <div>const &#123; TransactLab &#125; = require('./transactlab-magic/transactlab');</div>
            <div className="mt-2">const tl = new TransactLab(&#123;</div>
            <div className="ml-4">baseUrl: 'https://transactlab-backend.onrender.com/api/v1',</div>
            <div className="ml-4">sandboxSecret: 'your-sandbox-secret',</div>
            <div className="ml-4">webhookSecret: 'your-webhook-secret',</div>
            <div className="ml-4">frontendUrl: 'https://transactlab-payment-sandbox.vercel.app'</div>
            <div>&#125;);</div>
          </div>
          <p className="text-gray-600">The SDK automatically reads from your environment variables after running <code>magic-setup.js</code></p>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Creating One-Time Payments</h2>
          <p className="text-gray-600 mb-4">Create checkout sessions for one-time payments:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono mb-4">
            <div>const checkout = await tl.createOneTimeCheckout(&#123;</div>
            <div className="ml-4">amount: 300000, // Amount in major units (3000 NGN)</div>
            <div className="ml-4">currency: 'NGN',</div>
            <div className="ml-4">customerEmail: 'customer@example.com',</div>
            <div className="ml-4">description: 'Product purchase',</div>
            <div className="ml-4">success_url: 'https://yoursite.com/success',</div>
            <div className="ml-4">cancel_url: 'https://yoursite.com/cancel'</div>
            <div>&#125;);</div>
          </div>
          <p className="text-gray-600">Returns: <code>&#123; sessionId, checkoutUrl, url &#125;</code></p>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Creating Subscriptions</h2>
          <p className="text-gray-600 mb-4">Create recurring payment subscriptions:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono mb-4">
            <div>const subscription = await tl.createSubscription(&#123;</div>
            <div className="ml-4">planId: 'plan_z2x8haem',</div>
            <div className="ml-4">customerEmail: 'customer@example.com',</div>
            <div className="ml-4">trialDays: 7, // Optional trial period</div>
            <div className="ml-4">chargeNow: true, // Charge immediately</div>
            <div className="ml-4">metadata: &#123; source: 'website' &#125;</div>
            <div>&#125;);</div>
          </div>
          <p className="text-gray-600">Returns: <code>&#123; sessionId, subscriptionId, checkoutUrl, url &#125;</code></p>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Webhook Verification</h2>
          <p className="text-gray-600 mb-4">Verify webhook signatures for security:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono mb-4">
            <div>app.post('/webhooks/transactlab', (req, res) =&gt; &#123;</div>
            <div className="ml-4">try &#123;</div>
            <div className="ml-8">const event = tl.verifyWebhook(req.rawBody, req.headers);</div>
            <div className="ml-8">console.log('Webhook received:', event.type);</div>
            <div className="ml-8">res.json(&#123; received: true &#125;);</div>
            <div className="ml-4">&#125; catch (e) &#123;</div>
            <div className="ml-8">res.status(400).json(&#123; error: e.message &#125;);</div>
            <div className="ml-4">&#125;</div>
            <div>&#125;);</div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Configuration</h2>
          <p className="text-gray-600 mb-4">Your <code>config.json</code> contains:</p>
          <div className="bg-gray-900 text-green-400 p-4 rounded text-sm font-mono mb-4">
            <div>&#123;</div>
            <div className="ml-4">"apiKey": "sk_test_your_secret_key",</div>
            <div className="ml-4">"webhookSecret": "whsec_your_webhook_secret",</div>
            <div className="ml-4">"urls": &#123;</div>
            <div className="ml-8">"success": "https://yoursite.com/success",</div>
            <div className="ml-8">"cancel": "https://yoursite.com/cancel",</div>
            <div className="ml-8">"callback": "https://yoursite.com/webhooks/transactlab",</div>
            <div className="ml-8">"frontend": "https://yoursite.com"</div>
            <div className="ml-4">&#125;,</div>
            <div className="ml-4">"environment": "sandbox",</div>
            <div className="ml-4">"baseUrl": "https://transactlab-backend.onrender.com/api/v1"</div>
            <div>&#125;</div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-green-600" />
                <span className="text-sm">One-time payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-green-600" />
                <span className="text-sm">Subscriptions</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-green-600" />
                <span className="text-sm">Webhook verification</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-green-600" />
                <span className="text-sm">Auto-configuration</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-green-600" />
                <span className="text-sm">Sample implementations</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-green-600" />
                <span className="text-sm">Pure JavaScript</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLegalContent = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Legal</h1>
        <p className="text-base md:text-lg text-gray-600">Terms of Service and Privacy Policy for TransactLab</p>
      </div>

      {/* Terms of Service */}
      <div id="terms-of-service" className="border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Terms of Service</h2>
        <div className="space-y-6 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
            <p>By accessing and using TransactLab ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">2. Description of Service</h3>
            <p>TransactLab is a developer sandbox platform that provides payment testing and simulation services. The Service allows developers to test payment integrations without processing real transactions. This is a testing environment only and no real money is involved.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">3. User Accounts and Registration</h3>
            <p>To access certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">4. Acceptable Use Policy</h3>
            <p>You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. You may not use the Service in any manner that could damage, disable, overburden, or impair any server, or the network(s) connected to any server.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">5. API Usage and Rate Limits</h3>
            <p>Your use of the TransactLab API is subject to rate limits and usage restrictions. We reserve the right to modify these limits at any time. Abuse of the API may result in termination of your account.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">6. Data and Privacy</h3>
            <p>You retain ownership of any data you provide to the Service. We will not use your data for any purpose other than providing the Service. Please review our Privacy Policy for more information about how we handle your data.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">7. Service Availability</h3>
            <p>While we strive to maintain high availability, we do not guarantee that the Service will be available at all times. We may perform maintenance, updates, or modifications that may temporarily interrupt the Service.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">8. Limitation of Liability</h3>
            <p>TransactLab is provided "as is" without any warranties. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">9. Termination</h3>
            <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">10. Changes to Terms</h3>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">11. Contact Information</h3>
            <p>If you have any questions about these Terms of Service, please contact us at legal@transactlab.dev</p>
          </div>
        </div>
      </div>

      {/* Privacy Policy */}
      <div id="privacy-policy" className="border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Privacy Policy</h2>
        <div className="space-y-6 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include your name, email address, phone number, and any other information you choose to provide.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">2. How We Use Your Information</h3>
            <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send technical notices and support messages, and respond to your comments and questions.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">3. Information Sharing and Disclosure</h3>
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this Privacy Policy. We may share your information in certain limited circumstances, such as to comply with legal requirements.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">4. Data Security</h3>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">5. Cookies and Tracking Technologies</h3>
            <p>We use cookies and similar tracking technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">6. Data Retention</h3>
            <p>We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">7. Your Rights and Choices</h3>
            <p>You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us. To exercise these rights, please contact us at privacy@transactlab.dev</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">8. International Data Transfers</h3>
            <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">9. Children's Privacy</h3>
            <p>Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">10. Changes to This Privacy Policy</h3>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">11. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@transactlab.dev</p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div id="last-updated" className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Last Updated:</strong> September 13, 2025
        </p>
        <p className="text-sm text-gray-600 mt-2">
          These terms and privacy policy are effective as of the date above and apply to all users of TransactLab services.
        </p>
      </div>
    </div>
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/transactlab/4.png" 
                alt="TransactLab Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <span className="text-lg font-bold text-gray-900">TransactLab</span>
                <span className="text-gray-400 text-sm ml-2">docs</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header - Hidden on mobile */}
      <header className="hidden lg:block sticky top-0 z-50 bg-white border-b border-gray-200 ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/transactlab/4.png" 
                  alt="TransactLab Logo" 
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <span className="text-xl font-bold text-gray-900">TransactLab</span>
                  <span className="text-gray-400 ml-2">docs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <nav className="p-6 space-y-6">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <img 
                    src="/transactlab/4.png" 
                    alt="TransactLab Logo" 
                    className="w-12 h-12 object-contain mr-3"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">TransactLab</h1>
                    <p className="text-sm text-gray-500">Documentation</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">Sandbox Mode</p>
                </div>
              </div>

              {/* Main Navigation */}
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => {
                        setActiveNavItem(item.id);
                        setSidebarOpen(false);
                      }}
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
            </nav>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 lg:gap-8 py-4 lg:py-8 lg:ml-64">
          {/* Left Sidebar - Hidden on mobile, fixed on desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0 fixed left-0 top-0 h-screen overflow-y-auto bg-white border-r border-gray-200 z-10">
            <nav className="p-6 space-y-6">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <img 
                    src="/transactlab/4.png" 
                    alt="TransactLab Logo" 
                    className="w-12 h-12 object-contain mr-3"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">TransactLab</h1>
                    <p className="text-sm text-gray-500">Documentation</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">Sandbox Mode</p>
                </div>
              </div>

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

            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 w-full lg:w-auto">
            <div className="max-w-4xl mx-auto lg:mx-0">
              {/* Dynamic Content Based on Active Navigation */}
              {activeNavItem === "home" && renderHomeContent()}
              {activeNavItem === "get-started" && renderGetStartedContent()}
              {activeNavItem === "sdk" && renderSDKContent()}
              {activeNavItem === "api-reference" && renderAPIReferenceContent()}
              {activeNavItem === "developer-tools" && renderDeveloperToolsContent()}
              {activeNavItem === "testing" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">Testing</h1>
                    <p className="text-lg text-gray-600">Test your integration with TransactLab's sandbox environment</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
                      <h3 className="text-lg font-semibold text-yellow-800">Sandbox Environment</h3>
                    </div>
                    <p className="text-yellow-700 mb-4">Use our sandbox environment to test payments without processing real transactions.</p>
                  </div>

                  <div className="border rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold mb-4">Test Credit Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded">
                        <h4 className="font-semibold text-green-800 mb-2">Successful Payments</h4>
                        <div className="text-sm text-green-700 space-y-1">
                          <div>• 4242424242424242 - Visa</div>
                          <div>• 5555555555554444 - Mastercard</div>
                          <div>• 378282246310005 - American Express</div>
                        </div>
                      </div>
                      <div className="bg-red-50 p-4 rounded">
                        <h4 className="font-semibold text-red-800 mb-2">Declined Payments</h4>
                        <div className="text-sm text-red-700 space-y-1">
                          <div>• 4000000000000002 - Generic decline</div>
                          <div>• 4000000000000069 - Expired card</div>
                          <div>• 4000000000000127 - Incorrect CVC</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold mb-4">Fraud Testing</h2>
                    <p className="text-gray-600 mb-4">Test fraud detection scenarios:</p>
                    <div className="bg-gray-50 p-4 rounded">
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Velocity checks - Multiple rapid transactions</li>
                        <li>• IP mismatch - Different billing/shipping IPs</li>
                        <li>• BIN rules - Specific card number patterns</li>
                        <li>• Geographic restrictions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "changelog" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">Changelog</h1>
                    <p className="text-lg text-gray-600">Recent updates and improvements to TransactLab</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div id="version-1-0-0" className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Version 1.0.0</h3>
                        <span className="text-sm text-gray-500">September 13, 2025</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Complete authentication system with 5-step registration</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Modern UI/UX with shadcn/ui components</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Comprehensive sandbox testing environment</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">API key management and testing tools</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Webhook simulation and delivery testing</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Transaction and subscription testing</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Customer and product management</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Team workspace collaboration features</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800">Enhanced</Badge>
                          <span className="text-sm">Payment link generation with custom branding</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800">Enhanced</Badge>
                          <span className="text-sm">SDK with improved error handling</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-purple-100 text-purple-800">Fixed</Badge>
                          <span className="text-sm">Webhook delivery reliability improvements</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Fraud detection with customizable rules</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Responsive design with Tailwind CSS</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">TypeScript throughout for type safety</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Email verification and security features</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Complete payment gateway simulation (Paystack, Stripe, Flutterwave, PayPal, Square)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Advanced analytics dashboard</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">Custom webhook templates</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">New</Badge>
                          <span className="text-sm">API rate limiting simulation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeNavItem === "legal" && renderLegalContent()}
            </div>
          </main>

          {/* Right Sidebar - Hidden on mobile */}
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">On this page</h3>
              <nav className="space-y-2">
                {activeNavItem === "home" && (
                  <>
                    <a href="#features" className="block text-sm text-blue-600 hover:text-blue-800">Key Features</a>
                    <a href="#checkout-sessions" className="block text-sm text-blue-600 hover:text-blue-800">Checkout Sessions</a>
                    <a href="#team-workspaces" className="block text-sm text-blue-600 hover:text-blue-800">Team Workspaces</a>
                    <a href="#fraud-detection" className="block text-sm text-blue-600 hover:text-blue-800">Fraud Detection</a>
                    <a href="#webhook-simulation" className="block text-sm text-blue-600 hover:text-blue-800">Webhook Simulation</a>
                  </>
                )}
                
                {activeNavItem === "get-started" && (
                  <>
                    <a href="#create-account" className="block text-sm text-blue-600 hover:text-blue-800">Create Account</a>
                    <a href="#get-api-keys" className="block text-sm text-blue-600 hover:text-blue-800">Get API Keys</a>
                    <a href="#create-session" className="block text-sm text-blue-600 hover:text-blue-800">Create Session</a>
                    <a href="#code-example" className="block text-sm text-blue-600 hover:text-blue-800">Code Example</a>
                  </>
                )}

                {activeNavItem === "sdk" && (
                  <>
                    <a href="#installation" className="block text-sm text-blue-600 hover:text-blue-800">Installation</a>
                    <a href="#initialization" className="block text-sm text-blue-600 hover:text-blue-800">Initialization</a>
                    <a href="#checkout-sessions" className="block text-sm text-blue-600 hover:text-blue-800">Checkout Sessions</a>
                    <a href="#subscriptions" className="block text-sm text-blue-600 hover:text-blue-800">Subscriptions</a>
                    <a href="#error-handling" className="block text-sm text-blue-600 hover:text-blue-800">Error Handling</a>
                  </>
                )}
                
                {activeNavItem === "api-reference" && (
                  <>
                    <a href="#authentication" className="block text-sm text-blue-600 hover:text-blue-800">Authentication</a>
                    <a href="#base-url" className="block text-sm text-blue-600 hover:text-blue-800">Base URL</a>
                    <a href="#create-session" className="block text-sm text-blue-600 hover:text-blue-800">Create Session</a>
                    <a href="#create-subscription" className="block text-sm text-blue-600 hover:text-blue-800">Create Subscription</a>
                  </>
                )}

                {activeNavItem === "developer-tools" && (
                  <>
                    <a href="#api-keys" className="block text-sm text-blue-600 hover:text-blue-800">API Keys Management</a>
                    <a href="#fraud-detection" className="block text-sm text-blue-600 hover:text-blue-800">Fraud Detection System</a>
                    <a href="#team-management" className="block text-sm text-blue-600 hover:text-blue-800">Team Management</a>
                    <a href="#webhook-testing" className="block text-sm text-blue-600 hover:text-blue-800">Webhook Testing</a>
                    <a href="#payment-links" className="block text-sm text-blue-600 hover:text-blue-800">Payment Links</a>
                    <a href="#magic-sdk" className="block text-sm text-blue-600 hover:text-blue-800">Magic SDK Generator</a>
                  </>
                )}

                {activeNavItem === "testing" && (
                  <>
                    <a href="#sandbox-environment" className="block text-sm text-blue-600 hover:text-blue-800">Sandbox Environment</a>
                    <a href="#test-cards" className="block text-sm text-blue-600 hover:text-blue-800">Test Credit Cards</a>
                    <a href="#fraud-testing" className="block text-sm text-blue-600 hover:text-blue-800">Fraud Testing</a>
                  </>
                )}

                {activeNavItem === "changelog" && (
                  <>
                    <a href="#version-1-0-0" className="block text-sm text-blue-600 hover:text-blue-800">Version 1.0.0</a>
                    <a href="#initial-release" className="block text-sm text-blue-600 hover:text-blue-800">Initial Release</a>
                    <a href="#new-features" className="block text-sm text-blue-600 hover:text-blue-800">New Features</a>
                    <a href="#enhancements" className="block text-sm text-blue-600 hover:text-blue-800">Enhancements</a>
                  </>
                )}

                {activeNavItem === "legal" && (
                  <>
                    <a href="#terms-of-service" className="block text-sm text-blue-600 hover:text-blue-800">Terms of Service</a>
                    <a href="#privacy-policy" className="block text-sm text-blue-600 hover:text-blue-800">Privacy Policy</a>
                    <a href="#contact-information" className="block text-sm text-blue-600 hover:text-blue-800">Contact Information</a>
                    <a href="#last-updated" className="block text-sm text-blue-600 hover:text-blue-800">Last Updated</a>
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
