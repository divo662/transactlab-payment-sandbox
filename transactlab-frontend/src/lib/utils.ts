import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats API error messages to be user-friendly
 */
export function formatApiError(error: any): string {
  if (!error) return 'An unexpected error occurred';
  
  const message = error.message || error.toString();
  const status = error?.status || error?.response?.status;
  
  // Handle Render cold start (server sleeping) - timeout or connection errors
  if (
    message.includes('RENDER_COLD_START') ||
    message.includes('Server is waking up') ||
    (message.includes('Request timed out') && !message.includes('check your connection')) ||
    (message.includes('Failed to fetch') && !message.includes('check your internet')) ||
    (message.includes('timeout') && message.includes('15'))
  ) {
    return 'The server is waking up from sleep mode. This takes about 60 seconds. Please wait a moment and try again - this is normal behavior on the free tier.';
  }
  
  // Handle timeout errors (likely Render cold start)
  if (message.includes('Request timed out') || message.includes('aborted') || error.name === 'AbortError') {
    return 'Request timed out - the server may be waking up. Please wait about 60 seconds and try again. This is normal on free hosting services.';
  }
  
  // Handle network errors that might be Render cold start
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    // Check if it's likely a Render cold start (no response within timeout)
    return 'Unable to connect - the server may be waking up. Please wait about 60 seconds and try again. This is normal behavior and nothing is wrong!';
  }
  
  // Handle server errors that might indicate cold start
  if (status === 502 || status === 503 || status === 504) {
    return 'The server is temporarily unavailable - it may be waking up. Please wait about 60 seconds and try again. This is normal on free hosting services.';
  }
  
  // Handle specific error cases
  if (message.includes('Too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (message.includes('not found')) {
    return 'The requested resource was not found.';
  }
  
  if (message.includes('unauthorized') || message.includes('Please log in')) {
    return 'Please log in to continue.';
  }
  
  if (message.includes('permission') || message.includes('forbidden')) {
    return 'You don\'t have permission to perform this action.';
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'Please check your input and try again.';
  }
  
  // For unknown errors, return a generic message
  return 'Something went wrong. Please try again.';
}

/**
 * Checks if an error is a rate limiting error
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false;
  const message = error.message || error.toString();
  return message.includes('Too many requests') || message.includes('rate limit');
}

/**
 * Checks if an error is a network/connection error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  const message = error.message || error.toString();
  return message.includes('Failed to fetch') || message.includes('NetworkError');
}
