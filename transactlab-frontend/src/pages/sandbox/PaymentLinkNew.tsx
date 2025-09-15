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
  const [activeTab, setActiveTab] = useState<'create'>('create');
  const [mode, setMode] = useState<'one_time'|'recurring'>('one_time');
  const [title, setTitle] = useState<string>('');
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [resultUrl, setResultUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  // Advanced options
  const [allowAmountOverride, setAllowAmountOverride] = useState<boolean>(false);
  const [requireCustomerInfo, setRequireCustomerInfo] = useState<boolean>(false);
  const [expiresInMinutes, setExpiresInMinutes] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  // Branding (removed from UI for one-time links)

  // Quick Pay removed

  const createLink = async () => {
    try {
      setLoading(true);
      setResultUrl('');
      setSessionId('');
      const payload: any = {
        title: (title && title.trim()) || (description && description.trim()) || 'Quick Payment Link',
        currency,
        description: description || undefined,
        successUrl: successUrl || undefined,
        cancelUrl: cancelUrl || undefined,
      };
      const amtNum = parseFloat(amount || '0');
      if (!isNaN(amtNum) && amtNum > 0) {
        payload.amount = amtNum;
      }
      payload.allowAmountOverride = !!allowAmountOverride;
      payload.requireCustomerInfo = !!requireCustomerInfo;
      if (expiresInMinutes) {
        const v = parseInt(expiresInMinutes, 10);
        if (!isNaN(v) && v > 0) payload.expiresInMinutes = v;
      }
      if (maxUses) {
        const v = parseInt(maxUses, 10);
        if (!isNaN(v) && v > 0) payload.maxUses = v;
      }
      // branding removed for one-time link visuals
      if (mode === 'recurring') {
        payload.paymentType = 'recurring';
        payload.interval = interval;
        payload.trialDays = parseInt(trialDays || '0', 10) || 0;
        payload.chargeNow = chargeNow;
      } else {
        payload.paymentType = 'one_time';
      }
      const res = await api.createQuickPaymentLink(payload);
      const data = (res as any)?.data || res;
      const out = data?.data || data;
      const publicUrl = out?.publicUrl;
      if (publicUrl) {
        setResultUrl(publicUrl);
        toast({ title: 'Link created', description: 'Your payment link is ready to share' });
        return;
      }
      toast({ title: 'Error', description: 'Failed to get payment link URL', variant: 'destructive' });
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
      setInitialLoading(false);
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

  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
        </div>

        {/* Card Skeleton */}
        <div className="border rounded-lg p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Payment Type Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Form Fields Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Recurring Options Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* URL Fields Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Button Skeleton */}
            <div className="pt-2">
              <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading payment link generator...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Generate Payment Link</h1>
        <p className="text-sm sm:text-base text-gray-600">Create quick links for one-time or recurring payments.</p>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
            <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a164d]" /> 
            Link Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-4 sm:space-y-6">
          

          {activeTab === 'create' && (
          <>
            <Label className="text-xs text-gray-600">Payment Type</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={()=>setMode('one_time')} 
                className={`group border rounded-lg p-3 text-left transition-all ${mode==='one_time' ? 'border-[#0a164d] bg-[#0a164d]/5' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-gray-600 group-[&.active]:text-[#0a164d]" />
                  <span className="font-semibold text-xs sm:text-sm">One-time</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Single charge link</p>
              </button>
              <button 
                type="button" 
                onClick={()=>setMode('recurring')} 
                className={`group border rounded-lg p-3 text-left transition-all ${mode==='recurring' ? 'border-[#0a164d] bg-[#0a164d]/5' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-xs sm:text-sm">Recurring</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Subscription-based link</p>
              </button>
            </div>
          

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Title</Label>
              <Input 
                value={title} 
                onChange={(e)=>setTitle(e.target.value)} 
                placeholder="Payment title" 
                className="transition-all focus:shadow-sm text-xs sm:text-sm" 
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Amount</Label>
              <Input 
                value={amount} 
                onChange={(e)=>setAmount(e.target.value)} 
                placeholder="2500" 
                className="transition-all focus:shadow-sm text-xs sm:text-sm" 
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <Label className="text-xs text-gray-600">Customer</Label>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                  <Input 
                    value={filter} 
                    onChange={(e)=>setFilter(e.target.value)} 
                    placeholder="Search customers..." 
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div className="max-h-32 sm:max-h-40 overflow-auto border rounded-md">
                  {filteredCustomers.map((c)=> (
                    <button 
                      key={c.email} 
                      type="button" 
                      onClick={()=>setEmail(c.email)} 
                      className={`w-full text-left px-2 sm:px-3 py-2 text-xs sm:text-sm hover:bg-gray-50 ${email===c.email ? 'bg-[#0a164d]/5' : ''}`}
                    >
                      <div className="font-medium text-gray-900 truncate">{c.name || c.email}</div>
                      <div className="text-xs text-gray-500 truncate">{c.email}</div>
                    </button>
                  ))}
                  {filteredCustomers.length===0 && (
                    <div className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-500">No customers</div>
                  )}
                </div>
                {email && (
                  <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="truncate">Selected: {email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600">Description</Label>
            <Input 
              value={description} 
              onChange={(e)=>setDescription(e.target.value)} 
              placeholder="What is the payment for?" 
              className="transition-all focus:shadow-sm text-xs sm:text-sm" 
            />
          </div>

          {/* Advanced options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm">
              <input type="checkbox" className="w-3 h-3 sm:w-4 sm:h-4" checked={allowAmountOverride} onChange={(e)=>setAllowAmountOverride(e.target.checked)} />
              Allow amount override
            </label>
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm">
              <input type="checkbox" className="w-3 h-3 sm:w-4 sm:h-4" checked={requireCustomerInfo} onChange={(e)=>setRequireCustomerInfo(e.target.checked)} />
              Require customer info
            </label>
            <div />
            <div>
              <Label className="text-xs text-gray-600">Expires in (minutes)</Label>
              <Input value={expiresInMinutes} onChange={(e)=>setExpiresInMinutes(e.target.value)} placeholder="e.g. 10080" className="text-xs sm:text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Max uses</Label>
              <Input value={maxUses} onChange={(e)=>setMaxUses(e.target.value)} placeholder="e.g. 100" className="text-xs sm:text-sm" />
            </div>
          </div>

          {mode === 'recurring' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Interval</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
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
                <Input 
                  value={trialDays} 
                  onChange={(e)=>setTrialDays(e.target.value)} 
                  placeholder="0" 
                  className="transition-all focus:shadow-sm text-xs sm:text-sm" 
                />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <label className="inline-flex items-center gap-2 text-xs sm:text-sm">
                  <input 
                    type="checkbox" 
                    checked={chargeNow} 
                    onChange={(e)=>setChargeNow(e.target.checked)} 
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                  Charge immediately
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Success URL (optional)</Label>
              <Input 
                value={successUrl} 
                onChange={(e)=>setSuccessUrl(e.target.value)} 
                placeholder="https://yourapp.com/paid" 
                className="transition-all focus:shadow-sm text-xs sm:text-sm" 
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Cancel URL (optional)</Label>
              <Input 
                value={cancelUrl} 
                onChange={(e)=>setCancelUrl(e.target.value)} 
                placeholder="https://yourapp.com/cancelled" 
                className="transition-all focus:shadow-sm text-xs sm:text-sm" 
              />
            </div>
          </div>

          {/* Branding section removed per request */}

          <div className="pt-2">
            <Button 
              onClick={createLink} 
              disabled={loading} 
              className="transition-transform hover:scale-[1.01] active:scale-[0.99] w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Create Link
                </>
              )}
            </Button>
          </div>
          </>
          )}
        </CardContent>
      </Card>

      {resultUrl && (
        <Card className="shadow-sm hover:shadow-md transition-shadow animate-in fade-in duration-300">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
            <CardTitle className="text-sm sm:text-lg">Your Link</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input 
                value={resultUrl} 
                readOnly 
                className="text-xs sm:text-sm flex-1" 
              />
              <Button 
                variant="outline" 
                onClick={copy}
                className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
            </div>
            {sessionId && (
              <p className="text-xs text-gray-500 mt-2 break-all">
                Session ID: {sessionId}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentLinkNew;

