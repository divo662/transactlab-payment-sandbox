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

const API_BASE = 'http://localhost:5000/api/v1/sandbox';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { apiCall } = useSandbox();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    } finally { setLoading(false); }
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

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Product catalog</h1>
        <Button onClick={()=> setShowCreate(s=>!s)}>{showCreate ? 'Close' : 'Create product'}</Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <Input placeholder="Search products" value={query} onChange={(e)=> setQuery(e.target.value)} className="max-w-sm" />
        <div className="flex items-center gap-2">
          <Button size="sm" variant={status==='all'?'default':'outline'} onClick={()=> setStatus('all')}>All</Button>
          <Button size="sm" variant={status==='active'?'default':'outline'} onClick={()=> setStatus('active')}>Active</Button>
          <Button size="sm" variant={status==='archived'?'default':'outline'} onClick={()=> setStatus('archived')}>Archived</Button>
        </div>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add a product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e)=> setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={form.description} onChange={(e)=> setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={creating}>{creating? 'Creating...':'Add product'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table-like list */}
      <Card>
        <CardHeader>
          <CardTitle>All products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:grid md:grid-cols-5 text-xs text-gray-500 px-4 pb-2">
            <div>Name</div>
            <div>Pricing</div>
            <div>Created</div>
            <div>Updated</div>
            <div>Actions</div>
          </div>
          <div className="divide-y border rounded">
            {filtered.map((p:any) => (
              <div key={p._id} className="p-4 grid grid-cols-1 md:grid-cols-5 items-center hover:bg-gray-50">
                <div className="cursor-pointer" onClick={()=> navigate(`/sandbox/products/${p._id}`)}>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.active !== false ? 'Active':'Archived'}</div>
                </div>
                <div className="text-sm text-gray-700 cursor-pointer" onClick={()=> navigate(`/sandbox/products/${p._id}`)}>
                  {pricingForProduct(p._id)}
                </div>
                <div className="text-sm text-gray-600 cursor-pointer" onClick={()=> navigate(`/sandbox/products/${p._id}`)}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600 cursor-pointer" onClick={()=> navigate(`/sandbox/products/${p._id}`)}>
                  {new Date(p.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProduct(p);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreActions(showMoreActions === p._id ? null : p._id);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {showMoreActions === p._id && (
                      <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg p-2 min-w-[150px] z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
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
                          className="w-full justify-start text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(p);
                          }}
                          disabled={deleting === p._id}
                        >
                          {deleting === p._id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
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
            {filtered.length===0 && !loading && <div className="p-6 text-sm text-gray-500 text-center">No data available</div>}
            {loading && <div className="p-6 text-sm text-gray-500 text-center">Loading...</div>}
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Edit Product</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div>
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={updating} className="flex-1">
                  {updating ? (
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
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold">Delete Product</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>"{productToDelete.name}"</strong>? 
                This action cannot be undone and will permanently remove the product and all its data.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> If this product has active plans, you'll need to delete or archive them first.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="destructive" 
                  onClick={confirmDeleteProduct}
                  disabled={deleting === productToDelete._id}
                  className="flex-1"
                >
                  {deleting === productToDelete._id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Product
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting === productToDelete._id}
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


