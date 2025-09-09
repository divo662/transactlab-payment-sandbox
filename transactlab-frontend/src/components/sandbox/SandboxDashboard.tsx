import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSandbox } from '@/contexts/SandboxContext';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Copy, CreditCard, DollarSign, Key, RefreshCw, Shield, Webhook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SandboxDashboardProps { defaultTab?: string; }

const SandboxDashboard: React.FC<SandboxDashboardProps> = ({ defaultTab = 'overview' }) => {
  const { isAuthenticated } = useAuth();
  const { 
    loading,
    error,
    getSandboxStats,
    getApiKeys,
    createApiKey,
    deactivateApiKey,
    getRecentSessions,
    createSession,
    processPayment,
    getWebhooks,
    createWebhook,
    testWebhook,
    getRecentTransactions,
    refreshSandboxData,
  } = useSandbox();
  const { toast } = useToast();

  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [apiKeyForm, setApiKeyForm] = useState({ name: '', permissions: ['read', 'write'] as string[], expiresAt: '', webhookUrl: '' });
  const [sessionForm, setSessionForm] = useState({ amount: '', currency: 'NGN', description: '', customerEmail: '' });
  const [paymentForm, setPaymentForm] = useState({ sessionId: '', method: 'card', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' });
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', events: ['transaction.successful', 'transaction.failed'] as string[] });

  const normalizeArray = (res: any, key: string) => Array.isArray(res?.data) ? res.data : (res?.data?.[key] || []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchAll();
  }, [isAuthenticated]);

  const fetchAll = async () => {
    try {
      const [s, k, w, sess, tx] = await Promise.all([
        getSandboxStats(),
        getApiKeys(),
        getWebhooks(),
        getRecentSessions(),
        getRecentTransactions(),
      ]);
      setApiKeys(normalizeArray(k, 'apiKeys'));
      setWebhooks(normalizeArray(w, 'webhooks'));
      setSessions(normalizeArray(sess, 'sessions'));
      setTransactions(Array.isArray(tx?.data) ? tx.data : (tx?.data?.transactions || []));
    } catch (e) {
      /* handled below via error UI */
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied.` });
  };

  const fmtMoney = (amount: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((amount || 0) / 100);
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString() : '—');

  const totalTransactions = transactions.length;
  const successfulTransactions = transactions.filter((t:any)=> (t.status==='successful' || t.status==='completed')).length;

  // Handlers
  const onCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createApiKey({
      name: apiKeyForm.name,
      permissions: apiKeyForm.permissions,
      webhookUrl: apiKeyForm.webhookUrl || undefined,
      expiresAt: apiKeyForm.expiresAt ? new Date(apiKeyForm.expiresAt) : undefined,
    });
    if (res?.success) { toast({ title: 'API key created' }); setApiKeyForm({ name: '', permissions: ['read','write'], expiresAt: '', webhookUrl: '' }); await fetchAll(); }
  };

  const onDeactivateKey = async (key: string) => {
    const res = await deactivateApiKey(key);
    if (res?.success) { toast({ title: 'API key deactivated' }); await fetchAll(); }
  };

  const onCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createSession({
      amount: Math.round(parseFloat(sessionForm.amount) * 100),
      currency: sessionForm.currency,
      description: sessionForm.description,
      customerEmail: sessionForm.customerEmail,
    });
    if (res?.success) { toast({ title: 'Session created' }); setSessionForm({ amount: '', currency: 'NGN', description: '', customerEmail: '' }); await fetchAll(); }
  };

  const onProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.sessionId) return;
    const payload: any = { paymentMethod: paymentForm.method as 'card'|'bank'|'wallet' };
    if (paymentForm.method === 'card') {
      payload.cardDetails = { number: paymentForm.cardNumber, expiryMonth: paymentForm.expiryMonth, expiryYear: paymentForm.expiryYear, cvv: paymentForm.cvv };
    }
    const res = await processPayment(paymentForm.sessionId, payload);
    if (res?.success) { toast({ title: `Payment ${res.data.status}` }); setPaymentForm({ sessionId: '', method: 'card', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' }); await fetchAll(); }
  };

  const onCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createWebhook({ name: webhookForm.name, url: webhookForm.url, events: webhookForm.events });
    if (res?.success) { toast({ title: 'Webhook created' }); setWebhookForm({ name: '', url: '', events: ['transaction.successful', 'transaction.failed'] }); await fetchAll(); }
  };

  const onTestWebhook = async (id: string) => {
    const res = await testWebhook(id, { webhookUrl: 'https://webhook.site/test', eventType: 'transaction.successful' });
    if (res?.success) toast({ title: 'Webhook test sent' });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sandbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
          <h1 className="text-2xl font-semibold">Sandbox Dashboard</h1>
          <p className="text-sm text-muted-foreground">Stripe-like sandbox: real API, fake money</p>
            </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800"><Shield className="w-4 h-4 mr-2" />Sandbox</Badge>
          <Button variant="outline" onClick={() => { void refreshSandboxData(); void fetchAll(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50"><CardContent className="pt-6">
          <div className="flex items-center text-red-700 gap-2"><AlertTriangle className="w-5 h-5" /><span>{error}</span></div>
        </CardContent></Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Transactions</CardTitle></CardHeader><CardContent>
          <div className="text-2xl font-bold">{totalTransactions}</div>
          <p className="text-xs text-muted-foreground">{successfulTransactions} successful</p>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Active Sessions</CardTitle></CardHeader><CardContent>
          <div className="text-2xl font-bold">{sessions.filter(s=>s.status==='pending').length}</div>
          <p className="text-xs text-muted-foreground">{sessions.filter(s=>s.status==='completed').length} completed</p>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">API Keys</CardTitle></CardHeader><CardContent>
          <div className="text-2xl font-bold">{apiKeys.filter(k=>k.isActive).length}</div>
          <p className="text-xs text-muted-foreground">{apiKeys.length} total</p>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Webhooks</CardTitle></CardHeader><CardContent>
          <div className="text-2xl font-bold">{webhooks.filter(w=>w.isActive).length}</div>
          <p className="text-xs text-muted-foreground">{webhooks.length} total</p>
        </CardContent></Card>
            </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Recent Transactions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {transactions.slice(0,5).map((t:any, index: number) => (
                <div key={t.transactionId || t.sessionId || `transaction-${index}`} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{fmtMoney(t.amount, t.currency)}</span>
                  <span className="text-muted-foreground">{t.status}</span>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Create API Key</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={onCreateKey} className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input id="key-name" value={apiKeyForm.name} onChange={e=>setApiKeyForm(v=>({...v,name:e.target.value}))} placeholder="My key" required />
                  </div>
                <div>
                  <Label htmlFor="expires">Expires (optional)</Label>
                  <Input id="expires" type="datetime-local" value={apiKeyForm.expiresAt} onChange={e=>setApiKeyForm(v=>({...v,expiresAt:e.target.value}))} />
                  </div>
                  <div>
                  <Label htmlFor="wh">Webhook URL (optional)</Label>
                  <Input id="wh" value={apiKeyForm.webhookUrl} onChange={e=>setApiKeyForm(v=>({...v,webhookUrl:e.target.value}))} placeholder="https://example.com/webhooks" />
                  </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={loading}><Key className="w-4 h-4 mr-2" />Create</Button>
                </div>
              </form>
            </CardContent>
          </Card>

           <Card>
            <CardHeader><CardTitle className="text-sm">Your API Keys</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {apiKeys.map((k:any) => (
                <div key={k.apiKey} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{k.apiKey.slice(0,20)}...</span>
                    <Badge variant={k.isActive? 'default' : 'secondary'}>{k.isActive? 'Active':'Inactive'}</Badge>
               </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={()=>copy(k.apiKey,'API key')}><Copy className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" disabled={!k.isActive} onClick={()=>onDeactivateKey(k.apiKey)}>Deactivate</Button>
                      </div>
                    </div>
                  ))}
              {apiKeys.length===0 && <p className="text-sm text-muted-foreground">No API keys yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Create Session</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={onCreateSession} className="grid gap-3 md:grid-cols-2">
                      <div>
                  <Label htmlFor="amt">Amount</Label>
                  <Input id="amt" type="number" step="0.01" value={sessionForm.amount} onChange={e=>setSessionForm(v=>({...v,amount:e.target.value}))} required />
                      </div>
              <div>
                  <Label>Currency</Label>
                  <Select value={sessionForm.currency} onValueChange={(val)=>setSessionForm(v=>({...v,currency:val}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div className="md:col-span-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input id="desc" value={sessionForm.description} onChange={e=>setSessionForm(v=>({...v,description:e.target.value}))} required />
              </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">Customer Email</Label>
                  <Input id="email" type="email" value={sessionForm.customerEmail} onChange={e=>setSessionForm(v=>({...v,customerEmail:e.target.value}))} required />
              </div>
                <div className="md:col-span-2"><Button type="submit"><CreditCard className="w-4 h-4 mr-2" />Create</Button></div>
            </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Process Payment</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={onProcessPayment} className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="sid">Session ID</Label>
                  <Input id="sid" value={paymentForm.sessionId} onChange={e=>setPaymentForm(v=>({...v,sessionId:e.target.value}))} placeholder="sess_xxx" required />
              </div>
              <div>
                  <Label htmlFor="card">Card Number</Label>
                  <Input id="card" value={paymentForm.cardNumber} onChange={e=>setPaymentForm(v=>({...v,cardNumber:e.target.value}))} placeholder="4242 4242 4242 4242" required />
              </div>
              <div>
                  <Label htmlFor="mm">Expiry Month</Label>
                  <Input id="mm" value={paymentForm.expiryMonth} onChange={e=>setPaymentForm(v=>({...v,expiryMonth:e.target.value}))} placeholder="MM" required />
              </div>
              <div>
                  <Label htmlFor="yy">Expiry Year</Label>
                  <Input id="yy" value={paymentForm.expiryYear} onChange={e=>setPaymentForm(v=>({...v,expiryYear:e.target.value}))} placeholder="YY" required />
              </div>
              <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" value={paymentForm.cvv} onChange={e=>setPaymentForm(v=>({...v,cvv:e.target.value}))} placeholder="123" required />
              </div>
                <div className="md:col-span-2"><Button type="submit"><DollarSign className="w-4 h-4 mr-2" />Pay</Button></div>
            </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Add Webhook</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={onCreateWebhook} className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="whname">Name</Label>
                  <Input id="whname" value={webhookForm.name} onChange={e=>setWebhookForm(v=>({...v,name:e.target.value}))} required />
              </div>
                <div className="md:col-span-2">
                  <Label htmlFor="whurl">URL</Label>
                  <Input id="whurl" value={webhookForm.url} onChange={e=>setWebhookForm(v=>({...v,url:e.target.value}))} placeholder="https://your-domain.com/webhooks" required />
              </div>
                <div className="md:col-span-2"><Button type="submit"><Webhook className="w-4 h-4 mr-2" />Create</Button></div>
            </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Your Webhooks</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {webhooks.map((w:any) => (
                <div key={w.id} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[60%]">{w.name} — {w.url}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={()=>copy(w.url,'Webhook URL')}><Copy className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={()=>onTestWebhook(w.id)}>Test</Button>
              </div>
              </div>
              ))}
              {webhooks.length===0 && <p className="text-sm text-muted-foreground">No webhooks yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SandboxDashboard;
