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

  if (loading) {
    return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-2">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-9 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 sm:p-6">
              <div className="h-5 bg-gray-200 rounded w-20 mb-4 animate-pulse"></div>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Invoice Skeleton */}
        <div className="border rounded-lg p-4 sm:p-6">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-3 animate-pulse"></div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading subscription details...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-3 sm:p-6 text-center">
        <div className="text-gray-500 mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Subscription not found</h2>
          <p className="text-sm text-gray-500 mb-4">The subscription you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline" onClick={() => navigate('/sandbox/subscriptions')} className="w-full sm:w-auto">
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  const amount = plan ? (plan.amount/100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00';
  const currency = plan?.currency || 'NGN';

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
            {sub.customerEmail}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            on {product?.name || 'Product'} ({plan ? `${currency} ${amount} / ${plan.interval}` : 'Plan'})
          </p>
        </div>
        <Button variant="outline" onClick={()=> navigate('/sandbox/subscriptions')} className="w-full sm:w-auto text-xs sm:text-sm">
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <div className="text-gray-500 text-xs">Started</div>
                <div className="break-words">{new Date(sub.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Next invoice</div>
                <div className="break-words">{currency} {amount} on {new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-gray-500 text-xs">Current period</div>
                <div className="break-words">{new Date(sub.currentPeriodStart).toLocaleDateString()} to {new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Status</div>
                <div className="break-words">{sub.status}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">ID</div>
                <div className="break-all font-mono text-xs">{sub.subscriptionId}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Product</div>
                <div className="break-words">{product?.name || sub.productId}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">Plan ID</div>
                <div className="break-all font-mono text-xs">{plan?._id || sub.planId}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xs sm:text-sm space-y-2">
              <div className="font-medium break-words">{product?.name || '-'} • {plan ? `${currency} ${amount} / ${plan.interval}` : '-'}</div>
              <div className="text-gray-500">Quantity: 1</div>
              <div className="text-gray-500">Total: {currency} {amount}</div>
              {plan && <div className="text-gray-500 break-all font-mono text-xs">Plan ID: {plan._id}</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 sm:mt-6">
        <Card>
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-sm sm:text-base">Upcoming invoice</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xs sm:text-sm text-gray-600 mb-3">This is a preview of the invoice that will be billed on {new Date(sub.currentPeriodEnd).toLocaleDateString()}.</div>
            
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm">
                <div className="font-medium">Description</div>
                <div className="font-medium">Qty</div>
                <div className="font-medium">Unit price</div>
                <div className="font-medium">Amount</div>
                <div className="break-words">{plan ? `${currency} ${amount} / ${plan.interval}` : '-'}</div>
                <div>1</div>
                <div>{currency} {amount}</div>
                <div>{currency} {amount}</div>
              </div>
            </div>

            {/* Mobile Card */}
            <div className="sm:hidden space-y-3">
              <div className="border rounded-lg p-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Description</span>
                    <span className="text-xs font-medium break-words">{plan ? `${currency} ${amount} / ${plan.interval}` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Quantity</span>
                    <span className="text-xs">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Unit price</span>
                    <span className="text-xs">{currency} {amount}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-xs font-medium">Total</span>
                    <span className="text-xs font-medium">{currency} {amount}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionDetail;


