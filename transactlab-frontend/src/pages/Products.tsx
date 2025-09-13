import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Edit, MoreHorizontal, X, Save, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useSandbox } from '@/contexts/SandboxContext';

const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { apiCall } = useSandbox();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [status, setStatus] = useState<'all'|'active'|'archived'>('all');
  const [query, setQuery] = useState('');
  
  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [updating, setUpdating] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [prods, plansRes] = await Promise.all([
        apiCall('/products'),
        apiCall('/plans')
      ]);
      setProducts(prods.data || []);
      setPlans(plansRes.data || []);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally { 
      setLoading(false); 
      setInitialLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await apiCall('/products', { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', description: '' });
      setShowCreate(false);
      await load();
      toast({ title: 'Product created' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to create product', variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditForm({ name: product.name, description: product.description || '' });
    setShowEditModal(true);
    setShowMoreActions(null);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      setUpdating(true);
      await apiCall(`/products/${editingProduct._id}`, { 
        method: 'PUT', 
        body: JSON.stringify(editForm) 
      });
      setShowEditModal(false);
      setEditingProduct(null);
      await load();
      toast({ title: 'Product updated' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    } finally { 
      setUpdating(false); 
    }
  };

  const handleToggleProductStatus = async (product: any) => {
    try {
      await apiCall(`/products/${product._id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ active: product.active === false }) 
      });
      await load();
      toast({ title: 'Product status updated' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update product status', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    setShowMoreActions(null);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(productToDelete._id);
      await apiCall(`/products/${productToDelete._id}`, { 
        method: 'DELETE'
      });
      await load();
      toast({ title: 'Product deleted successfully' });
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete product';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const pricingForProduct = (productId: string) => {
    const p = plans.find((pl:any)=> pl.productId === productId && pl.active !== false);
    if (!p) return '—';
    const amt = (p.amount/100).toLocaleString('en-US', { minimumFractionDigits: 2 });
    return `${p.currency} ${amt} / ${p.interval}`;
  };

  const mrrForProduct = (productId: string) => {
    const prodPlans = plans.filter((pl:any)=> pl.productId === productId);
    const factorToMonth: Record<string, number> = { day: 30, week: 4.33, month: 1, quarter: 1/3, year: 1/12 };
    // Using approximate active counts not available on catalog; omitted here to keep it light
    return ''; // reserved for future table badge if needed
  };

  const filtered = useMemo(() => {
    return products
      .filter(p => status==='all' ? true : (status==='active' ? p.active !== false : p.active === false))
      .filter(p => query ? (p.name?.toLowerCase().includes(query.toLowerCase())) : true);
  }, [products, status, query]);

  if (initialLoading) {
    return (
      <div className="p-3 sm:p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Filter Bar Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="h-9 bg-gray-200 rounded w-full sm:max-w-sm animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>

        {/* Card Skeleton */}
        <div className="border rounded-lg p-4 sm:p-6">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading product catalog...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Product catalog</h1>
        <Button 
          onClick={()=> setShowCreate(s=>!s)}
          className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
        >
          {showCreate ? 'Close' : 'Create product'}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <Input 
          placeholder="Search products" 
          value={query} 
          onChange={(e)=> setQuery(e.target.value)} 
          className="w-full sm:max-w-sm text-xs sm:text-sm" 
        />
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant={status==='all'?'default':'outline'} 
            onClick={()=> setStatus('all')}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            All
          </Button>
          <Button 
            size="sm" 
            variant={status==='active'?'default':'outline'} 
            onClick={()=> setStatus('active')}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            Active
          </Button>
          <Button 
            size="sm" 
            variant={status==='archived'?'default':'outline'} 
            onClick={()=> setStatus('archived')}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            Archived
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
            <CardTitle className="text-sm sm:text-lg">Add a product</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <form onSubmit={onCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs sm:text-sm">Name</Label>
                <Input 
                  value={form.name} 
                  onChange={(e)=> setForm({ ...form, name: e.target.value })} 
                  required 
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Description</Label>
                <Input 
                  value={form.description} 
                  onChange={(e)=> setForm({ ...form, description: e.target.value })} 
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  disabled={creating}
                  className="w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
                >
                  {creating? 'Creating...':'Add product'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table-like list */}
      <Card>
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
          <CardTitle className="text-sm sm:text-lg">All products</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="hidden md:grid md:grid-cols-5 text-xs text-gray-500 px-2 sm:px-4 pb-2">
            <div>Name</div>
            <div>Pricing</div>
            <div>Created</div>
            <div>Updated</div>
            <div>Actions</div>
          </div>
          <div className="divide-y border rounded">
            {filtered.map((p:any) => (
              <div key={p._id} className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-5 items-center hover:bg-gray-50">
                <div className="cursor-pointer mb-2 md:mb-0" onClick={()=> navigate(`/sandbox/products/${p._id}`)}>
                  <div className="font-medium text-sm sm:text-base break-words">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.active !== false ? 'Active':'Archived'}</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-700 cursor-pointer mb-2 md:mb-0" onClick={()=> navigate(`/sandbox/products/${p._id}`)}>
                  {pricingForProduct(p._id)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 cursor-pointer mb-2 md:mb-0" onClick={()=> navigate(`/sandbox/products/${p._id}`)}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 cursor-pointer mb-2 md:mb-0" onClick={()=> navigate(`/sandbox/products/${p._id}`)}>
                  {new Date(p.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 justify-start md:justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProduct(p);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreActions(showMoreActions === p._id ? null : p._id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    {showMoreActions === p._id && (
                      <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg p-2 min-w-[140px] sm:min-w-[150px] z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs sm:text-sm h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleProductStatus(p);
                            setShowMoreActions(null);
                          }}
                        >
                          {p.active !== false ? 'Archive' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-red-600 hover:text-red-700 text-xs sm:text-sm h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(p);
                          }}
                          disabled={deleting === p._id}
                        >
                          {deleting === p._id ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length===0 && !loading && <div className="p-4 sm:p-6 text-xs sm:text-sm text-gray-500 text-center">No data available</div>}
            {loading && <div className="p-4 sm:p-6 text-xs sm:text-sm text-gray-500 text-center">Loading...</div>}
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-base sm:text-lg font-semibold">Edit Product</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-4 sm:p-6 space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-xs sm:text-sm">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Enter product name"
                  required
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Enter product description"
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" disabled={updating} className="flex-1 text-xs sm:text-sm h-9 sm:h-10">
                  {updating ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold">Delete Product</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Are you sure you want to delete <strong>"{productToDelete.name}"</strong>? 
                This action cannot be undone and will permanently remove the product and all its data.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <strong>Note:</strong> If this product has active plans, you'll need to delete or archive them first.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteProduct}
                  disabled={deleting === productToDelete._id}
                  className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                >
                  {deleting === productToDelete._id ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Delete Product
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting === productToDelete._id}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close more actions */}
      {showMoreActions && (
        <div 
          className="fixed inset-0 bg-transparent z-5" 
          onClick={() => setShowMoreActions(null)}
        />
      )}
    </div>
  );
};

export default Products;


