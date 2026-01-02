import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, FileText, CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';

interface Invoice {
  _id: string;
  invoiceId: string;
  customerEmail: string;
  customerName?: string;
  description?: string;
  amount: number; // minor units
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: string;
  createdAt: string;
  sessionId?: string; // optional link to a payment session
}

const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';

const InvoicePage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const json = await res.json();
        if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error || 'Invoice not found');
        setInvoice(json.data as Invoice);
      } catch (e: any) {
        setError(e?.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    if (invoiceId) void fetchInvoice();
  }, [invoiceId]);

  const payNow = async () => {
    if (!invoice) return;
    try {
      setProcessing(true);
      // If this invoice is already linked to a checkout session, go straight there
      if (invoice.sessionId) {
        navigate(`/checkout/${invoice.sessionId}`);
        return;
      }

      // Otherwise, create a sandbox session for this invoice using the authenticated API
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          amount: invoice.amount,
          currency: invoice.currency,
          description: invoice.description || `Invoice ${invoice.invoiceId}`,
          customerEmail: invoice.customerEmail,
          customerName: invoice.customerName
        })
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Failed to create payment session');
      const sessionId = json.data?.sessionId;
      if (!sessionId) throw new Error('No session created');
      navigate(`/checkout/${sessionId}`);
    } catch (e: any) {
      setError(e?.message || 'Unable to start payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#0a164d] animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'This invoice is invalid or no longer available.'}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-[#0a164d] text-white rounded-lg">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const amountMajor = (invoice.amount || 0) / 100;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoiceId}</h1>
              <p className="text-gray-600 text-sm">{invoice.description || 'Payment Invoice'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Customer</span><span className="text-gray-900">{invoice.customerName || invoice.customerEmail}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Email</span><span className="text-gray-900 break-all">{invoice.customerEmail}</span></div>
              {invoice.dueDate && (
                <div className="flex justify-between"><span className="text-gray-600">Due</span><span className="text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</span></div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Amount</span><span className="text-gray-900 font-semibold">{invoice.currency} {amountMajor.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className="text-gray-900 capitalize">{invoice.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Created</span><span className="text-gray-900">{new Date(invoice.createdAt).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="mt-6">
            {invoice.status === 'paid' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-700 font-semibold">This invoice has been paid</span>
                </div>
                <button onClick={() => navigate('/')} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Go to Dashboard</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={payNow}
                disabled={processing}
                className="w-full text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ backgroundColor: '#0a164d' }}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Starting Checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay {invoice.currency} {amountMajor.toLocaleString()}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;


