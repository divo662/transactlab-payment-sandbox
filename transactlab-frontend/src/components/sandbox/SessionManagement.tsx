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
      const response = await fetch('https://transactlab-backend.onrender.com/api/v1/sandbox/customers', {
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
      const response = await fetch('https://transactlab-backend.onrender.com/api/v1/sandbox/customers', {
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

  if (loading && sessions.length === 0) {
  return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4 sm:space-y-6">
          <div className="grid w-full grid-cols-2">
            <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="border rounded-lg p-4 sm:p-6">
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-9 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
                <div className="h-9 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
            </div>
            <div className="border rounded-lg p-4 sm:p-6">
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading session data...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Session Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Create, manage, and monitor checkout sessions</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => void fetchSessions()} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => setActiveTab('create')} className="bg-[#0a164d] hover:bg-[#0a164d]/90 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2"/>
            New Session
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start text-red-700">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
            <span className="font-medium">Error:</span>
              <span className="ml-2 break-words">{error}</span>
            </div>
          </div>
          <button 
            onClick={() => setError(null)} 
            className="mt-2 text-xs sm:text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.pendingSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-2 min-w-[200px]">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs sm:text-sm">All Sessions</TabsTrigger>
        </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500" />
                  Quick Charge
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600">Create a session and redirect to checkout instantly</p>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <form onSubmit={onQuick} className="space-y-3 sm:space-y-4">
                  <div>
                    <Label className="text-xs sm:text-sm">Select Customer *</Label>
                    <div className="mt-1">
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
                        <SelectTrigger className="text-xs sm:text-sm">
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
                                <span className="font-medium text-xs sm:text-sm">{customer.name}</span>
                                <span className="text-xs text-gray-500">{customer.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Customer Name</Label>
                      <Input 
                        value={quick.name} 
                        onChange={e=>setQuick(v=>({...v,name:e.target.value}))} 
                        placeholder="John Doe" 
                        disabled={selectedCustomer && selectedCustomer !== 'create_new'}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Email Address *</Label>
                      <Input 
                        type="email" 
                        value={quick.email} 
                        onChange={e=>setQuick(v=>({...v,email:e.target.value}))} 
                        required 
                        disabled={selectedCustomer && selectedCustomer !== 'create_new'}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Amount *</Label>
                      <Input 
                        type="text" 
                        value={quick.amount} 
                        onChange={e=>setQuick(v=>({...v,amount:formatAmount(e.target.value)}))} 
                        placeholder="1,000.00"
                        required 
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Currency</Label>
                      <Select value={quick.currency} onValueChange={v=>setQuick(f=>({...f,currency:v}))}>
                        <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
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
                    <Label className="text-xs sm:text-sm">Allowed Payment Method</Label>
                    <Select value={quick.method} onValueChange={v=>setQuick(f=>({...f, method:v}))}>
                      <SelectTrigger className="text-xs sm:text-sm">
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
                    <Label className="text-xs sm:text-sm">Description *</Label>
                    <Input 
                      value={quick.description} 
                      onChange={e=>setQuick(v=>({...v,description:e.target.value}))} 
                      placeholder="Payment for services"
                      required 
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-[#0a164d] hover:bg-[#0a164d]/90 text-xs sm:text-sm">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                        Creating Session...
                      </>
                    ) : (
                      <>
                    <CreditCard className="w-4 h-4 mr-2"/>
                    Create & Go to Checkout
                    <ArrowRight className="w-4 h-4 ml-2"/>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                  Recent Activity
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600">Latest session activity and status updates</p>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="space-y-2 sm:space-y-3">
                  {sessions.slice(0, 5).map((s: any) => (
                    <div 
                      key={s.sessionId} 
                      className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSessionClick(s)}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        {getStatusIcon(s.status)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{fmtMoney(s.amount, s.currency)}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{s.customerName || s.customerEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <span className={`${getStatusBadge(s.status)} text-xs`}>{s.status}</span>
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-gray-500">
                      <Activity className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-40" />
                      <p className="text-sm sm:text-base">No sessions yet</p>
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
        <TabsContent value="sessions" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-500" />
                All Sessions
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-600">View and manage all checkout sessions</p>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-3 sm:space-y-4">
                {sessions.map((s: any) => (
                  <div 
                    key={s.sessionId} 
                    className="border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSessionClick(s)}
                  >
                    {/* Desktop View */}
                    <div className="hidden sm:flex items-center justify-between p-4">
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

                    {/* Mobile View */}
                    <div className="sm:hidden p-3">
                      <div className="space-y-3">
                        {/* Header with amount and status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(s.status)}
                            <p className="font-semibold text-gray-900 text-sm">{fmtMoney(s.amount, s.currency)}</p>
                          </div>
                          <span className={`${getStatusBadge(s.status)} text-xs`}>{s.status}</span>
                        </div>

                        {/* Customer info */}
                        <div className="text-xs text-gray-600 truncate">
                          {s.customerName || s.customerEmail}
                        </div>

                        {/* Description */}
                        <div className="text-xs text-gray-500 truncate">
                          {s.description}
                        </div>

                        {/* Session ID and actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {s.sessionId.slice(0, 12)}...
                          </span>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(s.sessionId);
                              }}
                            >
                              <Copy className="w-3 h-3"/>
                            </Button>
                            <Eye className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-8 sm:py-12 text-gray-500">
                    <Activity className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-40" />
                    <p className="text-base sm:text-lg font-medium">No sessions found</p>
                    <p className="text-xs sm:text-sm">Create your first session to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Details Modal */}
      {showSessionModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">Session Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSessionModal(false)}
                className="p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Session Status */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(selectedSession.status)}
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {fmtMoney(selectedSession.amount, selectedSession.currency)}
                  </h3>
                </div>
                <span className={`${getStatusBadge(selectedSession.status)} text-xs w-fit`}>
                    {selectedSession.status}
                  </span>
              </div>

              {/* Session Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Session ID</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs sm:text-sm text-gray-900 font-mono break-all flex-1">
                        {selectedSession.sessionId}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(selectedSession.sessionId)}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4"/>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Customer Email</p>
                    <p className="text-xs sm:text-sm text-gray-900 break-words">
                      {selectedSession.customerEmail || 'No email provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Customer Name</p>
                    <p className="text-xs sm:text-sm text-gray-900 break-words">
                      {selectedSession.customerName || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Amount</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">
                      {fmtMoney(selectedSession.amount, selectedSession.currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Description</p>
                    <p className="text-xs sm:text-sm text-gray-900 break-words">
                      {selectedSession.description || 'No description'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Payment Method</p>
                    <p className="text-xs sm:text-sm text-gray-900">
                      {selectedSession.metadata?.customFields?.paymentMethodUsed === 'bank_transfer' && 'Bank Transfer'}
                      {selectedSession.metadata?.customFields?.paymentMethodUsed === 'mobile_money' && 'Mobile Money'}
                      {selectedSession.metadata?.customFields?.paymentMethodUsed === 'card' && 'Credit/Debit Card'}
                      {!selectedSession.metadata?.customFields?.paymentMethodUsed && 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Created At</p>
                    <p className="text-xs sm:text-sm text-gray-900">
                      {selectedSession.createdAt ? new Date(selectedSession.createdAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    copyToClipboard(selectedSession.sessionId);
                  }}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-2"/>
                  Copy Session ID
                </Button>
                {String(selectedSession.status).toLowerCase() === 'pending' && (
                  <Button 
                    onClick={() => {
                      window.open(`/checkout/${selectedSession.sessionId}`, '_blank');
                    }}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2"/>
                    Open Checkout
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">Create New Customer</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateCustomerModal(false)}
                className="p-1"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
            
            <form onSubmit={handleCreateCustomer} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-xs sm:text-sm">Full Name *</Label>
                  <Input 
                    value={newCustomerForm.name} 
                    onChange={e => setNewCustomerForm(v => ({...v, name: e.target.value}))} 
                    placeholder="John Doe" 
                    required 
                    className="text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Email Address *</Label>
                  <Input 
                    type="email" 
                    value={newCustomerForm.email} 
                    onChange={e => setNewCustomerForm(v => ({...v, email: e.target.value}))} 
                    placeholder="john@example.com" 
                    required 
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs sm:text-sm">Phone Number</Label>
                <Input 
                  value={newCustomerForm.phone} 
                  onChange={e => setNewCustomerForm(v => ({...v, phone: e.target.value}))} 
                  placeholder="+234 811 841 0480" 
                  className="text-xs sm:text-sm"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm">Address Information</Label>
                <div className="space-y-3 sm:space-y-4 mt-2">
                  <div>
                    <Label className="text-xs sm:text-sm">Address Line 1</Label>
                    <Input 
                      value={newCustomerForm.address.line1} 
                      onChange={e => setNewCustomerForm(v => ({
                        ...v, 
                        address: {...v.address, line1: e.target.value}
                      }))} 
                      placeholder="123 Main Street" 
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Address Line 2</Label>
                    <Input 
                      value={newCustomerForm.address.line2} 
                      onChange={e => setNewCustomerForm(v => ({
                        ...v, 
                        address: {...v.address, line2: e.target.value}
                      }))} 
                      placeholder="Apartment, suite, etc." 
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">City</Label>
                      <Input 
                        value={newCustomerForm.address.city} 
                        onChange={e => setNewCustomerForm(v => ({
                          ...v, 
                          address: {...v.address, city: e.target.value}
                        }))} 
                        placeholder="Lagos" 
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">State/Province</Label>
                      <Input 
                        value={newCustomerForm.address.state} 
                        onChange={e => setNewCustomerForm(v => ({
                          ...v, 
                          address: {...v.address, state: e.target.value}
                        }))} 
                        placeholder="Lagos" 
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Postal Code</Label>
                      <Input 
                        value={newCustomerForm.address.postalCode} 
                        onChange={e => setNewCustomerForm(v => ({
                          ...v, 
                          address: {...v.address, postalCode: e.target.value}
                        }))} 
                        placeholder="100001" 
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Country</Label>
                    <Select 
                      value={newCustomerForm.address.country} 
                      onValueChange={value => setNewCustomerForm(v => ({
                        ...v, 
                        address: {...v.address, country: value}
                      }))}
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
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
                <Label className="text-xs sm:text-sm">Description</Label>
                <Textarea 
                  value={newCustomerForm.description} 
                  onChange={e => setNewCustomerForm(v => ({...v, description: e.target.value}))} 
                  placeholder="Additional notes about this customer..." 
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateCustomerModal(false)}
                  disabled={loading}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#0a164d] hover:bg-[#0a164d]/90 w-full sm:w-auto text-xs sm:text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {loading ? 'Creating...' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documentation CTA */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <ExternalLink className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Ready to Get Started?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Explore our comprehensive documentation to learn how to integrate TransactLab 
              into your applications with detailed guides, API references, and code examples.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.open('https://transactlab-payment-sandbox.vercel.app/transactlab-docs', '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Read Our Documentation
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://transactlab-payment-sandbox.vercel.app/transactlab-docs', '_blank')}
                className="border-green-200 text-green-700 hover:bg-green-50 px-6 py-3"
              >
                View API Reference
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionManagement;
