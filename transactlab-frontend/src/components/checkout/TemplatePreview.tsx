import React from 'react';
import { CheckCircle, Shield, Lock, CreditCard } from 'lucide-react';

interface TemplatePreviewProps {
  templateId: 'classic' | 'modern' | 'minimal';
  config: any;
  sampleData?: any;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ templateId, config, sampleData }) => {
  const sample = sampleData || {
    product: { name: 'Sample Product', priceMinor: 500000, currency: 'NGN' },
    customer: { email: 'customer@example.com' }
  };

  const majorAmount = (sample.product.priceMinor || 0) / 100;

  if (templateId === 'classic') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Header */}
          <div className="lg:col-span-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {config.brand?.logoUrl && (
                  <img src={config.brand.logoUrl} alt="Logo" className="h-8 w-auto" />
                )}
                <h1 className="text-2xl font-bold" style={{ color: config.theme?.brandColor || '#0a164d' }}>
                  {config.brand?.companyName || 'Your Store'}
                </h1>
              </div>
              {config.layout?.showTrustBadges && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>Secure Checkout</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="4534 5555 5555 5555"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="123"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{sample.product.name}</span>
                  <span className="font-medium">{sample.product.currency} {majorAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-medium">{sample.product.currency} 0</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{sample.product.currency} {majorAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button 
                className="w-full mt-4 py-3 px-4 rounded-lg font-semibold text-white"
                style={{ backgroundColor: config.theme?.brandColor || '#0a164d' }}
              >
                Complete Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === 'modern') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-4xl">
        <div className="text-center mb-8">
          {config.brand?.logoUrl && (
            <img src={config.brand.logoUrl} alt="Logo" className="h-12 w-auto mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold mb-2" style={{ color: config.theme?.brandColor || '#0a164d' }}>
            {config.brand?.companyName || 'Your Store'}
          </h1>
          <p className="text-gray-600">Complete your purchase securely</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-semibold">{sample.product.name}</h3>
              <p className="text-2xl font-bold" style={{ color: config.theme?.brandColor || '#0a164d' }}>
                {sample.product.currency} {majorAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
                placeholder="4534 5555 5555 5555"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="123"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="customer@example.com"
              />
            </div>
            <button 
              className="w-full py-4 px-6 rounded-lg font-semibold text-white text-lg"
              style={{ backgroundColor: config.theme?.brandColor || '#0a164d' }}
            >
              Complete Purchase
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (templateId === 'minimal') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: config.theme?.brandColor || '#0a164d' }}>
            {sample.product.name}
          </h1>
          <p className="text-3xl font-bold" style={{ color: config.theme?.brandColor || '#0a164d' }}>
            {sample.product.currency} {majorAmount.toLocaleString()}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
            <input 
              type="text" 
              className="w-full px-3 py-3 border border-gray-300 rounded-lg"
              placeholder="4534 5555 5555 5555"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
              <input 
                type="text" 
                className="w-full px-3 py-3 border border-gray-300 rounded-lg"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
              <input 
                type="text" 
                className="w-full px-3 py-3 border border-gray-300 rounded-lg"
                placeholder="123"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input 
              type="email" 
              className="w-full px-3 py-3 border border-gray-300 rounded-lg"
              placeholder="customer@example.com"
            />
          </div>
          <button 
            className="w-full py-3 px-4 rounded-lg font-semibold text-white"
            style={{ backgroundColor: config.theme?.brandColor || '#0a164d' }}
          >
            Pay {sample.product.currency} {majorAmount.toLocaleString()}
          </button>
        </div>

        {config.layout?.showTrustBadges && (
          <div className="flex items-center justify-center space-x-4 mt-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>Secure</span>
            </div>
            <div className="flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              <span>Encrypted</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default TemplatePreview;
