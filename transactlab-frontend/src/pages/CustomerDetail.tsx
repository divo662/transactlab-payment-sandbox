import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Activity,
  FileText,
  Download,
  Plus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  Phone,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateInvoicePDF, InvoiceData, generateReceiptPDF } from '@/utils/pdfGenerator';
// import EnhancedPaymentMethodModal from '@/components/EnhancedPaymentMethodModal'; // DISABLED

interface CustomerData {
  _id: string;
  customerId: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  description?: string;
  totalTransactions: number;
  totalSpent: number;
  currency: string;
  transactionsByCurrency: Array<{
    currency: string;
    count: number;
    total: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  transactionId: string;
  sessionId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

const CustomerDetail: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'NG'
    } as {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country: string;
    },
    description: ''
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: 'requested_by_customer'
  });
  
  // Form states
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'NGN',
    description: '',
    paymentMethod: 'card'
  });
  const [invoiceForm, setInvoiceForm] = useState({
    amount: '',
    currency: 'NGN',
    description: '',
    dueDate: ''
  });
  // DISABLED - Payment Method Form
  // const [paymentMethodForm, setPaymentMethodForm] = useState({
  //   type: 'card',
  //   cardNumber: '',
  //   expiryMonth: '',
  //   expiryYear: '',
  //   cvv: '',
  //   cardholderName: '',
  //   billingAddress: {
  //     line1: '',
  //     line2: '',
  //     city: '',
  //     state: '',
  //     postalCode: '',
  //     country: 'NG'
  //   },
  //   phone: '',
  //   isDefault: true
  // });
  
  const [submitting, setSubmitting] = useState(false);

  const API_BASE = 'https://transactlab-backend.onrender.com/api/v1/sandbox';

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch customer details first
      const customerRes = await fetch(`${API_BASE}/customers`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (customerRes.ok) {
        const customerData = await customerRes.json();
        const foundCustomer = customerData.data.find((c: CustomerData) => c._id === customerId);
        setCustomer(foundCustomer || null);
        
        // Now fetch transactions and invoices using the found customer's email
        if (foundCustomer) {
          // Fetch sessions for this specific customer
          const sessionsRes = await fetch(`${API_BASE}/debug/customer-sessions?email=${encodeURIComponent(foundCustomer.email)}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (sessionsRes.ok) {
            const sessionsData = await sessionsRes.json();
            const customerSessions = sessionsData.data?.sessions || [];
            // Convert sessions to transaction format for display
            const sessionTransactions = customerSessions.map((s: any) => ({
              transactionId: s.sessionId,
              sessionId: s.sessionId,
              amount: s.amount,
              currency: s.currency,
              description: s.description,
              customerEmail: s.customerEmail,
              status: s.status,
              createdAt: s.completedAt || s.createdAt,
              paymentMethod: 'card' // Default for sandbox
            }));
            setTransactions(sessionTransactions);
          }

          // Fetch invoices for this customer
          const invoicesRes = await fetch(`${API_BASE}/invoices?customerEmail=${encodeURIComponent(foundCustomer.email)}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (invoicesRes.ok) {
            const invoicesData = await invoicesRes.json();
            setInvoices(invoicesData.data || []);
          }

          // Fetch subscriptions for this customer
          const subscriptionsRes = await fetch(`${API_BASE}/subscriptions?customerEmail=${encodeURIComponent(foundCustomer.email)}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (subscriptionsRes.ok) {
            const subscriptionsData = await subscriptionsRes.json();
            // Use the data as returned from the backend (already normalized)
            const normalized = subscriptionsData.data || [];
            setSubscriptions(normalized);
          }

          // Fetch refunds for this customer
          const refundsRes = await fetch(`${API_BASE}/refunds?customerEmail=${encodeURIComponent(foundCustomer.email)}`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (refundsRes.ok) {
            const refundsData = await refundsRes.json();
            setRefunds(refundsData.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch customer data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCustomer = async () => {
    try {
      if (!customer) return;
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/customers/${customer._id}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to export');
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer-${customer.customerId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: 'Customer data downloaded' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to export customer', variant: 'destructive' });
    }
  };

  const handleOpenEdit = () => {
    if (!customer) return;
    setEditForm({ 
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'NG'
      },
      description: customer.description || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!customer) return;
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/customers/${customer._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchCustomerData();
      setShowEditModal(false);
      toast({ title: 'Updated', description: 'Customer updated successfully' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update customer', variant: 'destructive' });
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      if (!customer) return;
      if (!confirm('Are you sure you want to delete this customer? This cannot be undone.')) return;
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/customers/${customer._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Deleted', description: 'Customer deleted' });
      navigate('/sandbox/customers');
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' });
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'successful':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'refunded':
        return <XCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'successful':
        return <Badge className="bg-green-100 text-green-800">Succeeded</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'refunded':
        return <Badge className="bg-orange-100 text-orange-800">Refunded</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Form handlers
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseInt(paymentForm.amount) * 100, // Convert to cents
          currency: paymentForm.currency,
          description: paymentForm.description,
          customerEmail: customer?.email,
          customerName: customer?.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: 'Payment session created successfully',
        });
        setShowCreatePayment(false);
        setPaymentForm({ amount: '', currency: 'NGN', description: '', paymentMethod: 'card' });
        // Redirect to checkout
        navigate(`/checkout/${data.data.sessionId}`);
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create payment session',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseInt(invoiceForm.amount) * 100, // Convert to cents
          currency: invoiceForm.currency,
          description: invoiceForm.description,
          customerEmail: customer?.email,
          customerName: customer?.name,
          dueDate: invoiceForm.dueDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: 'Invoice created successfully',
        });
        setShowCreateInvoice(false);
        setInvoiceForm({ amount: '', currency: 'NGN', description: '', dueDate: '' });
        // Refresh customer data to show new invoice
        fetchCustomerData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invoice');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create invoice',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // DISABLED - Add Payment Method Handler
  // const handleAddPaymentMethod = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setSubmitting(true);
  //   
  //   try {
  //     const token = localStorage.getItem('accessToken');
  //     const response = await fetch(`${API_BASE}/payment-methods`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({
  //         customerEmail: customer?.email,
  //         customerName: customer?.name,
  //         type: paymentMethodForm.type,
  //         cardDetails: {
  //           cardNumber: paymentMethodForm.cardNumber.replace(/\s/g, ''),
  //           expMonth: parseInt(paymentMethodForm.expiryMonth),
  //           expYear: parseInt('20' + paymentMethodForm.expiryYear),
  //           cvv: paymentMethodForm.cvv,
  //           cardholderName: paymentMethodForm.cardholderName,
  //           billingAddress: paymentMethodForm.billingAddress,
  //           phone: paymentMethodForm.phone
  //         },
  //         isDefault: paymentMethodForm.isDefault
  //       })
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       toast({
  //         title: 'Success',
  //         description: 'Payment method added successfully',
  //       });
  //       setShowAddPaymentMethod(false);
  //       setPaymentMethodForm({
  //         type: 'card',
  //         cardNumber: '',
  //         expiryMonth: '',
  //         expiryYear: '',
  //         cvv: '',
  //         cardholderName: '',
  //         billingAddress: {
  //           line1: '',
  //           line2: '',
  //           city: '',
  //           state: '',
  //           postalCode: '',
  //           country: 'NG'
  //         },
  //         phone: '',
  //         isDefault: true
  //       });
  //       // Refresh customer data to show new payment method
  //       fetchCustomerData();
  //     } else {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || 'Failed to add payment method');
  //     }
  //   } catch (error) {
  //     toast({
  //       title: 'Error',
  //       description: error instanceof Error ? error.message : 'Failed to add payment method',
  //       variant: 'destructive'
  //     });
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  // DISABLED - Card Number Formatter
  // const formatCardNumber = (value: string) => {
  //   return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  // };

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(.{2})/, '$1/');
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleInvoiceClick = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  // Find an invoice that corresponds to a given transaction
  const findInvoiceForTransaction = (tx: Transaction | null) => {
    if (!tx || !invoices || invoices.length === 0) return null;
    // Prefer direct session linkage, then fallback to heuristic match
    const bySession = invoices.find((inv: any) => inv.sessionId && inv.sessionId === tx.sessionId);
    if (bySession) return bySession;
    const byHeuristic = invoices.find(
      (inv: any) =>
        inv.customerEmail === tx.customerEmail &&
        inv.amount === tx.amount &&
        inv.currency === tx.currency
    );
    return byHeuristic || null;
  };

  const handleViewInvoiceForTransaction = async () => {
    const tx = selectedTransaction;
    const invoice = findInvoiceForTransaction(tx);
    if (invoice) {
      setSelectedInvoice(invoice);
      setShowInvoiceModal(true);
      return;
    }

    // If no invoice, create one quickly then open it
    try {
      const token = localStorage.getItem('accessToken');
      if (!tx || !token) throw new Error('Missing context to create invoice');

      const response = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: tx.amount,
          currency: tx.currency,
          description: tx.description || 'Auto-generated from transaction',
          customerEmail: tx.customerEmail,
          customerName: customer?.name,
          // Soft-link this invoice to the session for future lookups
          sessionId: tx.sessionId
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to create invoice');
      }

      const created = await response.json();
      const createdInvoice = created?.data;
      if (createdInvoice) {
        setSelectedInvoice(createdInvoice);
        setShowInvoiceModal(true);
        // refresh invoices list for this customer
        fetchCustomerData();
      } else {
        throw new Error('Invoice creation returned no data');
      }
    } catch (err) {
      console.error('Auto-create invoice error:', err);
      toast({
        title: 'Invoice not available',
        description: 'Could not create an invoice for this payment.',
        variant: 'destructive'
      });
    }
  };

  const mapTxStatusToInvoiceStatus = (status: string): 'paid' | 'sent' | 'draft' | 'overdue' | 'cancelled' => {
    const s = (status || '').toLowerCase();
    if (s === 'successful' || s === 'completed') return 'paid';
    if (s === 'failed') return 'cancelled';
    if (s === 'pending') return 'sent';
    return 'draft';
  };

  const handleDownloadReceiptForTransaction = () => {
    if (!selectedTransaction) return;

    const linkedInvoice = findInvoiceForTransaction(selectedTransaction);

    try {
      generateReceiptPDF({
        transactionId: selectedTransaction.transactionId || selectedTransaction.sessionId,
        sessionId: selectedTransaction.sessionId,
        customerEmail: selectedTransaction.customerEmail,
        customerName: customer?.name,
        amount: selectedTransaction.amount,
        currency: selectedTransaction.currency,
        description: selectedTransaction.description,
        createdAt: selectedTransaction.createdAt,
        status: selectedTransaction.status,
        paymentMethod: selectedTransaction.paymentMethod
      });
      toast({ title: 'Success', description: 'Receipt downloaded successfully' });
    } catch (err) {
      console.error('Error generating receipt PDF:', err);
      toast({ title: 'Error', description: 'Failed to generate receipt', variant: 'destructive' });
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Invoice sent successfully',
        });
        fetchCustomerData(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invoice');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invoice',
        variant: 'destructive'
      });
    }
  };

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paidAmount: selectedInvoice?.amount
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Invoice marked as paid',
        });
        setShowInvoiceModal(false);
        fetchCustomerData(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark invoice as paid');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark invoice as paid',
        variant: 'destructive'
      });
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedInvoice) return;
    
    try {
      const invoiceData: InvoiceData = {
        invoiceId: selectedInvoice.invoiceId,
        customerEmail: selectedInvoice.customerEmail,
        customerName: selectedInvoice.customerName,
        amount: selectedInvoice.amount,
        currency: selectedInvoice.currency,
        description: selectedInvoice.description,
        dueDate: selectedInvoice.dueDate,
        createdAt: selectedInvoice.createdAt,
        status: selectedInvoice.status,
        paidAt: selectedInvoice.paidAt,
        paidAmount: selectedInvoice.paidAmount
      };
      
      generateInvoicePDF(invoiceData);
      
      toast({
        title: 'Success',
        description: 'Invoice PDF downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive'
      });
    }
  };

  const handleRefundTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId: selectedTransaction.sessionId, // Use sessionId as transactionId for sandbox
          amount: refundForm.amount ? parseInt(refundForm.amount) * 100 : selectedTransaction.amount, // Convert to cents
          reason: refundForm.reason,
          customerEmail: selectedTransaction.customerEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: `Refund of ${formatAmount(data.data.amount, data.data.currency)} processed successfully`,
        });
        setShowRefundModal(false);
        setRefundForm({ amount: '', reason: 'requested_by_customer' });
        // Refresh customer data to show updated transaction
        fetchCustomerData();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Not Found</h2>
          <p className="text-gray-600 mb-4">The customer you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/sandbox/customers')}>
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/sandbox/customers')}
            className="mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Customers</span>
            <span className="sm:hidden">Back</span>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{customer.name}</h1>
              <div className="flex items-center mt-1 sm:mt-2 text-gray-600">
                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center mt-1 text-gray-600">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{customer.phone}</span>
                </div>
              )}
              {customer.address?.city && customer.address?.state && (
                <div className="flex items-center mt-1 text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{customer.address.city}, {customer.address.state}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => setShowCreatePayment(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create Payment</span>
                <span className="sm:hidden">Payment</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => setShowCreateInvoice(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Invoice</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => setShowMoreActions(!showMoreActions)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Spent</p>
                      <div className="space-y-1">
                        {customer.transactionsByCurrency.map((tx, idx) => (
                          <p key={idx} className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                            {formatAmount(tx.total, tx.currency)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Transactions</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{customer.totalTransactions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Customer Since</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {new Date(customer.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {transactions.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.transactionId} 
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          {getStatusIcon(transaction.status)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {formatAmount(transaction.amount, transaction.currency)}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{transaction.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1 sm:gap-2">
                          {getStatusBadge(transaction.status)}
                          <p className="text-xs sm:text-sm text-gray-600">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600">No payments found for this customer</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {invoices.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {invoices.map((invoice) => (
                      <div 
                        key={invoice._id} 
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleInvoiceClick(invoice)}
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {formatAmount(invoice.amount, invoice.currency)}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{invoice.description}</p>
                            <p className="text-xs text-gray-500">
                              Due: {formatDate(invoice.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1 sm:gap-2">
                          {getInvoiceStatusBadge(invoice.status)}
                          <p className="text-xs sm:text-sm text-gray-600">
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600">No invoices found for this customer</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscriptions */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {subscriptions.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {subscriptions.map((subscription) => (
                      <div 
                        key={subscription._id} 
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => navigate(`/sandbox/subscriptions/${subscription.subscriptionId}`)}
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {subscription.planName || 'Subscription Plan'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {formatAmount(subscription.planAmount || 0, subscription.currency || 'NGN')} / {subscription.planInterval || 'month'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Next billing: {formatDate(subscription.currentPeriodEnd)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1 sm:gap-2">
                          <Badge className={
                            subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                            subscription.status === 'canceled' ? 'bg-red-100 text-red-800' :
                            subscription.status === 'past_due' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {subscription.status}
                          </Badge>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {formatDate(subscription.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600">No subscriptions found for this customer</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => navigate('/sandbox/subscriptions')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Subscription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Refunds */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Refunds
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {refunds.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {refunds.map((refund) => (
                      <div 
                        key={refund._id} 
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4"
                      >
                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                          <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                            <XCircle className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {formatAmount(refund.amount, refund.currency)}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              Transaction: {refund.transactionId}
                            </p>
                            <p className="text-xs text-gray-500">
                              Reason: {refund.reason?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1 sm:gap-2">
                          <Badge className={
                            refund.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                            refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            refund.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {refund.status}
                          </Badge>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {formatDate(refund.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600">No refunds found for this customer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Customer Details */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Customer ID</label>
                  <p className="text-xs sm:text-sm text-gray-900 font-mono break-all">{customer.customerId}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Email</label>
                  <p className="text-xs sm:text-sm text-gray-900 break-all">{customer.email}</p>
                </div>
                {customer.phone && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-xs sm:text-sm text-gray-900">{customer.phone}</p>
                  </div>
                )}
                {customer.address && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Address</label>
                    <div className="text-xs sm:text-sm text-gray-900">
                      {customer.address.line1 && <p>{customer.address.line1}</p>}
                      {customer.address.line2 && <p>{customer.address.line2}</p>}
                      {(customer.address.city || customer.address.state) && (
                        <p>{[customer.address.city, customer.address.state].filter(Boolean).join(', ')}</p>
                      )}
                      {customer.address.postalCode && <p>{customer.address.postalCode}</p>}
                      {customer.address.country && <p>{customer.address.country}</p>}
                    </div>
                  </div>
                )}
                {customer.description && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-600">Description</label>
                    <p className="text-xs sm:text-sm text-gray-900">{customer.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Customer Since</label>
                  <p className="text-xs sm:text-sm text-gray-900">{formatDate(customer.createdAt)}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-xs sm:text-sm text-gray-900">{formatDate(customer.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {transactions.slice(0, 3).map((transaction) => (
                    <div key={transaction.transactionId} className="flex items-start space-x-2 sm:space-x-3">
                      <div className="p-1 bg-gray-100 rounded-full flex-shrink-0">
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-900 leading-tight">
                          Payment for {formatAmount(transaction.amount, transaction.currency)} was {transaction.status}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Payment Modal */}
        {showCreatePayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold">Create Payment</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreatePayment(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleCreatePayment} className="p-6 space-y-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={paymentForm.currency} onValueChange={(value) => setPaymentForm({...paymentForm, currency: value})}>
                    <SelectTrigger>
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                    placeholder="Payment description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Create Payment
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreatePayment(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Invoice Modal */}
        {showCreateInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold">Create Invoice</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateInvoice(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
                <div>
                  <Label htmlFor="invoice-amount">Amount</Label>
                  <Input
                    id="invoice-amount"
                    type="number"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="invoice-currency">Currency</Label>
                  <Select value={invoiceForm.currency} onValueChange={(value) => setInvoiceForm({...invoiceForm, currency: value})}>
                    <SelectTrigger>
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
                  <Label htmlFor="invoice-description">Description</Label>
                  <Textarea
                    id="invoice-description"
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})}
                    placeholder="Invoice description"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                    Create Invoice
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateInvoice(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enhanced Add Payment Method Modal - DISABLED */}
        {/* <EnhancedPaymentMethodModal
          show={showAddPaymentMethod}
          onClose={() => setShowAddPaymentMethod(false)}
          onSubmit={handleAddPaymentMethod}
          form={paymentMethodForm}
          setForm={setPaymentMethodForm}
          submitting={submitting}
          formatCardNumber={formatCardNumber}
        /> */}

        {/* Transaction Details Modal */}
        {showTransactionModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Transaction Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTransactionModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                {/* Transaction Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      {getStatusIcon(selectedTransaction.status)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                      </h3>
                      <p className="text-gray-600">{selectedTransaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(selectedTransaction.status)}
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(selectedTransaction.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Transaction Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                      <p className="text-sm text-gray-900 font-mono break-all">{selectedTransaction.transactionId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Session ID</label>
                      <p className="text-sm text-gray-900 font-mono break-all">{selectedTransaction.sessionId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Customer Email</label>
                      <p className="text-sm text-gray-900">{selectedTransaction.customerEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Method</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedTransaction.paymentMethod}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Amount</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Currency</label>
                      <p className="text-sm text-gray-900">{selectedTransaction.currency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedTransaction.status)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date & Time</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedTransaction.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                {selectedTransaction.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                      {selectedTransaction.description}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={handleDownloadReceiptForTransaction}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleViewInvoiceForTransaction}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Invoice
                  </Button>
                  {(selectedTransaction.status === 'successful' || selectedTransaction.status === 'completed') ? (
                    <Button 
                      variant="outline" 
                      className="flex-1 text-orange-600 hover:text-orange-700" 
                      onClick={() => setShowRefundModal(true)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Refund
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={() => setShowTransactionModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Details Modal */}
        {showInvoiceModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Invoice Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInvoiceModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                {/* Invoice Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {formatAmount(selectedInvoice.amount, selectedInvoice.currency)}
                      </h3>
                      <p className="text-gray-600">{selectedInvoice.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getInvoiceStatusBadge(selectedInvoice.status)}
                    <p className="text-sm text-gray-500 mt-1">
                      Due: {formatDate(selectedInvoice.dueDate)}
                    </p>
                  </div>
                </div>

                {/* Invoice Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Invoice ID</label>
                      <p className="text-sm text-gray-900 font-mono break-all">{selectedInvoice.invoiceId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Customer Email</label>
                      <p className="text-sm text-gray-900">{selectedInvoice.customerEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Customer Name</label>
                      <p className="text-sm text-gray-900">{selectedInvoice.customerName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        {getInvoiceStatusBadge(selectedInvoice.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Amount</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatAmount(selectedInvoice.amount, selectedInvoice.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Currency</label>
                      <p className="text-sm text-gray-900">{selectedInvoice.currency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Due Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedInvoice.dueDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedInvoice.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Description Section */}
                {selectedInvoice.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                      {selectedInvoice.description}
                    </p>
                  </div>
                )}

                {/* Payment Information */}
                {selectedInvoice.status === 'paid' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Payment Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-600">Paid Amount:</span>
                        <span className="ml-2 font-medium">{formatAmount(selectedInvoice.paidAmount || selectedInvoice.amount, selectedInvoice.currency)}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Paid Date:</span>
                        <span className="ml-2 font-medium">{formatDate(selectedInvoice.paidAt)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedInvoice.status === 'draft' && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleSendInvoice(selectedInvoice._id)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invoice
                    </Button>
                  )}
                  {selectedInvoice.status === 'sent' && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleMarkInvoicePaid(selectedInvoice._id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* More Actions Dropdown */}
        {showMoreActions && (
          <div className="fixed inset-0 bg-transparent z-40" onClick={() => setShowMoreActions(false)}>
            <div className="absolute top-20 right-4 bg-white border rounded-lg shadow-lg p-2 min-w-[200px]">
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                setShowMoreActions(false);
                handleExportCustomer();
              }}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                setShowMoreActions(false);
                handleOpenEdit();
              }}>
                <User className="w-4 h-4 mr-2" />
                Edit Customer
              </Button>
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700" onClick={() => {
                setShowMoreActions(false);
                handleDeleteCustomer();
              }}>
                <X className="w-4 h-4 mr-2" />
                Delete Customer
              </Button>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold">Edit Customer</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Full Name *</Label>
                      <Input 
                        id="edit-name" 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Phone Number</Label>
                      <Input 
                        id="edit-phone" 
                        value={editForm.phone} 
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
                        placeholder="+234 800 000 0000"
                      />
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
                      <Label htmlFor="edit-line1">Address Line 1</Label>
                      <Input 
                        id="edit-line1" 
                        value={editForm.address.line1} 
                        onChange={(e) => setEditForm({...editForm, address: {...editForm.address, line1: e.target.value}})} 
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-line2">Address Line 2</Label>
                      <Input 
                        id="edit-line2" 
                        value={editForm.address.line2} 
                        onChange={(e) => setEditForm({...editForm, address: {...editForm.address, line2: e.target.value}})} 
                        placeholder="Apartment, suite, etc."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-city">City</Label>
                        <Input 
                          id="edit-city" 
                          value={editForm.address.city} 
                          onChange={(e) => setEditForm({...editForm, address: {...editForm.address, city: e.target.value}})} 
                          placeholder="Lagos"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-state">State/Province</Label>
                        <Input 
                          id="edit-state" 
                          value={editForm.address.state} 
                          onChange={(e) => setEditForm({...editForm, address: {...editForm.address, state: e.target.value}})} 
                          placeholder="Lagos State"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-postalCode">Postal Code</Label>
                        <Input 
                          id="edit-postalCode" 
                          value={editForm.address.postalCode} 
                          onChange={(e) => setEditForm({...editForm, address: {...editForm.address, postalCode: e.target.value}})} 
                          placeholder="100001"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-country">Country</Label>
                      <Select value={editForm.address.country} onValueChange={(value) => setEditForm({...editForm, address: {...editForm.address, country: value}})}>
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

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Additional Information
                  </h3>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea 
                      id="edit-description" 
                      value={editForm.description} 
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                      placeholder="Additional notes about this customer..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button type="submit" className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
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
                    <strong>Amount:</strong> {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Description:</strong> {selectedTransaction.description}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Transaction ID:</strong> {selectedTransaction.sessionId}
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
                    Maximum refund: {formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
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
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
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
    </div>
  );
};

export default CustomerDetail;
