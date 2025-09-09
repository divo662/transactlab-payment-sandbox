import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';

interface SandboxContextType {
  isSandboxMode: boolean;
  switchToLiveMode: () => void;
  switchToSandboxMode: () => void;
  sandboxData: any;
  loading: boolean;
  error: string | null;
  
  // Core API method
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
  
  // New sandbox features
  createApiKey: (data: CreateApiKeyData) => Promise<any>;
  getApiKeys: () => Promise<any>;
  deactivateApiKey: (apiKey: string) => Promise<any>;
  createSession: (data: CreateSessionData) => Promise<any>;
  getSession: (sessionId: string) => Promise<any>;
  getRecentSessions: () => Promise<any>;
  processPayment: (sessionId: string, data: ProcessPaymentData) => Promise<any>;
  createWebhook: (data: CreateWebhookData) => Promise<any>;
  getWebhooks: () => Promise<any>;
  testWebhook: (webhookId: string, data: WebhookTestData) => Promise<any>;
  getRecentTransactions: () => Promise<any>;
  createCustomerWithSession: (data: CreateCustomerWithSessionData) => Promise<any>;
  
  // Legacy functions for backward compatibility
  processRefund: (data: RefundData) => Promise<any>;
  completePendingTransaction: (transactionId: string, status?: string) => Promise<any>;
  updateSandboxConfig: (data: { webhookEndpoint?: string; webhookSecret?: string }) => Promise<any>;
  refreshSandboxData: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  createTestTransaction: (data: CreateTransactionData) => Promise<any>;
  createTestSubscription: (data: CreateSubscriptionData) => Promise<any>;
  getSandboxTransactions: (page?: number, limit?: number, status?: string) => Promise<any>;
  getSandboxStats: (params?: { days?: number; freq?: 'daily'|'weekly'|'monthly'; product?: 'all'|'subscriptions'|'one-time' }) => Promise<any>;
}

interface CreateApiKeyData {
  name: string;
  permissions: string[];
  expiresAt?: Date;
  webhookUrl?: string;
}

interface CreateSessionData {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, any>;
}

interface ProcessPaymentData {
  paymentMethod: 'card' | 'bank' | 'wallet';
  cardDetails?: {
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
}

interface CreateWebhookData {
  name: string;
  url: string;
  events: string[];
}

interface CreateTransactionData {
  amount: number;
  currency: string;
  paymentMethod: string;
  customerEmail: string;
  description?: string;
}

interface CreateSubscriptionData {
  planName: string;
  planId: string;
  amount: number;
  currency: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  customerEmail: string;
  trialDays?: number;
}

interface RefundData {
  transactionId: string;
  refundAmount: number;
  reason?: string;
}

interface WebhookTestData {
  webhookUrl: string;
  eventType?: string;
}

interface CreateCustomerWithSessionData {
  email: string;
  name?: string;
  amount: number;
  currency: string;
  description: string;
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

export const useSandbox = () => {
  const context = useContext(SandboxContext);
  if (context === undefined) {
    throw new Error('useSandbox must be used within a SandboxProvider');
  }
  return context;
};

interface SandboxProviderProps {
  children: ReactNode;
}

export const SandboxProvider: React.FC<SandboxProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isSandboxMode, setIsSandboxMode] = useState(true);
  const [sandboxData, setSandboxData] = useState({
    config: {},
    recentTransactions: [],
    customers: [],
    apiKeys: [],
    webhooks: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef(0);

  // API base URL
  const API_BASE = 'http://localhost:5000/api/v1/sandbox';

  // Helper function to make authenticated API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('accessToken');
    // Read both per-user and global keys to be safe
    const activeOwner = localStorage.getItem('activeOwnerId') || localStorage.getItem(`activeOwnerId:${localStorage.getItem('currentUserId') || 'anon'}`) || '';
    const activeTeamId = localStorage.getItem('activeTeamId') || localStorage.getItem(`activeTeamId:${localStorage.getItem('currentUserId') || 'anon'}`) || '';
    // Debug header values
    try { console.debug('[SandboxContext] apiCall', { endpoint, activeOwner, activeTeamId }); } catch {}
    if (!token) {
      // If no token, force redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('No access token found');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(activeOwner ? { 'X-Owner-Id': activeOwner } : {}),
      ...(activeTeamId ? { 'X-Team-Id': activeTeamId } : {}),
      ...options.headers,
    };
    
    console.log('[SandboxContext] Making API call with headers:', {
      endpoint,
      activeOwner,
      activeTeamId,
      headers: {
        'x-owner-id': headers['x-owner-id'],
        'x-team-id': headers['x-team-id']
      }
    });

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // If unauthorized, clear tokens and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        try {
          const body = await response.json().catch(() => null) as any;
          const message = body?.message || 'Unauthorized';
          console.error('Unauthorized:', message);
        } catch (_) {}
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  };

  // Update sandbox data when user changes
  useEffect(() => {
    if (!isAuthenticated) {
      setError(null);
      setSandboxData({
        config: {},
        recentTransactions: [],
        customers: [],
        apiKeys: [],
        webhooks: []
      });
      return;
    }

    const fetchSandboxData = async () => {
      try {
        setLoading(true);
        const result = await apiCall('/data');
          if (result.success) {
            setSandboxData(result.data);
        } else {
          setError(result.message || 'Failed to fetch sandbox data');
        }
      } catch (error) {
        console.error('Failed to fetch sandbox data:', error);
        setError(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSandboxData();
  }, [isAuthenticated]);

  const switchToLiveMode = () => {
    setIsSandboxMode(false);
  };

  const switchToSandboxMode = () => {
    if (!isAuthenticated) {
      return;
    }
    setIsSandboxMode(true);
  };

  // New sandbox API methods
  const createApiKey = async (data: CreateApiKeyData) => {
    try {
      setLoading(true);
      const result = await apiCall('/api-keys', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshSandboxData(); // Refresh data after creation
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getApiKeys = async () => {
    try {
      const result = await apiCall('/api-keys');
      return result;
    } catch (error) {
      throw error;
    }
  };

  const deactivateApiKey = async (apiKey: string) => {
    try {
    setLoading(true);
      const result = await apiCall(`/api-keys/${apiKey}`, {
        method: 'DELETE',
      });
      await refreshSandboxData(); // Refresh data after deactivation
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (data: CreateSessionData) => {
    try {
      setLoading(true);
      const result = await apiCall('/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshSandboxData(); // Refresh data after creation
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getSession = async (sessionId: string) => {
    try {
      const result = await apiCall(`/sessions/${sessionId}`);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const getRecentSessions = async () => {
    try {
      const result = await apiCall('/sessions');
      return result;
    } catch (error) {
      throw error;
    }
  };

  const processPayment = async (sessionId: string, data: ProcessPaymentData) => {
    try {
      setLoading(true);
      const result = await apiCall(`/sessions/${sessionId}/process-payment`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshSandboxData(); // Refresh data after payment
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async (data: CreateWebhookData) => {
    try {
      setLoading(true);
      const result = await apiCall('/webhooks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshSandboxData(); // Refresh data after creation
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getWebhooks = async () => {
    try {
      const result = await apiCall('/webhooks');
      return result;
    } catch (error) {
      throw error;
    }
  };

  const testWebhook = async (webhookId: string, data: WebhookTestData) => {
    try {
      setLoading(true);
      const result = await apiCall(`/webhooks/${webhookId}/test`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getRecentTransactions = async (page: number = 1, limit: number = 20) => {
    try {
      const result = await apiCall(`/transactions?page=${page}&limit=${limit}`);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const createCustomerWithSession = async (data: CreateCustomerWithSessionData) => {
    try {
      setLoading(true);
      const result = await apiCall('/customers/quick-session', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshSandboxData(); // Refresh data after creation
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Legacy methods (keeping for backward compatibility)
  const processRefund = async (data: RefundData) => {
    try {
      setLoading(true);
      const result = await apiCall('/refunds', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshSandboxData();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completePendingTransaction = async (transactionId: string, status?: string) => {
    try {
      setLoading(true);
      const result = await apiCall('/transactions/complete', {
        method: 'POST',
        body: JSON.stringify({ transactionId, status }),
      });
      await refreshSandboxData();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSandboxConfig = async (data: { webhookEndpoint?: string; webhookSecret?: string }) => {
    try {
      setLoading(true);
      const result = await apiCall('/config', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      await refreshSandboxData();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshSandboxData = async () => {
    try {
      const result = await apiCall('/data');
      if (result.success) {
        setSandboxData(result.data);
      }
    } catch (error) {
      console.error('Failed to refresh sandbox data:', error);
    }
  };

  const refreshCustomers = async () => {
    // This is now handled by the main data fetch
    await refreshSandboxData();
  };

  const createTestTransaction = async (data: CreateTransactionData) => {
    // Legacy method - now creates a session and processes payment
    try {
      const session = await createSession({
        amount: data.amount,
        currency: data.currency,
        description: data.description || 'Test transaction',
        customerEmail: data.customerEmail,
      });
      
      if (session.success) {
        return await processPayment(session.data.sessionId, {
          paymentMethod: data.paymentMethod as 'card' | 'bank' | 'wallet',
        });
      }
      
      return session;
    } catch (error) {
      throw error;
    }
  };

  const createTestSubscription = async (data: CreateSubscriptionData) => {
    // Legacy method - now creates a session for subscription
    try {
      return await createSession({
        amount: data.amount,
        currency: data.currency,
        description: `${data.planName} subscription`,
        customerEmail: data.customerEmail,
        metadata: {
          planId: data.planId,
          interval: data.interval,
          trialDays: data.trialDays,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  const getSandboxTransactions = async (page?: number, limit?: number, status?: string) => {
    // Legacy method - now uses the new transactions endpoint
    try {
      const result = await getRecentTransactions();
      // Apply pagination and filtering if needed
      let transactions = result.data.transactions || [];
      
      if (status && status !== 'all') {
        transactions = transactions.filter((t: any) => t.status === status);
      }
      
      if (page && limit) {
        const start = (page - 1) * limit;
        const end = start + limit;
        transactions = transactions.slice(start, end);
      }
      
      return {
        success: true,
        data: { transactions },
        pagination: { page: page || 1, limit: limit || 10 }
      };
    } catch (error) {
      throw error;
    }
  };

  const getSandboxStats = async (params?: { days?: number; freq?: 'daily'|'weekly'|'monthly'; product?: 'all'|'subscriptions'|'one-time' }) => {
    try {
      const query = new URLSearchParams();
      if (params?.days) query.set('days', String(params.days));
      if (params?.freq) query.set('freq', String(params.freq));
      if (params?.product) query.set('product', String(params.product));
      const qs = query.toString();
      const result = await apiCall(`/stats${qs ? `?${qs}` : ''}`);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const value: SandboxContextType = {
    isSandboxMode,
    switchToLiveMode,
    switchToSandboxMode,
    sandboxData,
    loading,
    error,
    
    // Core API method
    apiCall,
    
    // New methods
    createApiKey,
    getApiKeys,
    deactivateApiKey,
    createSession,
    getSession,
    getRecentSessions,
    processPayment,
    createWebhook,
    getWebhooks,
    testWebhook,
    getRecentTransactions,
    createCustomerWithSession,
    
    // Legacy methods
    processRefund,
    completePendingTransaction,
    updateSandboxConfig,
    refreshSandboxData,
    refreshCustomers,
    createTestTransaction,
    createTestSubscription,
    getSandboxTransactions,
    getSandboxStats,
  };

  return (
    <SandboxContext.Provider value={value}>
      {children}
    </SandboxContext.Provider>
  );
};
