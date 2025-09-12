import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Copy, Link as LinkIcon, Loader2, Mail, Coins, Repeat, Type, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const PaymentLinkNew: React.FC = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'one_time'|'recurring'>('one_time');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('NGN');
  const [description, setDescription] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [customers, setCustomers] = useState<Array<{ email: string; name?: string }>>([]);
  const [filter, setFilter] = useState<string>('');
  const [interval, setInterval] = useState<string>('month');
  const [trialDays, setTrialDays] = useState<string>('0');
  const [chargeNow, setChargeNow] = useState<boolean>(true);
  const [successUrl, setSuccessUrl] = useState<string>('');
  const [cancelUrl, setCancelUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  const createLink = async () => {
    try {
      setLoading(true);
      setResultUrl('');
      setSessionId('');
      const payload: any = {
        amount: parseFloat(amount || '0'),
        currency,
        description,
        customerEmail: email || undefined,
        successUrl: successUrl || undefined,
        cancelUrl: cancelUrl || undefined,
      };
      if (mode === 'recurring') {
        payload.paymentType = 'recurring';
        payload.interval = interval;
        payload.trialDays = parseInt(trialDays || '0', 10) || 0;
        payload.chargeNow = chargeNow;
      }
      const res = await api.createQuickPaymentLink(payload);
      const data = res?.data || {};
      const sid = data.sessionId || data.id || '';
      setSessionId(sid);
      const frontendBase = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '';
      const normalizedUrl = sid ? `${frontendBase}/checkout/${sid}` : (data.checkoutUrl || '');
      if (normalizedUrl) setResultUrl(normalizedUrl);
      toast({ title: 'Link created', description: 'Your payment link is ready to share' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to create link', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.listSandboxCustomers({ limit: 100 });
        const arr = (resp?.data || []).map((c: any) => ({ email: c.email, name: c.name }));
        setCustomers(arr);
      } catch (_) {}
    })();
  }, []);

  const filteredCustomers = useMemo(() => {
    const f = (filter || '').toLowerCase();
    if (!f) return customers;
    return customers.filter(c => (c.email?.toLowerCase()?.includes(f) || c.name?.toLowerCase()?.includes(f)));
  }, [customers, filter]);

  const copy = async () => {
    try {
      if (resultUrl) {
        await navigator.clipboard.writeText(resultUrl);
        toast({ title: 'Copied', description: 'Link copied to clipboard' });
      }
    } catch {}
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Generate Payment Link</h1>
        <p className="text-gray-600">Create quick links for one-time or recurring payments.</p>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LinkIcon className="w-5 h-5 text-[#0a164d]" /> Link Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-xs text-gray-600">Payment Type</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={()=>setMode('one_time')} className={`group border rounded-lg p-3 text-left transition-all ${mode==='one_time' ? 'border-[#0a164d] bg-[#0a164d]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-gray-600 group-[&.active]:text-[#0a164d]" />
                  <span className="font-semibold text-sm">One-time</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Single charge link</p>
              </button>
              <button type="button" onClick={()=>setMode('recurring')} className={`group border rounded-lg p-3 text-left transition-all ${mode==='recurring' ? 'border-[#0a164d] bg-[#0a164d]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-sm">Recurring</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Subscription-based link</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Amount</Label>
              <Input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="2500" className="transition-all focus:shadow-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Customer</Label>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <Input value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder="Search customers..." />
                </div>
                <div className="max-h-40 overflow-auto border rounded-md">
                  {filteredCustomers.map((c)=> (
                    <button key={c.email} type="button" onClick={()=>setEmail(c.email)} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${email===c.email ? 'bg-[#0a164d]/5' : ''}`}>
                      <div className="font-medium text-gray-900">{c.name || c.email}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </button>
                  ))}
                  {filteredCustomers.length===0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">No customers</div>
                  )}
                </div>
                {email && (
                  <div className="mt-1 text-xs text-gray-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-600" />Selected: {email}</div>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600">Description</Label>
            <Input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="What is the payment for?" className="transition-all focus:shadow-sm" />
          </div>

          {mode === 'recurring' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Interval</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="quarter">Quarterly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Trial Days</Label>
                <Input value={trialDays} onChange={(e)=>setTrialDays(e.target.value)} placeholder="0" className="transition-all focus:shadow-sm" />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={chargeNow} onChange={(e)=>setChargeNow(e.target.checked)} />
                  Charge immediately
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Success URL (optional)</Label>
              <Input value={successUrl} onChange={(e)=>setSuccessUrl(e.target.value)} placeholder="https://yourapp.com/paid" className="transition-all focus:shadow-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Cancel URL (optional)</Label>
              <Input value={cancelUrl} onChange={(e)=>setCancelUrl(e.target.value)} placeholder="https://yourapp.com/cancelled" className="transition-all focus:shadow-sm" />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={createLink} disabled={loading} className="transition-transform hover:scale-[1.01] active:scale-[0.99]">
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>) : (<><LinkIcon className="w-4 h-4 mr-2" />Create Link</>)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {resultUrl && (
        <Card className="shadow-sm hover:shadow-md transition-shadow animate-in fade-in duration-300">
          <CardHeader>
            <CardTitle>Your Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input value={resultUrl} readOnly />
              <Button variant="outline" onClick={copy}><Copy className="w-4 h-4" /></Button>
            </div>
            {sessionId && (<p className="text-xs text-gray-500 mt-2">Session ID: {sessionId}</p>)}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentLinkNew;

