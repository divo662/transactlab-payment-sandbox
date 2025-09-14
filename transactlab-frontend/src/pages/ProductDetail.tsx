import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, BarChart3, TrendingUp, Users, DollarSign, Settings, Edit, MoreHorizontal, X, Save, Loader2, Trash2, AlertTriangle, Upload, Image as ImageIcon, FileImage } from 'lucide-react';
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  // Edit states
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editProductForm, setEditProductForm] = useState({ name: '', description: '', image: '' });
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
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image upload helpers
  const validateImageFile = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      });
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPEG, PNG, WebP, or GIF image',
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  };

  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) return;
    
    if (!validateImageFile(file)) return;
    
    try {
      const imageData = await handleImageUpload(file);
      setEditProductForm(prev => ({ ...prev, image: imageData }));
      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to process image', 
        variant: 'destructive' 
      });
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageChange(files[0]);
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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
    finally { 
      setLoading(false); 
      setInitialLoading(false);
    }
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
      description: product.description || '',
      image: product.image || ''
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

  if (initialLoading) {
    return (
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
          </div>
          <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="border rounded-lg p-4 sm:p-6">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg min-h-[100px]">
                      <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 mt-2 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border rounded-lg p-4 sm:p-6">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 mt-2 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="border rounded-lg p-4 sm:p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading product details...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={()=> navigate('/sandbox/products')}
            className="w-fit text-xs sm:text-sm h-8 sm:h-9"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Back
          </Button>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-3">
                {product?.image && (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border"
                  />
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words">{product?.name || 'Product'}</h1>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1 break-words">{product?.description || 'No description'}</div>
                </div>
              </div>
              {product && (
                <Badge variant={product.active !== false ? 'default' : 'secondary'} className="w-fit text-xs">
                  {product.active !== false ? 'Active' : 'Archived'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleEditProduct}
          className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
        >
          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Edit Product
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-full min-w-max sm:w-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">Analytics</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">Pricing</TabsTrigger>
            <TabsTrigger value="api" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">API</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg min-h-[80px] sm:min-h-[100px]">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 break-words leading-tight">
                        {formatCurrency(analytics.mrr*100, plans[0]?.currency || 'NGN')}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 leading-tight">Monthly Recurring Revenue</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg min-h-[80px] sm:min-h-[100px]">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-words leading-tight">
                        {formatCurrency(analytics.drr*100, plans[0]?.currency || 'NGN')}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 leading-tight">Daily Recurring Revenue</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg min-h-[80px] sm:min-h-[100px] sm:col-span-2 lg:col-span-1">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 break-words leading-tight">
                        {formatCurrency(analytics.yrr*100, plans[0]?.currency || 'NGN')}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 leading-tight">Yearly Recurring Revenue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

               <Card>
                 <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
                   <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                     <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                     Subscription Summary
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                     <div className="p-3 sm:p-4 border rounded-lg">
                       <div className="text-2xl sm:text-3xl font-bold">{analytics.activeSubs}</div>
                       <div className="text-xs sm:text-sm text-gray-600">Active Subscriptions</div>
                     </div>
                     <div className="p-3 sm:p-4 border rounded-lg">
                       <div className="text-2xl sm:text-3xl font-bold">{plans.length}</div>
                       <div className="text-xs sm:text-sm text-gray-600">Available Plans</div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
            </div>

             <div className="space-y-4 sm:space-y-6">
               <Card>
                 <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
                   <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                     <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                     Add New Plan
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                   <CreatePlanInline productId={productId!} onCreated={load} />
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
                   <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                     <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                     Product Details
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                   <div className="space-y-3 sm:space-y-4">
                     <div>
                       <div className="text-xs sm:text-sm text-gray-500">Product ID</div>
                       <div className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">
                         {product?._id}
                       </div>
                     </div>
                     <div>
                       <div className="text-xs sm:text-sm text-gray-500">Created</div>
                       <div className="text-xs sm:text-sm">
                         {product?.createdAt ? new Date(product.createdAt).toLocaleDateString() : '—'}
                       </div>
                     </div>
                     <div>
                       <div className="text-xs sm:text-sm text-gray-500">Status</div>
                       <div className="text-xs sm:text-sm">
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
         <TabsContent value="analytics" className="mt-4 sm:mt-6">
           <div className="space-y-4 sm:space-y-6">
             <Card>
               <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
                 <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                   <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                   Revenue Analytics
                 </CardTitle>
               </CardHeader>
               <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                   <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg min-h-[100px] sm:min-h-[120px]">
                     <div className="flex flex-col h-full">
                       <div className="flex-1">
                         <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-blue-600 break-words leading-tight">
                           {formatCurrency(analytics.mrr*100, plans[0]?.currency || 'NGN')}
                         </div>
                         <div className="text-xs sm:text-sm text-blue-700 mt-1 sm:mt-2 leading-tight">Monthly Recurring Revenue</div>
                       </div>
                       <div className="flex justify-end mt-2">
                         <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 flex-shrink-0" />
                       </div>
                     </div>
                   </div>
                   <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg min-h-[100px] sm:min-h-[120px]">
                     <div className="flex flex-col h-full">
                       <div className="flex-1">
                         <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-green-600 break-words leading-tight">
                           {formatCurrency(analytics.drr*100, plans[0]?.currency || 'NGN')}
                         </div>
                         <div className="text-xs sm:text-sm text-green-700 mt-1 sm:mt-2 leading-tight">Daily Recurring Revenue</div>
                       </div>
                       <div className="flex justify-end mt-2">
                         <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 flex-shrink-0" />
                       </div>
                     </div>
                   </div>
                   <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg min-h-[100px] sm:min-h-[120px]">
                     <div className="flex flex-col h-full">
                       <div className="flex-1">
                         <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-purple-600 break-words leading-tight">
                           {formatCurrency(analytics.yrr*100, plans[0]?.currency || 'NGN')}
                         </div>
                         <div className="text-xs sm:text-sm text-purple-700 mt-1 sm:mt-2 leading-tight">Yearly Recurring Revenue</div>
                       </div>
                       <div className="flex justify-end mt-2">
                         <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600 flex-shrink-0" />
                       </div>
                     </div>
                   </div>
                   <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg min-h-[100px] sm:min-h-[120px]">
                     <div className="flex flex-col h-full">
                       <div className="flex-1">
                         <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-orange-600 break-words leading-tight">
                           {analytics.activeSubs}
                         </div>
                         <div className="text-xs sm:text-sm text-orange-700 mt-1 sm:mt-2 leading-tight">Active Subscriptions</div>
                       </div>
                       <div className="flex justify-end mt-2">
                         <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-600 flex-shrink-0" />
                       </div>
                     </div>
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card>
               <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
                 <CardTitle className="text-sm sm:text-lg">Plan Performance</CardTitle>
               </CardHeader>
               <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                 <div className="space-y-3 sm:space-y-4">
                   {plans.map((plan: any) => {
                     const planSubs = subscriptions.filter((s: any) => s.planId === plan._id && s.status !== 'canceled');
                     const revenue = (plan.amount / 100) * planSubs.length;
                     return (
                       <div key={plan._id} className="p-3 sm:p-4 border rounded-lg">
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                           <div className="flex-1 min-w-0">
                             <div className="font-medium text-xs sm:text-sm lg:text-base break-words">
                               {formatCurrency(plan.amount, plan.currency)} / {plan.interval}
                             </div>
                             <div className="text-xs text-gray-500 mt-1">
                               {plan.trialDays ? `${plan.trialDays} day trial` : 'No trial'}
                             </div>
                           </div>
                           <div className="text-left sm:text-right flex-shrink-0">
                             <div className="text-sm sm:text-base lg:text-lg font-semibold">
                               {planSubs.length} subscribers
                             </div>
                             <div className="text-xs text-gray-500">
                               {formatCurrency(revenue * 100, plan.currency)} MRR
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                   {plans.length === 0 && (
                     <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                       No plans created yet. Add a plan to see analytics.
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>
          </div>
        </TabsContent>

         {/* Pricing Tab */}
         <TabsContent value="pricing" className="mt-4 sm:mt-6">
           <div className="space-y-4 sm:space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
               <div>
                 <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Pricing Plans</h2>
                 <p className="text-xs sm:text-sm text-gray-500">Manage your product's pricing tiers</p>
               </div>
               <Button 
                 onClick={() => document.getElementById('add-plan-form')?.scrollIntoView({ behavior: 'smooth' })}
                 className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
               >
                 <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                 Add Plan
               </Button>
             </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Price</th>
                        <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Interval</th>
                        <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Trial</th>
                        <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Subscriptions</th>
                        <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Created</th>
                        <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Status</th>
                        <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan: any) => {
                        const count = subscriptions.filter((s: any) => s.planId === plan._id && s.status !== 'canceled').length;
                        return (
                          <tr key={plan._id} className="border-b hover:bg-gray-50">
                            <td className="p-2 sm:p-4">
                              <div className="font-medium text-xs sm:text-sm">{formatCurrency(plan.amount, plan.currency)}</div>
                            </td>
                            <td className="p-2 sm:p-4">
                              <Badge variant="outline" className="text-xs">{plan.interval}</Badge>
                            </td>
                            <td className="p-2 sm:p-4">
                              <span className="text-xs sm:text-sm">{plan.trialDays ? `${plan.trialDays} days` : '—'}</span>
                            </td>
                            <td className="p-2 sm:p-4">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="font-medium text-xs sm:text-sm">{count}</span>
                                <span className="text-xs text-gray-500">active</span>
                              </div>
                            </td>
                            <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">
                              {new Date(plan.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-2 sm:p-4">
                              <Badge variant={plan.active !== false ? 'default' : 'secondary'} className="text-xs">
                                {plan.active !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="p-2 sm:p-4">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPlan(plan)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePlan(plan)}
                                  disabled={deletingPlan === plan._id}
                                  className="text-red-600 hover:text-red-700 h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  {deletingPlan === plan._id ? (
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
                    <div className="text-center py-8 sm:py-12 text-gray-500 text-sm">
                      No pricing plans yet. Create your first plan to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card id="add-plan-form">
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
                <CardTitle className="text-sm sm:text-lg">Add New Plan</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <CreatePlanInline productId={productId!} onCreated={load} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="mt-4 sm:mt-6">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0 shadow-xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileImage className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditProductModal(false)}
                className="h-8 w-8 p-0 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-4 sm:p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-product-name" className="text-sm font-medium text-gray-700">
                  Product Name *
                </Label>
                <Input
                  id="edit-product-name"
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({...editProductForm, name: e.target.value})}
                  placeholder="Enter product name"
                  required
                  className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-product-description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="edit-product-description"
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({...editProductForm, description: e.target.value})}
                  placeholder="Enter product description"
                  rows={3}
                  className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Product Image</Label>
                {!editProductForm.image ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50 scale-105' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-blue-600 hover:text-blue-500">
                            Click to upload
                          </span>
                          {' '}or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, WebP, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img 
                          src={editProductForm.image} 
                          alt="Preview" 
                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setEditProductForm({ ...editProductForm, image: '' })}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-lg"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={openFileDialog}
                            className="text-sm h-9"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Change Image
                          </Button>
                          <p className="text-xs text-gray-500">
                            Current image will be replaced
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={updatingProduct} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm h-10 font-medium"
                >
                  {updatingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating Product...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditProductModal(false)}
                  disabled={updatingProduct}
                  className="text-sm h-10 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditPlanModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-base sm:text-lg font-semibold">Edit Plan</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditPlanModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleUpdatePlan} className="p-4 sm:p-6 space-y-4">
              <div>
                <Label htmlFor="edit-plan-amount" className="text-xs sm:text-sm">Amount</Label>
                <Input
                  id="edit-plan-amount"
                  type="text"
                  value={formatMoneyInput(editPlanForm.amount)}
                  onChange={(e) => setEditPlanForm({...editPlanForm, amount: parseMoneyInput(e.target.value)})}
                  placeholder="10,000"
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="edit-plan-currency" className="text-xs sm:text-sm">Currency</Label>
                <Select value={editPlanForm.currency} onValueChange={(v) => setEditPlanForm({...editPlanForm, currency: v})}>
                  <SelectTrigger className="text-xs sm:text-sm">
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
                <Label htmlFor="edit-plan-interval" className="text-xs sm:text-sm">Interval</Label>
                <Select value={editPlanForm.interval} onValueChange={(v) => setEditPlanForm({...editPlanForm, interval: v})}>
                  <SelectTrigger className="text-xs sm:text-sm">
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
                <Label htmlFor="edit-plan-trial" className="text-xs sm:text-sm">Trial Days</Label>
                <Input
                  id="edit-plan-trial"
                  type="number"
                  value={editPlanForm.trialDays}
                  onChange={(e) => setEditPlanForm({...editPlanForm, trialDays: Number(e.target.value)})}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" disabled={updatingPlan} className="flex-1 text-xs sm:text-sm h-9 sm:h-10">
                  {updatingPlan ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Update Plan
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditPlanModal(false)}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {showDeletePlanModal && planToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold">Delete Plan</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeletePlanModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Are you sure you want to delete this plan?
              </p>
              <div className="bg-gray-50 border rounded-lg p-3 mb-4">
                <div className="text-xs sm:text-sm">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(planToDelete.amount, planToDelete.currency)} / {planToDelete.interval}
                  </div>
                  <div className="text-gray-500">
                    {planToDelete.trialDays ? `${planToDelete.trialDays} day trial` : 'No trial period'}
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                This action cannot be undone and will permanently remove the plan and all its data.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <strong>Note:</strong> If this plan has active subscriptions, you'll need to cancel or pause them first.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  variant="destructive" 
                  onClick={confirmDeletePlan}
                  disabled={deletingPlan === planToDelete._id}
                  className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                >
                  {deletingPlan === planToDelete._id ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Delete Plan
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeletePlanModal(false)}
                  disabled={deletingPlan === planToDelete._id}
                  className="text-xs sm:text-sm h-9 sm:h-10"
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
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
      <div>
        <Label className="text-xs sm:text-sm">Amount</Label>
        <Input
          type="text"
          value={formatMoneyInput(amount)}
          onChange={(e)=> setAmount(parseMoneyInput(e.target.value))}
          placeholder="10,000"
          className="text-xs sm:text-sm"
        />
      </div>
      <div>
        <Label className="text-xs sm:text-sm">Currency</Label>
        <Select value={currency} onValueChange={(v)=> setCurrency(v)}>
          <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NGN">NGN</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs sm:text-sm">Interval</Label>
        <Select value={interval} onValueChange={(v)=> setInterval(v)}>
          <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
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
        <Label className="text-xs sm:text-sm">Trial Days</Label>
        <Input 
          type="number" 
          value={trialDays} 
          onChange={(e)=> setTrialDays(Number(e.target.value))} 
          className="text-xs sm:text-sm"
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-1">
        <Button 
          type="submit" 
          disabled={saving}
          className="w-full text-xs sm:text-sm h-9 sm:h-10"
        >
          {saving?'Saving...':'Add Plan'}
        </Button>
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


