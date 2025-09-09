import React, { useEffect, useState } from 'react';
import { useSandbox } from '@/contexts/SandboxContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Pagination from '@/components/ui/Pagination';
import ApiWorkbench from '@/components/dev/ApiWorkbench';

const Subscriptions: React.FC = () => {
  const { createTestSubscription } = useSandbox();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Backend endpoints base
  const API_BASE = 'http://localhost:5000/api/v1/sandbox';

  // Products & Plans state
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

  // Subscriptions list
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [form, setForm] = useState({
    customerEmail: '',
    chargeNow: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { apiCall } = useSandbox();

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, planRes, subsRes, custRes] = await Promise.all([
        apiCall('/products'),
        apiCall('/plans'),
        apiCall('/subscriptions'),
        apiCall('/customers')
      ]);
      setProducts(prodRes.data || []);
      setPlans(planRes.data || []);
      setSubscriptions(subsRes.data || []);
      setCustomers(custRes.data || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (!selectedPlan) throw new Error('Select a plan');
      if (!selectedCustomer && !form.customerEmail) throw new Error('Select a customer or enter email');
      
      const customerEmail = selectedCustomer || form.customerEmail;
      const payload = { customerEmail, planId: selectedPlan, chargeNow: form.chargeNow };
      const res = await apiCall('/subscriptions', { method: 'POST', body: JSON.stringify(payload) });
      toast({ title: 'Subscription created', description: form.chargeNow ? 'Redirecting to checkout...' : 'Trial started' });
      if (res?.data?.sessionId) window.location.href = `/checkout/${res.data.sessionId}`;
      await loadData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create subscription', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <Button onClick={onSubmit} disabled={submitting || !selectedPlan || (!selectedCustomer && !form.customerEmail)}>Create subscription</Button>
      </div>

      {/* Create bar like Stripe */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Customer</Label>
              <div className="flex gap-2">
                <Select value={selectedCustomer} onValueChange={(value) => {
                  if (value === 'new') {
                    setSelectedCustomer('new');
                    setForm({...form, customerEmail: ''});
                  } else {
                    setSelectedCustomer(value);
                    setForm({...form, customerEmail: value});
                  }
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Create new customer</SelectItem>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer._id} value={customer.email}>
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name || 'Unnamed Customer'}</span>
                          <span className="text-xs text-gray-500">{customer.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomer === 'new' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/sandbox/customers')}
                    className="whitespace-nowrap"
                  >
                    Go to Customers
                  </Button>
                )}
              </div>
              {selectedCustomer === 'new' && (
                <div className="mt-2">
                  <Input 
                    value={form.customerEmail} 
                    onChange={(e)=> setForm({...form, customerEmail: e.target.value})} 
                    placeholder="Enter new customer email" 
                  />
                </div>
              )}
              {selectedCustomer && selectedCustomer !== 'new' && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {customers.find(c => c.email === selectedCustomer)?.name || selectedCustomer}
                </div>
              )}
            </div>
            <div>
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={(v)=> { setSelectedProduct(v); setSelectedPlan(''); }}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p:any)=> (<SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan</Label>
              <Select value={selectedPlan} onValueChange={(v)=> setSelectedPlan(v)}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {plans.filter((pl:any)=> !selectedProduct || pl.productId===selectedProduct).map((pl:any)=> (
                    <SelectItem key={pl._id} value={pl._id}>{pl.currency} {(pl.amount/100).toFixed(2)} / {pl.interval}{pl.trialDays?` +${pl.trialDays}d trial`:''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <input id="chargeNow" type="checkbox" checked={form.chargeNow} onChange={(e)=> setForm({...form, chargeNow: e.target.checked})} />
            <Label htmlFor="chargeNow">Charge now (otherwise trial if plan has trialDays)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={async()=>{
          try {
            await apiCall('/subscriptions/run-renewals', {method:'POST'});
            toast({ title: 'Renewals executed' });
            await loadData();
          } catch (e) {
            toast({ title: 'Error', description: 'Failed to run renewals', variant: 'destructive' });
          }
        }}>Run renewals now</Button>
      </div>

      {/* Subscriptions table */}
      <Card>
        <CardHeader><CardTitle>All subscriptions</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y border rounded">
            {(() => {
              const filtered = subscriptions.filter((s:any)=> statusFilter==='all' || s.status===statusFilter);
              if (filtered.length === 0) {
                return <div className="p-6 text-sm text-gray-500 text-center">No data available</div>;
              }
              return filtered.map((s:any)=> (
                <div key={s._id} className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={()=> navigate(`/sandbox/subscriptions/${s._id}`)}>
                  <div>
                    <div className="font-medium">{s.customerEmail}</div>
                    <div className="text-xs text-gray-500">{s.status} · {new Date(s.currentPeriodStart).toLocaleDateString()} → {new Date(s.currentPeriodEnd).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={s.status==='paused'} onClick={async()=>{
                      try { await apiCall(`/subscriptions/${s._id}/pause`, {method:'POST'}); toast({ title: 'Paused' }); await loadData(); }
                      catch { toast({ title: 'Error', description: 'Failed to pause', variant: 'destructive' }); }
                    }}>Pause</Button>
                    <Button size="sm" variant="outline" disabled={s.status!=='paused'} onClick={async()=>{
                      try { await apiCall(`/subscriptions/${s._id}/resume`, {method:'POST'}); toast({ title: 'Resumed' }); await loadData(); }
                      catch { toast({ title: 'Error', description: 'Failed to resume', variant: 'destructive' }); }
                    }}>Resume</Button>
                    <Button size="sm" variant="outline" onClick={async()=>{
                      try { await apiCall(`/subscriptions/${s._id}/cancel`, {method:'POST', body: JSON.stringify({atPeriodEnd:true})}); toast({ title: 'Will cancel at period end' }); await loadData(); }
                      catch { toast({ title: 'Error', description: 'Failed to cancel', variant: 'destructive' }); }
                    }}>Cancel at period end</Button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>
      <div className="mt-6">
        <ApiWorkbench
          examples={[
            { title: 'List products', method: 'GET', path: '/products' },
            { title: 'Create product', method: 'POST', path: '/products', body: { name: 'Pro Suite', description: 'All features' } },
            { title: 'List plans', method: 'GET', path: '/plans' },
            { title: 'Create plan', method: 'POST', path: '/plans', body: { productId: '<PRODUCT_ID>', amount: 100000, currency: 'NGN', interval: 'month', trialDays: 14 }, note: 'Amounts are in minor units' },
            { title: 'Create subscription', method: 'POST', path: '/subscriptions', body: { customerEmail: 'test@example.com', planId: '<PLAN_ID>', chargeNow: true } },
            { title: 'List subscriptions', method: 'GET', path: '/subscriptions' },
            { title: 'Cancel at period end', method: 'POST', path: '/subscriptions/<SUB_ID>/cancel', body: { atPeriodEnd: true } },
            { title: 'Pause subscription', method: 'POST', path: '/subscriptions/<SUB_ID>/pause' },
            { title: 'Resume subscription', method: 'POST', path: '/subscriptions/<SUB_ID>/resume' },
          ]}
        />
      </div>
    </div>
  );
};

export default Subscriptions;
function CreateProductForm({ onCreated }: { onCreated: () => void }) {
  const API_BASE = 'http://localhost:5000/api/v1/sandbox';
  const { toast } = useToast();
  const [name, setName] = useState('Pro Suite');
  const [description, setDescription] = useState('All features');
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/products`, { method:'POST', headers: { 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ name, description }) });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Product created' });
      onCreated();
    } catch(e) { toast({ title:'Error', description:'Failed to create product', variant:'destructive' }); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="sm:col-span-1">
        <Label>Name</Label>
        <Input value={name} onChange={(e)=> setName(e.target.value)} />
      </div>
      <div className="sm:col-span-1">
        <Label>Description</Label>
        <Input value={description} onChange={(e)=> setDescription(e.target.value)} />
      </div>
      <div className="sm:col-span-1 flex items-end">
        <Button type="submit" disabled={saving}>{saving?'Saving...':'Add Product'}</Button>
      </div>
    </form>
  );
}

function CreatePlanForm({ products, onCreated }: { products: any[]; onCreated: () => void }) {
  const API_BASE = 'http://localhost:5000/api/v1/sandbox';
  const { toast } = useToast();
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState(10000);
  const [currency, setCurrency] = useState('NGN');
  const [interval, setInterval] = useState('month');
  const [trialDays, setTrialDays] = useState(0);
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/plans`, { method:'POST', headers: { 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ productId, amount: Math.round(amount*100), currency, interval, trialDays }) });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Plan created' });
      onCreated();
    } catch(e) { toast({ title:'Error', description:'Failed to create plan', variant:'destructive' }); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
      <div className="sm:col-span-2">
        <Label>Product</Label>
        <Select value={productId} onValueChange={(v)=> setProductId(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {products.map((p:any)=> (<SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Amount</Label>
        <Input type="number" value={amount} onChange={(e)=> setAmount(Number(e.target.value))} />
      </div>
      <div>
        <Label>Currency</Label>
        <Select value={currency} onValueChange={(v)=> setCurrency(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NGN">NGN</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Interval</Label>
        <Select value={interval} onValueChange={(v)=> setInterval(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Trial Days</Label>
        <Input type="number" value={trialDays} onChange={(e)=> setTrialDays(Number(e.target.value))} />
      </div>
      <div className="sm:col-span-5 flex items-end">
        <Button type="submit" disabled={saving}>{saving?'Saving...':'Add Plan'}</Button>
      </div>
    </form>
  );
}


