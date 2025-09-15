import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

const QuickLinkPay: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [starting, setStarting] = useState<boolean>(false);
  const [meta, setMeta] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  const canSubmit = useMemo(() => {
    if (!meta) return false;
    if (meta.allowAmountOverride) {
      const num = parseFloat(amount || '0');
      if (isNaN(num) || num <= 0) return false;
    }
    if (meta.requireCustomerInfo) {
      if (!customerEmail) return false;
    }
    return true;
  }, [meta, amount, customerEmail]);

  useEffect(() => {
    (async () => {
      try {
        if (!token) {
          toast({ title: 'Invalid link', description: 'Payment link token is missing', variant: 'destructive' });
          navigate('/');
          return;
        }
        // Pass userId hint if present in URL
        const userIdHint = searchParams.get('userId') || undefined;
        const resp = await api.getQuickLinkMeta(token, userIdHint);
        const data = (resp as any)?.data || resp;
        const metaData = data?.data || data;
        setMeta(metaData);
        if (!metaData.allowAmountOverride && metaData.amount) {
          setAmount(String(metaData.amount));
        }
      } catch (e: any) {
        toast({ title: 'Link error', description: e?.message || 'Could not load payment link', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const startPayment = async () => {
    try {
      if (!token) return;
      setStarting(true);
      const userIdHint = searchParams.get('userId') || undefined;
      const payload: any = {};
      if (meta?.allowAmountOverride) {
        const num = parseFloat(amount || '0');
        if (!isNaN(num) && num > 0) payload.amount = num;
      }
      if (meta?.requireCustomerInfo) {
        if (customerEmail) payload.customerEmail = customerEmail;
        if (customerName) payload.customerName = customerName;
      }
      const resp = await api.startPaymentFromQuickLink(token, payload, userIdHint);
      const data = (resp as any)?.data || resp;
      const out = data?.data || data;
      const sessionId = out?.sessionId;
      const checkoutUrl = out?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else if (sessionId) {
        navigate(`/checkout/${sessionId}`);
      } else {
        toast({ title: 'Start failed', description: 'Could not start payment', variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Start failed', description: e?.message || 'Could not start payment', variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <div className="space-y-3">
          <div className="h-7 bg-gray-200 rounded w-60 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-80 animate-pulse" />
        </div>
        <div className="mt-4 border rounded-lg p-4 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <p className="text-gray-600">Payment link not available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-3 sm:p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">{meta.title || 'Payment Link'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {meta.description && (
            <p className="text-xs sm:text-sm text-gray-600">{meta.description}</p>
          )}

          {!meta.allowAmountOverride ? (
            <div className="text-sm text-gray-900">
              Amount: <span className="font-semibold">{meta.amount} {meta.currency}</span>
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-600">Amount</label>
              <Input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder={`0.00 (${meta.currency})`} className="text-xs sm:text-sm mt-1" />
            </div>
          )}

          {meta.requireCustomerInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">Email</label>
                <Input value={customerEmail} onChange={(e)=>setCustomerEmail(e.target.value)} placeholder="customer@example.com" className="text-xs sm:text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-600">Name (optional)</label>
                <Input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} placeholder="John Doe" className="text-xs sm:text-sm mt-1" />
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button disabled={starting || !canSubmit} onClick={startPayment} className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto">
              {starting ? 'Starting…' : 'Proceed to pay'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickLinkPay;


