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
import Pagination from '@/components/ui/Pagination';
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

  const API_BASE = 'http://localhost:5000/api/v1/sandbox';
  const fetchCustomers = async (page: number = 1) => {
    try {
      setLoading(true);
      console.log('Fetching customers with token:', 'exists');
      
      const json = await apiCall(`/customers?page=${page}&limit=10`);
      console.log('Customers API response:', json);
      
      const list = Array.isArray(json?.data) ? json.data : [];
      console.log('Processed customers list:', list);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="flex gap-2">
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Create New Customer
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={formData.address.country} onValueChange={(value) => setFormData({...formData, address: {...formData.address, country: value}})}>
                        <SelectTrigger>
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
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="line1">Address Line 1</Label>
                      <Input
                        id="line1"
                        value={formData.address.line1}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, line1: e.target.value}})}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <Label htmlFor="line2">Address Line 2</Label>
                      <Input
                        id="line2"
                        value={formData.address.line2}
                        onChange={(e) => setFormData({...formData, address: {...formData.address, line2: e.target.value}})}
                        placeholder="Apartment, suite, etc."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.address.city}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                          placeholder="Lagos"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          value={formData.address.state}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                          placeholder="Lagos State"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={formData.address.postalCode}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, postalCode: e.target.value}})}
                          placeholder="100001"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Additional Information
                  </h3>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Additional notes about this customer..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createCustomer} disabled={creating || !formData.name || !formData.email}>
                    {creating ? 'Creating...' : 'Create Customer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => void fetchCustomers()}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Sandbox Customers</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {customers.map((c:any)=> {
            // Calculate totals by currency for proper display
            const currencyTotals = c.transactionsByCurrency || [];
            const hasMultipleCurrencies = currencyTotals.length > 1;
            
            return (
              <div key={c._id || c.customerId} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                <div className="space-y-0.5">
                  <button
                    onClick={() => navigate(`/sandbox/customers/${c._id}`)}
                    className="font-medium text-left hover:text-[#0a164d] transition-colors cursor-pointer"
                  >
                    {c.name || c.email}
                  </button>
                  <div className="text-muted-foreground text-sm">{c.email}</div>
                  {c.phone && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {c.phone}
                    </div>
                  )}
                  {c.address?.city && c.address?.state && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {c.address.city}, {c.address.state}
                    </div>
                  )}
                </div>
                  <div className="text-right">
                    {hasMultipleCurrencies ? (
                      <div className="text-sm text-muted-foreground">
                        {c.totalTransactions || 0} transactions
                        <div className="text-xs mt-1">Multiple currencies</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold">
                          {currencyTotals.length > 0 
                            ? fmtMoney(currencyTotals[0].total, currencyTotals[0].currency)
                            : fmtMoney(0, c.currency)
                          }
                        </div>
                        <div className="text-muted-foreground text-sm">{c.totalTransactions || 0} transactions</div>
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
                        <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                          <div className="text-sm font-medium">
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
          {customers.length===0 && !loading && <p className="text-sm text-muted-foreground">No customers yet.</p>}
          {loading && <p className="text-sm text-muted-foreground">Loading customers...</p>}
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
