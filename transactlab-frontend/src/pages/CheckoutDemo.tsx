import React, { useState } from 'react';
import { 
  Link, 
  Copy, 
  ExternalLink, 
  CreditCard, 
  CheckCircle,
  ArrowRight,
  Play,
  Code,
  Zap
} from 'lucide-react';

const CheckoutDemo: React.FC = () => {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const demoPaymentLinks = [
    {
      id: 'demo_123',
      amount: 2500,
      currency: 'NGN',
      description: 'Premium SaaS Subscription',
      checkoutUrl: '/checkout/demo_123'
    },
    {
      id: 'demo_456',
      amount: 100,
      currency: 'USD',
      description: 'Monthly Plan',
      checkoutUrl: '/checkout/demo_456'
    },
    {
      id: 'demo_789',
      amount: 50,
      currency: 'EUR',
      description: 'One-time Payment',
      checkoutUrl: '/checkout/demo_789'
    }
  ];

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getFullUrl = (path: string) => {
    return `${window.location.origin}${path}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">TransactLab Checkout Demo</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the complete payment flow with our beautiful, secure checkout system. 
            Test different payment scenarios and see how easy it is to integrate payments into your SaaS.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Beautiful UI</h3>
            <p className="text-gray-600">Modern, responsive design with glassmorphism effects and smooth animations</p>
          </div>

          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Fast Integration</h3>
            <p className="text-gray-600">Simple API endpoints and ready-to-use components for quick setup</p>
          </div>

          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">PCI compliant, webhook support, and comprehensive error handling</p>
          </div>
        </div>

        {/* Demo Payment Links */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-12">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Try the Checkout Flow</h2>
              <p className="text-gray-600">Click on any payment link below to experience the complete checkout process</p>
            </div>
          </div>

          <div className="grid gap-4">
            {demoPaymentLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{link.description}</h3>
                    <p className="text-sm text-gray-600">ID: {link.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right mr-4">
                    <div className="text-2xl font-bold text-gray-800">
                      {link.currency} {link.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">{link.currency}</div>
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(getFullUrl(link.checkoutUrl), link.id)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy checkout URL"
                  >
                    {copiedLink === link.id ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  
                  <a
                    href={link.checkoutUrl}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Try Checkout
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Examples */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Frontend Integration */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                <Code className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Frontend Integration</h3>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">
                <div>// Create payment link</div>
                <div>const response = await fetch(&apos;/api/payment-links&apos;, {'{'}</div>
                <div>  method: &apos;POST&apos;,</div>
                <div>  body: JSON.stringify({'{'}</div>
                <div>    amount: 2500,</div>
                <div>    currency: &apos;NGN&apos;,</div>
                <div>    description: &apos;Premium Plan&apos;</div>
                <div>  {'}'})</div>
                <div>{'}'});</div>
              </div>
              
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">
                <div>// Redirect customer to checkout</div>
                <div>window.location.href = response.data.checkoutUrl;</div>
              </div>
            </div>
          </div>

          {/* Backend Integration */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Backend Integration</h3>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono">
                <div>// Handle webhook notifications</div>
                <div>app.post(&apos;/webhooks/transactlab&apos;, (req, res) =&gt; {'{'}</div>
                <div>  const {'{'} event, data {'}'} = req.body;</div>
                <div>  </div>
                <div>  switch (event) {'{'}</div>
                <div>    case &apos;payment.completed&apos;:</div>
                <div>      // Update order status</div>
                <div>      break;</div>
                <div>  {'}'}</div>
                <div>{'}'});</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Integrate?</h2>
            <p className="text-xl text-blue-100 mb-6">
              Start accepting payments in minutes with TransactLab&apos;s powerful checkout system
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
                <Code className="w-5 h-5 mr-2" />
                View Documentation
              </button>
              <button className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center">
                <ArrowRight className="w-5 h-5 mr-2" />
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutDemo;


