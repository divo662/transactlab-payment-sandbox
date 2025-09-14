import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Edit, MoreHorizontal, X, Save, Loader2, Trash2, AlertTriangle, Upload, Image as ImageIcon, FileImage } from 'lucide-react';
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
  const [form, setForm] = useState({ name: '', description: '', image: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [status, setStatus] = useState<'all'|'active'|'archived'>('all');
  const [query, setQuery] = useState('');
  
  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', image: '' });
  const [updating, setUpdating] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const [editDragActive, setEditDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to check if image is from Cloudinary
  const isCloudinaryImage = (imageUrl: string): boolean => {
    return imageUrl && imageUrl.includes('cloudinary.com');
  };

  // Helper function to check if image is from local uploads
  const isLocalImage = (imageUrl: string): boolean => {
    return imageUrl && imageUrl.includes('/uploads/');
  };

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
        // Ensure we have a proper base64 data URL
        if (result && result.startsWith('data:image/')) {
          resolve(result);
        } else {
          reject(new Error('Invalid image format'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (file: File | null, isEdit: boolean = false) => {
    if (!file) return;
    
    if (!validateImageFile(file)) return;
    
    try {
      const imageData = await handleImageUpload(file);
      if (isEdit) {
        setEditForm(prev => ({ ...prev, image: imageData }));
      } else {
        setForm(prev => ({ ...prev, image: imageData }));
      }
      toast({
        title: 'Image ready',
        description: 'Image processed and ready to upload'
      });
    } catch (error) {
      console.error('Image processing error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to process image file', 
        variant: 'destructive' 
      });
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent, isEdit: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEdit) {
      setEditDragActive(true);
    } else {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, isEdit: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEdit) {
      setEditDragActive(false);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, isEdit: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isEdit) {
      setEditDragActive(false);
    } else {
      setDragActive(false);
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageChange(files[0], isEdit);
    }
  };

  const openFileDialog = (isEdit: boolean = false) => {
    if (isEdit && editFileInputRef.current) {
      editFileInputRef.current.click();
    } else if (!isEdit && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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
      
      // Prepare the data to send
      const productData = {
        name: form.name,
        description: form.description,
        image: form.image || null // Send null if no image
      };
      
      const response = await apiCall('/products', { 
        method: 'POST', 
        body: JSON.stringify(productData) 
      });
      
      if (response.success) {
        setForm({ name: '', description: '', image: '' });
        setShowCreate(false);
        await load();
        toast({ 
          title: 'Product created', 
          description: 'Product created successfully with image uploaded' 
        });
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    } catch (e) {
      console.error('Product creation error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to create product';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally { 
      setCreating(false); 
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditForm({ 
      name: product.name, 
      description: product.description || '', 
      image: product.image || '' 
    });
    setShowEditModal(true);
    setShowMoreActions(null);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      setUpdating(true);
      
      // Prepare the data to send
      const updateData = {
        name: editForm.name,
        description: editForm.description,
        image: editForm.image || null // Send null if no image (will delete existing)
      };
      
      const response = await apiCall(`/products/${editingProduct._id}`, { 
        method: 'PUT', 
        body: JSON.stringify(updateData) 
      });
      
      if (response.success) {
        setShowEditModal(false);
        setEditingProduct(null);
        await load();
        toast({ 
          title: 'Product updated', 
          description: 'Product updated successfully with image changes applied' 
        });
      } else {
        throw new Error(response.message || 'Failed to update product');
      }
    } catch (e) {
      console.error('Product update error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to update product';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
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
            <form onSubmit={onCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>
              
              <div>
                <Label className="text-xs sm:text-sm">Product Image</Label>
                {!form.image ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={(e) => handleDrag(e, false)}
                    onDragLeave={(e) => handleDragLeave(e, false)}
                    onDragOver={(e) => handleDrag(e, false)}
                    onDrop={(e) => handleDrop(e, false)}
                    onClick={() => openFileDialog(false)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">
                          Click to upload
                        </span>
                        {' '}or drag and drop
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WebP, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img 
                        src={form.image} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setForm({ ...form, image: '' });
                          toast({
                            title: 'Image removed',
                            description: 'Image will be removed from the product'
                          });
                        }}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openFileDialog(false)}
                      className="text-xs h-8"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Change Image
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null, false)}
                  className="hidden"
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
                  <div className="flex items-center gap-2">
                    {p.image && (
                      <div className="relative">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="w-8 h-8 object-cover rounded border"
                        />
                        {isCloudinaryImage(p.image) && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" 
                               title="Image stored in Cloudinary" />
                        )}
                        {isLocalImage(p.image) && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white" 
                               title="Image stored locally" />
                        )}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm sm:text-base break-words">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.active !== false ? 'Active':'Archived'}</div>
                    </div>
                  </div>
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
                onClick={() => setShowEditModal(false)}
                className="h-8 w-8 p-0 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-4 sm:p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                  Product Name *
                </Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Enter product name"
                  required
                  className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Enter product description"
                  rows={3}
                  className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Product Image</Label>
                {!editForm.image ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                      editDragActive 
                        ? 'border-blue-500 bg-blue-50 scale-105' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={(e) => handleDrag(e, true)}
                    onDragLeave={(e) => handleDragLeave(e, true)}
                    onDragOver={(e) => handleDrag(e, true)}
                    onDrop={(e) => handleDrop(e, true)}
                    onClick={() => openFileDialog(true)}
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
                          src={editForm.image} 
                          alt="Preview" 
                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                        />
                        {isCloudinaryImage(editForm.image) && (
                          <div className="absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full border border-white" 
                               title="Currently stored in Cloudinary" />
                        )}
                        {isLocalImage(editForm.image) && (
                          <div className="absolute top-1 left-1 w-2 h-2 bg-blue-500 rounded-full border border-white" 
                               title="Currently stored locally" />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setEditForm({ ...editForm, image: '' });
                            toast({
                              title: 'Image removed',
                              description: 'Image will be removed when you save'
                            });
                          }}
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
                            onClick={() => openFileDialog(true)}
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
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null, true)}
                  className="hidden"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={updating} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm h-10 font-medium"
                >
                  {updating ? (
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
                  onClick={() => setShowEditModal(false)}
                  disabled={updating}
                  className="text-sm h-10 border-gray-300 hover:bg-gray-50"
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


