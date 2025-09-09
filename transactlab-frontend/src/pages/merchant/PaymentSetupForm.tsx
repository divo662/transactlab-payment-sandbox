import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, CreditCard, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

interface PaymentSetupFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
  onBack?: () => void;
}

const PaymentSetupForm: React.FC<PaymentSetupFormProps> = ({ onComplete, initialData = {}, onBack }) => {
  const [data, setData] = useState({
    supportedCurrencies: [] as string[],
    defaultCurrency: '',
    paymentMethods: [] as string[],
    ...initialData
  });

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check if form is valid
    const hasCurrencies = data.supportedCurrencies.length > 0;
    const hasDefaultCurrency = data.defaultCurrency !== '';
    const hasPaymentMethods = data.paymentMethods.length > 0;
    setIsValid(hasCurrencies && hasDefaultCurrency && hasPaymentMethods);
  }, [data]);

  const updateData = (newData: Partial<typeof data>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handleSubmit = () => {
    if (isValid) {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const toggleCurrency = (currency: string) => {
    setData(prev => {
      const newCurrencies = prev.supportedCurrencies.includes(currency)
        ? prev.supportedCurrencies.filter(c => c !== currency)
        : [...prev.supportedCurrencies, currency];
      
      // If default currency is removed, clear it
      const newDefaultCurrency = prev.defaultCurrency === currency ? '' : prev.defaultCurrency;
      
      return {
        ...prev,
        supportedCurrencies: newCurrencies,
        defaultCurrency: newDefaultCurrency
      };
    });
  };

  const togglePaymentMethod = (method: string) => {
    setData(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }));
  };

  const currencies = [
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', region: 'Nigeria' },
    { code: 'USD', name: 'US Dollar', symbol: '$', region: 'United States' },
    { code: 'EUR', name: 'Euro', symbol: '€', region: 'European Union' },
    { code: 'GBP', name: 'British Pound', symbol: '£', region: 'United Kingdom' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', region: 'Kenya' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', region: 'Ghana' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', region: 'Uganda' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', region: 'Tanzania' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', region: 'Rwanda' },
    { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', region: 'Zambia' },
    { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', region: 'Malawi' },
    { code: 'BWP', name: 'Botswana Pula', symbol: 'P', region: 'Botswana' },
    { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', region: 'Namibia' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', region: 'South Africa' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', region: 'Canada' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', region: 'Australia' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', region: 'Japan' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', region: 'China' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', region: 'India' }
  ];

  const paymentMethodTypes = [
    { id: 'card', name: 'Credit/Debit Cards', description: 'Visa, Mastercard, American Express' },
    { id: 'bank_transfer', name: 'Bank Transfers', description: 'Direct bank transfers and ACH' },
    { id: 'mobile_money', name: 'Mobile Money', description: 'M-Pesa, Airtel Money, MTN Mobile Money' },
    { id: 'wallet', name: 'Digital Wallets', description: 'PayPal, Apple Pay, Google Pay' },
    { id: 'crypto', name: 'Cryptocurrency', description: 'Bitcoin, Ethereum, USDT' },
    { id: 'ussd', name: 'USSD Payments', description: 'Unstructured Supplementary Service Data' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#0a164d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-[#0a164d]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Payment Configuration
        </h3>
        <p className="text-gray-600">
          Configure supported currencies and payment methods for your business
        </p>
      </div>

      {/* Supported Currencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0a164d]">
            <Globe className="w-5 h-5" />
            Supported Currencies
          </CardTitle>
          <p className="text-sm text-gray-600">
            Select the currencies you want to accept from your customers
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {currencies.map((currency) => (
              <div
                key={currency.code}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  data.supportedCurrencies.includes(currency.code)
                    ? 'border-[#0a164d] bg-[#0a164d]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleCurrency(currency.code)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={data.supportedCurrencies.includes(currency.code)}
                    onChange={() => toggleCurrency(currency.code)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{currency.code}</div>
                    <div className="text-xs text-gray-500">{currency.name}</div>
                  </div>
                  <div className="text-lg font-semibold text-[#0a164d]">
                    {currency.symbol}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Default Currency Selection */}
          {data.supportedCurrencies.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">
                Default Currency *
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.supportedCurrencies.map((currencyCode) => {
                  const currency = currencies.find(c => c.code === currencyCode);
                  if (!currency) return null;
                  
                  return (
                    <div
                      key={currency.code}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        data.defaultCurrency === currency.code
                          ? 'border-[#0a164d] bg-[#0a164d]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateData({ defaultCurrency: currency.code })}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold text-[#0a164d] mb-1">
                          {currency.symbol}
                        </div>
                        <div className="text-sm font-medium">{currency.code}</div>
                        {data.defaultCurrency === currency.code && (
                          <CheckCircle className="w-5 h-5 text-[#0a164d] mx-auto mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0a164d]">
            <CreditCard className="w-5 h-5" />
            Payment Methods
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose which payment methods your customers can use
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethodTypes.map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  data.paymentMethods.includes(method.id)
                    ? 'border-[#0a164d] bg-[#0a164d]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => togglePaymentMethod(method.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={data.paymentMethods.includes(method.id)}
                    onChange={() => togglePaymentMethod(method.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm mb-1">{method.name}</div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-3">Configuration Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Supported Currencies:</span>
              <span className="font-medium text-blue-800">
                {data.supportedCurrencies.length} selected
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Default Currency:</span>
              <span className="font-medium text-blue-800">
                {data.defaultCurrency || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Payment Methods:</span>
              <span className="font-medium text-blue-800">
                {data.paymentMethods.length} selected
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tips */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Start with currencies your customers use most</li>
          <li>• Consider local payment methods for better conversion</li>
          <li>• Set your primary business currency as default</li>
          <li>• You can add more currencies later</li>
          <li>• Mobile money is popular in African markets</li>
        </ul>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Required Configuration:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className={`flex items-center space-x-2 ${data.supportedCurrencies.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.supportedCurrencies.length > 0 ? '✓' : '✗'}</span>
            <span>At least one currency selected</span>
          </li>
          <li className={`flex items-center space-x-2 ${data.defaultCurrency !== '' ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.defaultCurrency !== '' ? '✓' : '✗'}</span>
            <span>Default currency set</span>
          </li>
          <li className={`flex items-center space-x-2 ${data.paymentMethods.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.paymentMethods.length > 0 ? '✓' : '✗'}</span>
            <span>At least one payment method selected</span>
          </li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={!isValid}
          className="bg-[#0a164d] hover:bg-[#0a164d]/90 disabled:opacity-50 ml-auto"
        >
          Continue to Payment Gateways
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PaymentSetupForm;
