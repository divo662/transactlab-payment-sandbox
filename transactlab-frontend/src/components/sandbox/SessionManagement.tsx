import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSandbox } from '@/contexts/SandboxContext';
import { 
  Copy, 
  CreditCard, 
  DollarSign,
  RefreshCw, 
  AlertTriangle, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ExternalLink,
  Plus,
  Settings,
  TrendingUp,
  Users,
  Activity,
  Loader2,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const onlyDigits = (v: string) => v.replace(/\D+/g, '');
const formatCard = (v: string) => onlyDigits(v).slice(0,16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
const formatMM = (v: string) => {
  const digits = onlyDigits(v);
  if (digits.length === 0) return '';
  // Allow user to type '1'..'12' naturally, only clamp when 2 digits supplied
  if (digits.length === 1) {
    const n = parseInt(digits, 10);
    if (isNaN(n) || n <= 0) return '';
    if (n > 1) return digits; // 2..9 allowed as single digit temporarily
    return digits; // '1' allowed; next key can form 10-12
  }
  let mm = parseInt(digits.slice(0, 2), 10);
  if (isNaN(mm) || mm <= 0) mm = 1;
  if (mm > 12) mm = 12;
  return mm.toString().padStart(2,'0');
};
const formatYY = (v: string) => onlyDigits(v).slice(0,2);
const formatCVV = (v: string) => onlyDigits(v).slice(0,4);

// Amount formatting functions
const formatAmount = (value: string) => {
  // Remove all non-digit characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, '');
  
  // Handle multiple decimal points - keep only the first one
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // If it's just a decimal point, return it
  if (cleanValue === '.') return '.';
  
  // If it starts with decimal point, add 0
  if (cleanValue.startsWith('.')) return '0' + cleanValue;
  
  // Split by decimal point
  const [integerPart, decimalPart] = parts;
  
  // Format integer part with commas
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // If there's a decimal part, add it back
  if (decimalPart !== undefined) {
    return formattedInteger + '.' + decimalPart;
  }
  
  return formattedInteger;
};

const parseAmount = (formattedValue: string) => {
  // Remove commas and return the numeric value
  return formattedValue.replace(/,/g, '');
};

const SessionManagement: React.FC = () => {
  const { getRecentSessions, createSession, processPayment, createCustomerWithSession } = useSandbox();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [form, setForm] = useState({ amount: '', currency: 'NGN', description: '', customerEmail: '', customerName: '', method: 'all' });
  const [quick, setQuick] = useState({ email: '', name: '', amount: '', currency: 'NGN', description: '', method: 'all' });
  const [pay, setPay] = useState({ sessionId: '', cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    pendingSessions: 0,
    totalAmount: 0,
    successRate: 0
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
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

  const normalizeSessions = (res: any) => Array.isArray(res?.data) ? res.data : (res?.data?.sessions || []);

  const calculateStats = (sessionsData: any[]) => {
    const totalSessions = sessionsData.length;
    const completedSessions = sessionsData.filter(s => s.status === 'completed').length;
    const pendingSessions = sessionsData.filter(s => s.status === 'pending').length;
    const totalAmount = sessionsData.reduce((sum, s) => sum + (s.amount || 0), 0);
    const successRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    
    setStats({
      totalSessions,
      completedSessions,
      pendingSessions,
      totalAmount,
      successRate
    });
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getRecentSessions();
      const sessionsData = normalizeSessions(res);
      setSessions(sessionsData);
      calculateStats(sessionsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
      
      // Parse API error response to extract the actual error message
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('Failed to fetch')) {
        friendlyMessage = 'Unable to connect to server. Please check your connection.';
      }
      
      setError(friendlyMessage);
      toast({ 
        title: 'Error', 
        description: friendlyMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <Pause className="w-4 h-4 text-gray-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status?.toLowerCase()) {
      case 'completed':
        return `${baseClasses} text-green-800 bg-green-100`;
      case 'pending':
        return `${baseClasses} text-yellow-800 bg-yellow-100`;
      case 'failed':
        return `${baseClasses} text-red-800 bg-red-100`;
      case 'cancelled':
        return `${baseClasses} text-gray-800 bg-gray-100`;
      case 'expired':
        return `${baseClasses} text-orange-800 bg-orange-100`;
      default:
        return `${baseClasses} text-gray-800 bg-gray-100`;
    }
  };

  const handleSessionClick = (session: any) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied to clipboard', description: 'Session ID copied successfully' });
    });
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/v1/sandbox/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      } else {
        console.error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/v1/sandbox/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCustomerForm)
      });

      if (response.ok) {
        const data = await response.json();
        toast({ 
          title: 'Success', 
          description: 'Customer created successfully' 
        });
        setShowCreateCustomerModal(false);
        setNewCustomerForm({
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
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create customer');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create customer',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    void fetchSessions(); 
    void fetchCustomers();
  }, []);

  const onQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const payload = {
        email: quick.email,
        name: quick.name || undefined,
        amount: Math.round(parseFloat(parseAmount(quick.amount)) * 100),
        currency: quick.currency,
        description: quick.description,
        paymentConfig: quick.method === 'all' ? undefined : { allowedPaymentMethods: [quick.method] },
      } as any;
      const res = await createCustomerWithSession(payload);
      if (res?.success) {
        toast({ title: 'Session ready', description: 'Redirecting to checkout…' });
        const pm = quick.method === 'all' ? '' : `?pm=${encodeURIComponent(quick.method)}`;
        window.location.href = `/checkout/${res.data.sessionId}${pm}`;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      
      // Parse API error response to extract the actual error message
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('Failed to fetch')) {
        friendlyMessage = 'Unable to connect to server. Please check your connection.';
      }
      
      setError(friendlyMessage);
      toast({ 
        title: 'Error', 
        description: friendlyMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await createSession({
        amount: Math.round(parseFloat(parseAmount(form.amount)) * 100),
        currency: form.currency,
        description: form.description,
        customerEmail: form.customerEmail,
        customerName: form.customerName || undefined,
        ...(form.method === 'all' ? {} : { paymentConfig: { allowedPaymentMethods: [form.method] } })
      } as any);
      if (res?.success) { 
        toast({ title: 'Session created' }); 
        setForm({ amount:'', currency:'NGN', description:'', customerEmail:'', customerName: '', method: 'all' }); 
        await fetchSessions(); 
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      
      // Parse API error response to extract the actual error message
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('Failed to fetch')) {
        friendlyMessage = 'Unable to connect to server. Please check your connection.';
      }
      
      setError(friendlyMessage);
      toast({ 
        title: 'Error', 
        description: friendlyMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const onPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pay.sessionId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await processPayment(pay.sessionId, { paymentMethod: 'card', cardDetails: { number: onlyDigits(pay.cardNumber), expiryMonth: pay.expiryMonth, expiryYear: pay.expiryYear, cvv: pay.cvv } });
      if (res?.success) { 
        toast({ title: `Payment ${res.data.status}` }); 
        setPay({ sessionId:'', cardNumber:'', expiryMonth:'', expiryYear:'', cvv:'' }); 
        await fetchSessions(); 
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      
      // Parse API error response to extract the actual error message
      let friendlyMessage = errorMessage;
      try {
        if (errorMessage.includes('API Error: 400')) {
          // Extract JSON from the error message
          const jsonMatch = errorMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            if (errorData.message === 'Session expired') {
              friendlyMessage = 'This session has expired. Please create a new session to process payment.';
            } else if (errorData.message === 'Session cannot be processed') {
              friendlyMessage = 'Session not found or cannot be processed. Please check the session ID.';
            } else {
              friendlyMessage = errorData.message || errorMessage;
            }
          }
        } else if (errorMessage.includes('Failed to fetch')) {
          friendlyMessage = 'Unable to connect to server. Please check your connection.';
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
        friendlyMessage = errorMessage;
      }
      
      setError(friendlyMessage);
      
      toast({ 
        title: 'Payment Error', 
        description: friendlyMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copy = (t: string) => navigator.clipboard.writeText(t).then(()=>toast({ title: 'Copied' }));

  const fmtMoney = (a:number,c:string)=> new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format((a||0)/100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600 mt-1">Create, manage, and monitor checkout sessions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => void fetchSessions()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
            Refresh
          </Button>
          <Button onClick={() => setActiveTab('create')} className="bg-[#0a164d] hover:bg-[#0a164d]/90">
            <Plus className="w-4 h-4 mr-2"/>
            New Session
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="font-medium">Error:</span>
            <span className="ml-2">{error}</span>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">All Sessions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  Quick Charge
                </CardTitle>
                <p className="text-sm text-gray-600">Create a session and redirect to checkout instantly</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={onQuick} className="space-y-4">
                  <div>
                    <Label>Select Customer *</Label>
                    <div className="flex space-x-2">
                      <Select 
                        value={selectedCustomer} 
                        onValueChange={(value) => {
                          if (value === 'create_new') {
                            setShowCreateCustomerModal(true);
                          } else {
                            setSelectedCustomer(value);
                            const customer = customers.find(c => c._id === value);
                            if (customer) {
                              setQuick(v => ({
                                ...v,
                                email: customer.email,
                                name: customer.name
                              }));
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose existing customer or create new" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="create_new">
                            <div className="flex items-center">
                              <Plus className="w-4 h-4 mr-2" />
                              Create New Customer
                            </div>
                          </SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer._id} value={customer._id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.name}</span>
                                <span className="text-xs text-gray-500">{customer.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Customer Name</Label>
                      <Input 
                        value={quick.name} 
                        onChange={e=>setQuick(v=>({...v,name:e.target.value}))} 
                        placeholder="John Doe" 
                        disabled={selectedCustomer && selectedCustomer !== 'create_new'}
                      />
                    </div>
                    <div>
                      <Label>Email Address *</Label>
                      <Input 
                        type="email" 
                        value={quick.email} 
                        onChange={e=>setQuick(v=>({...v,email:e.target.value}))} 
                        required 
                        disabled={selectedCustomer && selectedCustomer !== 'create_new'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Amount *</Label>
                      <Input 
                        type="text" 
                        value={quick.amount} 
                        onChange={e=>setQuick(v=>({...v,amount:formatAmount(e.target.value)}))} 
                        placeholder="1,000.00"
                        required 
                      />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select value={quick.currency} onValueChange={v=>setQuick(f=>({...f,currency:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NGN">NGN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Allowed Payment Method</Label>
                    <Select value={quick.method} onValueChange={v=>setQuick(f=>({...f, method:v}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All methods</SelectItem>
                        <SelectItem value="card">Card only</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer only</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Input 
                      value={quick.description} 
                      onChange={e=>setQuick(v=>({...v,description:e.target.value}))} 
                      placeholder="Payment for services"
                      required 
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-[#0a164d] hover:bg-[#0a164d]/90">
                    <CreditCard className="w-4 h-4 mr-2"/>
                    Create & Go to Checkout
                    <ArrowRight className="w-4 h-4 ml-2"/>
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-blue-500" />
                  Recent Activity
                </CardTitle>
                <p className="text-sm text-gray-600">Latest session activity and status updates</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((s: any) => (
                    <div 
                      key={s.sessionId} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSessionClick(s)}
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(s.status)}
                        <div>
                          <p className="font-medium text-gray-900">{fmtMoney(s.amount, s.currency)}</p>
                          <p className="text-sm text-gray-600">{s.customerName || s.customerEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={getStatusBadge(s.status)}>{s.status}</span>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-40" />
                      <p>No sessions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Removed Create Session tab */}
        {false && (
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-green-500" />
                Create New Session
              </CardTitle>
              <p className="text-sm text-gray-600">Create a checkout session for manual processing</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={onCreate} className="space-y-6">
                <div>
                  <Label>Select Customer *</Label>
                  <Select 
                    value={selectedCustomer} 
                    onValueChange={(value) => {
                      if (value === 'create_new') {
                        setShowCreateCustomerModal(true);
                      } else {
                        setSelectedCustomer(value);
                        const customer = customers.find(c => c._id === value);
                        if (customer) {
                          setForm(v => ({
                            ...v,
                            customerEmail: customer.email,
                            customerName: customer.name
                          }));
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose existing customer or create new" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create_new">
                        <div className="flex items-center">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Customer
                        </div>
                      </SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-gray-500">{customer.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Amount *</Label>
                    <Input 
                      type="text" 
                      value={form.amount} 
                      onChange={e=>setForm(v=>({...v,amount:formatAmount(e.target.value)}))} 
                      placeholder="1,000.00"
                      required 
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select value={form.currency} onValueChange={v=>setForm(f=>({...f,currency:v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Allowed Payment Method</Label>
                  <Select value={form.method} onValueChange={v=>setForm(f=>({...f, method:v}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All methods</SelectItem>
                      <SelectItem value="card">Card only</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer only</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description *</Label>
                  <Input 
                    value={form.description} 
                    onChange={e=>setForm(v=>({...v,description:e.target.value}))} 
                    placeholder="Payment for services"
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Customer Name</Label>
                    <Input 
                      value={form.customerName} 
                      onChange={e=>setForm(v=>({...v,customerName:e.target.value}))} 
                      placeholder="John Doe" 
                      disabled={selectedCustomer && selectedCustomer !== 'create_new'}
                    />
                  </div>
                  <div>
                    <Label>Customer Email *</Label>
                    <Input 
                      type="email" 
                      value={form.customerEmail} 
                      onChange={e=>setForm(v=>({...v,customerEmail:e.target.value}))} 
                      required 
                      disabled={selectedCustomer && selectedCustomer !== 'create_new'}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[#0a164d] hover:bg-[#0a164d]/90">
                  <CreditCard className="w-4 h-4 mr-2"/>
                  Create Session
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Removed Process Payment tab */}
        {false && (
        <TabsContent value="process" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                Process Payment
              </CardTitle>
              <p className="text-sm text-gray-600">Process a payment for an existing session</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={onPay} className="space-y-6">
                <div>
                  <Label>Session ID *</Label>
                  <Input 
                    value={pay.sessionId} 
                    onChange={e=>setPay(v=>({...v,sessionId:e.target.value}))} 
                    placeholder="sess_xxx" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label>Card Number *</Label>
                    <Input 
                      value={pay.cardNumber} 
                      onChange={e=>setPay(v=>({...v,cardNumber: formatCard(e.target.value)}))} 
                      placeholder="4242 4242 4242 4242" 
                      maxLength={19} 
                      required 
                    />
                  </div>
                  <div>
                    <Label>Expiry Month *</Label>
                    <Input 
                      value={pay.expiryMonth} 
                      onChange={e=>setPay(v=>({...v,expiryMonth: formatMM(e.target.value)}))} 
                      placeholder="MM" 
                      maxLength={2} 
                      required 
                    />
                  </div>
                  <div>
                    <Label>Expiry Year *</Label>
                    <Input 
                      value={pay.expiryYear} 
                      onChange={e=>setPay(v=>({...v,expiryYear: formatYY(e.target.value)}))} 
                      placeholder="YY" 
                      maxLength={2} 
                      required 
                    />
                  </div>
                </div>
                <div className="max-w-xs">
                  <Label>CVV *</Label>
                  <Input 
                    value={pay.cvv} 
                    onChange={e=>setPay(v=>({...v,cvv: formatCVV(e.target.value)}))} 
                    placeholder="123" 
                    maxLength={4} 
                    required 
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                  <DollarSign className="w-4 h-4 mr-2"/>
                  Process Payment
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* All Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                All Sessions
              </CardTitle>
              <p className="text-sm text-gray-600">View and manage all checkout sessions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((s: any) => (
                  <div 
                    key={s.sessionId} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSessionClick(s)}
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(s.status)}
                      <div>
                        <p className="font-semibold text-gray-900">{fmtMoney(s.amount, s.currency)}</p>
                        <p className="text-sm text-gray-600">{s.customerName || s.customerEmail}</p>
                        <p className="text-xs text-gray-500">{s.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={getStatusBadge(s.status)}>{s.status}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {s.sessionId.slice(0, 12)}...
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(s.sessionId);
                          }}
                        >
                          <Copy className="w-4 h-4"/>
                        </Button>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No sessions found</p>
                    <p className="text-sm">Create your first session to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Details Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Session Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessionModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Session Status */}
              <div className="flex items-center space-x-3">
                {getStatusIcon(selectedSession.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {fmtMoney(selectedSession.amount, selectedSession.currency)}
                  </h3>
                  <span className={getStatusBadge(selectedSession.status)}>
                    {selectedSession.status}
                  </span>
                </div>
              </div>

              {/* Session Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Session ID</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-900 font-mono break-all">
                        {selectedSession.sessionId}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(selectedSession.sessionId)}
                      >
                        <Copy className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer Email</p>
                    <p className="text-sm text-gray-900">
                      {selectedSession.customerEmail || 'No email provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer Name</p>
                    <p className="text-sm text-gray-900">
                      {selectedSession.customerName || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Amount</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {fmtMoney(selectedSession.amount, selectedSession.currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-sm text-gray-900">
                      {selectedSession.description || 'No description'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Created At</p>
                    <p className="text-sm text-gray-900">
                      {selectedSession.createdAt ? new Date(selectedSession.createdAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    copyToClipboard(selectedSession.sessionId);
                  }}
                >
                  <Copy className="w-4 h-4 mr-2"/>
                  Copy Session ID
                </Button>
                <Button 
                  onClick={() => {
                    window.open(`/checkout/${selectedSession.sessionId}`, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2"/>
                  Open Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Create New Customer</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateCustomerModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleCreateCustomer} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Full Name *</Label>
                  <Input 
                    value={newCustomerForm.name} 
                    onChange={e => setNewCustomerForm(v => ({...v, name: e.target.value}))} 
                    placeholder="John Doe" 
                    required 
                  />
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input 
                    type="email" 
                    value={newCustomerForm.email} 
                    onChange={e => setNewCustomerForm(v => ({...v, email: e.target.value}))} 
                    placeholder="john@example.com" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <Label>Phone Number</Label>
                <Input 
                  value={newCustomerForm.phone} 
                  onChange={e => setNewCustomerForm(v => ({...v, phone: e.target.value}))} 
                  placeholder="+234 811 841 0480" 
                />
              </div>

              <div>
                <Label>Address Information</Label>
                <div className="space-y-4">
                  <div>
                    <Label>Address Line 1</Label>
                    <Input 
                      value={newCustomerForm.address.line1} 
                      onChange={e => setNewCustomerForm(v => ({
                        ...v, 
                        address: {...v.address, line1: e.target.value}
                      }))} 
                      placeholder="123 Main Street" 
                    />
                  </div>
                  <div>
                    <Label>Address Line 2</Label>
                    <Input 
                      value={newCustomerForm.address.line2} 
                      onChange={e => setNewCustomerForm(v => ({
                        ...v, 
                        address: {...v.address, line2: e.target.value}
                      }))} 
                      placeholder="Apartment, suite, etc." 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input 
                        value={newCustomerForm.address.city} 
                        onChange={e => setNewCustomerForm(v => ({
                          ...v, 
                          address: {...v.address, city: e.target.value}
                        }))} 
                        placeholder="Lagos" 
                      />
                    </div>
                    <div>
                      <Label>State/Province</Label>
                      <Input 
                        value={newCustomerForm.address.state} 
                        onChange={e => setNewCustomerForm(v => ({
                          ...v, 
                          address: {...v.address, state: e.target.value}
                        }))} 
                        placeholder="Lagos" 
                      />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input 
                        value={newCustomerForm.address.postalCode} 
                        onChange={e => setNewCustomerForm(v => ({
                          ...v, 
                          address: {...v.address, postalCode: e.target.value}
                        }))} 
                        placeholder="100001" 
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Select 
                      value={newCustomerForm.address.country} 
                      onValueChange={value => setNewCustomerForm(v => ({
                        ...v, 
                        address: {...v.address, country: value}
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NG">Nigeria</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={newCustomerForm.description} 
                  onChange={e => setNewCustomerForm(v => ({...v, description: e.target.value}))} 
                  placeholder="Additional notes about this customer..." 
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateCustomerModal(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#0a164d] hover:bg-[#0a164d]/90"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Customer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
