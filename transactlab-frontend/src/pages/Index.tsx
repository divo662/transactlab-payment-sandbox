import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Code, Webhook, Database, Zap, Shield, Globe, Rocket, ChevronDown } from "lucide-react";

const Index = () => {
  useEffect(() => {
    document.title = "TransactLab - Developer Sandbox for Payment Testing";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
              <a href="#home" className="hover:text-black">Overview</a>
              <a href="#features" className="hover:text-black">Features</a>
              <a href="#sandbox" className="hover:text-black">Sandbox</a>
              <a href="#developers" className="hover:text-black">Developers</a>
              <a href="#how-it-works" className="hover:text-black">How it works</a>
              <a href="#test-data" className="hover:text-black">Test data</a>
              <a href="/docs" className="hover:text-black">Docs</a>
            </nav>
            <Link to="/" className="text-xl font-semibold tracking-tight text-black">
              TransactLab
              </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/auth/login" className="text-gray-700 hover:text-black">Log in</Link>
              <Link to="/auth/register">
                <Button className="h-8 rounded-full px-4 bg-black text-white hover:bg-black/90">Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-10 sm:py-14 bg-white">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl sm:rounded-4xl bg-black text-white">
            {/* glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_10%_0%,rgba(34,197,94,0.25),transparent_60%),radial-gradient(40%_40%_at_90%_10%,rgba(59,130,246,0.2),transparent_60%)]" />
            {/* subtle grid */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[linear-gradient(transparent_23px,rgba(255,255,255,0.08)_24px),linear-gradient(90deg,transparent_23px,rgba(255,255,255,0.08)_24px)] bg-[length:24px_24px]" />

            <div className="relative px-6 sm:px-12 pt-16 pb-20">
              <h1 className="text-5xl sm:text-6xl font-semibold leading-tight tracking-tight">
                Your money is
                <br />
                <span className="text-white/90">where you are</span>
          </h1>
              <p className="mt-5 max-w-xl text-white/70">
                Stand up a production‑like payment gateway sandbox. Generate API keys,
                create checkout sessions and simulate end‑to‑end webhooks for Paystack,
                Stripe, Flutterwave and more — with zero real money involved.
              </p>
              <div className="mt-8">
            <Link to="/auth/register">
                  <Button className="rounded-full bg-white text-black hover:bg-white/90 h-11 px-6">
                    Get Sandbox Access
              </Button>
            </Link>
          </div>
          
              {/* key bullets from README */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-4xl text-white/80 text-sm">
                <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                  <p className="font-medium text-white">Gateway sandbox</p>
                  <p className="mt-1">Alternative to Paystack, Stripe, Flutterwave, PayPal and Square for safe testing.</p>
                </div>
                <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                  <p className="font-medium text-white">Webhook simulation</p>
                  <p className="mt-1">Test delivery, retries and error scenarios with realistic payloads.</p>
                </div>
                <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
                  <p className="font-medium text-white">API keys & sessions</p>
                  <p className="mt-1">Create API keys, checkout sessions and end‑to‑end payment flows.</p>
                </div>
              </div>

              {/* mock dashboard */}
              <div className="mt-14 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-6">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Play className="w-3.5 h-3.5" />
                    </div>
                    <span>Sandbox dashboard</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Live</span>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-black/40 ring-1 ring-white/10 p-4">
                    <p className="text-xs text-white/60">API calls today</p>
                    <p className="mt-2 text-2xl font-semibold">0</p>
                    <p className="text-xs text-white/50 mt-1">sandbox requests</p>
                  </div>
                  <div className="rounded-xl bg-black/40 ring-1 ring-white/10 p-4">
                    <p className="text-xs text-white/60">Webhook deliveries</p>
                    <p className="mt-2 text-2xl font-semibold">0</p>
                    <p className="text-xs text-white/50 mt-1">last 24h</p>
                  </div>
                  <div className="rounded-xl bg-black/40 ring-1 ring-white/10 p-4">
                    <p className="text-xs text-white/60">Checkout sessions</p>
                    <p className="mt-2 text-2xl font-semibold">0</p>
                    <p className="text-xs text-white/50 mt-1">active</p>
                  </div>
                  <div className="rounded-xl bg-black/40 ring-1 ring-white/10 p-4">
                    <p className="text-xs text-white/60">Subscriptions</p>
                    <p className="mt-2 text-2xl font-semibold">0</p>
                    <p className="text-xs text-white/50 mt-1">test plans</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl h-36 bg-gradient-to-br from-white/5 to-white/0 ring-1 ring-white/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

   

      {/* Daily Finance / Transfer Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-100">
              Sandbox Capabilities
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900">
              Efficiency for developers: a payment
              <br /> gateway sandbox
            </h2>
            <p className="mt-3 text-gray-500">Build, test and debug payment integrations with realistic data and webhooks.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* left copy */}
            <div>
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                Checkout & Transfers
              </div>
              <h3 className="mt-4 text-3xl font-semibold text-gray-900">Global payments: your
                <br /> gateway to secure
                <br /> transactions
              </h3>
              <p className="mt-4 text-gray-600 max-w-prose">
                TransactLab emulates popular gateways so you can prototype checkout, payments,
                refunds and transfers using sample data, FX rates and realistic response codes.
              </p>
            </div>

            {/* right mock card */}
            <div className="relative">
              <div className="mx-auto w-full max-w-md rounded-3xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
                <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5">
                  <p className="text-gray-800 font-medium">Amount</p>
                  <p className="text-xs text-gray-500 mt-1">Send Money</p>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                    <div>
                      <div className="text-lg font-semibold">€2,129</div>
                      <div className="text-[11px] text-gray-500">Balance: €5,950.00</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="h-6 w-6 rounded-full bg-blue-600" /> EUR
                    </div>
                  </div>

                  <p className="mt-6 text-xs text-gray-500">Who are you sending money to?</p>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">JS</div>
                      <span className="text-sm text-gray-800">John Smith</span>
                    </div>
                    <div className="h-5 w-5 rounded-full bg-gray-200" />
                  </div>

                  <Button className="mt-6 w-full h-11 rounded-full bg-black text-white hover:bg-black/90">Confirm and Send</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 3 soft cards tailored to sandbox */}
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900">API Analytics</h4>
              <p className="mt-2 text-sm text-gray-600">Inspect per‑gateway request counts and latency statistics.</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-emerald-500" />
                    <span className="text-sm text-gray-800">Paystack</span>
                  </div>
                  <span className="text-sm text-gray-600">0 req • 0 ms</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-indigo-500" />
                    <span className="text-sm text-gray-800">Stripe</span>
                  </div>
                  <span className="text-sm text-gray-600">0 req • 0 ms</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-yellow-500" />
                    <span className="text-sm text-gray-800">Flutterwave</span>
                  </div>
                  <span className="text-sm text-gray-600">0 req • 0 ms</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900">Webhook Testing</h4>
              <p className="mt-2 text-sm text-gray-600">Simulate events and verify delivery, retries, and signatures.</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-xl bg-white border border-gray-200 px-4 py-3">
                  <div className="text-sm text-gray-800">0</div>
                  <div className="text-[11px] text-gray-500">Delivered • last 24h</div>
                </div>
                <div className="rounded-xl bg-white border border-gray-200 px-4 py-3">
                  <div className="text-sm text-gray-800">0</div>
                  <div className="text-[11px] text-gray-500">Retries • last 24h</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900">Test Data</h4>
              <p className="mt-2 text-sm text-gray-600">Work with generated customers, products and cards.</p>
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-sky-400" />
                    <span className="text-sm text-gray-800">Customers</span>
                  </div>
                  <span className="text-sm text-gray-600">25+</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="text-sm text-gray-800">Products</span>
                  </div>
                  <span className="text-sm text-gray-600">15+</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="text-sm text-gray-800">Test cards</span>
                  </div>
                  <span className="text-sm text-gray-600">Multiple</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

   {/* Feature Timeline Section */}
   <section id="feature-timeline" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-100">
              Feature Timeline
            </div>
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">Explore TransactLab features</h2>
            <p className="mt-3 text-gray-600">Click a feature to preview its sandbox experience.</p>
          </div>
          <div className="mx-auto max-w-5xl mb-10 text-sm text-gray-600">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 list-disc pl-5">
                <li><span className="font-medium text-gray-800">API Keys</span>: Workspace‑scoped keys for server/client; rotate and revoke safely.</li>
                <li><span className="font-medium text-gray-800">Webhook Simulation</span>: Send test events with signatures, latency and retry controls.</li>
                <li><span className="font-medium text-gray-800">Checkout Sessions</span>: Canonical redirect returns an absolute hosted URL for customers.</li>
                <li><span className="font-medium text-gray-800">Transactions</span>: Create, fail or pend payments to test success and error paths.</li>
                <li><span className="font-medium text-gray-800">Subscriptions</span>: Plans, renewals and cancellations with realistic schedule math.</li>
                <li><span className="font-medium text-gray-800">Fraud Flagging</span>: Toggle common risk signals (velocity, IP mismatch, BIN rules).</li>
                <li><span className="font-medium text-gray-800">Team Collaboration</span>: Invite roles to share API keys, webhooks and data.</li>
                <li><span className="font-medium text-gray-800">Workspaces</span>: Isolated sandboxes for multi‑project or multi‑client setups.</li>
              </ul>
            </div>
          </div>

          {(() => {
            const featureItems = [
              { key: "api-keys", label: "API Keys", description: "Generate, scope and rotate test keys for your workspace.", how: "Use publishable keys on the client and secret keys on the server. Rotate any key instantly and audit usage by environment." },
              { key: "webhooks", label: "Webhook Simulation", description: "Trigger events and verify signatures with retry logic.", how: "Configure an endpoint and send signed events. Adjust delays and simulate 2xx/4xx responses to test retries." },
              { key: "checkout", label: "Checkout Sessions", description: "Create sessions and redirect users to a hosted test checkout.", how: "Create a session via API and redirect customers to the canonical absolute URL. Supports success/cancel return URLs." },
              { key: "transactions", label: "Transactions", description: "Create, capture and refund test payments with realistic states.", how: "Drive transactions through success, failure or pending states and inspect structured error objects for debugging." },
              { key: "subscriptions", label: "Subscriptions", description: "Test recurring billing, plan changes and cancellations.", how: "Emulate trial periods, proration and renewal events. Fire webhook notices for invoice.created/paid." },
              { key: "fraud", label: "Fraud Flagging", description: "Surface risky signals and flagged test transactions.", how: "Flip flags like velocity_high or ip_mismatch to see how your app responds to risk assessment." },
              { key: "team", label: "Team Collaboration", description: "Invite teammates and share sandbox resources.", how: "Assign roles (Owner/Developer/Viewer) and limit access to keys, sessions and webhooks by workspace." },
              { key: "workspaces", label: "Workspaces", description: "Isolated environments for keys, data and settings.", how: "Create multiple sandboxes to separate clients or projects. Each workspace has its own keys and data." }
            ];

            const [activeKey, setActiveKey] = useState<string>(featureItems[0].key);

            const Preview = () => {
              switch (activeKey) {
                case "api-keys":
                  return (
                    <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
                      <div className="rounded-2xl bg-white border border-gray-100 p-5">
                        <p className="text-sm font-medium text-gray-900">Test API Keys</p>
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                            <div>
                              <div className="text-xs text-gray-500">Publishable</div>
                              <div className="font-mono text-sm">tl_pk_test_1a2b…9z</div>
                            </div>
                            <Button className="h-8 px-3 rounded-full bg-black text-white hover:bg-black/90">Rotate</Button>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                            <div>
                              <div className="text-xs text-gray-500">Secret</div>
                              <div className="font-mono text-sm">tl_sk_test_2c3d…8y</div>
                            </div>
                            <Button className="h-8 px-3 rounded-full bg-black text-white hover:bg-black/90">Reveal</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                case "webhooks":
                  return (
                    <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
                      <div className="rounded-2xl bg-white border border-gray-100 p-5">
                        <p className="text-sm font-medium text-gray-900">Webhook Delivery</p>
                        <div className="mt-4 grid sm:grid-cols-2 gap-3">
                          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                            <div className="text-xs text-gray-500">Endpoint</div>
                            <div className="font-mono text-xs truncate">https://example.com/webhook</div>
                          </div>
                          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                            <div className="text-xs text-gray-500">Event</div>
                            <div className="text-sm">transaction.completed</div>
                          </div>
                        </div>
                        <Button className="mt-4 rounded-full bg-black text-white hover:bg-black/90 h-10 px-5">Send Test Event</Button>
                      </div>
                    </div>
                  );
                case "checkout":
                  return (
                    <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
                      <div className="rounded-2xl bg-white border border-gray-100 p-5">
                        <p className="text-sm font-medium text-gray-900">Hosted Checkout</p>
                        <div className="mt-4 rounded-xl h-32 bg-gradient-to-br from-gray-50 to-white ring-1 ring-gray-200" />
                        <div className="mt-3 text-xs text-gray-500">Canonical redirect with absolute checkout URL</div>
                      </div>
                    </div>
                  );
                case "transactions":
                  return (
                    <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
                      <div className="rounded-2xl bg-white border border-gray-100 p-5">
                        <p className="text-sm font-medium text-gray-900">Transaction Simulation</p>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {["Success", "Failed", "Pending"].map(s => (
                            <div key={s} className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
                              <div className="text-sm font-medium text-gray-800">{s}</div>
                              <div className="text-[11px] text-gray-500">card • NGN</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                case "subscriptions":
                  return (
                    <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
                      <div className="rounded-2xl bg-white border border-gray-100 p-5">
                        <p className="text-sm font-medium text-gray-900">Subscriptions</p>
                        <div className="mt-4 grid sm:grid-cols-3 gap-3">
                          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                            <div className="text-xs text-gray-500">Plan</div>
                            <div className="text-sm">Starter • $9/mo</div>
                          </div>
                          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                            <div className="text-xs text-gray-500">Status</div>
                            <div className="text-sm">Active</div>
                          </div>
                          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                            <div className="text-xs text-gray-500">Next charge</div>
                            <div className="text-sm">in 30 days</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                case "fraud":
                  return (
                    <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
                      <div className="rounded-2xl bg-white border border-gray-100 p-5">
                        <p className="text-sm font-medium text-gray-900">Fraud Signals</p>
                        <div className="mt-4 space-y-2">
                          {["velocity_high", "ip_mismatch", "stolen_card_test"].map(tag => (
                            <div key={tag} className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-2">
                              <span className="text-sm text-gray-800">{tag}</span>
                              <span className="text-xs rounded-full px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200">flagged</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                case "team":
                  return (
                    <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
                      <div className="rounded-2xl bg-white border border-gray-100 p-5">
                        <p className="text-sm font-medium text-gray-900">Team Collaboration</p>
                        <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                          {["Owner", "Developer", "Viewer"].map(role => (
                            <div key={role} className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                              <div className="font-medium text-gray-800">{role}</div>
                              <div className="text-[11px] text-gray-500">sample permissions</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                case "workspaces":
                default:
                  return (
                    <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 shadow-sm">
                      <div className="rounded-2xl bg-white border border-gray-100 p-5">
                        <p className="text-sm font-medium text-gray-900">Workspaces</p>
                        <div className="mt-4 grid sm:grid-cols-2 gap-3">
                          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                            <div className="text-xs text-gray-500">Sandbox A</div>
                            <div className="text-sm">api-keys • webhooks • data</div>
                          </div>
                          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                            <div className="text-xs text-gray-500">Sandbox B</div>
                            <div className="text-sm">isolated environment</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
              }
            };

            return (
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                <aside className="lg:col-span-4">
                  <ol className="space-y-2">
                    {featureItems.map(item => (
                      <li key={item.key}>
                        <button
                          onClick={() => setActiveKey(item.key)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                            activeKey === item.key
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                              : "bg-white border-gray-200 hover:bg-gray-50 text-gray-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`h-2.5 w-2.5 rounded-full ${activeKey === item.key ? "bg-emerald-500" : "bg-gray-300"}`} />
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ol>
                </aside>
                <div className="lg:col-span-8">
                  <Preview />
                  <div className="mt-4 text-sm text-gray-600">
                    {featureItems.find(f => f.key === activeKey)?.how}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Sandbox Features Section (redesigned) */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-100">Why TransactLab</div>
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">Complete developer sandbox</h2>
            <p className="mt-3 text-gray-600 max-w-3xl mx-auto">Mirror real payment processor behavior with zero‑risk data and events.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Code className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">API testing</h3>
              <p className="text-sm text-gray-600 mt-1">Drive endpoints through success, failure and pending states with structured errors.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Webhook className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Webhook simulation</h3>
              <p className="text-sm text-gray-600 mt-1">Send signed events, tweak delays and retries, and observe delivery logs.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sample data</h3>
              <p className="text-sm text-gray-600 mt-1">Seeded customers, products and cards for end‑to‑end UX development.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sandbox Tools Section (redesigned) */}
      <section id="sandbox" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4 border border-blue-100">Developer tools</div>
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">Powerful tools for testing</h2>
            <p className="mt-3 text-gray-600 max-w-3xl mx-auto">Everything you need to validate integrations before going live.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                API Key Management & Testing
              </h3>
              <p className="text-lg text-gray-600 mb-8">Generate keys, configure webhooks and inspect logs with a consistent developer experience.</p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Secure Test Keys</h4>
                    <p className="text-gray-600">Generate unlimited test API keys with full access to sandbox features and no risk of real transactions.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Globe className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Webhook Testing</h4>
                    <p className="text-gray-600">Test webhook delivery, retry logic, and error handling with configurable endpoints and event simulation.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Rocket className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Integration Testing</h4>
                    <p className="text-gray-600">Test complete payment flows, subscription management, and refund processes with realistic data.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Example</div>
                  <pre className="mt-2 overflow-x-auto text-sm"><code className="font-mono">curl -X POST\n https://localhost:3000/api/v1/sandbox/sessions\n -H "x-sandbox-secret: tl_sk_test_123"\n -H "Content-Type: application/json"\n -d '&#123;"amount":5000,"currency":"USD"&#125;'</code></pre>
                </div>
                <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Response</div>
                    <div className="font-mono truncate">200 OK</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Webhook</div>
                    <div className="font-mono truncate">checkout.session.created</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                    <div className="text-xs text-gray-500">Redirect</div>
                    <div className="font-mono truncate">https://sandbox/checkout/:id</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Benefits Section (redesigned) */}
      <section id="developers" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold mb-4 border border-gray-200">Built for developers</div>
            <h2 className="text-4xl font-semibold tracking-tight text-gray-900">Why teams choose TransactLab</h2>
            <p className="mt-3 text-gray-600 max-w-3xl mx-auto">Focus on your product while the sandbox handles payments complexity.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3"><Zap className="w-6 h-6 text-blue-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">Fast setup</h3>
              <p className="mt-1 text-sm text-gray-600">Start in minutes with opinionated defaults and sample data.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3"><Shield className="w-6 h-6 text-purple-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">Zero risk</h3>
              <p className="mt-1 text-sm text-gray-600">No real money, but realistic payloads, errors and events.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><Globe className="w-6 h-6 text-green-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">Realistic testing</h3>
              <p className="mt-1 text-sm text-gray-600">Mimic Paystack/Stripe/Flutterwave behavior without provider lock‑in.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3"><Rocket className="w-6 h-6 text-orange-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">Ship faster</h3>
              <p className="mt-1 text-sm text-gray-600">Catch issues early with webhooks, logs and mock analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section (redesigned) */}
      <section className="py-20 bg-gradient-to-r from-[#0a164d] to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Test Your Payment Integration?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers who trust TransactLab for their payment testing needs. Start building with confidence today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register">
              <Button size="lg" className="bg-white hover:bg-gray-100 hover:text-black text-[#0a164d] px-8 py-3 text-lg font-semibold">
                Get Started Free
              </Button>
            </Link>
            <Link to="/sandbox">
              <Button size="lg" variant="outline" className="border-white/30 text-black hover:bg-white/10 hover:text-white px-8 py-3 text-lg">
                Explore Sandbox
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section (redesigned) */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How TransactLab Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with payment testing in just a few simple steps. No complex setup required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[{ num: "1", title: "Create account", text: "Sign up and get an isolated workspace with sample data." }, { num: "2", title: "Generate keys", text: "Create publishable/secret keys and configure webhooks." }, { num: "3", title: "Start testing", text: "Create sessions, process transactions and inspect events." }].map(step => (
              <div key={step.num} className="rounded-3xl bg-white border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-semibold text-gray-800">{step.num}</div>
                <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Test Data Section (redesigned) */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Test Data & Scenarios
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Use our pre-configured test data to simulate real-world payment scenarios and edge cases.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Test credit cards</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-green-50">
                  <div>
                    <p className="font-semibold text-green-800">Success</p>
                    <p className="text-sm text-green-600">4242 4242 4242 4242</p>
                  </div>
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50">
                  <div>
                    <p className="font-semibold text-red-800">Insufficient Funds</p>
                    <p className="text-sm text-red-600">4000 0000 0000 9995</p>
                  </div>
                  <span className="text-red-600 font-bold">✗</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-50">
                  <div>
                    <p className="font-semibold text-yellow-800">3D Secure Required</p>
                    <p className="text-sm text-yellow-600">4000 0027 6000 3184</p>
                  </div>
                  <span className="text-yellow-600 font-bold">⚠</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Test scenarios</h3>
              <ol className="space-y-4">
                <li className="flex items-start"><div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-xs font-bold text-blue-600">1</div><div><p className="font-semibold text-gray-900">Payment success</p><p className="text-sm text-gray-600">Simulate successful charges and webhook delivery.</p></div></li>
                <li className="flex items-start"><div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-xs font-bold text-blue-600">2</div><div><p className="font-semibold text-gray-900">Payment failures</p><p className="text-sm text-gray-600">Declined cards, processor errors and timeouts.</p></div></li>
                <li className="flex items-start"><div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-xs font-bold text-blue-600">3</div><div><p className="font-semibold text-gray-900">Refunds & disputes</p><p className="text-sm text-gray-600">Full/partial refunds with corresponding events.</p></div></li>
                <li className="flex items-start"><div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-xs font-bold text-blue-600">4</div><div><p className="font-semibold text-gray-900">Subscriptions</p><p className="text-sm text-gray-600">Recurring billing, renewals and cancellations.</p></div></li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">TransactLab</h3>
              <p className="text-gray-400 text-sm">
                The developer sandbox for payment gateway testing and integration development.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#sandbox" className="hover:text-white">Sandbox</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Developers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/docs" className="hover:text-white">Documentation</a></li>
                <li><a href="/sandbox" className="hover:text-white">API Reference</a></li>
                <li><a href="/checkout-demo" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/auth/login" className="hover:text-white">Login</a></li>
                <li><a href="/auth/register" className="hover:text-white">Sign Up</a></li>
                <li><a href="#support" className="hover:text-white">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 TransactLab. All rights reserved. Built for developers, by developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
