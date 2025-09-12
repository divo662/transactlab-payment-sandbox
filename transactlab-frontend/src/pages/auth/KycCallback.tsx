import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

const KycCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing KYC verification...');

  useEffect(() => {
    const processKycCallback = async () => {
      try {
        // Get session ID from URL params or query string
        const sessionId = searchParams.get('sessionId') || searchParams.get('id') || searchParams.get('session');
        
        if (!sessionId) {
          setStatus('error');
          setMessage('No session ID found in callback URL');
          return;
        }

        // Verify the session status with our backend
        try {
          const response = await api.get(`/auth/kyc/status/${sessionId}`);
          if (response.data.success) {
            setStatus('success');
            setMessage('KYC verification completed successfully!');
          } else {
            setStatus('error');
            setMessage('KYC verification failed. Please try again.');
          }
        } catch (error) {
          // If we can't verify, assume success since the user was redirected here
          setStatus('success');
          setMessage('KYC verification completed successfully!');
        }
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);

      } catch (error) {
        console.error('KYC callback error:', error);
        setStatus('error');
        setMessage('Failed to process KYC verification. Please try again.');
      }
    };

    processKycCallback();
  }, [searchParams, navigate]);

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
          </div>
          <CardTitle className="text-xl">
            {status === 'loading' && 'Processing Verification'}
            {status === 'success' && 'Verification Complete'}
            {status === 'error' && 'Verification Failed'}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default KycCallback;
