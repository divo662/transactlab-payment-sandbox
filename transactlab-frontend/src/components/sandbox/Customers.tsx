import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Pagination from '@/components/ui/pagination';
import { Plus, User, Mail, Phone, MapPin, Building } from 'lucide-react';
import { useSandbox } from '@/contexts/SandboxContext';

// Simple fetch via SandboxContext endpoints isn't defined yet for customers,
// so we will call the REST endpoint directly using the auth token like other calls.

const Customers: React.FC = () => {
  const { toast } = useToast();
  const { apiCall } = useSandbox();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'NG'
    },
    description: ''
  });

  const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';
  const fetchCustomers = async (page: number = 1) => {
    try {
      setLoading(true);
      const json = await apiCall(`/customers?page=${page}&limit=10`);
      const list = Array.isArray(json?.data) ? json.data : [];
      setCustomers(list);
      
      // Update pagination info
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchCustomers(page);
  };

  const createCustomer = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem('accessToken');
      
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const result = await res.json();
      toast({
        title: 'Success',
        description: 'Customer created successfully'
      });
      
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'NG'
        },
        description: ''
      });
      
      await fetchCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create customer',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => { void fetchCustomers(); }, []);

  const fmtMoney = (a:number,c:string)=> new Intl.NumberFormat('en-US',{style:'currency',currency:c||'NGN'}).format((a||0)/100);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>

        {/* Card Skeleton */}
        <div className="border rounded-lg p-4 sm:p-6">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-4"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="bg-gray-50 px-3 py-2 rounded">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading customers...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Customers</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto text-xs sm:text-sm">
                <Plus className="h-3 h-4 w-3 w-4 mr-2" />
                Create Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Create New Customer
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-lg font-medium">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="name" className="text-xs sm:text-sm">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="John Doe"
                        required
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs sm:text-sm">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@example.com"
                        required
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+234 800 000 0000"
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country" className="text-xs sm:text-sm">Country</Label>
                      <Select value={formData.address.country} onValueChange={(value) => setFormData({...formData, address: {...formData.address, country: value}})}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NG">Nigeria</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="IT">Italy</SelectItem>
                          <SelectItem value="ES">Spain</SelectItem>
                          <SelectItem value="NL">Netherlands</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-lg font-medium flex items-center gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    Address Information
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="line1" className="text-xs sm:text-sm">Address Line 1</Label>
                      <Input
                        id="line1"
                        value={formData.address.line1}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, line1: e.target.value}})}
                        placeholder="123 Main Street"
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="line2" className="text-xs sm:text-sm">Address Line 2</Label>
                      <Input
                        id="line2"
                        value={formData.address.line2}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, line2: e.target.value}})}
                        placeholder="Apartment, suite, etc."
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="city" className="text-xs sm:text-sm">City</Label>
                        <Input
                          id="city"
                          value={formData.address.city}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                          placeholder="Lagos"
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-xs sm:text-sm">State/Province</Label>
                        <Input
                          id="state"
                          value={formData.address.state}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                          placeholder="Lagos State"
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode" className="text-xs sm:text-sm">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={formData.address.postalCode}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, postalCode: e.target.value}})}
                          placeholder="100001"
                          className="text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-sm sm:text-lg font-medium flex items-center gap-2">
                    <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                    Additional Information
                  </h3>
                  <div>
                    <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Additional notes about this customer..."
                      rows={3}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto text-xs sm:text-sm">
                    Cancel
                  </Button>
                  <Button onClick={createCustomer} disabled={creating || !formData.name || !formData.email} className="w-full sm:w-auto text-xs sm:text-sm">
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Customer'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => void fetchCustomers()} className="w-full sm:w-auto text-xs sm:text-sm">
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3 sm:pb-6">
          <CardTitle className="text-xs sm:text-sm">Sandbox Customers</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
          {customers.map((c:any)=> {
            // Calculate totals by currency for proper display
            const currencyTotals = c.transactionsByCurrency || [];
            const hasMultipleCurrencies = currencyTotals.length > 1;
            
            return (
              <div 
                key={c._id || c.customerId} 
                className="border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                onClick={() => navigate(`/sandbox/customers/${c._id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-2">
                  <div className="space-y-1 sm:space-y-0.5 min-w-0 flex-1">
                    <div className="font-medium text-left text-sm sm:text-base truncate">
                      {c.name || c.email}
                    </div>
                    <div className="text-muted-foreground text-xs sm:text-sm truncate">{c.email}</div>
                    {c.phone && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{c.phone}</span>
                      </div>
                    )}
                    {c.address?.city && c.address?.state && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{c.address.city}, {c.address.state}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-left sm:text-right mt-2 sm:mt-0">
                    {hasMultipleCurrencies ? (
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {c.totalTransactions || 0} transactions
                        <div className="text-xs mt-1">Multiple currencies</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-sm sm:text-base">
                          {currencyTotals.length > 0 
                            ? fmtMoney(currencyTotals[0].total, currencyTotals[0].currency)
                            : fmtMoney(0, c.currency)
                          }
                        </div>
                        <div className="text-muted-foreground text-xs sm:text-sm">{c.totalTransactions || 0} transactions</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Always show transactions by currency for clarity */}
                {currencyTotals.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-2">Transactions by Currency:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currencyTotals.map((tx: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 px-2 sm:px-3 py-2 rounded">
                          <div className="text-xs sm:text-sm font-medium truncate">
                            {fmtMoney(tx.total, tx.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tx.count} {tx.count === 1 ? 'transaction' : 'transactions'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {customers.length===0 && !loading && (
            <div className="text-center py-6 sm:py-8">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm text-muted-foreground">No customers yet.</p>
            </div>
          )}
        </CardContent>
        
        {/* Pagination */}
        {customers.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={handlePageChange}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        )}
      </Card>
    </div>
  );
};

export default Customers;
