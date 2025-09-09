import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/utils";

const ResetSecurityQuestion = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    newSecurityQuestion: "",
    newSecurityAnswer: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resetMethod, setResetMethod] = useState<'token' | 'password'>('token');
  const { resetSecurityQuestion, resetSecurityQuestionWithPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Determine reset method based on URL token
  useEffect(() => {
    if (token) {
      setResetMethod('token');
    } else {
      setResetMethod('password');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetMethod === 'token') {
      // Token-based reset
      if (!token || !formData.newSecurityQuestion || !formData.newSecurityAnswer) {
        toast({
          title: "Missing information",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }

      setIsLoading(true);
      try {
        await resetSecurityQuestion(
          token,
          formData.newSecurityQuestion,
          formData.newSecurityAnswer
        );
        
        toast({
          title: "Security question updated!",
          description: "Your security question has been successfully updated.",
          variant: "default"
        });

        navigate("/auth/login");
      } catch (error: any) {
        toast({
          title: "Update failed",
          description: formatApiError(error),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Password-based reset
      if (!formData.email || !formData.password || !formData.newSecurityQuestion || !formData.newSecurityAnswer) {
        toast({
          title: "Missing information",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }

      setIsLoading(true);
      try {
        await resetSecurityQuestionWithPassword(
          formData.email,
          formData.password,
          formData.newSecurityQuestion,
          formData.newSecurityAnswer
        );
        
        toast({
          title: "Security question updated!",
          description: "Your security question has been successfully updated.",
          variant: "default"
        });

        navigate("/auth/login");
      } catch (error: any) {
        toast({
          title: "Update failed",
          description: formatApiError(error),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              Update your security question for enhanced account protection
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
            <p className="text-gray-600">Update your security question and answer</p>
          </div>

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Method Indicator */}
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {resetMethod === 'token' 
                  ? '🔐 Reset via email link (most secure)' 
                  : '🔑 Reset with current password'
                }
              </p>
            </div>

            {/* Email Field - Only show for password-based reset */}
            {resetMethod === 'password' && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a164d] focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Password Field - Only show for password-based reset */}
            {resetMethod === 'password' && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Current Password</label>
                <Input 
                  id="password" 
                  type="password"
                  placeholder="Enter your current password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a164d] focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* New Security Question Field */}
            <div className="space-y-2">
              <label htmlFor="newSecurityQuestion" className="text-sm font-medium text-gray-700">New Security Question</label>
              <select
                id="newSecurityQuestion"
                value={formData.newSecurityQuestion}
                onChange={(e) => updateFormData("newSecurityQuestion", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a164d] focus:border-transparent"
                required
              >
                <option value="">Select a security question</option>
                <option value="What was your first pet's name?">What was your first pet's name?</option>
                <option value="In what city were you born?">In what city were you born?</option>
                <option value="What was your mother's maiden name?">What was your mother's maiden name?</option>
                <option value="What was the name of your first school?">What was the name of your first school?</option>
                <option value="What is your favorite book?">What is your favorite book?</option>
                <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                <option value="What is the name of the street you grew up on?">What is the name of the street you grew up on?</option>
                <option value="What is your favorite movie?">What is your favorite movie?</option>
              </select>
            </div>

            {/* New Security Answer Field */}
            <div className="space-y-2">
              <label htmlFor="newSecurityAnswer" className="text-sm font-medium text-gray-700">New Security Answer</label>
              <Input 
                id="newSecurityAnswer" 
                type="text"
                placeholder="Enter your new answer"
                value={formData.newSecurityAnswer}
                onChange={(e) => updateFormData("newSecurityAnswer", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a164d] focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500">
                This answer will be required every time you log in
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
                  <span>Updating...</span>
                </div>
              ) : (
                "Update Security Question"
              )}
            </Button>

            {/* Alternative Reset Method */}
            {resetMethod === 'password' && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Don't remember your password?
                </p>
                <Link 
                  to="/auth/initiate-security-question-reset" 
                  className="text-sm text-[#0a164d] hover:text-[#0a164d]/80 font-medium"
                >
                  Reset via email instead
                </Link>
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
};

export default ResetSecurityQuestion;
