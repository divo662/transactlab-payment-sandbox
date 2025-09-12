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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0a164d]">SDK Setup</h2>
        <p className="text-sm text-muted-foreground">Paste the generated SDK config JSON, then copy the .env for your SDK bundle.</p>
      </div>

      {/* 1) Keys & environment first */}
      <div className="space-y-2 border rounded-md p-4">
        <h3 className="text-base font-medium">Choose API key and environment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label>Sandbox Secret (x-sandbox-secret)</Label>
            <Input placeholder="sk_test_secret_..." value={(JSON.parse(configJson||'{}')?.apiKey)||''} onChange={e=>{
              try { const j = JSON.parse(configJson||'{}'); j.apiKey = e.target.value; setConfigJson(JSON.stringify(j, null, 2)); } catch {}
            }} />
          </div>
          <div>
            <Label>Frontend URL</Label>
            <Input placeholder="http://localhost:3000" value={(JSON.parse(configJson||'{}')?.urls?.frontend)||''} onChange={e=>{
              try { const j = JSON.parse(configJson||'{}'); j.urls = j.urls||{}; j.urls.frontend = e.target.value; setConfigJson(JSON.stringify(j, null, 2)); } catch {}
            }} />
          </div>
        </div>
      </div>

      {/* 2) Payment defaults */}
      <div className="space-y-3 border rounded-md p-4">
        <h3 className="text-base font-medium">Payment defaults</h3>
        <p className="text-xs text-muted-foreground">These will be embedded in the generated SDK as sdk-defaults.json.</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" checked={mode === 'one_time'} onChange={() => setMode('one_time')} />
            One-time
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" checked={mode === 'subscription'} onChange={() => setMode('subscription')} />
            Subscription
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="mode" checked={mode === 'both'} onChange={() => setMode('both' as any)} />
            Both
          </label>
        </div>
        {(mode === 'one_time' || mode === 'both') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <Label>Amount (major units)</Label>
              <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="25000" />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="NGN" />
            </div>
          </div>
        )}

        {(mode === 'subscription' || mode === 'both') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <Label>Product</Label>
              <select className="w-full border rounded-md h-9 px-2" value={productName} onChange={e => setProductName(e.target.value)}>
                <option value="">Select a product</option>
                {products.map((p:any) => (
                  <option key={p._id || p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Plan</Label>
              <select className="w-full border rounded-md h-9 px-2" value={planId} onChange={e => setPlanId(e.target.value)}>
                <option value="">Select a plan (optional)</option>
                {plans.map((pl:any) => (
                  <option key={pl._id || pl.id || pl.planId} value={pl.planId || pl._id || pl.id}>
                    {pl.name || pl.planName || pl.planId}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Interval</Label>
              <div className="flex gap-2 mt-1">
                <Button type="button" variant={interval==='month'?undefined:'outline'} onClick={()=>setInterval('month')}>Monthly</Button>
                <Button type="button" variant={interval==='quarter'?undefined:'outline'} onClick={()=>setInterval('quarter')}>Quarterly</Button>
                <Button type="button" variant={interval==='year'?undefined:'outline'} onClick={()=>setInterval('year')}>Yearly</Button>
              </div>
            </div>
            <div className="md:col-span-3 text-xs text-muted-foreground">If no planId, SDK can create a plan from product + amount/currency/interval.</div>
          </div>
        )}

        <div className="mt-3">
          <Button onClick={handleSaveDefaults}>Save defaults</Button>
        </div>
      </div>
      {/* 3) Config JSON + actions */}
      <div className="space-y-2 border rounded-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>transactlab-magic/config.json</Label>
          </div>
          <Button variant="outline" onClick={() => setConfigJson(exampleConfig)}>Load template</Button>
        </div>
        <Textarea value={configJson} onChange={e => setConfigJson(e.target.value)} rows={10} placeholder={exampleConfig} />
        <div className="flex gap-3">
          <Button disabled={loading} onClick={() => { try { handleGenerateEnv(); toast({ title: 'Generated', description: '.env template ready' }); } catch {} }}>Generate .env</Button>
          <Button variant="secondary" disabled={loading} onClick={async () => {
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
          }}>Generate SDK</Button>
          <Button variant="outline" disabled={loading} onClick={async ()=>{
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
          }}>Download SDK Zip</Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>.env (copy into project root)</Label>
        <Textarea value={envPreview} readOnly rows={8} />
      </div>

      {/* Review Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review SDK</h3>
              <Button variant="ghost" onClick={()=>setReviewOpen(false)}>Close</Button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label>config.json</Label>
                <Textarea readOnly rows={10} value={(bakedFiles.find(f=>f.path?.includes('config.json'))?.contents) || configJson} />
              </div>
              <div>
                <Label>sdk-defaults.json</Label>
                <Textarea readOnly rows={8} value={JSON.stringify({
                  paymentMode: mode,
                  amount: amount ? Number(amount) : undefined,
                  currency,
                  planId: planId || undefined,
                  productName: productName || undefined,
                  interval
                }, null, 2)} />
              </div>
              <div className="flex gap-3">
                <Button onClick={async ()=>{
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
                }}>Download SDK Zip</Button>
                <Button variant="outline" onClick={()=>setReviewOpen(false)}>Done</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Next steps</Label>
        <ol className="text-sm list-decimal pl-5 space-y-1">
          <li>Save `transactlab-magic/config.json` with your dashboard JSON.</li>
          <li>Run `node transactlab-magic/magic-setup.js`.</li>
          <li>`npm i` then `node transactlab-magic/samples/express-server.js`.</li>
        </ol>
      </div>
    </div>
  );
}


