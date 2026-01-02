import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SandboxProvider } from "./contexts/SandboxContext";
import { WorkspaceInviteProvider } from "./contexts/WorkspaceInviteContext";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ResetSecurityQuestion from "./pages/auth/ResetSecurityQuestion";
import InitiateSecurityQuestionReset from "./pages/auth/InitiateSecurityQuestionReset";
import EmailVerification from "./pages/auth/EmailVerification";
import KycCallback from "./pages/auth/KycCallback";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/settings/Profile";
import Security from "./pages/Security";
import NotFound from "./pages/NotFound";
import SandboxDashboard from "./components/sandbox/SandboxDashboard";
import ApiKeyManagement from "./components/sandbox/ApiKeyManagement";
import SessionManagement from "./components/sandbox/SessionManagement";
import WebhookManagement from "./components/sandbox/WebhookManagement";
import TransactionHistory from "./components/sandbox/TransactionHistory";
import Customers from "./components/sandbox/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutErrorPage from "./pages/CheckoutErrorPage";
import CheckoutDemo from "./pages/CheckoutDemo";
import InvoicePage from "./pages/InvoicePage";
import Subscriptions from "./pages/Subscriptions";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import SubscriptionDetail from "./pages/SubscriptionDetail";
import Docs from "./pages/Docs";
import TransactLabDocs from "./pages/TransactLabDocs";
import TeamAccept from "./pages/TeamAccept";
import CheckoutTemplates from "./pages/sandbox/CheckoutTemplates";
import PaymentLinkNew from "./pages/sandbox/PaymentLinkNew";
import SDKSetup from "./pages/sandbox/SDKSetup";
import Feedback from "./pages/Feedback";
import Analytics from "./pages/Analytics";
import QuickLinkPay from "./pages/QuickLinkPay";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SandboxProvider>
        <WorkspaceInviteProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Landing page */}
              <Route path="/" element={<Index />} />

              {/* Auth */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/reset-security-question" element={<ResetSecurityQuestion />} />
              <Route path="/auth/initiate-security-question-reset" element={<InitiateSecurityQuestionReset />} />
              <Route path="/auth/verify-email" element={<EmailVerification />} />
              <Route path="/auth/kyc/callback" element={<KycCallback />} />
              <Route path="/auth/kyc/callback/:sessionId" element={<KycCallback />} />

              {/* Standalone docs page */}
              <Route path="/transactlab-docs" element={<TransactLabDocs />} />

              {/* App routes with layout */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/settings/profile" element={<Profile />} />
                <Route path="/settings/security" element={<Security />} />
                <Route path="/feedback" element={<Feedback />} />

                {/* Sandbox Routes */}
                <Route path="/sandbox" element={<SandboxDashboard />} />
                <Route path="/sandbox/api-keys" element={<ApiKeyManagement />} />
                <Route path="/sandbox/sessions" element={<SessionManagement />} />
                <Route path="/sandbox/webhooks" element={<WebhookManagement />} />
                <Route path="/sandbox/transactions" element={<TransactionHistory />} />
                <Route path="/sandbox/customers" element={<Customers />} />
                <Route path="/sandbox/customers/:customerId" element={<CustomerDetail />} />
                <Route path="/sandbox/subscriptions" element={<Subscriptions />} />
                <Route path="/sandbox/subscriptions/:subscriptionId" element={<SubscriptionDetail />} />
                <Route path="/sandbox/products" element={<Products />} />
                <Route path="/sandbox/products/:productId" element={<ProductDetail />} />
                <Route path="/sandbox/checkout-templates" element={<CheckoutTemplates />} />
                <Route path="/sandbox/sdk-setup" element={<SDKSetup />} />
                <Route path="/sandbox/payment-links/new" element={<PaymentLinkNew />} />
              </Route>

              {/* Checkout (public) */}
              <Route path="/pay/ql/:token" element={<QuickLinkPay />} />
              <Route path="/invoice/:invoiceId" element={<InvoicePage />} />
              <Route path="/checkout/:sessionId" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/checkout/error" element={<CheckoutErrorPage />} />
              <Route path="/checkout-demo" element={<CheckoutDemo />} />

              {/* Team invite accept (public after login redirect) */}
              <Route path="/team/accept" element={<TeamAccept />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </WorkspaceInviteProvider>
      </SandboxProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
