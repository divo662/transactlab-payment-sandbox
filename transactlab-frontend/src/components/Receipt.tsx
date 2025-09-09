import React from 'react';
import { CheckCircle, Shield, CreditCard } from 'lucide-react';

interface ReceiptProps {
  sessionId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  description?: string;
  paymentMethod?: string;
  timestamp?: Date;
}

const Receipt: React.FC<ReceiptProps> = ({
  sessionId,
  amount,
  currency,
  customerEmail,
  description,
  paymentMethod = 'Credit/Debit Card',
  timestamp = new Date()
}) => {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN'
    }).format(amount / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  return (
    <div className="receipt-container bg-white p-8 max-w-md mx-auto" style={{ fontFamily: 'monospace' }}>
      {/* Receipt Header */}
      <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
        <div className="flex justify-center mb-3">
          <img 
            src="/transactlab/2.png" 
            alt="TransactLab" 
            className="h-12 w-auto"
          />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">TRANSACTLAB</h1>
        <p className="text-sm text-gray-600">Payment Gateway Receipt</p>
        <div className="flex items-center justify-center mt-2">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-600 font-semibold text-sm">PAYMENT SUCCESSFUL</span>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-600 font-medium">Receipt #:</span>
          <span className="font-mono text-sm">{sessionId}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-600 font-medium">Date & Time:</span>
          <span className="text-sm">{formatDate(timestamp)}</span>
        </div>
        
        {customerEmail && (
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Customer:</span>
            <span className="text-sm">{customerEmail}</span>
          </div>
        )}
        
        {description && (
          <div className="flex justify-between items-start py-2 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Description:</span>
            <span className="text-sm text-right max-w-48">{description}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-600 font-medium">Payment Method:</span>
          <div className="flex items-center">
            <CreditCard className="w-4 h-4 mr-1" />
            <span className="text-sm">{paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1">Amount Paid</p>
          <p className="text-3xl font-bold text-green-600">
            {formatAmount(amount, currency)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Transaction completed successfully</p>
        </div>
      </div>

      {/* Security & Verification */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-center py-2 bg-green-50 rounded-lg">
          <Shield className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-700 font-medium text-sm">Secured by TransactLab</span>
        </div>
        
        <div className="text-center text-xs text-gray-500">
          <p>This receipt serves as proof of payment</p>
          <p>Keep this receipt for your records</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
        <p className="mb-1">Thank you for using TransactLab</p>
        <p>For support, contact: support@transactlab.com</p>
        <p className="mt-2 font-mono">Receipt ID: {sessionId.slice(-8).toUpperCase()}</p>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .receipt-container {
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Receipt;
