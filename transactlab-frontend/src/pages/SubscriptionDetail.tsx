import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';

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
      // Use the new subscription detail endpoint
      const subRes = await fetchJSON(`${API_BASE}/subscriptions/${subscriptionId}`);
      setSub(subRes.data);
      
      if (subRes.data) {
        // The backend now returns populated data, so we don't need to fetch separately
        setProduct({ name: subRes.data.planName, description: subRes.data.planDescription });
        setPlan({ 
          amount: subRes.data.planAmount, 
          currency: subRes.data.planCurrency, 
          interval: subRes.data.planInterval 
        });
      }
    } catch (e) {
      console.error('Error loading subscription:', e);
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


