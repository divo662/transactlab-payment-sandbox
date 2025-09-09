const API_BASE_URL = '/api/v1';

export interface TransactionData {
  amount: number;
  currency: string;
  email: string;
  reference?: string;
  payment_method?: string;
  customer_name?: string;
  customer_phone?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface TransactionResponse {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  customerEmail: string;
  customerName?: string;
  createdAt: string;
  processedAt?: string;
  fees: number;
  totalAmount: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  successCount: number;
  successRate: number;
  avgTransactionValue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

class TransactionApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  /**
   * Initialize a new transaction
   */
  async initializeTransaction(transactionData: TransactionData): Promise<ApiResponse<{
    transaction: TransactionResponse;
    paymentUrl: string;
    authorizationUrl: string;
  }>> {
    const response = await fetch(`${API_BASE_URL}/transactions/initialize`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(transactionData)
    });

    return this.handleResponse(response);
  }

  /**
   * Get list of transactions with filters
   */
  async getTransactions(params: {
    page?: number;
    perPage?: number;
    status?: string;
    payment_method?: string;
    period?: string;
    search?: string;
  } = {}): Promise<ApiResponse<{
    transactions: TransactionResponse[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/transactions?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(id: string): Promise<ApiResponse<TransactionResponse>> {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Verify transaction by reference
   */
  async verifyTransaction(reference: string): Promise<ApiResponse<{
    transaction: TransactionResponse;
    merchant: {
      id: string;
      businessName: string;
      businessEmail: string;
      logo?: string;
    } | null;
  }>> {
    const response = await fetch(`${API_BASE_URL}/transactions/verify/${reference}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Cancel a transaction
   */
  async cancelTransaction(id: string): Promise<ApiResponse<{
    transaction: {
      id: string;
      reference: string;
      status: string;
      failureReason: string;
    };
  }>> {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(period: string = '30d'): Promise<ApiResponse<{
    period: string;
    summary: TransactionStats;
    byStatus: Array<{
      _id: string;
      count: number;
      totalAmount: number;
      avgAmount: number;
    }>;
    byPaymentMethod: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
  }>> {
    const response = await fetch(`${API_BASE_URL}/transactions/stats?period=${period}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    return this.handleResponse(response);
  }

  /**
   * Export transactions (CSV/Excel)
   */
  async exportTransactions(params: {
    status?: string;
    payment_method?: string;
    start_date?: string;
    end_date?: string;
    format?: 'csv' | 'excel';
  } = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/transactions/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to export transactions');
    }

    return response.blob();
  }
}

// Create and export a singleton instance
export const transactionApi = new TransactionApiService();

// Export the class for testing purposes
export { TransactionApiService };

