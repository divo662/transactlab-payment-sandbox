import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginRequest } from "@/types";
import { formatApiError } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";

// --- HELPER COMPONENTS ---

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children, error }: { children: React.ReactNode, error?: boolean }) => (
  <div className={`rounded-2xl border transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10 ${
    error ? 'border-red-500/50 bg-red-500/5' : 'border-border bg-foreground/5 backdrop-blur-sm'
  }`}>
    {children}
  </div>
);

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  securityAnswer: z.string().min(1, "Security question answer is required").optional(),
  totpCode: z.string().min(6, "Please enter a 6-digit code").max(6, "Please enter a 6-digit code").optional(),
}).refine((data) => {
  // If TOTP is required, totpCode is mandatory
  // If TOTP is not required, securityAnswer is mandatory
  return true; // We'll handle this in the component logic
});

type FormValues = z.infer<typeof schema>;

const Login = () => {
  const { toast } = useToast();
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const [resendLoading, setResendLoading] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [loginData, setLoginData] = useState<{ email: string; password: string; securityAnswer: string } | null>(null);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }
  } = useForm<FormValues>({ 
    resolver: zodResolver(schema)
  });

  useEffect(() => { 
    document.title = "Login — TransactLab"; 
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleResendVerification = async () => {
    if (!emailForResend) {
      toast({
        title: "Email required",
        description: "Please enter your email address to resend verification.",
        variant: "destructive"
      });
      return;
    }

    setResendLoading(true);
    try {
      const apiService = (await import("@/lib/api")).default;
      await apiService.resendVerification({ email: emailForResend });
      
      toast({
        title: "Verification email sent!",
        description: "Please check your email for the verification link.",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend verification",
        description: formatApiError(error),
        variant: "destructive"
      });
    } finally {
      setResendLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
        // If TOTP is required, validate TOTP code
        if (requiresTotp && loginData) {
          if (!data.totpCode || data.totpCode.length !== 6) {
            toast({
              title: "Invalid Code Format",
              description: "Please enter a valid 6-digit authentication code from your authenticator app.",
              variant: "destructive"
            });
            return;
          }
        
        const result = await login(loginData.email, loginData.password, loginData.securityAnswer, false, data.totpCode);
        if (result.requiresTotp) {
          toast({
            title: "Invalid Authentication Code",
            description: "The 6-digit code you entered is incorrect. Please check your authenticator app and try again.",
            variant: "destructive"
          });
          return;
        }
      } else {
        // First login attempt - validate required fields
        if (!data.securityAnswer) {
          toast({
            title: "Security Answer Required",
            description: "Please enter the answer to your security question to continue.",
            variant: "destructive"
          });
          return;
        }
        
        const result = await login(data.email, data.password, data.securityAnswer);
        if (result.requiresTotp) {
          setRequiresTotp(true);
          setLoginData({ email: data.email, password: data.password, securityAnswer: data.securityAnswer });
          toast({
            title: "Two-Factor Authentication Required",
            description: "Please enter the 6-digit code from your authenticator app.",
            variant: "default"
          });
          return;
        }
      }
      
      // If KYC is required, AuthContext will redirect to provider immediately.
      // Otherwise, continue to dashboard.
      toast({ 
        title: "Welcome back!", 
        description: "Successfully signed in to TransactLab.",
        variant: "default"
      });
      navigate("/dashboard");
    } catch (error: any) {
      // Provide friendlier, case-specific error messages
      const status = error?.status || error?.response?.status;
      const payload = error?.response?.data || error;
      const code = payload?.code || payload?.error;
      const message = payload?.message || payload?.error || String(error?.message || "");

      let friendly = "An unexpected error occurred. Please try again.";
      let title = "Login failed";

      // Network/connection issues
      if (status === 0 || /network/i.test(message) || /fetch/i.test(message)) {
        friendly = "Unable to reach the server. Check your internet connection and try again.";
        title = "Connection Error";
      }
      // Invalid credentials - catch all 401 errors related to authentication
      else if (status === 401) {
        if (/verification/i.test(message) || code === 'EMAIL_NOT_VERIFIED') {
          friendly = "Your email is not verified yet. Please check your inbox for the verification link or resend it from the banner above.";
          title = "Email Not Verified";
        } else if (/security answer/i.test(message) || code === 'INVALID_SECURITY_ANSWER') {
          friendly = "The security question answer is incorrect. Please try again.";
          title = "Invalid Security Answer";
        } else {
          // Default 401 error - most likely invalid credentials
          friendly = "Email or password is incorrect. Please check your credentials and try again.";
          title = "Invalid Credentials";
        }
      }
      // Catch any authentication-related errors even without status code
      else if (/unauthorized/i.test(message) || /invalid credentials/i.test(message) || /incorrect/i.test(message) || /authentication failed/i.test(message)) {
        friendly = "Email or password is incorrect. Please check your credentials and try again.";
        title = "Invalid Credentials";
      }
      // Account locked/suspended
      else if ((status === 403 && code === 'ACCOUNT_LOCKED') || /locked/i.test(message) || /suspended/i.test(message)) {
        friendly = "Your account is temporarily locked due to multiple failed attempts. Please try again later or reset your password.";
        title = "Account Locked";
      }
      // Rate limiting
      else if (status === 429 || /too many/i.test(message) || /rate limit/i.test(message)) {
        friendly = "Too many login attempts. Please wait a few minutes and try again.";
        title = "Too Many Attempts";
      }
      // Server errors
      else if (status >= 500) {
        friendly = "Our servers are experiencing issues. Please try again in a few minutes.";
        title = "Server Error";
      }
      // Other specific error codes
      else if (code === 'USER_NOT_FOUND') {
        friendly = "No account found with this email address. Please check your email or create a new account.";
        title = "Account Not Found";
      } else if (code === 'ACCOUNT_DISABLED') {
        friendly = "Your account has been disabled. Please contact support for assistance.";
        title = "Account Disabled";
      } else if (message && message.length > 0) {
        // Use the server message if it's available and meaningful
        friendly = message;
      } else {
        // Ultimate fallback - if we can't determine the specific error, assume it's credentials
        friendly = "Email or password is incorrect. Please check your credentials and try again.";
        title = "Invalid Credentials";
      }

      toast({ 
        title: title, 
        description: friendly,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-geist bg-background text-foreground overflow-hidden">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 w-full">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <div className="flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <img 
                    src="/transactlab/1.png" 
                    alt="TransactLab Logo" 
                    className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              </div>
              <h1 className="animate-element animate-delay-100 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight">
                <span className="font-light text-foreground tracking-tighter bg-gradient-to-r from-foreground via-foreground to-violet-600 bg-clip-text text-transparent">
                  {requiresTotp ? 'Two-Factor Authentication' : 'Welcome'}
                </span>
              </h1>
              <p className="animate-element animate-delay-200 text-muted-foreground mt-2 text-sm sm:text-base md:text-lg max-w-md mx-auto leading-relaxed">
                {requiresTotp 
                  ? 'Enter the verification code from your authenticator app to complete login'
                  : 'Access your account and continue your journey with us'
                }
              </p>
            </div>

          {/* Verification Alert */}
          {searchParams.get("verification") === "required" && (
            <div className="bg-[#0a164d]/10 border border-[#0a164d]/20 text-[#0a164d] px-4 py-3 rounded-lg relative mb-6" role="alert">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-[#0a164d]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-[#0a164d]">Account Created Successfully!</h3>
                  <div className="mt-2 text-sm text-[#0a164d]/80">
                    <p>Please check your email for a verification link to activate your account.</p>
                    <p className="mt-1">Once verified, you can sign in below.</p>
                  </div>
                </div>
                <div className="ml-auto pl-3">
                  <button 
                    onClick={() => navigate("/auth/login")} 
                    className="inline-flex text-[#0a164d] hover:text-[#0a164d]/80"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Resend verification section */}
              <div className="mt-4 pt-4 border-t border-[#0a164d]/20">
                <p className="text-sm text-[#0a164d]/80 mb-3">Didn't receive the email?</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={emailForResend}
                    onChange={(e) => setEmailForResend(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleResendVerification}
                    disabled={resendLoading || !emailForResend}
                    size="sm"
                    variant="outline"
                    className="text-[#0a164d] border-[#0a164d]/30 hover:bg-[#0a164d]/10"
                  >
                    {resendLoading ? (
                      <div className="w-4 h-4 border-2 border-[#0a164d] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Resend"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              {/* Email Field */}
              <div className="animate-element animate-delay-300 group">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1 transition-colors group-focus-within:text-violet-600">
                  Email Address
                </label>
                <GlassInputWrapper error={!!errors.email}>
                  <input 
                    {...register("email")}
                    type="email" 
                    placeholder="Enter your email address" 
                    className="w-full bg-transparent text-sm p-2.5 sm:p-3 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-muted-foreground/60" 
                  />
                </GlassInputWrapper>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="animate-element animate-delay-400 group">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1 transition-colors group-focus-within:text-violet-600">
                  Password
                </label>
                <GlassInputWrapper error={!!errors.password}>
                  <div className="relative">
                    <input 
                      {...register("password")}
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Enter your password" 
                      className="w-full bg-transparent text-sm p-2.5 sm:p-3 pr-8 sm:pr-10 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-muted-foreground/60" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute inset-y-0 right-2 flex items-center p-1.5 hover:bg-muted/20 rounded-lg transition-all duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.password.message}</p>
                )}
              </div>

              {/* Security Question Answer Field */}
              {!requiresTotp && (
                <div className="animate-element animate-delay-450 group">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1 transition-colors group-focus-within:text-violet-600">
                    Security Question Answer
                  </label>
                  <GlassInputWrapper error={!!errors.securityAnswer}>
                    <input 
                      {...register("securityAnswer")}
                      type="text"
                      placeholder="Answer your security question" 
                      className="w-full bg-transparent text-sm p-2.5 sm:p-3 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-muted-foreground/60" 
                    />
                  </GlassInputWrapper>
                  {errors.securityAnswer && (
                    <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.securityAnswer.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Enter the answer to the security question you set during registration
                  </p>
                </div>
              )}

              {/* TOTP Code Field */}
              {requiresTotp && (
                <div className="animate-element animate-delay-450 group">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                      <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1 transition-colors group-focus-within:text-violet-600 text-center">
                    Two-Factor Authentication Code
                  </label>
                  <GlassInputWrapper error={!!errors.totpCode}>
                    <input 
                      {...register("totpCode")}
                      type="text"
                      placeholder="000000" 
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      className="w-full bg-transparent text-sm p-2.5 sm:p-3 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-muted-foreground/60 text-center text-2xl font-mono tracking-widest" 
                    />
                  </GlassInputWrapper>
                  {errors.totpCode && (
                    <p className="text-xs text-red-500 mt-1 animate-fade-in text-center">{errors.totpCode.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed text-center">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRequiresTotp(false);
                      setLoginData(null);
                    }}
                    className="text-xs text-violet-400 hover:text-violet-500 hover:underline mt-2 transition-all duration-200 block mx-auto"
                  >
                    ← Back to login
                  </button>
                </div>
              )}

              {/* Forgot Password and Security Question Reset */}
              {!requiresTotp && (
                <div className="animate-element animate-delay-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs">
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                    <Link 
                      to="/auth/forgot" 
                      className="hover:underline text-violet-400 transition-all duration-200 hover:text-violet-500 hover:scale-105 inline-block"
                    >
                      Forgot password?
                    </Link>
                    <Link 
                      to="/auth/initiate-security-question-reset" 
                      className="hover:underline text-violet-400 transition-all duration-200 hover:text-violet-500 hover:scale-105 inline-block"
                    >
                      Reset security question
                    </Link>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 py-2.5 sm:py-3 font-medium text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">{requiresTotp ? 'Verifying...' : 'Signing in...'}</span>
                  </div>
                ) : (
                  <span className="text-sm">{requiresTotp ? 'Verify Code' : 'Sign In'}</span>
                )}
              </button>
            </form>


            {/* Register Link */}
            <p className="animate-element animate-delay-700 text-center text-xs sm:text-sm text-muted-foreground">
              New to our platform?{" "}
              <Link 
                to="/auth/register" 
                className="text-violet-400 hover:text-violet-500 hover:underline transition-all duration-200 hover:scale-105 inline-block font-medium"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials carousel */}
      <section className="hidden md:block flex-1 relative p-4 w-full">
        <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80)` }}></div>
        
        {/* Testimonials Carousel */}
        <div className="absolute bottom-8 left-4 right-4">
          <div className="testimonial-carousel overflow-hidden relative w-full">
            <div className="testimonial-track flex gap-3 animate-scroll">
              {/* Testimonial 1 */}
              <div className="flex-shrink-0 flex items-start gap-2 rounded-2xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-3 w-64 sm:w-72">
                <img src="https://randomuser.me/api/portraits/women/57.jpg" className="h-8 w-8 object-cover rounded-xl" alt="avatar" />
                <div className="text-xs leading-snug">
                  <p className="flex items-center gap-1 font-medium">Sarah Chen</p>
                  <p className="text-muted-foreground text-xs">@sarahdigital</p>
                  <p className="mt-1 text-foreground/80 text-xs">Amazing platform! The user experience is seamless and the features are exactly what I needed.</p>
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="flex-shrink-0 flex items-start gap-2 rounded-2xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-3 w-64 sm:w-72">
                <img src="https://randomuser.me/api/portraits/men/64.jpg" className="h-8 w-8 object-cover rounded-xl" alt="avatar" />
                <div className="text-xs leading-snug">
                  <p className="flex items-center gap-1 font-medium">Marcus Johnson</p>
                  <p className="text-muted-foreground text-xs">@marcustech</p>
                  <p className="mt-1 text-foreground/80 text-xs">This service has transformed how I work. Clean design, powerful features, and excellent support.</p>
                </div>
              </div>
              
              {/* Testimonial 3 */}
              <div className="flex-shrink-0 flex items-start gap-2 rounded-2xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-3 w-64 sm:w-72">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" className="h-8 w-8 object-cover rounded-xl" alt="avatar" />
                <div className="text-xs leading-snug">
                  <p className="flex items-center gap-1 font-medium">David Martinez</p>
                  <p className="text-muted-foreground text-xs">@davidcreates</p>
                  <p className="mt-1 text-foreground/80 text-xs">I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity.</p>
                </div>
              </div>
              
              {/* Duplicate testimonials for seamless loop */}
              <div className="flex-shrink-0 flex items-start gap-2 rounded-2xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-3 w-64 sm:w-72">
                <img src="https://randomuser.me/api/portraits/women/57.jpg" className="h-8 w-8 object-cover rounded-xl" alt="avatar" />
                <div className="text-xs leading-snug">
                  <p className="flex items-center gap-1 font-medium">Sarah Chen</p>
                  <p className="text-muted-foreground text-xs">@sarahdigital</p>
                  <p className="mt-1 text-foreground/80 text-xs">Amazing platform! The user experience is seamless and the features are exactly what I needed.</p>
                </div>
              </div>
              
              <div className="flex-shrink-0 flex items-start gap-2 rounded-2xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-3 w-64 sm:w-72">
                <img src="https://randomuser.me/api/portraits/men/64.jpg" className="h-8 w-8 object-cover rounded-xl" alt="avatar" />
                <div className="text-xs leading-snug">
                  <p className="flex items-center gap-1 font-medium">Marcus Johnson</p>
                  <p className="text-muted-foreground text-xs">@marcustech</p>
                  <p className="mt-1 text-foreground/80 text-xs">This service has transformed how I work. Clean design, powerful features, and excellent support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
