import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_BASE = 'http://localhost:5000/api/v1/sandbox';

const SubscriptionDetail: React.FC = () => {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [sub, setSub] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchJSON = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(url, { ...(options||{}), headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(options?.headers||{}) } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const load = async () => {
    try {
      setLoading(true);
      const subs = await fetchJSON(`${API_BASE}/subscriptions`);
      const found = (subs.data || []).find((s:any)=> s._id === subscriptionId);
      setSub(found);
      if (found) {
        const [productsRes, plans] = await Promise.all([
          fetchJSON(`${API_BASE}/products`),
          fetchJSON(`${API_BASE}/plans?productId=${found.productId}`)
        ]);
        const prod = (productsRes.data || []).find((p:any)=> p._id === found.productId);
        setProduct(prod);
        const p = (plans.data || []).find((pl:any)=> pl._id === found.planId);
        setPlan(p);
      }
    } catch (e) {
      // ignore simple errors
    } finally { setLoading(false); }
  };

  useEffect(()=>{ void load(); }, [subscriptionId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!sub) return <div className="p-6">Subscription not found</div>;

  const amount = plan ? (plan.amount/100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00';
  const currency = plan?.currency || 'NGN';

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{sub.customerEmail} on {product?.name || 'Product'} ({plan ? `${currency} ${amount} / ${plan.interval}` : 'Plan'})</h1>
        <Button variant="outline" onClick={()=> navigate('/sandbox/subscriptions')}>Back</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Started</div>
                <div>{new Date(sub.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Next invoice</div>
                <div>{currency} {amount} on {new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Current period</div>
                <div>{new Date(sub.currentPeriodStart).toLocaleDateString()} to {new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div>{sub.status}</div>
              </div>
              <div>
                <div className="text-gray-500">ID</div>
                <div>{sub.subscriptionId}</div>
              </div>
              <div>
                <div className="text-gray-500">Product</div>
                <div>{product?.name || sub.productId}</div>
              </div>
              <div>
                <div className="text-gray-500">Plan ID</div>
                <div>{plan?._id || sub.planId}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="font-medium">{product?.name || '-'} • {plan ? `${currency} ${amount} / ${plan.interval}` : '-'}</div>
              <div className="text-gray-500">Quantity: 1</div>
              <div className="text-gray-500">Total: {currency} {amount}</div>
              {plan && <div className="text-gray-500">Plan ID: {plan._id}</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader><CardTitle>Upcoming invoice</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">This is a preview of the invoice that will be billed on {new Date(sub.currentPeriodEnd).toLocaleDateString()}.</div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
              <div>Description</div><div>Qty</div><div>Unit price</div><div>Amount</div>
              <div>{plan ? `${currency} ${amount} / ${plan.interval}` : '-'}</div><div>1</div><div>{currency} {amount}</div><div>{currency} {amount}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionDetail;


