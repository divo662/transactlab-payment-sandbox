import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

// Extend window interface for our flag
declare global {
  interface Window {
    kycCallbackActive?: boolean;
  }
}

const KycCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'retry'>('loading');
  const [message, setMessage] = useState('Processing KYC verification...');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // Prevent any automatic redirects while on this page
  useEffect(() => {
    console.log('KYC Callback: Component mounted, preventing redirects');
    // Add a flag to prevent other components from redirecting
    window.kycCallbackActive = true;
    
    return () => {
      window.kycCallbackActive = false;
    };
  }, []);

  useEffect(() => {
    const processKycCallback = async () => {
      try {
        console.log('KYC Callback: Processing callback', {
          currentUrl: window.location.href,
          searchParams: Object.fromEntries(searchParams.entries())
        });

        // Get session ID from URL params or query string
        const currentSessionId = searchParams.get('sessionId') || searchParams.get('id') || searchParams.get('session');
        
        if (!currentSessionId) {
          setStatus('error');
          setMessage('No session ID found in callback URL');
          return;
        }

        setSessionId(currentSessionId);
        console.log('KYC Callback: Session ID found', currentSessionId);

        // Verify the session status with our backend
        try {
          console.log('KYC Callback: Checking status with backend');
          const response = await api.getKycStatus(currentSessionId);
          console.log('KYC Callback: Backend response', response.data);
          
          if (response.data.success && response.data.data.completed) {
            console.log('KYC Callback: Verification completed, showing success');
            setStatus('success');
            setMessage('KYC verification completed successfully!');
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              console.log('KYC Callback: Redirecting to dashboard');
              navigate('/dashboard');
            }, 3000);
          } else {
            console.log('KYC Callback: Verification not completed, showing retry');
            setStatus('retry');
            setMessage('KYC verification is still processing. If you completed verification, click the button below to manually complete it.');
          }
        } catch (error) {
          console.log('KYC Callback: Error checking status', error);
          // If we can't verify, show retry option
          setStatus('retry');
          setMessage('Unable to verify KYC status. If you completed verification, click the button below to manually complete it.');
        }

      } catch (error) {
        console.error('KYC callback error:', error);
        setStatus('error');
        setMessage('Failed to process KYC verification. Please try again.');
      }
    };

    processKycCallback();
  }, [searchParams, navigate]);

  const handleManualComplete = async () => {
    if (!sessionId) return;
    
    setIsCompleting(true);
    try {
      const response = await api.completeKyc(sessionId);
      if (response.data.success) {
        setStatus('success');
        setMessage('KYC verification completed successfully!');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage('Failed to complete KYC verification. Please try again.');
      }
    } catch (error) {
      console.error('Manual KYC completion error:', error);
      setMessage('Failed to complete KYC verification. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
            {status === 'retry' && (
              <RefreshCw className="h-12 w-12 text-yellow-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {status === 'loading' && 'Processing Verification'}
            {status === 'success' && 'Verification Complete'}
            {status === 'error' && 'Verification Failed'}
            {status === 'retry' && 'Verification Pending'}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'success' && (
            <p className="text-sm text-gray-600 mb-4">
              You will be redirected to your dashboard shortly.
            </p>
          )}
          {status === 'error' && (
            <Button onClick={handleGoToDashboard} className="w-full">
              Go to Dashboard
            </Button>
          )}
          {status === 'retry' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                If you completed the verification process on the KYC platform, click the button below to manually complete it.
              </p>
              <Button 
                onClick={handleManualComplete} 
                disabled={isCompleting}
                className="w-full"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Complete Verification
                  </>
                )}
              </Button>
              <Button 
                onClick={handleGoToDashboard} 
                variant="outline" 
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KycCallback;
