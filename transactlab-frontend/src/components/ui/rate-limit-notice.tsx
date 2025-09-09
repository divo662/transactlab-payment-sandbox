import React from 'react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';

interface RateLimitNoticeProps {
  onRetry?: () => void;
  retryDisabled?: boolean;
  message?: string;
}

export function RateLimitNotice({ 
  onRetry, 
  retryDisabled = false, 
  message = "You've made too many requests. Please wait a moment before trying again."
}: RateLimitNoticeProps) {
  return (
    <Alert className="border-amber-200 bg-amber-50/50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Please wait a moment</AlertTitle>
      <AlertDescription className="text-amber-700">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="mb-2">{message}</p>
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Clock className="h-4 w-4" />
              <span>This usually resolves within a few seconds</span>
            </div>
          </div>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={retryDisabled}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${retryDisabled ? '' : 'animate-spin'}`} />
              {retryDisabled ? 'Please wait...' : 'Try again'}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
