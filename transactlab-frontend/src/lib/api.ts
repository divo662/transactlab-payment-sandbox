const API_BASE_URL = 'https://transactlab-backend.onrender.com/api/v1';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // Only set Content-Type for JSON requests
    if (!(options.body instanceof FormData)) {
      config.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
    }

    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      let response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData: any = {};
        try {
          // Try to parse JSON error response
          errorData = await response.json();
        } catch {
          // If not JSON, try to get text
          const errorText = await response.text();
          errorData = { message: errorText || 'Unknown error occurred' };
        }
        
        // Handle rate limiting with retry logic
        if (response.status === 429 && retryCount < 3) {
          // TEMPORARILY DISABLED: Rate limiting retry logic
          // In development, you can reduce the delay or bypass rate limiting in dev
          const isDevelopment = process.env.NODE_ENV === 'development';
          
          // Development bypass - temporarily bypass rate limiting in dev
          if (isDevelopment) {
            console.log('Development mode: Bypassing rate limit');
            // Don't retry, just continue with the request
          } else {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Rate limited, retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.request(endpoint, options, retryCount + 1);
          }
        }
        
        // Handle specific error cases with user-friendly messages
        if (response.status === 429) {
          // TEMPORARILY: In development, don't throw rate limit errors
          if (process.env.NODE_ENV === 'development') {
            console.warn('Rate limited in development - continuing anyway');
            // Return a mock response or continue with the request
            return {} as T;
          }
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 401) {
          // Try refresh once, then retry original request
          if (retryCount === 0) {
            try {
              await this.refreshToken();
              const newToken = localStorage.getItem('accessToken');
              if (newToken) {
                config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newToken}` };
              }
              response = await fetch(url, config);
              if (!response.ok) throw new Error('Unauthorized');
              // continue below to parse normally
            } catch (_) {
              throw new Error('Please log in to continue.');
            }
          } else {
            throw new Error('Please log in to continue.');
          }
        } else if (response.status === 403) {
          throw new Error('You don\'t have permission to perform this action.');
        } else if (response.status === 404) {
          throw new Error('The requested resource was not found.');
        } else if (response.status === 500) {
          // For 500 errors, try to extract more specific error information
          console.error('Server error details:', errorData);
          if (errorData.message && errorData.message !== 'An error occurred while updating the merchant profile') {
            throw new Error(`Server error: ${errorData.message}`);
          } else {
            throw new Error('Something went wrong on our end. Please try again later.');
          }
        } else {
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
      }

      // For FormData requests, return the response text or JSON
      if (options.body instanceof FormData) {
        try {
          return await response.json() as T;
        } catch {
          return await response.text() as T;
        }
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(data: any): Promise<any> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: any): Promise<any> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<any> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getProfile(): Promise<any> {
    return this.request('/auth/me');
  }

  async updateProfile(data: any): Promise<any> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(formData: FormData): Promise<any> {
    return this.request('/auth/upload-avatar', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
    });
  }

  async forgotPassword(data: any): Promise<any> {
    return this.request('/password/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: any): Promise<any> {
    return this.request('/password/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(token: string): Promise<any> {
    return this.request(`/auth/verify-email/${token}`);
  }

  async startKyc(returnUrl?: string): Promise<any> {
    return this.request('/auth/kyc/start', {
      method: 'POST',
      body: JSON.stringify({ returnUrl })
    });
  }

  async getKycStatus(sessionId: string): Promise<any> {
    return this.request(`/auth/kyc/status/${sessionId}`);
  }

  async completeKyc(sessionId: string): Promise<any> {
    return this.request(`/auth/kyc/complete/${sessionId}`, {
      method: 'POST'
    });
  }

  async verifyResetToken(token: string): Promise<any> {
    return this.request(`/password/verify-reset-token/${token}`);
  }

  async resendVerification(data: any): Promise<any> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async initiateSecurityQuestionReset(data: any): Promise<any> {
    return this.request('/auth/initiate-security-question-reset', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetSecurityQuestion(data: any): Promise<any> {
    return this.request('/auth/reset-security-question', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetSecurityQuestionWithPassword(data: any): Promise<any> {
    return this.request('/auth/reset-security-question-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/health');
  }

  // Merchant endpoints
  async getMerchantProfile(): Promise<any> {
    return this.request('/merchant/profile');
  }

  async createMerchantProfile(data: any): Promise<any> {
    return this.request('/merchant/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMerchantProfile(data: any): Promise<any> {
    console.log('API: Updating merchant profile with data:', data);
    console.log('API: Data type:', typeof data);
    console.log('API: Data keys:', Object.keys(data));
    
    const requestBody = JSON.stringify(data);
    console.log('API: Request body:', requestBody);
    
    return this.request('/merchant/profile', {
      method: 'PUT',
      body: requestBody,
    });
  }

  async getMerchantOnboardingStatus(): Promise<any> {
    return this.request('/merchant/onboarding-status');
  }

  async submitMerchantVerification(data: any): Promise<any> {
    // For file uploads, we need to use FormData instead of JSON
    const formData = new FormData();
    
    // Add each document file to the FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      }
    });
    
    return this.request('/merchant/verify', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header for FormData - browser will set it automatically with boundary
      headers: {
        'Content-Type': undefined
      }
    });
  }

  // Payment methods
  async getPaymentMethods(): Promise<any> {
    return this.request('/merchant/payment-methods');
  }

  async addPaymentMethod(data: any): Promise<any> {
    return this.request('/merchant/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentMethod(id: string, data: any): Promise<any> {
    return this.request(`/merchant/payment-methods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePaymentMethod(id: string): Promise<any> {
    return this.request(`/merchant/payment-methods/${id}`, {
      method: 'DELETE',
    });
  }

  // Transactions
  async createTransaction(data: any): Promise<any> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransactions(params?: any): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/transactions${queryString}`);
  }

  async getTransaction(id: string): Promise<any> {
    return this.request(`/transactions/${id}`);
  }

  // Analytics
  async getMerchantAnalytics(params?: any): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/merchant/analytics${queryString}`);
  }

  async getTransactionStats(params?: any): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/merchant/transaction-stats${queryString}`);
  }

  // Checkout templates & settings
  async listCheckoutTemplates(): Promise<any> {
    return this.request('/checkout/templates');
  }

  async getCheckoutSettings(): Promise<any> {
    return this.request('/checkout/settings');
  }

  async updateCheckoutSettings(data: any): Promise<any> {
    return this.request('/checkout/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateSdkDefaults(data: any): Promise<any> {
    return this.request('/checkout/settings/sdk-defaults', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateCheckoutProductOverride(productId: string, data: any): Promise<any> {
    return this.request(`/checkout/settings/product/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async previewCheckoutConfig(params?: Record<string,string>): Promise<any> {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/checkout/preview${qs}`);
  }

  // Sandbox template preview session
  async createTemplatePreviewSession(): Promise<any> {
    return this.request('/sandbox/sessions/preview-template', { method: 'POST' });
  }

  // Sandbox quick payment link
  async createQuickPaymentLink(data: any): Promise<any> {
    return this.request('/sandbox/links/quick', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Sandbox catalogs
  async listSandboxProducts(): Promise<any> {
    return this.request('/sandbox/products');
  }

  async listSandboxPlans(productId?: string): Promise<any> {
    const qs = productId ? `?${new URLSearchParams({ productId }).toString()}` : '';
    return this.request(`/sandbox/plans${qs}`);
  }

  async listSandboxCustomers(params?: { page?: number; limit?: number }): Promise<any> {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).reduce((acc, [k, v]) => ({...acc, [k]: String(v)}), {} as any)).toString()}` : '';
    return this.request(`/sandbox/customers${qs}`);
  }

  // Magic SDK
  async bakeMagicSdk(payload: any): Promise<any> {
    return this.request('/magic-sdk/bake', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async downloadMagicSdkZip(payload: any): Promise<Blob> {
    const endpoint = '/magic-sdk/zip';
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('accessToken');
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(msg || 'Failed to download SDK zip');
    }
    return await resp.blob();
  }
}

export const apiService = new ApiService();
export default apiService; 