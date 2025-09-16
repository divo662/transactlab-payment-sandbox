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
      // Remove commas and parse the number
      const cleanAmount = amount.replace(/,/g, '');
      const num = parseFloat(cleanAmount || '0');
      if (isNaN(num) || num <= 0) return false;
    }
    if (meta.requireCustomerInfo) {
      if (!customerEmail) return false;
    }
    return true;
  }, [meta, amount, customerEmail]);

  // Helper function to format numbers with commas
  const formatNumber = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    if (!numericValue) return '';
    
    // Split by decimal point
    const parts = numericValue.split('.');
    // Add commas to the integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Prefer frontend checkout: extract a sessionId from any backend URL
  const extractSessionIdFromUrl = (url?: string): string | null => {
    if (!url) return null;
    try {
      // Try common pattern like sess_xxxxxxxx
      const match = url.match(/(sess_[a-zA-Z0-9]+)/);
      if (match && match[1]) return match[1];

      // Parse URL and inspect path/query
      const parsed = new URL(url, window.location.origin);
      const segments = parsed.pathname.split('/').filter(Boolean);
      // Look for checkout/session-like segments
      const idx = segments.findIndex(s => ['checkout', 'session', 'sessions'].includes(s));
      if (idx >= 0 && segments[idx + 1]) return segments[idx + 1];

      const qp = parsed.searchParams.get('sessionId') || parsed.searchParams.get('session') || parsed.searchParams.get('id');
      if (qp) return qp;
    } catch (_e) {
      // no-op, fall through
    }
    return null;
  };

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
        // Remove commas and parse the number
        const cleanAmount = amount.replace(/,/g, '');
        const num = parseFloat(cleanAmount || '0');
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
      // Always prefer navigating to our own frontend route
      if (sessionId) {
        navigate(`/checkout/${sessionId}`);
      } else if (checkoutUrl) {
        const sid = extractSessionIdFromUrl(checkoutUrl);
        if (sid) {
          navigate(`/checkout/${sid}`);
        } else {
          // Fallback to whatever URL was returned if we cannot parse a session id
          window.location.href = checkoutUrl;
        }
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto animate-pulse" />
          <div className="mt-6 border rounded-2xl p-5 shadow-sm bg-white">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="mt-3 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="mt-3 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="mt-4 h-10 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
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

  const branding = (meta && meta.branding) || {};
  const primary = branding.primaryColor || '#0a164d';
  const secondary = branding.secondaryColor || '#1e3a8a';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-3 sm:p-6" style={{ ['--tl-primary' as any]: primary, ['--tl-secondary' as any]: secondary }}>
      <div className="w-full max-w-lg md:max-w-2xl">
        {/* Header / Brand */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border bg-white shadow-sm">
            <img src={branding.logoUrl || '/transactlab/1.png'} alt="TransactLab" className="h-5 w-5 rounded" />
            <span className="text-xs font-semibold" style={{ color: primary }}>TransactLab</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{meta.title || 'Payment'}</h1>
          {meta.description ? (
            <p className="mt-1 text-sm sm:text-base text-gray-600">{meta.description}</p>
          ) : null}
        </div>

        <Card className="shadow-md border-0 rounded-2xl overflow-hidden">
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />
          <CardContent className="p-5 sm:p-7 space-y-5">
            {/* Amount */}
            {!meta.allowAmountOverride ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-lg sm:text-xl font-bold text-gray-900">{meta.currency} {Number(meta.amount).toLocaleString()}</span>
              </div>
            ) : (
              <div>
                <label className="text-xs text-gray-600">Amount</label>
                <Input 
                  value={amount} 
                  onChange={(e) => setAmount(formatNumber(e.target.value))} 
                  placeholder={`0.00 (${meta.currency})`} 
                  className="text-sm mt-1" 
                />
                <p className="text-[11px] text-gray-500 mt-1">Enter any amount in {meta.currency}</p>
                {amount && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Formatted: {amount} {meta.currency}
                  </p>
                )}
              </div>
            )}

            {/* Customer Info */}
            {meta.requireCustomerInfo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Email</label>
                  <Input value={customerEmail} onChange={(e)=>setCustomerEmail(e.target.value)} placeholder="customer@example.com" className="text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Name (optional)</label>
                  <Input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} placeholder="John Doe" className="text-sm mt-1" />
                </div>
              </div>
            )}

            <Button disabled={starting || !canSubmit} onClick={startPayment} className="h-10 text-sm w-full transition-transform hover:scale-[1.01] active:scale-[0.99]" style={{ backgroundColor: primary }}>
              {starting ? 'Starting…' : 'Proceed to pay'}
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs text-gray-500">
              <div className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />
                <span>Secure</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: secondary }} />
                <span>Sandbox Mode</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer brand stripe */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] text-gray-500 px-3 py-1.5 rounded-full border bg-white">
            <img src={branding.logoUrl || '/transactlab/1.png'} alt="TransactLab" className="h-4 w-4 rounded" />
            <span>Payments powered by TransactLab</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickLinkPay;


