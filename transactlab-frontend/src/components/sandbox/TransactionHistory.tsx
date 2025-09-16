import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSandbox } from '@/contexts/SandboxContext';
import { useToast } from '@/hooks/use-toast';
import Pagination from '@/components/ui/pagination';
import { generateReceiptPDF } from '@/utils/pdfGenerator';
import { 
  DollarSign, 
  RefreshCw, 
  Eye, 
  X, 
  Calendar, 
  CreditCard, 
  Mail, 
  Hash,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  RotateCcw,
  Loader2,
  Repeat,
  Zap,
  Filter,
  Search,
  CalendarDays,
  DollarSign as DollarIcon,
  User,
  ChevronDown
} from 'lucide-react';

const TransactionHistory: React.FC = () => {
  const { getRecentTransactions } = useSandbox();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: 'requested_by_customer'
  });
  const [submitting, setSubmitting] = useState(false);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'subscription' | 'one-time'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'successful' | 'pending' | 'failed' | 'refunded'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [amountRangeFilter, setAmountRangeFilter] = useState({
    minAmount: '',
    maxAmount: ''
  });
  const [customerSearchFilter, setCustomerSearchFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const normalizeTx = (res: any) => Array.isArray(res?.data) ? res.data : (res?.data?.transactions || []);

  const fetchTx = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await getRecentTransactions(page, 20);
      setTransactions(normalizeTx(res));
      
      // Update pagination info
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchTx(page);
  };

  // Enhanced filtering function with all filter types
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Payment type filter
      if (paymentTypeFilter !== 'all') {
        if (paymentTypeFilter === 'subscription' && !isSubscriptionPayment(transaction)) {
          return false;
        }
        if (paymentTypeFilter === 'one-time' && isSubscriptionPayment(transaction)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const transactionStatus = transaction.status?.toLowerCase();
        if (statusFilter === 'successful' && transactionStatus !== 'successful' && transactionStatus !== 'completed') {
          return false;
        }
        if (statusFilter === 'pending' && transactionStatus !== 'pending') {
          return false;
        }
        if (statusFilter === 'failed' && transactionStatus !== 'failed') {
          return false;
        }
        if (statusFilter === 'refunded' && transactionStatus !== 'refunded') {
          return false;
        }
      }

      // Date range filter
      if (dateRangeFilter.startDate || dateRangeFilter.endDate) {
        const transactionDate = new Date(transaction.createdAt);
        const startDate = dateRangeFilter.startDate ? new Date(dateRangeFilter.startDate) : null;
        const endDate = dateRangeFilter.endDate ? new Date(dateRangeFilter.endDate) : null;

        if (startDate && transactionDate < startDate) {
          return false;
        }
        if (endDate) {
          // Set end date to end of day
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (transactionDate > endOfDay) {
            return false;
          }
        }
      }

      // Amount range filter
      if (amountRangeFilter.minAmount || amountRangeFilter.maxAmount) {
        const transactionAmount = transaction.amount;
        const minAmount = amountRangeFilter.minAmount ? parseFloat(amountRangeFilter.minAmount) * 100 : null;
        const maxAmount = amountRangeFilter.maxAmount ? parseFloat(amountRangeFilter.maxAmount) * 100 : null;

        if (minAmount && transactionAmount < minAmount) {
          return false;
        }
        if (maxAmount && transactionAmount > maxAmount) {
          return false;
        }
      }

      // Customer search filter
      if (customerSearchFilter) {
        const searchTerm = customerSearchFilter.toLowerCase();
        const customerEmail = transaction.customerEmail?.toLowerCase() || '';
        const customerName = transaction.customerName?.toLowerCase() || '';
        const transactionId = transaction.transactionId?.toLowerCase() || '';
        const sessionId = transaction.sessionId?.toLowerCase() || '';

        if (!customerEmail.includes(searchTerm) && 
            !customerName.includes(searchTerm) && 
            !transactionId.includes(searchTerm) && 
            !sessionId.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  };

  useEffect(() => { void fetchTx(); }, []);

  const fmtMoney = (a:number,c:string)=> new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format((a||0)/100);
  const fmtDate = (d?:string)=> d? new Date(d).toLocaleString() : '—';

  const exportAllTransactions = async () => {
    try {
      setExporting(true);
      const allTx: any[] = [];
      let page = 1;
      const limit = 100;
      const maxPages = 1000;
      while (page <= maxPages) {
        const res = await getRecentTransactions(page, limit);
        const list = normalizeTx(res);
        allTx.push(...list);
        const hasNext = Boolean(res?.pagination?.hasNextPage);
        if (!hasNext) break;
        page += 1;
      }

      const headers = [
        'Transaction ID',
        'Session ID',
        'Status',
        'Amount',
        'Currency',
        'Customer Email',
        'Customer Name',
        'Description',
        'Created At',
        'Payment Method',
        'Type'
      ];

      const escapeCsv = (value: unknown) => {
        const str = value === null || value === undefined ? '' : String(value);
        if (/[",\n]/.test(str)) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const rows = allTx.map((t: any) => {
        const type = isSubscriptionPayment(t) ? 'Subscription' : 'One-time';
        const cols = [
          t.transactionId || '',
          t.sessionId || '',
          t.status || '',
          (t.amount ?? 0) / 100,
          t.currency || '',
          t.customerEmail || '',
          t.customerName || '',
          t.description || '',
          t.createdAt ? new Date(t.createdAt).toISOString() : '',
          getFormattedPaymentMethod(t),
          type
        ];
        return cols.map(escapeCsv).join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute('download', `sandbox-transactions-${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export complete',
        description: `Exported ${allTx.length} transactions to CSV`
      });
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to export transactions',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setPaymentTypeFilter('all');
    setStatusFilter('all');
    setDateRangeFilter({ startDate: '', endDate: '' });
    setAmountRangeFilter({ minAmount: '', maxAmount: '' });
    setCustomerSearchFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return paymentTypeFilter !== 'all' ||
           statusFilter !== 'all' ||
           dateRangeFilter.startDate ||
           dateRangeFilter.endDate ||
           amountRangeFilter.minAmount ||
           amountRangeFilter.maxAmount ||
           customerSearchFilter;
  };

  // Get filter count
  const getFilterCount = () => {
    let count = 0;
    if (paymentTypeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (dateRangeFilter.startDate || dateRangeFilter.endDate) count++;
    if (amountRangeFilter.minAmount || amountRangeFilter.maxAmount) count++;
    if (customerSearchFilter) count++;
    return count;
  };

  // Check if transaction is subscription-based
  const isSubscriptionPayment = (transaction: any) => {
    return transaction.metadata?.subscriptionId || 
           transaction.metadata?.productId || 
           transaction.metadata?.planId ||
           transaction.description?.toLowerCase().includes('subscription') ||
           transaction.description?.toLowerCase().includes('recurring');
  };

  // Get formatted payment method
  const getFormattedPaymentMethod = (transaction: any) => {
    // First try to use the formatted paymentMethod from the API response
    if (transaction.paymentMethod) {
      return transaction.paymentMethod;
    }
    
    // Fallback to the raw payment method from metadata
    const paymentMethod = transaction.metadata?.customFields?.paymentMethodUsed;
    
    if (!paymentMethod) {
      return 'Credit/Debit Card';
    }

    switch (paymentMethod.toLowerCase()) {
      case 'card':
        return 'Credit/Debit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'mobile_money':
        return 'Mobile Money';
      case 'wallet':
        return 'Digital Wallet';
      case 'bank_account':
        return 'Bank Account';
      default:
        return 'Credit/Debit Card';
    }
  };

  // Get payment type icon and label
  const getPaymentTypeInfo = (transaction: any) => {
    if (isSubscriptionPayment(transaction)) {
      return {
        icon: <Repeat className="w-4 h-4 text-purple-500" />,
        label: 'Subscription',
        color: 'text-purple-600 bg-purple-50',
        description: transaction.metadata?.planId ? `Plan: ${transaction.metadata.planId}` : 'Recurring Payment'
      };
    } else {
      return {
        icon: <Zap className="w-4 h-4 text-blue-500" />,
        label: 'One-time',
        color: 'text-blue-600 bg-blue-50',
        description: 'Single Payment'
      };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'successful':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'refunded':
        return <RotateCcw className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'successful':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'refunded':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const openModal = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleRefundTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://transactlab-backend.onrender.com/api/v1/sandbox/refunds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId: selectedTransaction.sessionId || selectedTransaction.transactionId,
          amount: refundForm.amount ? parseInt(refundForm.amount) * 100 : selectedTransaction.amount,
          reason: refundForm.reason,
          customerEmail: selectedTransaction.customerEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: `Refund of ${fmtMoney(data.data.amount, data.data.currency)} processed successfully`,
        });
        setShowRefundModal(false);
        setRefundForm({ amount: '', reason: 'requested_by_customer' });
        // Refresh transactions
        fetchTx(pagination.currentPage);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process refund');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process refund',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  const handleDownloadReceipt = async () => {
    if (!selectedTransaction) return;

    try {
      setDownloadingReceipt(true);
      generateReceiptPDF({
        transactionId: selectedTransaction.transactionId || selectedTransaction.sessionId,
        sessionId: selectedTransaction.sessionId || selectedTransaction.transactionId,
        customerEmail: selectedTransaction.customerEmail,
        customerName: selectedTransaction.customerName || selectedTransaction.customerEmail.split('@')[0],
        amount: selectedTransaction.amount,
        currency: selectedTransaction.currency,
        description: selectedTransaction.description || 'Payment',
        createdAt: selectedTransaction.createdAt,
        status: selectedTransaction.status,
        paymentMethod: getFormattedPaymentMethod(selectedTransaction)
      });
      toast({ title: 'Success', description: 'Receipt downloaded successfully' });
    } catch (err) {
      console.error('Error generating receipt PDF:', err);
      toast({ title: 'Error', description: 'Failed to generate receipt', variant: 'destructive' });
    } finally {
      setDownloadingReceipt(false);
    }
  };

  if (loading && transactions.length === 0) {
  return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-9 bg-gray-200 rounded w-32 sm:w-40 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>

        {/* Card Skeleton */}
        <div className="border rounded-lg">
          <div className="p-4 sm:p-6 border-b">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="p-0">
            <div className="space-y-4 p-4 sm:p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                          <div className="flex gap-2">
                            <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                            <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="flex gap-1">
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      </div>
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
          <p className="text-gray-600 font-medium">Loading transactions...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold">Transactions</h1>
            {hasActiveFilters() && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {getFilterCount()} filter{getFilterCount() > 1 ? 's' : ''}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => void fetchTx()} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button 
              variant="outline" 
              onClick={exportAllTransactions}
              disabled={exporting}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export All'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="w-full sm:w-auto"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 text-xs">
                  {getFilterCount()}
                </Badge>
              )}
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Advanced Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
                Clear all filters
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Payment Type Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Payment Type</Label>
          <Select value={paymentTypeFilter} onValueChange={(value: 'all' | 'subscription' | 'one-time') => setPaymentTypeFilter(value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="subscription">Subscriptions</SelectItem>
              <SelectItem value="one-time">One-time</SelectItem>
            </SelectContent>
          </Select>
        </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Status</Label>
                <Select value={statusFilter} onValueChange={(value: 'all' | 'successful' | 'pending' | 'failed' | 'refunded') => setStatusFilter(value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="successful">Successful</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Search */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Search Customer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Email, name, or ID..."
                    value={customerSearchFilter}
                    onChange={(e) => setCustomerSearchFilter(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Start Date</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    value={dateRangeFilter.startDate}
                    onChange={(e) => setDateRangeFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">End Date</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    value={dateRangeFilter.endDate}
                    onChange={(e) => setDateRangeFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Min Amount</Label>
                <div className="relative">
                  <DollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amountRangeFilter.minAmount}
                    onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, minAmount: e.target.value }))}
                    className="pl-9 h-9"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Max Amount</Label>
                <div className="relative">
                  <DollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="1000.00"
                    value={amountRangeFilter.maxAmount}
                    onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, maxAmount: e.target.value }))}
                    className="pl-9 h-9"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                {paymentTypeFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Type: {paymentTypeFilter === 'subscription' ? 'Subscriptions' : 'One-time'}
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Status: {statusFilter}
                  </Badge>
                )}
                {(dateRangeFilter.startDate || dateRangeFilter.endDate) && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Date: {dateRangeFilter.startDate || 'Start'} - {dateRangeFilter.endDate || 'End'}
                  </Badge>
                )}
                {(amountRangeFilter.minAmount || amountRangeFilter.maxAmount) && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Amount: ${amountRangeFilter.minAmount || '0'} - ${amountRangeFilter.maxAmount || '∞'}
                  </Badge>
                )}
                {customerSearchFilter && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    Search: {customerSearchFilter}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-sm sm:text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            const filteredTransactions = getFilteredTransactions();
            return filteredTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 sm:py-12 px-4">
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm sm:text-base">
                  {transactions.length === 0 
                    ? 'No transactions yet.' 
                    : hasActiveFilters() 
                      ? 'No transactions match the selected filters.' 
                      : 'No transactions found.'}
                </p>
                {hasActiveFilters() && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="mt-3"
                  >
                    Clear filters to see all transactions
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden sm:block divide-y divide-gray-200">
                {filteredTransactions.map((t: any) => (
                <div 
                  key={t.transactionId || t.sessionId} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openModal(t)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(t.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="text-lg font-semibold text-gray-900">
                            {fmtMoney(t.amount, t.currency)}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>
                            {t.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentTypeInfo(t).color}`}>
                            {getPaymentTypeInfo(t).icon}
                            <span className="ml-1">{getPaymentTypeInfo(t).label}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-600 truncate">
                            {t.customerEmail || 'No email provided'}
                          </p>
                          <span className="text-xs text-gray-500">•</span>
                          <p className="text-xs text-gray-500 truncate">
                            {getPaymentTypeInfo(t).description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {fmtDate(t.createdAt)}
                      </span>
                      <div className="flex items-center space-x-1">
                        {(t.status === 'completed' || t.status === 'successful') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransaction(t);
                              setShowRefundModal(true);
                            }}
                            title="Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(t);
                            handleDownloadReceipt();
                          }}
                              disabled={downloadingReceipt}
                          title="Download Receipt"
                        >
                              {downloadingReceipt ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                          <Download className="w-4 h-4" />
                              )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(t);
                          }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>

                {/* Mobile View */}
                <div className="sm:hidden space-y-3 p-3">
                  {filteredTransactions.map((t: any) => (
                    <div 
                      key={t.transactionId || t.sessionId} 
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openModal(t)}
                    >
                      <div className="space-y-3">
                        {/* Header with amount and status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(t.status)}
                            <p className="text-lg font-semibold text-gray-900">
                              {fmtMoney(t.amount, t.currency)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>
                            {t.status}
                          </span>
                        </div>

                        {/* Payment type and description */}
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeInfo(t).color}`}>
                            {getPaymentTypeInfo(t).icon}
                            <span className="ml-1">{getPaymentTypeInfo(t).label}</span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {fmtDate(t.createdAt)}
                          </span>
                        </div>

                        {/* Customer email */}
                        <div className="text-sm text-gray-600 truncate">
                          {t.customerEmail || 'No email provided'}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            {getPaymentTypeInfo(t).description}
                          </div>
                          <div className="flex items-center space-x-1">
                            {(t.status === 'completed' || t.status === 'successful') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTransaction(t);
                                  setShowRefundModal(true);
                                }}
                                title="Refund"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTransaction(t);
                                handleDownloadReceipt();
                              }}
                              disabled={downloadingReceipt}
                              title="Download Receipt"
                            >
                              {downloadingReceipt ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal(t);
                              }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
          
          {/* Loading state */}
          {loading && transactions.length > 0 && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0a164d] mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading more transactions...</p>
            </div>
          )}
        </CardContent>
        
        {/* Pagination */}
        {getFilteredTransactions().length > 0 && paymentTypeFilter === 'all' && (
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

      {/* Transaction Details Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Transaction Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Transaction Status */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(selectedTransaction.status)}
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {fmtMoney(selectedTransaction.amount, selectedTransaction.currency)}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </span>
                  <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getPaymentTypeInfo(selectedTransaction).color}`}>
                      {getPaymentTypeInfo(selectedTransaction).icon}
                      <span className="ml-1">{getPaymentTypeInfo(selectedTransaction).label}</span>
                    </span>
                </div>
              </div>

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Transaction ID</p>
                      <p className="text-xs sm:text-sm text-gray-900 font-mono break-all">
                        {selectedTransaction.transactionId || selectedTransaction.sessionId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Customer Email</p>
                      <p className="text-xs sm:text-sm text-gray-900 break-all">
                        {selectedTransaction.customerEmail || 'No email provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Date & Time</p>
                      <p className="text-xs sm:text-sm text-gray-900">
                        {fmtDate(selectedTransaction.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Payment Method</p>
                      <p className="text-xs sm:text-sm text-gray-900">
                        {getFormattedPaymentMethod(selectedTransaction)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">
                        {fmtMoney(selectedTransaction.amount, selectedTransaction.currency)}
                      </p>
                    </div>
                  </div>

                  {selectedTransaction.description && (
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Description</p>
                        <p className="text-xs sm:text-sm text-gray-900 break-words">
                          {selectedTransaction.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Subscription Details */}
                  {isSubscriptionPayment(selectedTransaction) && (
                    <div className="flex items-start space-x-3">
                      <Repeat className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Subscription Details</p>
                        <div className="space-y-1">
                          {selectedTransaction.metadata?.subscriptionId && (
                            <p className="text-xs sm:text-sm text-gray-900 break-all">
                              <span className="font-medium">Subscription ID:</span> {selectedTransaction.metadata.subscriptionId}
                            </p>
                          )}
                          {selectedTransaction.metadata?.productId && (
                            <p className="text-xs sm:text-sm text-gray-900 break-all">
                              <span className="font-medium">Product ID:</span> {selectedTransaction.metadata.productId}
                            </p>
                          )}
                          {selectedTransaction.metadata?.planId && (
                            <p className="text-xs sm:text-sm text-gray-900 break-all">
                              <span className="font-medium">Plan ID:</span> {selectedTransaction.metadata.planId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              {selectedTransaction.customerName && (
                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-500">Customer Name</p>
                      <p className="text-xs sm:text-sm text-gray-900 break-words">
                        {selectedTransaction.customerName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 p-4 sm:p-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                {(selectedTransaction.status === 'completed' || selectedTransaction.status === 'successful') && (
                  <Button 
                    onClick={() => {
                      closeModal();
                      setShowRefundModal(true);
                    }}
                    variant="outline"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 w-full sm:w-auto"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Refund
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    handleDownloadReceipt();
                  }}
                  variant="outline"
                  disabled={downloadingReceipt}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
                >
                  {downloadingReceipt ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                  <Download className="w-4 h-4 mr-2" />
                  )}
                  {downloadingReceipt ? 'Downloading...' : 'Download Receipt'}
                </Button>
              </div>
              <Button onClick={closeModal} variant="outline" className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[95vh] overflow-y-auto mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-base sm:text-lg font-semibold">Refund Transaction</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRefundModal(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleRefundTransaction} className="p-4 sm:p-6 space-y-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Transaction Details</h3>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                  <strong>Amount:</strong> {fmtMoney(selectedTransaction.amount, selectedTransaction.currency)}
                </p>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                  <strong>Description:</strong> {selectedTransaction.description || 'Payment'}
                </p>
                  <p className="text-xs sm:text-sm text-gray-600 break-all">
                  <strong>Transaction ID:</strong> {selectedTransaction.sessionId || selectedTransaction.transactionId}
                </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="refund-amount" className="text-sm sm:text-base">Refund Amount (leave empty for full refund)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({...refundForm, amount: e.target.value})}
                  placeholder={`${(selectedTransaction.amount / 100).toFixed(2)}`}
                  max={selectedTransaction.amount / 100}
                  step="0.01"
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum refund: {fmtMoney(selectedTransaction.amount, selectedTransaction.currency)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="refund-reason" className="text-sm sm:text-base">Refund Reason</Label>
                <Select value={refundForm.reason} onValueChange={(value) => setRefundForm({...refundForm, reason: value})}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested_by_customer">Requested by customer</SelectItem>
                    <SelectItem value="duplicate">Duplicate charge</SelectItem>
                    <SelectItem value="fraudulent">Fraudulent</SelectItem>
                    <SelectItem value="product_defective">Product defective</SelectItem>
                    <SelectItem value="product_not_received">Product not received</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-yellow-800">
                  <strong>Note:</strong> Refunds are processed immediately in sandbox mode. 
                  In production, refunds may take 5-10 business days to appear on the customer's statement.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-sm sm:text-base"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  {submitting ? 'Processing...' : 'Process Refund'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowRefundModal(false)}
                  disabled={submitting}
                  className="flex-1 sm:flex-none text-sm sm:text-base"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
