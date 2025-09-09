import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMerchant } from "@/contexts/MerchantContext";
import { transactionApi, TransactionResponse, TransactionStats } from "@/lib/transactionApi";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  CreditCard
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import NewTransaction from "@/components/merchant/NewTransaction";

const MerchantTransactions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { merchant, isProfileComplete } = useMerchant();
  
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalAmount: 0,
    successCount: 0,
    successRate: 0,
    avgTransactionValue: 0
  });

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "success", label: "Success" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded", label: "Refunded" }
  ];

  const paymentMethodOptions = [
    { value: "all", label: "All Methods" },
    { value: "card", label: "Credit/Debit Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "ussd", label: "USSD" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "wallet", label: "Digital Wallet" }
  ];

  const dateRangeOptions = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "1y", label: "Last year" }
  ];

  // Check if merchant profile is complete
  useEffect(() => {
    if (!isProfileComplete) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your business profile to access transactions.",
        variant: "destructive"
      });
    }
  }, [isProfileComplete, toast]);

  // Fetch transactions from backend
  useEffect(() => {
    if (isProfileComplete && merchant?.id) {
      fetchTransactions();
      fetchTransactionStats();
    }
  }, [isProfileComplete, merchant?.id, status, paymentMethod, dateRange]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params: any = {};
      if (status !== "all") params.status = status;
      if (paymentMethod !== "all") params.payment_method = paymentMethod;
      if (dateRange !== "30d") params.period = dateRange;
      if (query) params.search = query;

      const response = await transactionApi.getTransactions(params);
      
      if (response.success) {
        setTransactions(response.data.transactions || []);
      } else {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch transactions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionStats = async () => {
    try {
      const response = await transactionApi.getTransactionStats(dateRange);
      
      if (response.success) {
        setStats(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExportTransactions = async () => {
    try {
      const params: any = {};
      if (status !== "all") params.status = status;
      if (paymentMethod !== "all") params.payment_method = paymentMethod;
      if (dateRange !== "30d") params.period = dateRange;
      params.format = 'csv';

      const blob = await transactionApi.exportTransactions(params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Transactions exported successfully",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export transactions",
        variant: "destructive"
      });
    }
  };

  const handleCompleteProfile = () => {
    navigate('/dashboard');
    toast({
      title: "Complete Your Profile",
      description: "Please complete your business profile to access transactions.",
      variant: "default"
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      success: { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      refunded: { color: "bg-blue-100 text-blue-800", icon: TrendingDown }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const methodIcons = {
      card: "💳",
      bank_transfer: "🏦",
      ussd: "📱",
      mobile_money: "📲",
      wallet: "👛"
    };
    return methodIcons[method as keyof typeof methodIcons] || "💳";
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols = { NGN: "₦", USD: "$", EUR: "€", GBP: "£" };
    const symbol = symbols[currency as keyof typeof symbols] || currency;
    return `${symbol}${amount.toLocaleString()}`;
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

  // If profile is not complete, show completion prompt
  if (!isProfileComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Business Profile</h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            To access transactions and start processing payments, you need to complete your business profile verification.
            This includes business information, verification documents, and payment method setup.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={handleCompleteProfile}
              size="lg"
              className="bg-gradient-to-r from-[#0a164d] to-[#1a2a6b] hover:from-[#08123a] hover:to-[#0a164d]"
            >
              Complete Profile
            </Button>
            <p className="text-sm text-gray-500">
              This will take you to the dashboard to complete your profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage and monitor all your payment transactions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-[#0a164d] to-[#1a2a6b] hover:from-[#08123a] hover:to-[#0a164d]">
              <Plus className="h-4 w-4" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
            </DialogHeader>
            <NewTransaction />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount, 'NGN')}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.avgTransactionValue, 'NGN')}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="glass-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions ({transactions.length})</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleExportTransactions}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#0a164d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 mb-4">
                {query || status !== "all" || paymentMethod !== "all" 
                  ? "Try adjusting your filters or search terms"
                  : "Start by creating your first transaction"
                }
              </p>
              {!query && status === "all" && paymentMethod === "all" && (
                <Button onClick={() => document.querySelector('[data-radix-dialog-trigger]')?.click()}>
                  Create Transaction
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium font-mono text-sm">
                        {transaction.reference}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.customerName || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{transaction.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Fee: {formatCurrency(transaction.fees, transaction.currency)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPaymentMethodIcon(transaction.paymentMethod)}</span>
                          <span className="text-sm capitalize">
                            {transaction.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(transaction.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantTransactions;
