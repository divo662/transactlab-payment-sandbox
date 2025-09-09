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

const MetricCard = ({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) => (
  <Card className="border rounded-xl">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold text-[#0a164d]">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
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

  return (
    <div className="space-y-6 animate-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0a164d]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadStats()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value="2025-08-05" 
                className="w-[140px] text-sm"
                onChange={(e) => {
                  // Handle date change
                  const startDate = e.target.value;
                  const endDate = "2025-09-04"; // Default end date
                  setPeriod(`${new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — ${new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`);
                }}
              />
              <span className="text-gray-400">—</span>
              <Input 
                type="date" 
                value="2025-09-04" 
                className="w-[140px] text-sm"
                onChange={(e) => {
                  // Handle end date change
                  const startDate = "2025-08-05"; // Default start date
                  const endDate = e.target.value;
                  setPeriod(`${new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} — ${new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`);
                }}
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Frequency Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Frequency:</span>
            <Select value={frequency} onValueChange={(v)=>setFrequency(v as any)}>
              <SelectTrigger className="w-[120px] border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Product Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Products:</span>
            <Select value={product} onValueChange={(v)=>setProduct(v)}>
              <SelectTrigger className="w-[160px] border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]">
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
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="All revenue" value={fmt(stats.allRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevAllRevenue ?? 0)} last period`} />
        <MetricCard title="New orders" value={stats.newOrders ?? 0} subtitle={`vs. ${stats.prevNewOrders ?? 0} last period`} />
        <MetricCard title="New order revenue" value={fmt(stats.newOrderRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevNewOrderRevenue ?? 0)} last period`} />
        <MetricCard title="Avg. order revenue" value={fmt(stats.avgOrderRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevAvgOrderRevenue ?? 0)} last period`} />
        <MetricCard title="Subscription renewals revenue" value={fmt(stats.subscriptionRenewalsRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevSubscriptionRenewalsRevenue ?? 0)} last period`} />
        <MetricCard title="New subscriptions" value={stats.newSubscriptions ?? 0} subtitle={`vs. ${stats.prevNewSubscriptions ?? 0} last period`} />
        <MetricCard title="Monthly recurring revenue" value={fmt(stats.mrr ?? 0)} subtitle={`vs. ${fmt(stats.prevMrr ?? 0)} last period`} />
        <MetricCard title="Refunds" value={stats.refundsCount ?? 0} subtitle={`vs. ${stats.prevRefundsCount ?? 0} last period`} />
        <MetricCard title="Abandoned cart revenue" value={fmt(stats.abandonedCartRevenue ?? 0)} subtitle={`vs. ${fmt(stats.prevAbandonedCartRevenue ?? 0)} last period`} />
      </div>

      {/* Simple sparkline/placeholder */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Revenue trend</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Professional chart with recharts */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.series || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => fmt(value)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0a164d" 
                  strokeWidth={3}
                  dot={{ fill: '#0a164d', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#0a164d', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Breakdown hover tips */}
          <div className="mt-3 grid md:grid-cols-3 gap-2 text-sm text-muted-foreground">
            {(stats.breakdown || []).map((b: any, idx: number) => (
              <div key={idx} className="border rounded p-2 hover:bg-gray-50" title={`${b.orders} orders in ${b.currency} ≈ ${fmt(b.converted)}`}>
                <div className="flex justify-between">
                  <span>{b.currency}</span>
                  <span>{fmt(b.converted)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />
    </div>
  );
};

export default Dashboard;
