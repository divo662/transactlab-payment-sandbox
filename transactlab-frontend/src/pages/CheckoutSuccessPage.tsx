import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// Removed framer-motion import
import { 
  CheckCircle, 
  Download, 
  Mail, 
  Home, 
  Receipt,
  Clock,
  Shield,
  Printer
} from 'lucide-react';
import ReceiptComponent from '@/components/Receipt';

interface SuccessState {
  sessionId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  description?: string;
  callbackUrl?: string; // optional external redirect
  source?: 'dashboard' | 'external';
  // Subscription extras (optional)
  type?: 'payment' | 'subscription';
  subscriptionId?: string;
  interval?: string;
  nextBillingDate?: string; // ISO
}

const CheckoutSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [state] = useState<SuccessState | null>(location.state as SuccessState);
  const search = new URLSearchParams(location.search);
  const isSubscription = (state?.type === 'subscription') || (search.get('type') === 'subscription');
  const nextBilling = state?.nextBillingDate || search.get('nextBillingDate') || undefined;
  const billingInterval = state?.interval || search.get('interval') || undefined;
  const [countdown, setCountdown] = useState(10);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }

    const redirectTarget = state.callbackUrl || (state.source === 'dashboard' ? '/sandbox/transactions' : null);
    if (!redirectTarget) return; // no auto-redirect when no callback and not dashboard-initiated

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (redirectTarget.startsWith('http')) {
            window.location.href = redirectTarget;
          } else {
            navigate(redirectTarget);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, navigate]);

  const handlePrintReceipt = () => {
    try {
      setShowReceipt(true);
      setTimeout(() => {
        if (receiptRef.current) {
          const printWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes');
          if (printWindow) {
            const receiptContent = receiptRef.current.innerHTML;
            
            // Create a more robust print document
            const printDocument = `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Receipt - ${state?.sessionId}</title>
                  <meta charset="utf-8">
                  <style>
                    * { box-sizing: border-box; }
                    body { 
                      margin: 0; 
                      padding: 20px; 
                      font-family: 'Courier New', monospace;
                      background: white;
                      color: black;
                      line-height: 1.4;
                    }
                    @media print { 
                      body { margin: 0; padding: 10px; }
                      * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                      @page { margin: 0.5in; }
                    }
                    .receipt-container {
                      max-width: 400px;
                      margin: 0 auto;
                      background: white;
                      padding: 20px;
                      border: 1px solid #ccc;
                    }
                    img { max-width: 100%; height: auto; display: block; }
                    .text-green-600 { color: #059669 !important; }
                    .text-gray-600 { color: #4b5563 !important; }
                    .text-gray-800 { color: #1f2937 !important; }
                    .text-gray-400 { color: #9ca3af !important; }
                    .text-gray-500 { color: #6b7280 !important; }
                    .bg-gray-50 { background-color: #f9fafb !important; }
                    .bg-green-50 { background-color: #f0fdf4 !important; }
                    .text-green-700 { color: #15803d !important; }
                    .border-gray-200 { border-color: #e5e7eb !important; }
                    .border-gray-300 { border-color: #d1d5db !important; }
                    .rounded-lg { border-radius: 8px; }
                    .rounded-full { border-radius: 9999px; }
                    .px-2 { padding-left: 8px; padding-right: 8px; }
                    .py-1 { padding-top: 4px; padding-bottom: 4px; }
                    .px-3 { padding-left: 12px; padding-right: 12px; }
                    .py-2 { padding-top: 8px; padding-bottom: 8px; }
                    .p-4 { padding: 16px; }
                    .mb-1 { margin-bottom: 4px; }
                    .mb-2 { margin-bottom: 8px; }
                    .mb-3 { margin-bottom: 12px; }
                    .mb-6 { margin-bottom: 24px; }
                    .mt-1 { margin-top: 4px; }
                    .mt-2 { margin-top: 8px; }
                    .mr-1 { margin-right: 4px; }
                    .mr-2 { margin-right: 8px; }
                    .text-xs { font-size: 12px; }
                    .text-sm { font-size: 14px; }
                    .text-xl { font-size: 20px; }
                    .text-3xl { font-size: 30px; }
                    .font-bold { font-weight: 700; }
                    .font-medium { font-weight: 500; }
                    .font-semibold { font-weight: 600; }
                    .font-mono { font-family: 'Courier New', monospace; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .flex { display: flex; }
                    .items-center { align-items: center; }
                    .justify-center { justify-content: center; }
                    .justify-between { justify-content: space-between; }
                    .space-y-3 > * + * { margin-top: 12px; }
                    .border-b { border-bottom: 1px solid; }
                    .border-t { border-top: 1px solid; }
                    .border-2 { border-width: 2px; }
                    .pb-4 { padding-bottom: 16px; }
                    .pt-4 { padding-top: 16px; }
                    .w-4 { width: 16px; }
                    .w-5 { width: 20px; }
                    .h-4 { height: 16px; }
                    .h-5 { height: 20px; }
                    .h-12 { height: 48px; }
                    .max-w-48 { max-width: 192px; }
                    
                    /* Print-specific styles */
                    @media print {
                      .no-print { display: none !important; }
                      .receipt-container { border: none; box-shadow: none; }
                    }
                  </style>
                </head>
                <body>
                  <div class="receipt-container">
                    ${receiptContent}
                  </div>
                  
                  <!-- Print button for the print window -->
                  <div class="no-print" style="text-align: center; margin-top: 20px; padding: 20px;">
                    <button onclick="window.print()" style="
                      background: #0a164d; 
                      color: white; 
                      border: none; 
                      padding: 12px 24px; 
                      border-radius: 6px; 
                      font-size: 16px; 
                      cursor: pointer;
                      margin-right: 10px;
                    ">Print Receipt</button>
                    <button onclick="window.close()" style="
                      background: #6b7280; 
                      color: white; 
                      border: none; 
                      padding: 12px 24px; 
                      border-radius: 6px; 
                      font-size: 16px; 
                      cursor: pointer;
                    ">Close</button>
                  </div>
                </body>
              </html>
            `;
            
            printWindow.document.write(printDocument);
            printWindow.document.close();
            
            // Focus the window and wait for it to load
            printWindow.focus();
            
            // Auto-print after a short delay
            setTimeout(() => {
              printWindow.print();
            }, 1000);
            
          } else {
            console.error('Failed to open print window');
            alert('Failed to open print window. Please check your popup blocker settings.');
          }
        } else {
          console.error('Receipt ref not found');
          alert('Receipt content not found. Please try again.');
        }
        setShowReceipt(false);
      }, 200);
    } catch (error) {
      console.error('Print receipt error:', error);
      alert('Failed to print receipt. Please try again.');
      setShowReceipt(false);
    }
  };

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
        
          {/* Success Animation */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {isSubscription ? 'Subscription Activated!' : 'Payment Successful!'}
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              {isSubscription ? 'Your subscription is now active.' : 'Your transaction has been completed successfully'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Transaction Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0a164d] rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Transaction Details</h2>
                <p className="text-gray-600 text-xs sm:text-sm">Payment confirmation</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Transaction ID</span>
                <span className="text-gray-800 font-mono text-xs sm:text-sm break-all">{state.sessionId}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Amount Paid</span>
                <span className="text-xl sm:text-2xl font-bold text-green-600">
                  {state.currency} {(state.amount / 100).toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Status</span>
                <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                  Completed
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Date & Time</span>
                <span className="text-gray-800 text-xs sm:text-sm">{new Date().toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 sm:py-3">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Payment Method</span>
                <span className="text-gray-800 text-xs sm:text-sm">Credit/Debit Card</span>
              </div>
              {isSubscription && (
                <div className="flex justify-between items-center py-2 sm:py-3 border-t border-gray-200">
                  <span className="text-gray-600 font-medium text-sm sm:text-base">Next Billing</span>
                  <span className="text-gray-800 text-xs sm:text-sm">
                    {nextBilling ? new Date(nextBilling).toLocaleString() : 'On schedule'}
                    {billingInterval ? ` • ${billingInterval}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">What's Next?</h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm sm:text-base">Confirmation Email</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">You'll receive a confirmation email shortly with your receipt</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm sm:text-base">{isSubscription ? 'Subscription Details' : 'Download Receipt'}</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {isSubscription
                      ? 'You can manage your plan and view upcoming invoices in your dashboard.'
                      : 'Your receipt is available for download in your account'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm sm:text-base">Secure & Protected</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">Your payment information is encrypted and secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8">
          {state?.source === 'dashboard' && (
            <button
              onClick={() => navigate('/sandbox/transactions')}
              className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-[#0a164d] text-white rounded-lg font-semibold hover:bg-[#0a164d]/90 transition-all transform hover:scale-105 text-sm sm:text-base"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
              View Transactions
            </button>
          )}
          {state?.callbackUrl && (
            <button
              onClick={() => (window.location.href = state.callbackUrl!)}
              className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-[#0a164d] text-white rounded-lg font-semibold hover:bg-[#0a164d]/90 transition-all transform hover:scale-105 text-sm sm:text-base"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
              Return to Site
            </button>
          )}
          
          <button
            onClick={handlePrintReceipt}
            className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 text-sm sm:text-base"
          >
            <Printer className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
            Print Receipt
          </button>
        </div>

        {/* Auto-redirect Notice or Missing Callback Warning */}
        <div className="text-center mt-6 sm:mt-8">
          {state?.callbackUrl ? (
            <div className="inline-flex items-center text-gray-500 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Redirecting back in {countdown} seconds
            </div>
          ) : state?.source === 'dashboard' ? (
            <div className="inline-flex items-center text-gray-500 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Redirecting to transactions in {countdown} seconds
            </div>
          ) : (
            <div className="inline-flex items-center text-yellow-700 text-xs sm:text-sm bg-yellow-50 border border-yellow-200 px-3 py-2 rounded">
              No callback URL configured. Please set a success URL when creating sessions from your app to auto-redirect users.
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center text-gray-400 text-xs">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Powered by TransactLab • Secure Payment Gateway
          </div>
        </div>
      </div>

      {/* Hidden Receipt Component for Printing */}
      {showReceipt && (
        <div ref={receiptRef} className="hidden">
          <ReceiptComponent
            sessionId={state.sessionId}
            amount={state.amount}
            currency={state.currency}
            customerEmail={state.customerEmail}
            description={state.description}
            timestamp={new Date()}
          />
        </div>
      )}
      
      
    </div>
  );
};

export default CheckoutSuccessPage;


