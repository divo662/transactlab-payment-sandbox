import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSEO } from "@/hooks/use-seo";
import { useAuth } from "@/contexts/AuthContext";
import { useSandbox } from "@/contexts/SandboxContext";
import { TrendingUp, RefreshCw, Calendar } from "lucide-react";
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MetricCard = ({ title, value, subtitle, isLoading }: { title: string; value: string | number; subtitle?: string; isLoading?: boolean }) => (
  <Card className="border rounded-xl">
    <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
      <CardTitle className="text-xs sm:text-sm text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      ) : (
        <>
          <div className="text-lg sm:text-2xl font-semibold text-[#0a164d] break-words">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1 break-words">{subtitle}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  useSEO("Sandbox Dashboard — TransactLab", "Developer sandbox for testing payment integrations and APIs.");
  const { user } = useAuth();
  const { isSandboxMode, switchToSandboxMode, getSandboxStats } = useSandbox();
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState<any>({});
  const [period, setPeriod] = React.useState<string>('5 Aug, 2025 — 4 Sep, 2025');
  const [frequency, setFrequency] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [product, setProduct] = React.useState<string>('one-time');
  const [startDate, setStartDate] = React.useState<string>('2025-08-05');
  const [endDate, setEndDate] = React.useState<string>('2025-09-04');

  // Ensure sandbox mode is enabled for all users
  React.useEffect(() => {
    if (!isSandboxMode) {
      switchToSandboxMode();
    }
  }, [isSandboxMode, switchToSandboxMode]);

  const baseCurrency = stats?.currency || 'NGN';
  const userCurrency = (user as any)?.preferences?.currency || 'NGN';

  // Simple client-side conversion table relative to NGN
  const rates: Record<string, number> = {
    NGN: 1,
    USD: 0.00075, // example
    EUR: 0.00069,
    GBP: 0.00059,
    KES: 0.116,
    GHS: 0.010,
  };

  const convert = (amount: number, from: string, to: string) => {
    const fromRate = rates[from] ?? 1;
    const toRate = rates[to] ?? 1;
    // normalize to NGN then to target when base is NGN; otherwise cross using rates
    const inNgn = amount / fromRate; // since NGN is base 1
    return inNgn * toRate;
  };

  const fmt = (amount: number) => {
    const v = convert(amount || 0, baseCurrency, userCurrency);
    return `${userCurrency} ${Number(v).toLocaleString()}`;
  };

  const updatePeriod = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPeriod(`${new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — ${new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`);
  };

  const setQuickRange = (range: 'today' | '7d' | '30d' | '90d') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (range) {
      case 'today':
        updatePeriod(todayStr, todayStr);
        break;
      case '7d':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        updatePeriod(weekAgo.toISOString().split('T')[0], todayStr);
        break;
      case '30d':
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        updatePeriod(monthAgo.toISOString().split('T')[0], todayStr);
        break;
      case '90d':
        const quarterAgo = new Date(today);
        quarterAgo.setDate(today.getDate() - 90);
        updatePeriod(quarterAgo.toISOString().split('T')[0], todayStr);
        break;
    }
  };

  const loadStats = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSandboxStats({ product: product as any });
      if (res?.success) setStats(res.data || {});
    } finally {
      setLoading(false);
    }
  }, [getSandboxStats, product]);

  React.useEffect(() => { void loadStats(); }, [loadStats]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sandbox dashboard...</p>
        </div>
      </div>
    );
  }

  if (loading && Object.keys(stats).length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-enter p-3 sm:p-0">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-3 sm:p-6">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="border rounded-lg p-3 sm:p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="h-64 sm:h-80 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-enter p-3 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0a164d]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadStats()} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? (
              <span>Refreshing...</span>
            ) : (
              <>
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh Data</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          {/* Date Range Picker */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">Date Range</span>
            </div>
            <div className="flex-1 space-y-3">
              {/* Quick Range Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRange('today')}
                  className="text-xs h-7 px-2"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRange('7d')}
                  className="text-xs h-7 px-2"
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRange('30d')}
                  className="text-xs h-7 px-2"
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRange('90d')}
                  className="text-xs h-7 px-2"
                >
                  Last 90 days
                </Button>
              </div>
              
              {/* Custom Date Range */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    className="w-full text-sm h-9"
                    onChange={(e) => updatePeriod(e.target.value, endDate)}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-gray-400 text-sm">—</span>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    className="w-full text-sm h-9"
                    onChange={(e) => updatePeriod(startDate, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          <Separator className="sm:hidden" />

          {/* Frequency Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
            <span className="text-sm font-medium text-gray-700">Frequency:</span>
            <Select value={frequency} onValueChange={(v)=>setFrequency(v as any)}>
              <SelectTrigger className="w-full sm:w-[120px] border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />
          <Separator className="sm:hidden" />

          {/* Product Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
            <span className="text-sm font-medium text-gray-700">Products:</span>
            <Select value={product} onValueChange={(v)=>setProduct(v)}>
              <SelectTrigger className="w-full sm:w-[160px] border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]">
                <SelectValue placeholder="All Products"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="subscriptions">Subscriptions</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Metrics Grid (real stats from backend sessions) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="All revenue" value={fmt(stats.allRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevAllRevenue ?? 0)} last period`} isLoading={loading} />
        <MetricCard title="New orders" value={stats.newOrders ?? 0} subtitle={`vs. ${stats.prevNewOrders ?? 0} last period`} isLoading={loading} />
        <MetricCard title="New order revenue" value={fmt(stats.newOrderRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevNewOrderRevenue ?? 0)} last period`} isLoading={loading} />
        <MetricCard title="Avg. order revenue" value={fmt(stats.avgOrderRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevAvgOrderRevenue ?? 0)} last period`} isLoading={loading} />
        <MetricCard title="Subscription renewals revenue" value={fmt(stats.subscriptionRenewalsRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevSubscriptionRenewalsRevenue ?? 0)} last period`} isLoading={loading} />
        <MetricCard title="New subscriptions" value={stats.newSubscriptions ?? 0} subtitle={`vs. ${stats.prevNewSubscriptions ?? 0} last period`} isLoading={loading} />
        <MetricCard title="Monthly recurring revenue" value={fmt(stats.mrr ?? 0)} subtitle={`vs. ${fmt(stats.prevMrr ?? 0)} last period`} isLoading={loading} />
        <MetricCard title="Refunds" value={stats.refundsCount ?? 0} subtitle={`vs. ${stats.prevRefundsCount ?? 0} last period`} isLoading={loading} />
        <MetricCard title="Abandoned cart revenue" value={fmt(stats.abandonedCartRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevAbandonedCartRevenue ?? 0)} last period`} isLoading={loading} />
      </div>

      {/* Simple sparkline/placeholder */}
      <Card className="border">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4"/> 
            <span className="hidden sm:inline">Revenue trend</span>
            <span className="sm:hidden">Revenue</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {loading ? (
            <div className="space-y-4">
              {/* Chart Loading Skeleton */}
              <div className="h-64 sm:h-80 bg-gray-200 rounded animate-pulse"></div>
              {/* Breakdown Loading Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded p-2 sm:p-3">
                    <div className="flex justify-between items-center mb-1">
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Professional chart with recharts */}
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.series || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        // Shorter format for mobile
                        const v = convert(value || 0, baseCurrency, userCurrency);
                        return `${userCurrency} ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                      }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: string) => [
                        name === 'revenue' ? fmt(value) : value,
                        name === 'revenue' ? 'Revenue' : name.charAt(0).toUpperCase() + name.slice(1)
                      ]}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#0a164d" 
                      strokeWidth={2}
                      dot={{ fill: '#0a164d', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, stroke: '#0a164d', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Breakdown hover tips */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                {(stats.breakdown || []).map((b: any, idx: number) => (
                  <div key={idx} className="border rounded p-2 sm:p-3 hover:bg-gray-50 transition-colors" title={`${b.orders} orders in ${b.currency} ≈ ${fmt(b.converted)}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{b.currency}</span>
                      <span className="text-[#0a164d] font-semibold">{fmt(b.converted)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {b.orders} orders
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />
    </div>
  );
};

export default Dashboard;
