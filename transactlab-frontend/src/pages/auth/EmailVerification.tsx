import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'verifying'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationStatus('error');
        setErrorMessage('No verification token found. Please check your email for the correct link.');
        setIsVerifying(false);
        return;
      }

      try {
        setIsVerifying(true);
        const response = await apiService.verifyEmail(token);
        
        if (response.success) {
          setVerificationStatus('success');
          // Extract email from the token or response if available
          // For now, we'll show a generic message
          toast({
            title: "Email verified successfully!",
            description: "Your account has been activated. You can now sign in.",
            variant: "default"
          });
        } else {
          setVerificationStatus('error');
          setErrorMessage(response.message || 'Verification failed. Please try again.');
        }
      } catch (error: any) {
        setVerificationStatus('error');
        setErrorMessage(error.message || 'Verification failed. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, toast]);

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address to resend verification.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsResending(true);
      const response = await apiService.resendVerification({ email: userEmail });
      
      if (response.success) {
        toast({
          title: "Verification email sent!",
          description: "Please check your inbox for the new verification link.",
          variant: "default"
        });
      } else {
        toast({
          title: "Failed to resend",
          description: response.message || "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#0a164d] mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Your Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            {verificationStatus === 'success' ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold text-gray-900">
            {verificationStatus === 'success' ? 'Email Verified!' : 'Verification Failed'}
          </CardTitle>
          
          <CardDescription className="text-gray-600">
            {verificationStatus === 'success' 
              ? 'Your email has been successfully verified. You can now access your account.'
              : 'We encountered an issue while verifying your email.'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {verificationStatus === 'success' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Account Activated</p>
                    <p>Welcome to TransactLab! Your account is now ready to use.</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGoToLogin}
                className="w-full bg-[#0a164d] hover:bg-[#0a164d]/90 text-white h-12 text-base font-medium transition-all duration-200 hover:scale-105"
              >
                Go to Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Verification Error</p>
                    <p className="mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>

              {/* Email input for resend */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Enter your email to resend verification
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] rounded-md px-3 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleGoToLogin}
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-gray-300 hover:border-[#0a164d] hover:text-[#0a164d] transition-all duration-200"
                >
                  Go to Login
                </Button>
                
                <Button 
                  onClick={handleResendVerification}
                  disabled={!userEmail || isResending}
                  className="w-full h-12 text-base font-medium bg-[#0a164d] hover:bg-[#0a164d]/90 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <img 
                  src="/transactlab/1.png" 
                  alt="TransactLab Logo" 
                  className="w-8 h-8 object-cover"
                />
                <span className="text-lg font-bold text-[#0a164d]">TransactLab</span>
              </div>
              <p className="text-xs text-gray-500">
                Secure payment gateway simulation platform
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;
