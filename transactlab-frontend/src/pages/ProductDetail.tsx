import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, BarChart3, TrendingUp, Users, DollarSign, Settings, Edit, MoreHorizontal, X, Save, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ApiWorkbench from '@/components/dev/ApiWorkbench';

const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';

const ProductDetail: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  // Edit states
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editProductForm, setEditProductForm] = useState({ name: '', description: '' });
  const [updatingProduct, setUpdatingProduct] = useState(false);
  
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editPlanForm, setEditPlanForm] = useState({ 
    amount: 0, 
    currency: 'NGN', 
    interval: 'month', 
    trialDays: 0 
  });
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null);
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);

  const fetchJSON = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(url, { ...(options||{}), headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(options?.headers||{}) } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const load = async () => {
    try {
      setLoading(true);
      const [prods, plansRes, subsRes] = await Promise.all([
        fetchJSON(`${API_BASE}/products`),
        fetchJSON(`${API_BASE}/plans?productId=${productId}`),
        fetchJSON(`${API_BASE}/subscriptions`)
      ]);
      const found = (prods.data || []).find((p:any)=> p._id === productId);
      setProduct(found);
      setPlans(plansRes.data || []);
      setSubscriptions((subsRes.data || []).filter((s:any)=> s.productId === productId));
    } catch(e) { toast({ title:'Error', description:'Failed to load product', variant:'destructive' }); }
    finally { setLoading(false); }
  };

  const analytics = useMemo(() => {
    if (!plans || plans.length === 0) {
      return { mrr: 0, drr: 0, yrr: 0, activeSubs: 0 };
    }
    const planById: Record<string, any> = {};
    plans.forEach((p:any)=> { planById[p._id] = p; });
    let mrr = 0; // monthly recurring revenue
    let drr = 0; // daily recurring revenue
    let yrr = 0; // yearly recurring revenue
    let activeSubs = 0;
    const factorToMonth: Record<string, number> = {
      day: 30,
      week: 4.33,
      month: 1,
      quarter: 1/3,
      year: 1/12
    };
    subscriptions.forEach((s:any)=>{
      if (s.status === 'canceled') return;
      const p = planById[s.planId];
      if (!p) return;
      activeSubs += 1;
      const monthly = (p.amount/100) * (factorToMonth[p.interval] ?? 1);
      const daily = monthly / 30;
      const yearly = monthly * 12;
      mrr += monthly; drr += daily; yrr += yearly;
    });
    return { mrr, drr, yrr, activeSubs };
  }, [plans, subscriptions]);

  useEffect(()=> { void load(); }, [productId]);

  const handleEditProduct = () => {
    if (!product) return;
    setEditProductForm({ 
      name: product.name, 
      description: product.description || '' 
    });
    setShowEditProductModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    try {
      setUpdatingProduct(true);
      await fetchJSON(`${API_BASE}/products/${product._id}`, { 
        method: 'PUT', 
        body: JSON.stringify(editProductForm) 
      });
      setShowEditProductModal(false);
      await load();
      toast({ title: 'Product updated' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    } finally { 
      setUpdatingProduct(false); 
    }
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setEditPlanForm({ 
      amount: plan.amount / 100, // Convert from cents
      currency: plan.currency, 
      interval: plan.interval, 
      trialDays: plan.trialDays || 0 
    });
    setShowEditPlanModal(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    try {
      setUpdatingPlan(true);
      const numericAmount = typeof editPlanForm.amount === 'string' ? 
        Number(String(editPlanForm.amount).replace(/[^\d]/g, '')) : editPlanForm.amount;
      
      await fetchJSON(`${API_BASE}/plans/${editingPlan._id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ 
          amount: Math.round(numericAmount * 100), // Convert to cents
          currency: editPlanForm.currency, 
          interval: editPlanForm.interval, 
          trialDays: editPlanForm.trialDays 
        }) 
      });
      setShowEditPlanModal(false);
      setEditingPlan(null);
      await load();
      toast({ title: 'Plan updated' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update plan', variant: 'destructive' });
    } finally { 
      setUpdatingPlan(false); 
    }
  };

  const handleDeletePlan = (plan: any) => {
    setPlanToDelete(plan);
    setShowDeletePlanModal(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      setDeletingPlan(planToDelete._id);
      await fetchJSON(`${API_BASE}/plans/${planToDelete._id}`, { 
        method: 'DELETE'
      });
      await load();
      toast({ title: 'Plan deleted successfully' });
      setShowDeletePlanModal(false);
      setPlanToDelete(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete plan';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setDeletingPlan(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={()=> navigate('/sandbox/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{product?.name || 'Product'}</h1>
                {product && (
                  <Badge variant={product.active !== false ? 'default' : 'secondary'}>
                    {product.active !== false ? 'Active' : 'Archived'}
                  </Badge>
                )}
              </div>
              <div className="text-gray-500 mt-1">{product?.description || 'No description'}</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleEditProduct}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg min-h-[100px]">
                      <div className="text-xl lg:text-2xl font-bold text-blue-600 break-words leading-tight">
                        {formatCurrency(analytics.mrr*100, plans[0]?.currency || 'NGN')}
                      </div>
                      <div className="text-xs lg:text-sm text-gray-600 mt-2 leading-tight">Monthly Recurring Revenue</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg min-h-[100px]">
                      <div className="text-xl lg:text-2xl font-bold text-green-600 break-words leading-tight">
                        {formatCurrency(analytics.drr*100, plans[0]?.currency || 'NGN')}
                      </div>
                      <div className="text-xs lg:text-sm text-gray-600 mt-2 leading-tight">Daily Recurring Revenue</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg min-h-[100px]">
                      <div className="text-xl lg:text-2xl font-bold text-purple-600 break-words leading-tight">
                        {formatCurrency(analytics.yrr*100, plans[0]?.currency || 'NGN')}
                      </div>
                      <div className="text-xs lg:text-sm text-gray-600 mt-2 leading-tight">Yearly Recurring Revenue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Subscription Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{analytics.activeSubs}</div>
                      <div className="text-sm text-gray-600">Active Subscriptions</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{plans.length}</div>
                      <div className="text-sm text-gray-600">Available Plans</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CreatePlanInline productId={productId!} onCreated={load} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500">Product ID</div>
                      <div className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">
                        {product?._id}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Created</div>
                      <div className="text-sm">
                        {product?.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="text-sm">
                        {product?.active !== false ? 'Active' : 'Archived'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg min-h-[120px]">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-600 break-words leading-tight">
                          {formatCurrency(analytics.mrr*100, plans[0]?.currency || 'NGN')}
                        </div>
                        <div className="text-xs lg:text-sm text-blue-700 mt-2 leading-tight">Monthly Recurring Revenue</div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <TrendingUp className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg min-h-[120px]">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="text-2xl lg:text-3xl font-bold text-green-600 break-words leading-tight">
                          {formatCurrency(analytics.drr*100, plans[0]?.currency || 'NGN')}
                        </div>
                        <div className="text-xs lg:text-sm text-green-700 mt-2 leading-tight">Daily Recurring Revenue</div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <TrendingUp className="h-6 w-6 text-green-600 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg min-h-[120px]">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="text-2xl lg:text-3xl font-bold text-purple-600 break-words leading-tight">
                          {formatCurrency(analytics.yrr*100, plans[0]?.currency || 'NGN')}
                        </div>
                        <div className="text-xs lg:text-sm text-purple-700 mt-2 leading-tight">Yearly Recurring Revenue</div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <TrendingUp className="h-6 w-6 text-purple-600 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg min-h-[120px]">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="text-2xl lg:text-3xl font-bold text-orange-600 break-words leading-tight">
                          {analytics.activeSubs}
                        </div>
                        <div className="text-xs lg:text-sm text-orange-700 mt-2 leading-tight">Active Subscriptions</div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Users className="h-6 w-6 text-orange-600 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan: any) => {
                    const planSubs = subscriptions.filter((s: any) => s.planId === plan._id && s.status !== 'canceled');
                    const revenue = (plan.amount / 100) * planSubs.length;
                    return (
                      <div key={plan._id} className="p-4 border rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base break-words">
                              {formatCurrency(plan.amount, plan.currency)} / {plan.interval}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 mt-1">
                              {plan.trialDays ? `${plan.trialDays} day trial` : 'No trial'}
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <div className="text-base sm:text-lg font-semibold">
                              {planSubs.length} subscribers
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {formatCurrency(revenue * 100, plan.currency)} MRR
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {plans.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No plans created yet. Add a plan to see analytics.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Pricing Plans</h2>
                <p className="text-gray-500">Manage your product's pricing tiers</p>
              </div>
              <Button onClick={() => document.getElementById('add-plan-form')?.scrollIntoView({ behavior: 'smooth' })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Price</th>
                        <th className="text-left p-4 font-medium">Interval</th>
                        <th className="text-left p-4 font-medium">Trial</th>
                        <th className="text-left p-4 font-medium">Subscriptions</th>
                        <th className="text-left p-4 font-medium">Created</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan: any) => {
                        const count = subscriptions.filter((s: any) => s.planId === plan._id && s.status !== 'canceled').length;
                        return (
                          <tr key={plan._id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div className="font-medium">{formatCurrency(plan.amount, plan.currency)}</div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">{plan.interval}</Badge>
                            </td>
                            <td className="p-4">
                              {plan.trialDays ? `${plan.trialDays} days` : '—'}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{count}</span>
                                <span className="text-sm text-gray-500">active</span>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {new Date(plan.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <Badge variant={plan.active !== false ? 'default' : 'secondary'}>
                                {plan.active !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPlan(plan)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePlan(plan)}
                                  disabled={deletingPlan === plan._id}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  {deletingPlan === plan._id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {plans.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No pricing plans yet. Create your first plan to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card id="add-plan-form">
              <CardHeader>
                <CardTitle>Add New Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <CreatePlanInline productId={productId!} onCreated={load} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="mt-6">
          <ApiWorkbench examples={[
            { title: 'Get Product', method: 'GET', path: `/products/${productId}` },
            { title: 'Update Product', method: 'PUT', path: `/products/${productId}`, body: { name: 'Updated Product Name', description: 'Updated description' } },
            { title: 'Create Plan', method: 'POST', path: '/plans', body: { productId, amount: 10000, currency: 'NGN', interval: 'month', trialDays: 0 } },
            { title: 'List Plans', method: 'GET', path: `/plans?productId=${productId}` },
            { title: 'Create Subscription', method: 'POST', path: '/subscriptions', body: { customerEmail: 'customer@example.com', productId, planId: 'plan_xxx', chargeNow: true } },
            { title: 'List Subscriptions', method: 'GET', path: `/subscriptions?productId=${productId}` }
          ]} />
        </TabsContent>
      </Tabs>

      {/* Edit Product Modal */}
      {showEditProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Edit Product</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditProductModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div>
                <Label htmlFor="edit-product-name">Product Name *</Label>
                <Input
                  id="edit-product-name"
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({...editProductForm, name: e.target.value})}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-product-description">Description</Label>
                <Textarea
                  id="edit-product-description"
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({...editProductForm, description: e.target.value})}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={updatingProduct} className="flex-1">
                  {updatingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowEditProductModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditPlanModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Edit Plan</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditPlanModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4">
              <div>
                <Label htmlFor="edit-plan-amount">Amount</Label>
                <Input
                  id="edit-plan-amount"
                  type="text"
                  value={formatMoneyInput(editPlanForm.amount)}
                  onChange={(e) => setEditPlanForm({...editPlanForm, amount: parseMoneyInput(e.target.value)})}
                  placeholder="10,000"
                />
              </div>
              <div>
                <Label htmlFor="edit-plan-currency">Currency</Label>
                <Select value={editPlanForm.currency} onValueChange={(v) => setEditPlanForm({...editPlanForm, currency: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-plan-interval">Interval</Label>
                <Select value={editPlanForm.interval} onValueChange={(v) => setEditPlanForm({...editPlanForm, interval: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label htmlFor="edit-plan-trial">Trial Days</Label>
                <Input
                  id="edit-plan-trial"
                  type="number"
                  value={editPlanForm.trialDays}
                  onChange={(e) => setEditPlanForm({...editPlanForm, trialDays: Number(e.target.value)})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={updatingPlan} className="flex-1">
                  {updatingPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Plan
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowEditPlanModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {showDeletePlanModal && planToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold">Delete Plan</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeletePlanModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this plan?
              </p>
              <div className="bg-gray-50 border rounded-lg p-3 mb-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(planToDelete.amount, planToDelete.currency)} / {planToDelete.interval}
                  </div>
                  <div className="text-gray-500">
                    {planToDelete.trialDays ? `${planToDelete.trialDays} day trial` : 'No trial period'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone and will permanently remove the plan and all its data.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> If this plan has active subscriptions, you'll need to cancel or pause them first.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="destructive" 
                  onClick={confirmDeletePlan}
                  disabled={deletingPlan === planToDelete._id}
                  className="flex-1"
                >
                  {deletingPlan === planToDelete._id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Plan
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeletePlanModal(false)}
                  disabled={deletingPlan === planToDelete._id}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

function CreatePlanInline({ productId, onCreated }: { productId: string; onCreated: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number | string>(10000);
  const [currency, setCurrency] = useState('NGN');
  const [interval, setInterval] = useState('month');
  const [trialDays, setTrialDays] = useState(0);
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const numericAmount = typeof amount === 'string' ? Number(String(amount).replace(/[^\d]/g, '')) : amount;
      const res = await fetch(`${API_BASE}/plans`, { method:'POST', headers: { 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ productId, amount: Math.round(numericAmount*100), currency, interval, trialDays }) });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Plan created' });
      onCreated();
    } catch(e) { toast({ title:'Error', description:'Failed to create plan', variant:'destructive' }); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3">
      <div>
        <Label>Amount</Label>
        <Input
          type="text"
          value={formatMoneyInput(amount)}
          onChange={(e)=> setAmount(parseMoneyInput(e.target.value))}
          placeholder="10,000"
        />
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
      <div>
        <Button type="submit" disabled={saving}>{saving?'Saving...':'Add Plan'}</Button>
      </div>
    </form>
  );
}

function formatMoneyInput(v: number | string) {
  const num = typeof v === 'number' ? v : Number(String(v).replace(/[^\d]/g, ''));
  if (Number.isNaN(num)) return '';
  return num.toLocaleString('en-US');
}

function parseMoneyInput(v: string): number {
  const n = Number(v.replace(/[^\d]/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function formatCurrency(amountMinor: number, currency: string) {
  const value = (amountMinor / 100);
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}


