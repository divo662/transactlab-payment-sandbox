import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  XCircle, 
  RefreshCw, 
  Home, 
  AlertTriangle,
  Clock,
  Shield,
  ArrowLeft
} from 'lucide-react';

interface ErrorState {
  sessionId?: string;
  amount?: number;
  currency?: string;
  error?: string;
  message?: string;
}

const CheckoutErrorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [state] = useState<ErrorState | null>(location.state as ErrorState);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/sandbox/transactions');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const getFriendlyErrorMessage = (error: string) => {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('expired') || errorLower.includes('timeout')) {
      return 'Your payment session has expired. Please try again with a new session.';
    }
    if (errorLower.includes('insufficient') || errorLower.includes('declined')) {
      return 'Your payment was declined. Please check your card details or try a different payment method.';
    }
    if (errorLower.includes('network') || errorLower.includes('connection')) {
      return 'There was a network issue. Please check your internet connection and try again.';
    }
    if (errorLower.includes('invalid') || errorLower.includes('format')) {
      return 'Please check your payment details and ensure all information is correct.';
    }
    if (errorLower.includes('security') || errorLower.includes('fraud')) {
      return 'For security reasons, this transaction was blocked. Please contact your bank or try a different card.';
    }
    
    return 'We encountered an issue processing your payment. Please try again or contact support if the problem persists.';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 sm:mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <img 
              src="/transactlab/3.png" 
              alt="TransactLab" 
              className="h-16 sm:h-20 md:h-24 w-auto"
            />
          </div>
          
          {/* Error Animation */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Payment Failed</h1>
            <p className="text-gray-600 text-base sm:text-lg">We couldn't process your payment</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Error Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Error Details</h2>
                <p className="text-gray-600 text-xs sm:text-sm">Payment processing failed</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {state.sessionId && (
                <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium text-sm sm:text-base">Session ID</span>
                  <span className="text-gray-800 font-mono text-xs sm:text-sm break-all">{state.sessionId}</span>
                </div>
              )}
              
              {state.amount && state.currency && (
                <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-200">
                  <span className="text-gray-600 font-medium text-sm sm:text-base">Amount</span>
                  <span className="text-xl sm:text-2xl font-bold text-red-600">
                    {state.currency} {(state.amount / 100).toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Status</span>
                <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-medium">
                  Failed
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Date & Time</span>
                <span className="text-gray-800 text-xs sm:text-sm">{new Date().toLocaleString()}</span>
              </div>
              
              <div className="py-2 sm:py-3">
                <span className="text-gray-600 font-medium text-sm sm:text-base block mb-2">Error Message</span>
                <p className="text-gray-800 text-xs sm:text-sm bg-gray-50 p-3 rounded-lg">
                  {state.error ? getFriendlyErrorMessage(state.error) : (state.message || 'An unexpected error occurred')}
                </p>
              </div>
            </div>
          </div>

          {/* Help & Next Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">What Can You Do?</h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm sm:text-base">Try Again</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">Double-check your payment details and try processing the payment again</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm sm:text-base">Check Your Card</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">Ensure your card has sufficient funds and is not expired</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm sm:text-base">Contact Support</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">If the problem persists, contact our support team for assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-[#0a164d] text-white rounded-lg font-semibold hover:bg-[#0a164d]/90 transition-all transform hover:scale-105 text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
            Try Again
          </button>
          
          <button
            onClick={() => navigate('/sandbox/transactions')}
            className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 text-sm sm:text-base"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
            View Transactions
          </button>
        </div>

        {/* Auto-redirect Notice */}
        <div className="text-center mt-6 sm:mt-8">
          <div className="inline-flex items-center text-gray-500 text-xs sm:text-sm">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Redirecting to transactions page in {countdown} seconds
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center text-gray-400 text-xs">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Powered by TransactLab • Secure Payment Gateway
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutErrorPage;
