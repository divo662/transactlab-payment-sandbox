import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Code, Webhook, Database, Zap, Shield, Globe, Rocket, ChevronDown, ArrowRight, Menu, X } from "lucide-react";

function NavItem({
  label,
  href,
}: {
  label: string;
  href?: string;
}) {
  if (href) {
    return (
      <Link to={href} className="flex items-center text-sm text-gray-300 hover:text-white">
        <span>{label}</span>
      </Link>
    );
  }
  
  return (
    <div className="flex items-center text-sm text-gray-300 hover:text-white cursor-pointer">
      <span>{label}</span>
    </div>
  );
}

function MobileNavItem({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white">
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </div>
  );
}

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "TransactLab - Developer Sandbox for Payment Testing";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* New Modern Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-black">
        {/* Gradient background with grain effect */}
        <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0">
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
          <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
        </div>
        <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>

        {/* Content container */}
        <div className="relative z-10">
          {/* Navigation */}
          <nav className="container mx-auto flex items-center justify-between px-4 py-4 mt-6">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white overflow-hidden">
                <img src="/transactlab/4.png" alt="TransactLab" className="h-10 w-10 object-contain" />
              </div>
              <Link to="/" className="ml-3 text-xl font-bold text-white">TransactLab</Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-6">
                <NavItem label="Documentation" href="/transactlab-docs" />
              </div>
              <div className="flex items-center space-x-3">
                <Link to="/auth/login" className="text-gray-300 hover:text-white">
                  Login
                </Link>
                <Link to="/auth/register">
                  <button className="h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </nav>

          {/* Mobile Navigation Menu with animation */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex flex-col p-4 bg-black/95 md:hidden animate-in slide-in-from-top-5 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white overflow-hidden">
                      <img src="/transactlab/4.png" alt="TransactLab" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
                    </div>
                    <span className="ml-3 text-lg sm:text-xl font-bold text-white">
                      TransactLab
                    </span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="mt-6 sm:mt-8 flex flex-col space-y-4 sm:space-y-6">
                  <Link to="/transactlab-docs" className="flex items-center justify-between border-b border-gray-800 pb-3 text-base sm:text-lg text-white">
                    <span>Documentation</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                  <div className="pt-2 sm:pt-4">
                    <Link to="/auth/login" className="block w-full text-center py-3 px-4 border border-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
                      Log in
                    </Link>
                  </div>
                  <Link to="/auth/register">
                    <button className="w-full h-12 rounded-full bg-white px-6 sm:px-8 text-sm sm:text-base font-medium text-black hover:bg-white/90">
                      Get Started For Free
                    </button>
                  </Link>
                </div>
              </div>
            )}

          {/* Badge */}
          <div className="mx-auto mt-4 sm:mt-6 flex max-w-fit items-center justify-center space-x-2 rounded-full bg-white/10 px-3 sm:px-4 py-2 backdrop-blur-sm">
            <span className="text-xs sm:text-sm font-medium text-white">
              Trusted by developers worldwide
            </span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </div>

          {/* Hero section */}
          <div className="container mx-auto mt-8 sm:mt-12 px-4 text-center">
            <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Build Payment Apps Without Risk
            </h1>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-gray-300 px-4">
              TransactLab provides a complete payment sandbox environment. Test with realistic data,
              simulate webhooks, and validate your integrations before going live all with zero real money.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center space-y-3 sm:space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 px-4">
              <Link to="/auth/register">
                <button className="w-full sm:w-auto h-12 rounded-full bg-white px-6 sm:px-8 text-sm sm:text-base font-medium text-black hover:bg-white/90">
                  Start Building Now
                </button>
              </Link>
              {/* <Link to="/sandbox">
                <button className="w-full sm:w-auto h-12 rounded-full border border-gray-600 px-6 sm:px-8 text-sm sm:text-base font-medium text-white hover:bg-white/10">
                  View Live Demo
                </button>
              </Link> */}
            </div>

            {/* key bullets from README */}
            <div className="mt-12 sm:mt-16 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto text-white/80 text-sm px-4">
              <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 sm:p-4">
                <p className="font-medium text-white text-sm sm:text-base">Gateway sandbox</p>
                <p className="mt-1 text-xs sm:text-sm">Alternative to Paystack, Stripe, Flutterwave, PayPal and Square for safe testing.</p>
              </div>
              <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 sm:p-4">
                <p className="font-medium text-white text-sm sm:text-base">Webhook simulation</p>
                <p className="mt-1 text-xs sm:text-sm">Test delivery, retries and error scenarios with realistic payloads.</p>
              </div>
              <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 sm:p-4">
                <p className="font-medium text-white text-sm sm:text-base">API keys & sessions</p>
                <p className="mt-1 text-xs sm:text-sm">Create API keys, checkout sessions and end‑to‑end payment flows.</p>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative mx-auto my-12 sm:my-16 lg:my-20 w-full max-w-6xl px-4">
              <div className="absolute inset-0 rounded-2xl shadow-lg bg-white blur-[10rem] bg-grainy opacity-20" />
              
              <img
                src="/transactlab/image.png"
                alt="TransactLab Dashboard"
                className="relative w-full h-auto shadow-md grayscale-100 rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

   

      {/* Daily Finance / Transfer Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-100">
              Sandbox Capabilities
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900">
              Efficiency for developers: a payment
              <br className="hidden sm:block" /> gateway sandbox
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">Build, test and debug payment integrations with realistic data and webhooks.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* left copy */}
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                Checkout & Transfers
              </div>
              <h3 className="mt-4 text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">Global payments: your
                <br className="hidden sm:block" /> gateway to secure
                <br className="hidden sm:block" /> transactions
              </h3>
              <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-prose">
                TransactLab emulates popular gateways so you can prototype checkout, payments,
                refunds and transfers using sample data, FX rates and realistic response codes.
              </p>
            </div>

            {/* right mock card */}
            <div className="relative order-1 lg:order-2">
              <div className="mx-auto w-full max-w-sm sm:max-w-md rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6 shadow-sm">
                <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 sm:p-5">
                  <p className="text-gray-800 font-medium text-sm sm:text-base">Amount</p>
                  <p className="text-xs text-gray-500 mt-1">Send Money</p>
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
                    <div>
                      <div className="text-base sm:text-lg font-semibold">€2,129</div>
                      <div className="text-[10px] sm:text-[11px] text-gray-500">Balance: €5,950.00</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-600" /> EUR
                    </div>
                  </div>

                  <p className="mt-4 sm:mt-6 text-xs text-gray-500">Who are you sending money to?</p>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">JS</div>
                      <span className="text-xs sm:text-sm text-gray-800">John Smith</span>
                    </div>
                    <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gray-200" />
                  </div>

                  <Button className="mt-4 sm:mt-6 w-full h-10 sm:h-11 rounded-full bg-black text-white hover:bg-black/90 text-sm sm:text-base">Confirm and Send</Button>
                </div>
              </div>
            </div>
          </div>

          {/* 3 soft cards tailored to sandbox */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900">API Analytics</h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-600">Inspect per‑gateway request counts and latency statistics.</p>
              <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-emerald-500" />
                    <span className="text-xs sm:text-sm text-gray-800">Paystack</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">0 req • 0 ms</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-indigo-500" />
                    <span className="text-xs sm:text-sm text-gray-800">Stripe</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">0 req • 0 ms</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-yellow-500" />
                    <span className="text-xs sm:text-sm text-gray-800">Flutterwave</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">0 req • 0 ms</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900">Webhook Testing</h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-600">Simulate events and verify delivery, retries, and signatures.</p>
              <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
                <div className="rounded-xl bg-white border border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
                  <div className="text-xs sm:text-sm text-gray-800">0</div>
                  <div className="text-[10px] sm:text-[11px] text-gray-500">Delivered • last 24h</div>
                </div>
                <div className="rounded-xl bg-white border border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
                  <div className="text-xs sm:text-sm text-gray-800">0</div>
                  <div className="text-[10px] sm:text-[11px] text-gray-500">Retries • last 24h</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900">Test Data</h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-600">Work with generated customers, products and cards.</p>
              <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 sm:px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-sky-400" />
                    <span className="text-xs sm:text-sm text-gray-800">Customers</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">25+</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 sm:px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-400" />
                    <span className="text-xs sm:text-sm text-gray-800">Products</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">15+</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-3 sm:px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-400" />
                    <span className="text-xs sm:text-sm text-gray-800">Test cards</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">Multiple</span>
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <aside className="lg:col-span-4 order-2 lg:order-1">
                  <ol className="space-y-2">
                    {featureItems.map(item => (
                      <li key={item.key}>
                        <button
                          onClick={() => setActiveKey(item.key)}
                          className={`w-full text-left rounded-xl border px-3 sm:px-4 py-2 sm:py-3 transition ${
                            activeKey === item.key
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                              : "bg-white border-gray-200 hover:bg-gray-50 text-gray-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${activeKey === item.key ? "bg-emerald-500" : "bg-gray-300"}`} />
                            <div>
                              <div className="font-medium text-sm sm:text-base">{item.label}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ol>
                </aside>
                <div className="lg:col-span-8 order-1 lg:order-2">
                  <Preview />
                  <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                    {featureItems.find(f => f.key === activeKey)?.how}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Sandbox Features Section (redesigned) */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-100">Why TransactLab</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900">Complete developer sandbox</h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-3xl mx-auto">Mirror real payment processor behavior with zero‑risk data and events.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Code className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">API testing</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Drive endpoints through success, failure and pending states with structured errors.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Webhook className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Webhook simulation</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Send signed events, tweak delays and retries, and observe delivery logs.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sample data</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Seeded customers, products and cards for end‑to‑end UX development.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sandbox Tools Section (redesigned) */}
      <section id="sandbox" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4 border border-blue-100">Developer tools</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900">Powerful tools for testing</h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-3xl mx-auto">Everything you need to validate integrations before going live.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                API Key Management & Testing
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8">Generate keys, configure webhooks and inspect logs with a consistent developer experience.</p>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Secure Test Keys</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Generate unlimited test API keys with full access to sandbox features and no risk of real transactions.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Webhook Testing</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Test webhook delivery, retry logic, and error handling with configurable endpoints and event simulation.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <Rocket className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Integration Testing</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Test complete payment flows, subscription management, and refund processes with realistic data.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 border border-gray-100">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                  <div className="text-xs text-gray-500">Example</div>
                  <pre className="mt-2 overflow-x-auto text-xs sm:text-sm"><code className="font-mono">curl -X POST\n https://localhost:3000/api/v1/sandbox/sessions\n -H "x-sandbox-secret: tl_sk_test_123"\n -H "Content-Type: application/json"\n -d '&#123;"amount":5000,"currency":"USD"&#125;'</code></pre>
                </div>
                <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-2 sm:p-3">
                    <div className="text-xs text-gray-500">Response</div>
                    <div className="font-mono truncate">200 OK</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-2 sm:p-3">
                    <div className="text-xs text-gray-500">Webhook</div>
                    <div className="font-mono truncate">checkout.session.created</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-2 sm:p-3">
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
      <section id="developers" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold mb-4 border border-gray-200">Built for developers</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900">Why teams choose TransactLab</h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-3xl mx-auto">Focus on your product while the sandbox handles payments complexity.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3"><Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /></div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Fast setup</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">Start in minutes with opinionated defaults and sample data.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3"><Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" /></div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Zero risk</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">No real money, but realistic payloads, errors and events.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><Globe className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /></div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Realistic testing</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">Mimic Paystack/Stripe/Flutterwave behavior without provider lock‑in.</p>
            </div>
            <div className="rounded-3xl bg-gray-50 border border-gray-200 p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3"><Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" /></div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Ship faster</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">Catch issues early with webhooks, logs and mock analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section (redesigned) */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-[#0a164d] to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Test Your Payment Integration?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8">
            Join thousands of developers who trust TransactLab for their payment testing needs. Start building with confidence today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/auth/register">
              <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-gray-100 hover:text-black text-[#0a164d] px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-semibold">
                Get Started Free
              </Button>
            </Link>
            <Link to="/sandbox">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 hover:text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg">
                Explore Sandbox
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section (redesigned) */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              How TransactLab Works
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Get started with payment testing in just a few simple steps. No complex setup required.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[{ num: "1", title: "Create account", text: "Sign up and get an isolated workspace with sample data." }, { num: "2", title: "Generate keys", text: "Create publishable/secret keys and configure webhooks." }, { num: "3", title: "Start testing", text: "Create sessions, process transactions and inspect events." }].map(step => (
              <div key={step.num} className="rounded-3xl bg-white border border-gray-200 p-4 sm:p-6 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-base sm:text-lg font-semibold text-gray-800">{step.num}</div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Test Data Section (redesigned) */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Test Data & Scenarios
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Use our pre-configured test data to simulate real-world payment scenarios and edge cases.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Test credit cards</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-green-50">
                  <div>
                    <p className="font-semibold text-green-800 text-sm sm:text-base">Success</p>
                    <p className="text-xs sm:text-sm text-green-600">4242 4242 4242 4242</p>
                  </div>
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-red-50">
                  <div>
                    <p className="font-semibold text-red-800 text-sm sm:text-base">Insufficient Funds</p>
                    <p className="text-xs sm:text-sm text-red-600">4000 0000 0000 9995</p>
                  </div>
                  <span className="text-red-600 font-bold">✗</span>
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-yellow-50">
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm sm:text-base">3D Secure Required</p>
                    <p className="text-xs sm:text-sm text-yellow-600">4000 0027 6000 3184</p>
                  </div>
                  <span className="text-yellow-600 font-bold">⚠</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Test scenarios</h3>
              <ol className="space-y-3 sm:space-y-4">
                <li className="flex items-start"><div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-xs font-bold text-blue-600">1</div><div><p className="font-semibold text-gray-900 text-sm sm:text-base">Payment success</p><p className="text-xs sm:text-sm text-gray-600">Simulate successful charges and webhook delivery.</p></div></li>
                <li className="flex items-start"><div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-xs font-bold text-blue-600">2</div><div><p className="font-semibold text-gray-900 text-sm sm:text-base">Payment failures</p><p className="text-xs sm:text-sm text-gray-600">Declined cards, processor errors and timeouts.</p></div></li>
                <li className="flex items-start"><div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-xs font-bold text-blue-600">3</div><div><p className="font-semibold text-gray-900 text-sm sm:text-base">Refunds & disputes</p><p className="text-xs sm:text-sm text-gray-600">Full/partial refunds with corresponding events.</p></div></li>
                <li className="flex items-start"><div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1 text-xs font-bold text-blue-600">4</div><div><p className="font-semibold text-gray-900 text-sm sm:text-base">Subscriptions</p><p className="text-xs sm:text-sm text-gray-600">Recurring billing, renewals and cancellations.</p></div></li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">TransactLab</h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                The developer sandbox for payment gateway testing and integration development.
              </p>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Product</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><Link to="/transactlab-docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Developers</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><Link to="/transactlab-docs" className="hover:text-white">Documentation</Link></li>
                <li><Link to="/transactlab-docs" className="hover:text-white">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">Company</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><a href="/auth/login" className="hover:text-white">Login</a></li>
                <li><a href="/auth/register" className="hover:text-white">Sign Up</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              © 2025 TransactLab. All rights reserved. Built for developers, by developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
