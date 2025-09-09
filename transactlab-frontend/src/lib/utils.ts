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
  
  // Handle specific error cases
  if (message.includes('Too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
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
