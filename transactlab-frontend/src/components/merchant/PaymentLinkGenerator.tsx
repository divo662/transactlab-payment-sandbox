import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Link, 
  Copy, 
  ExternalLink, 
  Plus, 
  Trash2,
  Eye,
  EyeOff,
  QrCode,
  Download,
  CheckCircle
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface PaymentLink {
  id: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'completed';
  createdAt: string;
  usageCount: number;
}

const PaymentLinkGenerator: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'NGN',
    description: '',
    customerEmail: '',
    successUrl: '',
    cancelUrl: '',
    expiresIn: '30' // minutes
  });

  // Mock payment links - replace with actual API data
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([
    {
      id: 'pl_123456789',
      amount: 5000,
      currency: 'NGN',
      description: 'Premium SaaS Subscription',
      customerEmail: 'customer@example.com',
      successUrl: 'https://yoursaas.com/success',
      cancelUrl: 'https://yoursaas.com/cancel',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      usageCount: 0
    }
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const newLink: PaymentLink = {
      id: `pl_${Date.now()}`,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description,
      customerEmail: formData.customerEmail || undefined,
      successUrl: formData.successUrl || 'https://yoursaas.com/success',
      cancelUrl: formData.cancelUrl || 'https://yoursaas.com/cancel',
      expiresAt: new Date(Date.now() + parseInt(formData.expiresIn) * 60 * 1000).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    setPaymentLinks(prev => [newLink, ...prev]);
    setFormData({
      amount: '',
      currency: 'NGN',
      description: '',
      customerEmail: '',
      successUrl: '',
      cancelUrl: '',
      expiresIn: '30'
    });
    setShowForm(false);
  };

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getCheckoutUrl = (linkId: string) => {
    return `${window.location.origin}/checkout/${linkId}`;
  };

  const deletePaymentLink = (linkId: string) => {
    setPaymentLinks(prev => prev.filter(link => link.id !== linkId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatExpiryTime = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return 'Expired';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.ceil(diffMins / 60)}h`;
    return `${Math.ceil(diffMins / 1440)}d`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Links</h1>
          <p className="text-gray-600">Create and manage payment links for your customers</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Cancel' : 'Create Payment Link'}
        </motion.button>
      </div>

      {/* Create Payment Link Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Create New Payment Link</h2>
            
            <form onSubmit={generatePaymentLink} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="NGN">NGN (Nigerian Naira)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What is this payment for?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires In
                </label>
                <select
                  value={formData.expiresIn}
                  onChange={(e) => handleInputChange('expiresIn', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="1440">24 hours</option>
                  <option value="10080">7 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Success URL
                </label>
                <input
                  type="url"
                  value={formData.successUrl}
                  onChange={(e) => handleInputChange('successUrl', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yoursaas.com/success"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancel URL
                </label>
                <input
                  type="url"
                  value={formData.cancelUrl}
                  onChange={(e) => handleInputChange('cancelUrl', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yoursaas.com/cancel"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  Generate Payment Link
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Links List */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Your Payment Links</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Link className="w-5 h-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{link.description}</p>
                        <p className="text-sm text-gray-500">{link.id}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-semibold text-gray-900">
                      {link.currency} {link.amount.toLocaleString()}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(link.status)}`}>
                      {link.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatExpiryTime(link.expiresAt)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {link.usageCount} uses
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(getCheckoutUrl(link.id), link.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Copy checkout URL"
                      >
                        {copiedLink === link.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      
                      <a
                        href={getCheckoutUrl(link.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Open checkout page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      
                      <button
                        onClick={() => setShowQrCode(showQrCode === link.id ? null : link.id)}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                        title="Show QR code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => deletePaymentLink(link.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete payment link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {paymentLinks.length === 0 && (
          <div className="text-center py-12">
            <Link className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment links yet</h3>
            <p className="text-gray-500">Create your first payment link to start accepting payments</p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQrCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowQrCode(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">QR Code</h3>
                <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code to open the payment link
                </p>
                <button
                  onClick={() => setShowQrCode(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentLinkGenerator;


