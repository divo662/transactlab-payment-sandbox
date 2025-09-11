import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';

interface CheckoutSession {
  sessionId: string;
  amount: number; // in minor units
  currency: string;
  description: string;
  customerEmail?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled';
  expiresAt: string;
  // optional callback info if backend includes it
  successUrl?: string;
  success_url?: string;
  paymentConfig?: {
    allowedPaymentMethods?: string[];
  };
}

interface PaymentFormData {
  cardNumber: string;
  expiryDate: string; // MM/YY
  cvv: string;
  cardholderName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  saveCard: boolean;
}

// Public backend origin for read-only checkout session (no secrets required)
const PUBLIC_BACKEND_ORIGIN = 'https://transactlab-backend.onrender.com';
// Generic proxy base for server-side processing (keeps secrets on server)
// Developers should set VITE_TL_PROXY_BASE to their own backend that forwards to TransactLab
const TL_PROXY_BASE: string | undefined = (import.meta as any)?.env?.VITE_TL_PROXY_BASE;

const CheckoutPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank_transfer' | 'mobile_money'>('card');
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankConfirmed, setBankConfirmed] = useState(false);
  
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'NG',
    saveCard: false
  });

  // Fetch checkout session from backend
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Fetch public session data from backend (no auth, no secrets)
        const res = await fetch(`${PUBLIC_BACKEND_ORIGIN}/checkout/${sessionId}`);
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || 'Failed to load checkout session');
        }
        // Public endpoint returns { success, data: {...} }
        const s = json.data;
        // Derive minor units. Provider may return formatted amount string (e.g., "NGN 300,000.00").
        const amountMinor = (() => {
          const val = (s as any)?.amount;
          if (typeof val === 'number') return val; // already minor units
          if (typeof val === 'string') {
            const numeric = parseFloat(val.replace(/[^0-9.]/g, ''));
            if (Number.isFinite(numeric)) return Math.round(numeric * 100);
          }
          return 0;
        })();
        const normalized: CheckoutSession = {
          sessionId: s.sessionId,
          amount: amountMinor,
          currency: s.currency,
          description: s.description,
          customerEmail: s.customerEmail,
          status: s.status,
          expiresAt: s.expiresAt,
          successUrl: s.successUrl || s.success_url,
          success_url: s.success_url,
          paymentConfig: s.paymentConfig
        };
        setSession(normalized);
        // derive initial method from URL param or default to card
        const searchParams = new URLSearchParams(location.search);
        const pmParam = searchParams.get('pm') as 'card' | 'bank_transfer' | 'mobile_money' | null;
        const initial = pmParam && (['card','bank_transfer','mobile_money'] as const).includes(pmParam) ? pmParam : 'card';
        setSelectedMethod(initial);
        setFormData(prev => ({ ...prev, email: normalized.customerEmail || '' }));
      } catch (e: any) {
        setError(e?.message || 'Failed to load checkout session');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) void fetchSession();
  }, [sessionId, location.search]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string | boolean) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value as string);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value as string);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validateForm = (): boolean => {
    if (!formData.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    
    if (!formData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    // Validate expiry: month 01-12 and not in the past
    const [mmStr, yyStr] = formData.expiryDate.split('/');
    const mmNum = Number(mmStr);
    const yyNum = Number(yyStr);
    if (mmNum < 1 || mmNum > 12) {
      setError('Expiry month must be between 01 and 12');
      return false;
    }
    const fullYear = 2000 + yyNum; // support 20xx
    // Set to last day of the expiry month at 23:59:59
    const expiryDate = new Date(fullYear, mmNum, 0, 23, 59, 59, 999);
    const now = new Date();
    if (expiryDate < now) {
      setError('Card has expired. Please use a valid card.');
      return false;
    }
    
    if (!formData.cvv.match(/^\d{3}$/)) {
      setError('Please enter a valid 3-digit CVV');
      return false;
    }
    
    if (!formData.cardholderName.trim()) {
      setError('Please enter the cardholder name');
      return false;
    }
    
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.addressLine1.trim()) {
      setError('Please enter your billing address line 1');
      return false;
    }

    if (!formData.city.trim()) {
      setError('Please enter your city');
      return false;
    }

    if (!formData.country.trim()) {
      setError('Please enter your country');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For non-card methods, we relax card validations
    if (selectedMethod === 'card') {
      if (!validateForm() || !session) return;
    } else if (selectedMethod === 'mobile_money') {
      if (!formData.phone || formData.phone.trim().length < 10) {
        setError('Please enter a valid phone number for mobile money');
        return;
      }
      if (!session) return;
    } else {
      if (!session) return;
    }
    setProcessing(true);
    setError(null);
    try {
      const [mm, yy] = formData.expiryDate.split('/');
      // Require a proxy base; processing must occur server-side to protect secrets
      if (!TL_PROXY_BASE) {
        setError('Payment proxy not configured. Set VITE_TL_PROXY_BASE to your server URL.');
        setProcessing(false);
        return;
      }
      const res = await fetch(`${TL_PROXY_BASE.replace(/\/$/, '')}/proxy/checkout/sessions/${session.sessionId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          cardDetails: selectedMethod === 'card' ? {
            number: formData.cardNumber.replace(/\s/g, ''),
            expiryMonth: mm,
            expiryYear: yy,
            cvv: formData.cvv
          } : undefined,
          mobileMoney: selectedMethod === 'mobile_money' ? { phone: formData.phone } : undefined,
          customer: {
            email: formData.email,
            name: formData.cardholderName,
            phone: formData.phone
          },
          billingAddress: {
            line1: formData.addressLine1,
            line2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
            phone: formData.phone
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Payment failed.');
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/checkout/success', { 
          state: { 
            sessionId: session.sessionId, 
            amount: session.amount, 
            currency: session.currency,
            customerEmail: session.customerEmail,
            description: session.description,
            callbackUrl: (session.successUrl || session.success_url) as any,
            source: (session.successUrl || session.success_url) ? 'external' : 'dashboard'
          } 
        });
      }, 1200);
    } catch (e: any) {
      setError(e?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0a164d] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-4">This checkout session is invalid or has expired.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#0a164d] text-white rounded-lg hover:bg-[#0a164d]/90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const majorAmount = (session.amount || 0) / 100;

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 sm:mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
         
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 text-center">Checkout</h1>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
            <span>Powered by</span>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-white shadow-sm">
              <img src="/transactlab/1.png" alt="TransactLab" className="h-4 w-4" />
              <span className="font-semibold text-[#0a164d]">TransactLab</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-5 md:p-8">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">PAYMENT DETAILS</h2>
                </div>

              {/* Payment Method Selector - always show all methods */}
              <div className="flex items-center gap-2 mb-4">
                {(['card','bank_transfer','mobile_money'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMethod(m)}
                    className={`px-3 py-2 rounded border text-xs sm:text-sm ${selectedMethod===m ? 'border-[#0a164d] text-[#0a164d] bg-[#0a164d]/5' : 'border-gray-200 text-gray-600'}`}
                  >
                    {m === 'card' ? 'Card' : m === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Name on Card */}
                <div className={`${selectedMethod==='card' ? '' : 'hidden'}`}>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                    NAME ON CARD
                  </label>
                  <input
                    type="text"
                    value={formData.cardholderName}
                    onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                    placeholder="John Doe"
                  />
              </div>

                {/* Card Number */}
                <div className={`${selectedMethod==='card' ? '' : 'hidden'}`}>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                    CARD NUMBER
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                      placeholder="4534 5555 5555 5555"
                      maxLength={19}
                    />
                    <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2">
                      <div className="bg-blue-600 text-white px-1 sm:px-2 py-1 rounded text-xs font-bold">VISA</div>
                    </div>
                  </div>
                </div>

                {/* Valid Through & CVC */}
                <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${selectedMethod==='card' ? '' : 'hidden'}`}>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                      VALID THROUGH
                    </label>
                    <input
                      type="text"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                      placeholder="06/19"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                      CVC CODE
                    </label>
                    <div className="relative">
                      <input
                        type={showCvv ? 'text' : 'password'}
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                        placeholder="123"
                        maxLength={4}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvv(!showCvv)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCvv ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone (Optional / Required for Mobile Money) */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                    {selectedMethod==='mobile_money' ? 'MOBILE MONEY PHONE' : 'PHONE (OPTIONAL)'}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                    placeholder={selectedMethod==='mobile_money' ? '+234 801 234 5678 (required)' : '+234 801 234 5678'}
                  />
                </div>

                {/* Bank Transfer Instructions (Sandbox) */}
                {selectedMethod==='bank_transfer' && (
                  <div className="p-3 sm:p-4 border rounded-lg bg-gray-50 text-xs sm:text-sm text-gray-700">
                    Use the sandbox bank details displayed on your screen to simulate a transfer. Click Purchase to confirm after you’ve “sent” the transfer.
                    <div className="mt-2">
                      <button type="button" onClick={() => setShowBankModal(true)} className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100">
                        View Bank Details
                      </button>
                    </div>
                  </div>
                )}

                {/* Billing Address */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                      ADDRESS LINE 1
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine1}
                      onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                      placeholder="123 Example Street"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                      ADDRESS LINE 2 (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine2}
                      onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                      placeholder="Apartment, suite, unit"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                        CITY
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                        placeholder="Lagos"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                        STATE/REGION
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                        placeholder="Lagos"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                        POSTAL CODE
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                        placeholder="100001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 uppercase tracking-wide">
                      COUNTRY
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0a164d] focus:border-[#0a164d] transition-all text-sm sm:text-base md:text-lg"
                      placeholder="NG"
                    />
                  </div>
                </div>

                {/* Error Message */}
                  {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <p className="text-red-700">{error}</p>
                      </div>
                  </div>
                  )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing || session.status !== 'pending'}
                  className="w-full bg-[#0a164d] text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold hover:bg-[#0a164d]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base md:text-lg"
                >
                  {processing ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                      Processing Payment...
                    </div>
                  ) : (
                    `PURCHASE ${session.currency} ${majorAmount.toLocaleString()}`
                  )}
                </button>

                  {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                        <span className="text-green-700 font-semibold">Payment Successful!</span>
                      </div>
                      <p className="text-green-600 text-sm">Redirecting to success page...</p>
                  </div>
                  )}
              </form>
            </div>
                </div>
                
          {/* Transaction Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-8">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">TRANSACTION SUMMARY</h3>
                </div>
                
              {/* Transaction Item */}
              <div className="space-y-4 mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#0a164d] rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-xs sm:text-sm break-words leading-snug">{session.description}</h4>
                    <p className="text-[10px] sm:text-xs text-gray-600">Payment Session</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Quantity: 1</p>
                  </div>
                </div>
                </div>
                
              {/* Price Breakdown */}
              <div className="space-y-2 sm:space-y-3 border-t border-gray-200 pt-3 sm:pt-4">
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{session.currency} {majorAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="text-gray-900">{session.currency} 0</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 sm:pt-3">
                  <span className="text-base sm:text-lg font-bold text-gray-900">Total</span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">{session.currency} {majorAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Security Features */}
              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-green-500 flex-shrink-0" />
                  SSL Encrypted
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-[#0a164d] flex-shrink-0" />
                  PCI Compliant
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-[#0a164d] flex-shrink-0" />
                  Sandbox Mode
                </div>
              </div>

              {/* Session Expiry Warning */}
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-xs sm:text-sm">
                  ⏰ This session expires in {Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / (1000 * 60)))} minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Bank Transfer Modal */}
    {showBankModal && session && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Sandbox Bank Transfer</h3>
          </div>
          <div className="p-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between"><span>Bank:</span><span className="font-medium">Demo Bank (Sandbox)</span></div>
            <div className="flex justify-between"><span>Account Name:</span><span className="font-medium">TransactLab Sandbox</span></div>
            <div className="flex justify-between"><span>Account Number:</span><span className="font-mono font-semibold">0001234567</span></div>
            <div className="flex justify-between"><span>Amount:</span><span className="font-semibold">{session.currency} {(session.amount/100).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Reference:</span><span className="font-mono">{session.sessionId}</span></div>
            <p className="text-xs text-gray-500">Note: This is a simulation. No real funds are moved. Use “Mark as Paid” to complete the test.</p>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={bankConfirmed} onChange={(e)=>setBankConfirmed(e.target.checked)} />
              I have simulated the transfer using the above details
            </label>
          </div>
          <div className="p-4 border-t flex items-center justify-end gap-2">
            <button type="button" onClick={()=>setShowBankModal(false)} className="px-3 py-2 rounded border border-gray-300">Close</button>
            <button type="button" disabled={!bankConfirmed || processing} onClick={()=>{ setShowBankModal(false); void (async()=>{ await new Promise(r=>setTimeout(r,0)); const form=document.querySelector('form'); (form as HTMLFormElement)?.dispatchEvent(new Event('submit', {cancelable:true, bubbles:true})); })(); }} className={`px-3 py-2 rounded ${bankConfirmed ? 'bg-[#0a164d] text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
              Mark as Paid
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default CheckoutPage;


