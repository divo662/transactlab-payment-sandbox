import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  Activity, 
  Download,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Webhook,
  Key,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AnalyticsData {
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    totalAmount: number;
    averageAmount: number;
    successRate: number;
    dailyData: Array<{ date: string; count: number; amount: number }>;
    monthlyData: Array<{ month: string; count: number; amount: number }>;
  };
  customers: {
    total: number;
    newThisMonth: number;
    active: number;
    topCustomers: Array<{ email: string; totalSpent: number; transactionCount: number }>;
    growthRate: number;
  };
  apiUsage: {
    totalRequests: number;
    requestsThisMonth: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; count: number; successRate: number }>;
  };
  webhooks: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    recentEvents: Array<{ event: string; status: string; timestamp: string; responseTime: number }>;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
    byCurrency: Array<{ currency: string; amount: number; percentage: number }>;
    dailyRevenue: Array<{ date: string; amount: number }>;
  };
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAnalyticsOverview(timeRange);
      
      if ((response as any).success) {
        setData((response as any).data);
      } else {
        throw new Error((response as any).message || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast({
      title: 'Analytics Updated',
      description: 'Your analytics data has been refreshed.',
    });
  };

  const handleExport = async (type: string) => {
    try {
      const response = await apiService.exportAnalytics(type, 'json', timeRange);
      
      if ((response as any).success) {
        // Create and download the file
        const dataStr = JSON.stringify((response as any).data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-analytics-${timeRange}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Export Complete',
          description: `${type} data has been downloaded successfully.`,
        });
      } else {
        throw new Error((response as any).message || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d]"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-600">Unable to load analytics data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">
              Monitor your payment performance, customer insights, and API usage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.revenue.total)}</p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(data.revenue.growthRate)}
                  <span className={`text-sm font-medium ${getGrowthColor(data.revenue.growthRate)}`}>
                    {formatPercentage(data.revenue.growthRate)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.transactions.total)}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    {formatPercentage(data.transactions.successRate)} success rate
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.customers.total)}</p>
                <div className="flex items-center mt-1">
                  {getGrowthIcon(data.customers.growthRate)}
                  <span className={`text-sm font-medium ${getGrowthColor(data.customers.growthRate)}`}>
                    {formatPercentage(data.customers.growthRate)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">growth</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Requests</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.apiUsage.totalRequests)}</p>
                <div className="flex items-center mt-1">
                  <Activity className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600 font-medium">
                    {data.apiUsage.averageResponseTime}ms avg
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Transaction Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Transaction Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatNumber(data.transactions.successful)}</p>
                  <p className="text-sm text-green-700">Successful</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{formatNumber(data.transactions.failed)}</p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span className="font-medium">{formatPercentage(data.transactions.successRate)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${data.transactions.successRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Average Transaction Value</p>
                <p className="text-xl font-semibold">{formatCurrency(data.transactions.averageAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Currency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue by Currency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.revenue.byCurrency.map((currency, index) => (
                <div key={currency.currency} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{currency.currency}</span>
                    <span>{formatCurrency(currency.amount, currency.currency)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${currency.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">{formatPercentage(currency.percentage)} of total revenue</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Usage and Webhooks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* API Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{formatNumber(data.apiUsage.requestsThisMonth)}</p>
                  <p className="text-sm text-blue-700">This Month</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{data.apiUsage.averageResponseTime}ms</p>
                  <p className="text-sm text-orange-700">Avg Response</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Error Rate</span>
                  <span className="font-medium">{formatPercentage(data.apiUsage.errorRate)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${data.apiUsage.errorRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Top Endpoints</p>
                <div className="space-y-2">
                  {data.apiUsage.topEndpoints.map((endpoint, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{endpoint.endpoint}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatNumber(endpoint.count)}</span>
                        <Badge className={endpoint.successRate > 95 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {formatPercentage(endpoint.successRate)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatNumber(data.webhooks.successful)}</p>
                  <p className="text-sm text-green-700">Successful</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{formatNumber(data.webhooks.failed)}</p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span className="font-medium">{formatPercentage(data.webhooks.successRate)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${data.webhooks.successRate}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Recent Events</p>
                <div className="space-y-2">
                  {data.webhooks.recentEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{event.event}</span>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                      <span className="text-gray-500">{event.responseTime}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.customers.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.email}</p>
                    <p className="text-sm text-gray-500">{customer.transactionCount} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                  <p className="text-sm text-gray-500">Total spent</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => handleExport('transactions')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Transaction Report
            </Button>
            <Button
              onClick={() => handleExport('customers')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Customer Report
            </Button>
            <Button
              onClick={() => handleExport('revenue')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Revenue Report
            </Button>
            <Button
              onClick={() => handleExport('api')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              API Usage Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions for generating mock data
function generateDailyData(days: number) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 50) + 10,
      amount: Math.floor(Math.random() * 5000) + 1000
    });
  }
  return data;
}

function generateMonthlyData(months: number) {
  const data = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    data.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count: Math.floor(Math.random() * 500) + 100,
      amount: Math.floor(Math.random() * 50000) + 10000
    });
  }
  return data;
}

function generateDailyRevenue(days: number) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 2000) + 500
    });
  }
  return data;
}

export default Analytics;
