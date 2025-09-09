import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Zap
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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);

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

  // Filter transactions based on payment type
  const getFilteredTransactions = () => {
    if (paymentTypeFilter === 'all') return transactions;
    return transactions.filter(transaction => {
      if (paymentTypeFilter === 'subscription') {
        return isSubscriptionPayment(transaction);
      } else if (paymentTypeFilter === 'one-time') {
        return !isSubscriptionPayment(transaction);
      }
      return true;
    });
  };

  useEffect(() => { void fetchTx(); }, []);

  const fmtMoney = (a:number,c:string)=> new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format((a||0)/100);
  const fmtDate = (d?:string)=> d? new Date(d).toLocaleString() : '—';

  // Check if transaction is subscription-based
  const isSubscriptionPayment = (transaction: any) => {
    return transaction.metadata?.subscriptionId || 
           transaction.metadata?.productId || 
           transaction.metadata?.planId ||
           transaction.description?.toLowerCase().includes('subscription') ||
           transaction.description?.toLowerCase().includes('recurring');
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

  const handleDownloadReceipt = () => {
    if (!selectedTransaction) return;

    try {
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
        paymentMethod: 'card'
      });
      toast({ title: 'Success', description: 'Receipt downloaded successfully' });
    } catch (err) {
      console.error('Error generating receipt PDF:', err);
      toast({ title: 'Error', description: 'Failed to generate receipt', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="flex items-center space-x-3">
          <Select value={paymentTypeFilter} onValueChange={(value: 'all' | 'subscription' | 'one-time') => setPaymentTypeFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="subscription">Subscriptions</SelectItem>
              <SelectItem value="one-time">One-time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void fetchTx()}>
            <RefreshCw className="w-4 h-4 mr-2"/>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            const filteredTransactions = getFilteredTransactions();
            return filteredTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>{transactions.length === 0 ? 'No transactions yet.' : 'No transactions match the selected filter.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
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
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4" />
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
            );
          })()}
          
          {/* Loading state */}
          {loading && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Loading transactions...</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Transaction Status */}
              <div className="flex items-center space-x-3">
                {getStatusIcon(selectedTransaction.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {fmtMoney(selectedTransaction.amount, selectedTransaction.currency)}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentTypeInfo(selectedTransaction).color}`}>
                      {getPaymentTypeInfo(selectedTransaction).icon}
                      <span className="ml-1">{getPaymentTypeInfo(selectedTransaction).label}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Hash className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                      <p className="text-sm text-gray-900 font-mono break-all">
                        {selectedTransaction.transactionId || selectedTransaction.sessionId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer Email</p>
                      <p className="text-sm text-gray-900">
                        {selectedTransaction.customerEmail || 'No email provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date & Time</p>
                      <p className="text-sm text-gray-900">
                        {fmtDate(selectedTransaction.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Method</p>
                      <p className="text-sm text-gray-900">
                        {selectedTransaction.metadata?.customFields?.paymentMethodUsed === 'bank_transfer' && 'Bank Transfer'}
                        {selectedTransaction.metadata?.customFields?.paymentMethodUsed === 'mobile_money' && 'Mobile Money'}
                        {!selectedTransaction.metadata?.customFields?.paymentMethodUsed && 'Credit/Debit Card'}
                        {selectedTransaction.metadata?.customFields?.paymentMethodUsed === 'card' && 'Credit/Debit Card'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {fmtMoney(selectedTransaction.amount, selectedTransaction.currency)}
                      </p>
                    </div>
                  </div>

                  {selectedTransaction.description && (
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 text-gray-400 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Description</p>
                        <p className="text-sm text-gray-900">
                          {selectedTransaction.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Subscription Details */}
                  {isSubscriptionPayment(selectedTransaction) && (
                    <div className="flex items-start space-x-3">
                      <Repeat className="w-5 h-5 text-purple-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Subscription Details</p>
                        <div className="space-y-1">
                          {selectedTransaction.metadata?.subscriptionId && (
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Subscription ID:</span> {selectedTransaction.metadata.subscriptionId}
                            </p>
                          )}
                          {selectedTransaction.metadata?.productId && (
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Product ID:</span> {selectedTransaction.metadata.productId}
                            </p>
                          )}
                          {selectedTransaction.metadata?.planId && (
                            <p className="text-sm text-gray-900">
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
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer Name</p>
                      <p className="text-sm text-gray-900">
                        {selectedTransaction.customerName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between p-6 border-t border-gray-200">
              <div className="flex space-x-2">
                {(selectedTransaction.status === 'completed' || selectedTransaction.status === 'successful') && (
                  <Button 
                    onClick={() => {
                      closeModal();
                      setShowRefundModal(true);
                    }}
                    variant="outline"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
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
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
              <Button onClick={closeModal} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Refund Transaction</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRefundModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleRefundTransaction} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Transaction Details</h3>
                <p className="text-sm text-gray-600">
                  <strong>Amount:</strong> {fmtMoney(selectedTransaction.amount, selectedTransaction.currency)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {selectedTransaction.description || 'Payment'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Transaction ID:</strong> {selectedTransaction.sessionId || selectedTransaction.transactionId}
                </p>
              </div>
              
              <div>
                <Label htmlFor="refund-amount">Refund Amount (leave empty for full refund)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({...refundForm, amount: e.target.value})}
                  placeholder={`${(selectedTransaction.amount / 100).toFixed(2)}`}
                  max={selectedTransaction.amount / 100}
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum refund: {fmtMoney(selectedTransaction.amount, selectedTransaction.currency)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="refund-reason">Refund Reason</Label>
                <Select value={refundForm.reason} onValueChange={(value) => setRefundForm({...refundForm, reason: value})}>
                  <SelectTrigger>
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
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Refunds are processed immediately in sandbox mode. 
                  In production, refunds may take 5-10 business days to appear on the customer's statement.
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Process Refund
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowRefundModal(false)}
                  disabled={submitting}
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
