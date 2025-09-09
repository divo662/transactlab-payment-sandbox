import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/utils";

const InitiateSecurityQuestionReset = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { initiateSecurityQuestionReset } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await initiateSecurityQuestionReset(email);
      
      toast({
        title: "Reset email sent!",
        description: "If an account with this email exists, a reset link has been sent to your email.",
        variant: "default"
      });

      // Redirect to login page
      navigate("/auth/login");
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: formatApiError(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#0a164d] mb-2">
              Security Reset
            </h2>
            <p className="text-[#0a164d]/80 text-lg">
              Reset your security question via email verification
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Reset Form */}
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Security Question</h1>
            <p className="text-gray-600">Enter your email to receive a reset link</p>
          </div>

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a164d] focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500">
                We'll send you a secure link to reset your security question
              </p>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-[#0a164d] hover:bg-[#0a164d]/90 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your security question?{" "}
              <Link to="/auth/login" className="text-[#0a164d] hover:text-[#0a164d]/80 font-medium">
                Sign in instead
              </Link>
            </p>
          </div>

          {/* Alternative Options */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Other Options:</h3>
            <div className="space-y-2">
              <Link 
                to="/auth/reset-security-question" 
                className="block text-sm text-[#0a164d] hover:text-[#0a164d]/80"
              >
                Reset with current password
              </Link>
              <Link 
                to="/auth/forgot" 
                className="block text-sm text-[#0a164d] hover:text-[#0a164d]/80"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitiateSecurityQuestionReset;
