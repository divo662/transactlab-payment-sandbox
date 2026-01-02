const API_BASE_URL = 'https://transactlab-backend.onrender.com/api/v1';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // Add timeout to prevent hanging requests (reduced for mobile)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for better mobile experience
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        ...options.headers,
      },
      ...options,
      signal: controller.signal, // Add abort signal for timeout
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
      clearTimeout(timeoutId); // Clear timeout on successful response
      
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
          // For sandbox/payment testing, be more lenient with rate limits
          console.warn('Rate limited - but continuing for sandbox testing');
          // Return a mock response or continue with the request for better UX
          return {} as T;
        } else if (response.status === 401) {
          // Try refresh once, then retry original request
          if (retryCount === 0) {
            try {
              console.log('Attempting token refresh...');
              await this.refreshToken();
              const newToken = localStorage.getItem('accessToken');
              if (newToken) {
                config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newToken}` };
                console.log('Token refreshed, retrying request...');
                response = await fetch(url, config);
                if (!response.ok) throw new Error('Unauthorized after refresh');
                // continue below to parse normally
                clearTimeout(timeoutId);
                return await response.json() as T;
              } else {
                throw new Error('No new token after refresh');
              }
              } catch (refreshError) {
                // Try to get the actual error response before throwing
                let errorMessage = 'Please log in to continue.';
                let errorData: any = {};
                
                try {
                  // Clone the response to avoid consuming it
                  const responseClone = response.clone();
                  errorData = await responseClone.json();
                  errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                  // If we can't parse JSON, try to get text
                  try {
                    const responseClone = response.clone();
                    const text = await responseClone.text();
                    if (text) {
                      errorMessage = text;
                      errorData = { message: text };
                    }
                  } catch {
                    // Use default message
                  }
                }
                
                const error = new Error(errorMessage);
                (error as any).status = response.status;
                (error as any).response = { data: errorData };
                throw error;
              }
            } else {
              // Try to get the actual error response before throwing
              let errorMessage = 'Please log in to continue.';
              let errorData: any = {};
              
              try {
                // Clone the response to avoid consuming it
                const responseClone = response.clone();
                errorData = await responseClone.json();
                errorMessage = errorData.message || errorMessage;
              } catch (parseError) {
                // If we can't parse JSON, try to get text
                try {
                  const responseClone = response.clone();
                  const text = await responseClone.text();
                  if (text) {
                    errorMessage = text;
                    errorData = { message: text };
                  }
                } catch {
                  // Use default message
                }
              }
              
              const error = new Error(errorMessage);
              (error as any).status = response.status;
              (error as any).response = { data: errorData };
              throw error;
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
    } catch (error: any) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('API request failed:', error);
      
      // Handle specific error types with better messages
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // For production, be more lenient with certain errors
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        console.warn('Rate limit hit, but continuing for sandbox testing');
        return {} as T; // Return empty object instead of throwing
      }
      
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
    // Try login with shorter timeout for better UX
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for login
    
    try {
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle login-specific errors
      if (error.name === 'AbortError') {
        throw new Error('Login timed out. Please check your connection and try again.');
      }
      
      throw error;
    }
  }

  async logout(): Promise<any> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async deleteAccount(data: { password: string; confirmation: string }): Promise<any> {
    return this.request('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify(data)
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

  // Security methods
  async getSecuritySettings(): Promise<any> {
    return this.request('/auth/security/settings');
  }

  async updateSecuritySettings(data: any): Promise<any> {
    return this.request('/auth/security/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getTrustedDevices(): Promise<any> {
    return this.request('/auth/security/devices');
  }

  async removeTrustedDevice(deviceId: string): Promise<any> {
    return this.request(`/auth/security/devices/${deviceId}`, {
      method: 'DELETE'
    });
  }

  async setupTotp(): Promise<any> {
    return this.request('/auth/security/totp/setup', {
      method: 'POST'
    });
  }

  async verifyTotp(data: any): Promise<any> {
    return this.request('/auth/security/totp/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async disableTotp(): Promise<any> {
    return this.request('/auth/security/totp', {
      method: 'DELETE'
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
    return this.request('/sandbox/payment-links/quick', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Public quick link endpoints (no auth required by server, but we still send token if available)
  async getQuickLinkMeta(token: string, userIdHint?: string): Promise<any> {
    const qs = userIdHint ? `?userId=${encodeURIComponent(userIdHint)}` : '';
    const url = `https://transactlab-backend.onrender.com/sandbox/pay/ql/${encodeURIComponent(token)}${qs}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      let msg = 'Failed to fetch quick link meta';
      try { const j = await resp.json(); msg = j?.message || msg; } catch {}
      throw new Error(msg);
    }
    return await resp.json();
  }

  async startPaymentFromQuickLink(token: string, payload: { amount?: number; customerEmail?: string; customerName?: string }, userIdHint?: string): Promise<any> {
    const qs = userIdHint ? `?userId=${encodeURIComponent(userIdHint)}` : '';
    const url = `https://transactlab-backend.onrender.com/sandbox/pay/ql/${encodeURIComponent(token)}/start${qs}`;
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!resp.ok) {
      let msg = 'Failed to start payment from quick link';
      try { const j = await resp.json(); msg = j?.message || msg; } catch {}
      throw new Error(msg);
    }
    return await resp.json();
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

  // Feedback API methods
  async createFeedback(data: {
    rating: number;
    title: string;
    message: string;
    category: 'bug' | 'feature' | 'improvement' | 'general' | 'other';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
    isPublic?: boolean;
  }) {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserFeedback(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/feedback/my?${queryString}` : '/feedback/my';
    
    return this.request(endpoint);
  }

  async getPublicFeedback(params?: {
    page?: number;
    limit?: number;
    category?: string;
    rating?: number;
    sortBy?: 'createdAt' | 'helpful';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.rating) queryParams.append('rating', params.rating.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/feedback/public?${queryString}` : '/feedback/public';
    
    return this.request(endpoint);
  }

  async getFeedbackStats() {
    return this.request('/feedback/stats');
  }

  async voteFeedback(feedbackId: string, voteType: 'helpful' | 'notHelpful') {
    const helpful = voteType === 'helpful';
    return this.request(`/feedback/${feedbackId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    });
  }

  // Analytics API methods
  async getAnalyticsOverview(timeRange: string = '30d') {
    return this.request(`/analytics/overview?timeRange=${timeRange}`);
  }

  async getTransactionAnalytics(timeRange: string = '30d') {
    return this.request(`/analytics/transactions?timeRange=${timeRange}`);
  }

  async getCustomerAnalytics(timeRange: string = '30d') {
    return this.request(`/analytics/customers?timeRange=${timeRange}`);
  }

  async exportAnalytics(type: string, format: string = 'json', timeRange: string = '30d'): Promise<any> {
    const url = `${API_BASE_URL}/analytics/export?type=${type}&format=${format}&timeRange=${timeRange}`;
    
    // For binary formats (Excel/CSV), we need to handle the response differently
    if (format === 'excel' || format === 'xlsx' || format === 'csv') {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Export failed' };
        }
        throw new Error(errorData.message || 'Export failed');
      }

      return await response.arrayBuffer();
    } else {
      // For JSON format, use the regular request method
      return this.request(`/analytics/export?type=${type}&format=${format}&timeRange=${timeRange}`);
    }
  }

  // Sandbox API methods (used by Dashboard)
  async getSandboxStats(params: { product: string; days: number; freq: string; offset?: number }) {
    let url = `/sandbox/stats?days=${params.days}&freq=${params.freq}&product=${params.product}`;
    if (params.offset) {
      url += `&offset=${params.offset}`;
    }
    return this.request(url);
  }

  async getSandboxWebhooks() {
    return this.request('/sandbox/webhooks');
  }

  async getSandboxCustomers() {
    return this.request('/sandbox/customers');
  }

  async getSandboxTransactions() {
    return this.request('/sandbox/transactions');
  }

  async getSandboxRefunds() {
    return this.request('/sandbox/refunds');
  }

  // API Key management (single permanent key)
  async getSandboxApiKey() {
    return this.request('/sandbox/api-key');
  }

  async updateSandboxApiKey(data: {
    webhookUrl?: string;
    webhookSecret?: string;
    rateLimit?: {
      requestsPerMinute?: number;
      requestsPerHour?: number;
      requestsPerDay?: number;
    };
  }) {
    return this.request('/sandbox/api-key', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async regenerateSandboxApiKey() {
    return this.request('/sandbox/api-key/regenerate', {
      method: 'POST'
    });
  }

  async toggleSandboxApiKeyStatus() {
    return this.request('/sandbox/api-key/toggle', {
      method: 'POST'
    });
  }

  // Invoice methods
  async sendInvoice(invoiceId: string): Promise<any> {
    return this.request(`/sandbox/invoices/${invoiceId}/send`, {
      method: 'POST',
    });
  }

  async sendInvoiceReminder(invoiceId: string): Promise<any> {
    return this.request(`/sandbox/invoices/${invoiceId}/remind`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
export default apiService; 