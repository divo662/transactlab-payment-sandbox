import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api, { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SDKSetup() {
  const [configJson, setConfigJson] = useState("");
  const [envPreview, setEnvPreview] = useState<string>("");
  const [mode, setMode] = useState<'one_time' | 'subscription' | 'both'>("one_time");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("NGN");
  const [planId, setPlanId] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [interval, setInterval] = useState<string>("month");
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [bakedFiles, setBakedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();

  const exampleConfig = `{
  "apiKey": "sk_test_secret_...",
  "baseUrl": "https://transactlab-backend.onrender.com/api/v1",
  "urls": {
    "success": "http://localhost:3000/?payment=success",
    "cancel": "http://localhost:3000/?payment=cancel",
    "callback": "http://localhost:3000/webhooks/transactlab",
    "frontend": "http://localhost:3000"
  }
}`;

  function handleGenerateEnv() {
    try {
      const cfg = JSON.parse(configJson || "{}");
      const base = (cfg.baseUrl || "https://transactlab-backend.onrender.com/api/v1").replace(/\/$/, "");
      const sandbox = `${base}/sandbox`;
      const env = [
        `TL_BASE=${sandbox}`,
        `TL_SECRET=${cfg.apiKey || ""}`,
        `TL_WEBHOOK_SECRET=${cfg.webhookSecret || ""}`,
        `FRONTEND_URL=${cfg.urls?.frontend || "http://localhost:3000"}`,
        `PORT=3000`
      ].join("\n");
      setEnvPreview(env + "\n");
    } catch (_e) {
      setEnvPreview("Invalid JSON");
    }
  }

  useEffect(() => {
    // Load existing defaults from backend settings
    (async () => {
      try {
        const resp = await apiService.getCheckoutSettings();
        const d = resp?.data || resp;
        const sdk = d?.sdkDefaults || {};
        if (sdk.paymentMode) setMode(sdk.paymentMode);
        if (sdk.amount != null) setAmount(String(sdk.amount));
        if (sdk.currency) setCurrency(sdk.currency);
        if (sdk.planId) setPlanId(sdk.planId);
        if (sdk.productName) setProductName(sdk.productName);
        if (sdk.interval) setInterval(sdk.interval);
      } catch (_) {}
      try {
        const productsResp = await apiService.listSandboxProducts();
        const list = productsResp?.data || productsResp || [];
        setProducts(Array.isArray(list) ? list : []);
      } catch (_) {}
      setInitialLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const product = products.find((p:any) => p.name === productName);
        const r = await apiService.listSandboxPlans(product?._id || product?.id);
        const list = r?.data || r || [];
        setPlans(Array.isArray(list) ? list : []);
      } catch (_) {}
    })();
  }, [productName, products]);

  async function handleSaveDefaults() {
    const payload = {
      paymentMode: mode,
      amount: amount ? Number(amount) : undefined,
      currency,
      planId: planId || undefined,
      productName: productName || undefined,
      interval
    };
    await apiService.updateSdkDefaults(payload);
  }

  if (initialLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>

        {/* API Keys Section Skeleton */}
        <div className="space-y-2 border rounded-md p-3 sm:p-4">
          <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Payment Defaults Section Skeleton */}
        <div className="space-y-3 border rounded-md p-3 sm:p-4">
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-80 animate-pulse"></div>
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Config JSON Section Skeleton */}
        <div className="space-y-2 border rounded-md p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-3">
            <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-28 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Env Preview Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Next Steps Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading SDK setup...</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-[#0a164d]">SDK Setup</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Paste the generated SDK config JSON, then copy the .env for your SDK bundle.</p>
      </div>

      {/* 1) Keys & environment first */}
      <div className="space-y-2 border rounded-md p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-medium">Choose API key and environment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs sm:text-sm">Sandbox Secret (x-sandbox-secret)</Label>
            <Input 
              placeholder="sk_test_secret_..." 
              value={(JSON.parse(configJson||'{}')?.apiKey)||''} 
              onChange={e=>{
                try { const j = JSON.parse(configJson||'{}'); j.apiKey = e.target.value; setConfigJson(JSON.stringify(j, null, 2)); } catch {}
              }} 
              className="text-xs sm:text-sm"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">Frontend URL</Label>
            <Input 
              placeholder="http://localhost:3000" 
              value={(JSON.parse(configJson||'{}')?.urls?.frontend)||''} 
              onChange={e=>{
                try { const j = JSON.parse(configJson||'{}'); j.urls = j.urls||{}; j.urls.frontend = e.target.value; setConfigJson(JSON.stringify(j, null, 2)); } catch {}
              }} 
              className="text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* 2) Payment defaults */}
      <div className="space-y-3 border rounded-md p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-medium">Payment defaults</h3>
        <p className="text-xs text-muted-foreground">These will be embedded in the generated SDK as sdk-defaults.json.</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <label className="flex items-center gap-2 text-xs sm:text-sm">
            <input type="radio" name="mode" checked={mode === 'one_time'} onChange={() => setMode('one_time')} className="w-3 h-3 sm:w-4 sm:h-4" />
            One-time
          </label>
          <label className="flex items-center gap-2 text-xs sm:text-sm">
            <input type="radio" name="mode" checked={mode === 'subscription'} onChange={() => setMode('subscription')} className="w-3 h-3 sm:w-4 sm:h-4" />
            Subscription
          </label>
          <label className="flex items-center gap-2 text-xs sm:text-sm">
            <input type="radio" name="mode" checked={mode === 'both'} onChange={() => setMode('both' as any)} className="w-3 h-3 sm:w-4 sm:h-4" />
            Both
          </label>
        </div>
        {(mode === 'one_time' || mode === 'both') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <Label className="text-xs sm:text-sm">Amount (major units)</Label>
              <Input 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="25000" 
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Currency</Label>
              <Input 
                value={currency} 
                onChange={e => setCurrency(e.target.value)} 
                placeholder="NGN" 
                className="text-xs sm:text-sm"
              />
            </div>
          </div>
        )}

        {(mode === 'subscription' || mode === 'both') && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <Label className="text-xs sm:text-sm">Product</Label>
              <select 
                className="w-full border rounded-md h-8 sm:h-9 px-2 text-xs sm:text-sm" 
                value={productName} 
                onChange={e => setProductName(e.target.value)}
              >
                <option value="">Select a product</option>
                {products.map((p:any) => (
                  <option key={p._id || p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Plan</Label>
              <select 
                className="w-full border rounded-md h-8 sm:h-9 px-2 text-xs sm:text-sm" 
                value={planId} 
                onChange={e => setPlanId(e.target.value)}
              >
                <option value="">Select a plan (optional)</option>
                {plans.map((pl:any) => (
                  <option key={pl._id || pl.id || pl.planId} value={pl.planId || pl._id || pl.id}>
                    {pl.name || pl.planName || pl.planId}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Interval</Label>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mt-1">
                <Button 
                  type="button" 
                  variant={interval==='month'?undefined:'outline'} 
                  onClick={()=>setInterval('month')}
                  className="text-xs sm:text-sm h-7 sm:h-8"
                >
                  Monthly
                </Button>
                <Button 
                  type="button" 
                  variant={interval==='quarter'?undefined:'outline'} 
                  onClick={()=>setInterval('quarter')}
                  className="text-xs sm:text-sm h-7 sm:h-8"
                >
                  Quarterly
                </Button>
                <Button 
                  type="button" 
                  variant={interval==='year'?undefined:'outline'} 
                  onClick={()=>setInterval('year')}
                  className="text-xs sm:text-sm h-7 sm:h-8"
                >
                  Yearly
                </Button>
              </div>
            </div>
            <div className="sm:col-span-3 text-xs text-muted-foreground">If no planId, SDK can create a plan from product + amount/currency/interval.</div>
          </div>
        )}

        <div className="mt-3">
          <Button onClick={handleSaveDefaults} className="text-xs sm:text-sm h-8 sm:h-9">
            Save defaults
          </Button>
        </div>
      </div>
      {/* 3) Config JSON + actions */}
      <div className="space-y-2 border rounded-md p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div>
            <Label className="text-xs sm:text-sm">transactlab-magic/config.json</Label>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setConfigJson(exampleConfig)}
            className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
          >
            Load template
          </Button>
        </div>
        <Textarea 
          value={configJson} 
          onChange={e => setConfigJson(e.target.value)} 
          rows={8} 
          placeholder={exampleConfig} 
          className="text-xs sm:text-sm"
        />
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            disabled={loading} 
            onClick={() => { try { handleGenerateEnv(); toast({ title: 'Generated', description: '.env template ready' }); } catch {} }}
            className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
          >
            Generate .env
          </Button>
          <Button 
            variant="secondary" 
            disabled={loading} 
            onClick={async () => {
              try {
                setLoading(true);
                const cfg = JSON.parse(configJson || '{}');
                const resp = await apiService.bakeMagicSdk({
                  successUrl: cfg.urls?.success,
                  cancelUrl: cfg.urls?.cancel,
                  callbackUrl: cfg.urls?.callback,
                  frontendUrl: cfg.urls?.frontend,
                  sandboxSecret: cfg.apiKey,
                  encrypt: false,
                  sdkDefaults: {
                    paymentMode: mode,
                    amount: amount ? Number(amount) : undefined,
                    currency,
                    planId: planId || undefined,
                    productName: productName || undefined,
                    interval
                  }
                });
                const files = resp?.data?.files || [];
                setBakedFiles(files);
                const content = files?.[0]?.contents;
                if (content) setConfigJson(content);
                setReviewOpen(true);
                toast({ title: 'SDK prepared', description: 'Review and download the zip' });
              } catch (e:any) { toast({ title: 'Generate SDK failed', description: String(e?.message||'Unknown error'), variant: 'destructive' }); }
              finally { setLoading(false); }
            }}
            className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
          >
            Generate SDK
          </Button>
          <Button 
            variant="outline" 
            disabled={loading} 
            onClick={async ()=>{
              try{
                setLoading(true);
                const cfg = JSON.parse(configJson || '{}');
                const blob = await apiService.downloadMagicSdkZip({
                  successUrl: cfg.urls?.success,
                  cancelUrl: cfg.urls?.cancel,
                  callbackUrl: cfg.urls?.callback,
                  frontendUrl: cfg.urls?.frontend,
                  sandboxSecret: cfg.apiKey,
                  encrypt: false,
                  sdkDefaults: {
                    paymentMode: mode,
                    amount: amount ? Number(amount) : undefined,
                    currency,
                    planId: planId || undefined,
                    productName: productName || undefined,
                    interval
                  }
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'transactlab-magic.zip'; a.click();
                URL.revokeObjectURL(url);
                toast({ title: 'Download started', description: 'transactlab-magic.zip' });
              }catch(e:any){ toast({ title: 'Download failed', description: String(e?.message||'Unknown error'), variant: 'destructive' }); }
              finally { setLoading(false); }
            }}
            className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
          >
            Download SDK Zip
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs sm:text-sm">.env (copy into project root)</Label>
        <Textarea value={envPreview} readOnly rows={6} className="text-xs sm:text-sm" />
      </div>

      {/* Review Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg mx-2 sm:mx-0 max-h-[95vh] overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold">Review SDK</h3>
              <Button 
                variant="ghost" 
                onClick={()=>setReviewOpen(false)}
                className="text-xs sm:text-sm h-8 sm:h-9"
              >
                Close
              </Button>
            </div>
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label className="text-xs sm:text-sm">config.json</Label>
                <Textarea 
                  readOnly 
                  rows={8} 
                  value={(bakedFiles.find(f=>f.path?.includes('config.json'))?.contents) || configJson} 
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm">sdk-defaults.json</Label>
                <Textarea 
                  readOnly 
                  rows={6} 
                  value={JSON.stringify({
                    paymentMode: mode,
                    amount: amount ? Number(amount) : undefined,
                    currency,
                    planId: planId || undefined,
                    productName: productName || undefined,
                    interval
                  }, null, 2)} 
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button 
                  onClick={async ()=>{
                    try{
                      const cfg = JSON.parse(configJson || '{}');
                      const blob = await apiService.downloadMagicSdkZip({
                        successUrl: cfg.urls?.success,
                        cancelUrl: cfg.urls?.cancel,
                        callbackUrl: cfg.urls?.callback,
                        frontendUrl: cfg.urls?.frontend,
                        sandboxSecret: cfg.apiKey,
                        encrypt: false,
                        sdkDefaults: {
                          paymentMode: mode,
                          amount: amount ? Number(amount) : undefined,
                          currency,
                          planId: planId || undefined,
                          productName: productName || undefined,
                          interval
                        }
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'transactlab-magic.zip'; a.click();
                      URL.revokeObjectURL(url);
                    }catch(_){ }
                  }}
                  className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                >
                  Download SDK Zip
                </Button>
                <Button 
                  variant="outline" 
                  onClick={()=>setReviewOpen(false)}
                  className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs sm:text-sm">Next steps</Label>
        <ol className="text-xs sm:text-sm list-decimal pl-4 sm:pl-5 space-y-1">
          <li>Save `transactlab-magic/config.json` with your dashboard JSON.</li>
          <li>Run `node transactlab-magic/magic-setup.js`.</li>
          <li>`npm i` then `node transactlab-magic/samples/express-server.js`.</li>
        </ol>
      </div>

      {/* Documentation CTA */}
      <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Read Our Documentation
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://transactlab-payment-sandbox.vercel.app/transactlab-docs', '_blank')}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-6 py-3"
            >
              View API Reference
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


