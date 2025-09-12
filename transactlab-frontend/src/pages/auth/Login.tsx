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

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  securityAnswer: z.string().min(1, "Security question answer is required"),
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
      await login(data.email, data.password, data.securityAnswer);
      
      toast({ 
        title: "Welcome back!", 
        description: "Successfully signed in to TransactLab.",
        variant: "default"
      });

      // Redirect to dashboard after successful login
      navigate("/dashboard");
    } catch (error: any) {
      // Provide friendlier, case-specific error messages
      const status = error?.status || error?.response?.status;
      const payload = error?.response?.data || error;
      const code = payload?.code || payload?.error;
      const message = payload?.message || payload?.error || String(error?.message || "");

      let friendly = "An unexpected error occurred. Please try again.";

      if (status === 0 || /network/i.test(message)) {
        friendly = "Unable to reach the server. Check your internet connection and try again.";
      } else if (status === 401 && (/invalid credentials/i.test(message) || /incorrect/i.test(message))) {
        friendly = "Email or password is incorrect. If you recently changed your password, please use the new one or reset it.";
      } else if (status === 401 && (/verification/i.test(message) || code === 'EMAIL_NOT_VERIFIED')) {
        friendly = "Your email is not verified yet. Please check your inbox for the verification link or resend it from the banner above.";
      } else if ((status === 403 && code === 'ACCOUNT_LOCKED') || /locked/i.test(message)) {
        friendly = "Your account is temporarily locked due to multiple failed attempts. Please try again later or reset your password.";
      } else if (status === 429 || /too many/i.test(message)) {
        friendly = "Too many login attempts. Please wait a few minutes and try again.";
      } else if (/security answer/i.test(message) || code === 'INVALID_SECURITY_ANSWER') {
        friendly = "The security question answer is incorrect. Please try again.";
      } else if (message) {
        friendly = message;
      }

      toast({ 
        title: "Login failed", 
        description: friendly,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Promotional Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#0a164d]/10 via-[#0a164d]/20 to-[#0a164d]/30 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-[#0a164d]/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#0a164d]/25 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#0a164d]/15 rounded-full blur-lg"></div>
        </div>
        
        {/* Content Panel */}
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 max-w-md text-center border border-white/30 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-[#0a164d]/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#0a164d]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#0a164d] mb-2">
              Secure & Reliable
            </h2>
            <p className="text-[#0a164d]/80 text-lg">
              Your trusted partner for secure payment processing and financial solutions
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/transactlab/1.png" 
                alt="TransactLab Logo" 
                className="w-12 h-12 object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your TransactLab account</p>
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email"
                {...register("email")}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a164d] focus:border-transparent ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a164d] focus:border-transparent pr-10 ${errors.password ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Security Question Answer Field */}
            <div className="space-y-2">
              <label htmlFor="securityAnswer" className="text-sm font-medium text-gray-700">Security Question Answer</label>
              <Input 
                id="securityAnswer" 
                type="text"
                placeholder="Answer your security question"
                {...register("securityAnswer")}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a164d] focus:border-transparent ${errors.securityAnswer ? "border-red-500" : ""}`}
              />
              {errors.securityAnswer && (
                <p className="text-sm text-red-500">{errors.securityAnswer.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter the answer to the security question you set during registration
              </p>
            </div>

            {/* Forgot Password and Security Question Reset */}
            <div className="flex flex-col space-y-1 items-end">
              <Link to="/auth/forgot" className="text-sm text-[#0a164d] hover:text-[#0a164d]/80 font-medium">
                Forgot password?
              </Link>
                                      <Link to="/auth/initiate-security-question-reset" className="text-sm text-[#0a164d] hover:text-[#0a164d]/80 font-medium">
                          Reset security question
                        </Link>
            </div>

            {/* Login Button */}
            <Button 
              type="submit" 
              className="w-full bg-[#0a164d] hover:bg-[#0a164d]/90 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>



          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/auth/register" className="text-[#0a164d] hover:text-[#0a164d]/80 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
