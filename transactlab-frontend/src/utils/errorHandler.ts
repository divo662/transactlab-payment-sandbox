import { useState } from 'react';

// Global error handler for API requests
export class ApiErrorHandler {
  private static retryCounts = new Map<string, number>();
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  static async handleError(error: any, endpoint: string, retryFn?: () => Promise<any>): Promise<any> {
    console.error(`API Error for ${endpoint}:`, error);
    
    // Handle timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      console.warn(`Request timeout for ${endpoint}`);
      if (retryFn && this.shouldRetry(endpoint)) {
        await this.delay(this.RETRY_DELAY);
        this.incrementRetryCount(endpoint);
        console.log(`Retrying ${endpoint} (attempt ${this.getRetryCount(endpoint)})`);
        return retryFn();
      }
      throw new Error('Request timed out. Please check your connection and try again.');
    }

    // Handle network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
      console.warn(`Network error for ${endpoint}`);
      if (retryFn && this.shouldRetry(endpoint)) {
        await this.delay(this.RETRY_DELAY);
        this.incrementRetryCount(endpoint);
        console.log(`Retrying ${endpoint} due to network error (attempt ${this.getRetryCount(endpoint)})`);
        return retryFn();
      }
      throw new Error('Network error. Please check your connection and try again.');
    }

    // Handle 401 errors (token issues)
    if (error.status === 401 || error.message?.includes('Unauthorized')) {
      console.warn(`Unauthorized error for ${endpoint} - clearing auth state`);
      // Clear auth state and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    // Handle 429 errors (rate limiting)
    if (error.status === 429 || error.message?.includes('Too many requests')) {
      console.warn(`Rate limited for ${endpoint}`);
      if (retryFn && this.shouldRetry(endpoint)) {
        const delay = Math.pow(2, this.getRetryCount(endpoint)) * 1000; // Exponential backoff
        await this.delay(delay);
        this.incrementRetryCount(endpoint);
        console.log(`Retrying ${endpoint} after rate limit (attempt ${this.getRetryCount(endpoint)})`);
        return retryFn();
      }
      throw new Error('Too many requests. Please wait a moment and try again.');
    }

    // Reset retry count for other errors
    this.resetRetryCount(endpoint);
    throw error;
  }

  private static shouldRetry(endpoint: string): boolean {
    return this.getRetryCount(endpoint) < this.MAX_RETRIES;
  }

  private static getRetryCount(endpoint: string): number {
    return this.retryCounts.get(endpoint) || 0;
  }

  private static incrementRetryCount(endpoint: string): void {
    const current = this.getRetryCount(endpoint);
    this.retryCounts.set(endpoint, current + 1);
  }

  private static resetRetryCount(endpoint: string): void {
    this.retryCounts.delete(endpoint);
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static resetAllRetryCounts(): void {
    this.retryCounts.clear();
  }
}

// Hook for handling loading states
export const useLoadingHandler = () => {
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      if (loading) {
        newMap.set(key, true);
      } else {
        newMap.delete(key);
      }
      return newMap;
    });
  };

  const isLoading = (key: string) => loadingStates.has(key);

  const clearAllLoading = () => setLoadingStates(new Map());

  return { setLoading, isLoading, clearAllLoading };
};