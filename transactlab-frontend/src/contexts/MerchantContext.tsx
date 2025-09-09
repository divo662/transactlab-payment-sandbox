import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, BusinessProfileData, OnboardingProgress, PaymentMethodSetup } from '@/types';
import apiService from '@/lib/api';
import { useAuth } from './AuthContext';

interface MerchantContextType {
  merchant: User | null;
  onboardingProgress: OnboardingProgress;
  paymentMethods: PaymentMethodSetup[];
  isLoading: boolean;
  isOnboardingComplete: boolean;
  loadMerchantProfile: () => Promise<void>;
  createMerchantProfile: (data: BusinessProfileData) => Promise<void>;
  updateMerchantProfile: (data: Partial<User>) => Promise<void>;
  submitVerification: (data: any) => Promise<void>;
  loadPaymentMethods: () => Promise<void>;
  addPaymentMethod: (method: PaymentMethodSetup) => Promise<void>;
  updatePaymentMethod: (id: string, method: Partial<PaymentMethodSetup>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
  refreshMerchantProfile: () => Promise<void>;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

export const useMerchant = () => {
  const context = useContext(MerchantContext);
  if (context === undefined) {
    throw new Error('useMerchant must be used within a MerchantProvider');
  }
  return context;
};

interface MerchantProviderProps {
  children: ReactNode;
}

export const MerchantProvider: React.FC<MerchantProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [merchant, setMerchant] = useState<User | null>(null);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>({
    currentStep: 1,
    totalSteps: 4,
    completedSteps: [],
    isComplete: false,
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSetup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasAttemptedLoadRef = useRef(false);
  const lastAuthCheckRef = useRef<{ isAuthenticated: boolean; userId: string | undefined }>({
    isAuthenticated: false,
    userId: undefined
  });

  const isOnboardingComplete = onboardingProgress.isComplete;

  const loadMerchantProfile = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log('🔍 Debug: Skipping loadMerchantProfile - already loading');
      return;
    }
    
    // TEMPORARILY DISABLED: Rate limiting protection
    // const now = Date.now();
    // const lastCallTime = (loadMerchantProfile as any).lastCallTime || 0;
    // const minInterval = 2000; // Minimum 2 seconds between calls
    // 
    // if (now - lastCallTime < minInterval) {
    //   console.log('🔍 Debug: Rate limiting - skipping merchant profile load');
    //   return;
    // }
    // 
    // (loadMerchantProfile as any).lastCallTime = now;
    
    try {
      setIsLoading(true);
      console.log('🔍 Debug: Loading merchant profile...');
      const response = await apiService.getMerchantProfile();
      
      if (response.success && response.data) {
        // Extract the merchant object from the response
        const merchantData = response.data.merchant || response.data;
        setMerchant(merchantData);
        updateOnboardingProgress(merchantData);
        console.log('🔍 Debug: Merchant profile loaded successfully:', merchantData);
      } else {
        console.log('🔍 Debug: Merchant profile API returned no data or failed');
        setMerchant(null);
      }
    } catch (error: any) {
      console.error('Failed to load merchant profile:', error);
      
      // Handle specific error cases
      if (error.message?.includes('Too many requests')) {
        console.log('Rate limited - will retry automatically');
        // Don't show error to user for rate limiting, just set merchant to null
        setMerchant(null);
        // Reset the last call time to allow retry after delay
        // (loadMerchantProfile as any).lastCallTime = 0;
      } else if (error.message?.includes('not found') || error.message?.includes('Merchant profile not found')) {
        // If no profile exists, that's fine - user needs to complete onboarding
        console.log('No merchant profile found - user needs to complete onboarding');
        setMerchant(null);
        // Don't set an error for this case - it's expected for new users
      } else {
        // For other errors, show a user-friendly message
        console.error('Unexpected error loading merchant profile:', error.message);
        setMerchant(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Load merchant profile when user is authenticated
  useEffect(() => {
    console.log('🔍 Debug: Merchant loading effect triggered with:', { 
      isAuthenticated, 
      userId: user?.id, 
      userRole: user?.role,
      hasAttempted: hasAttemptedLoadRef.current,
      currentMerchant: merchant
    });
    
    const currentAuthState = { isAuthenticated, userId: user?.id };
    
    // Check if auth state has actually changed
    if (lastAuthCheckRef.current.isAuthenticated === isAuthenticated && 
        lastAuthCheckRef.current.userId === user?.id) {
      console.log('🔍 Debug: Auth state unchanged, skipping merchant profile load');
      return;
    }
    
    // Update the last auth check
    lastAuthCheckRef.current = currentAuthState;
    
    console.log('🔍 Debug: Auth state changed:', { isAuthenticated, userId: user?.id, hasAttempted: hasAttemptedLoadRef.current });
    
    if (isAuthenticated && user?.id && user?.role) {
      // User is authenticated and has a role, load merchant profile
      console.log('🔍 Debug: Loading merchant profile for user:', user.id, 'with role:', user.role);
      if (!hasAttemptedLoadRef.current) {
        hasAttemptedLoadRef.current = true;
        loadMerchantProfile();
      }
    } else if (isAuthenticated && !user?.id) {
      console.log('🔍 Debug: User authenticated but user object not fully loaded yet - waiting...');
      // Don't reset hasAttemptedLoadRef here, wait for user object to load
    } else if (isAuthenticated && !user?.role) {
      console.log('🔍 Debug: User authenticated but no role assigned yet');
    } else if (!isAuthenticated) {
      console.log('🔍 Debug: User not authenticated, resetting merchant profile');
      setMerchant(null);
      hasAttemptedLoadRef.current = false;
    }
  }, [isAuthenticated, user?.id, user?.role]); // Removed loadMerchantProfile dependency

  // Additional effect to handle when user object loads after authentication
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.role && !merchant && !hasAttemptedLoadRef.current) {
      console.log('🔍 Debug: User object loaded, now loading merchant profile');
      hasAttemptedLoadRef.current = true;
      loadMerchantProfile();
    }
  }, [user, merchant, isAuthenticated]);

  const updateOnboardingProgress = (merchantData: User) => {
    const steps = [
      { id: "profile", isCompleted: !!merchantData.businessName },
      { id: "address", isCompleted: false }, // TODO: Add businessAddress field to User model
      { id: "payment", isCompleted: !!(merchantData.supportedCurrencies?.length && merchantData.paymentMethods?.length) },
      { id: "verification", isCompleted: merchantData.isBusinessVerified || false },
    ];

    const completedSteps = steps.filter(step => step.isCompleted).map(step => step.id);
    const currentStep = completedSteps.length + 1;
    const isComplete = completedSteps.length === steps.length;

    setOnboardingProgress({
      currentStep,
      totalSteps: steps.length,
      completedSteps,
      isComplete,
    });
  };

  const createMerchantProfile = useCallback(async (data: BusinessProfileData) => {
    try {
      setIsLoading(true);
      const response = await apiService.createMerchantProfile(data);
      
      if (response.success && response.data) {
        // Extract the merchant object from the response
        const merchantData = response.data.merchant || response.data;
        setMerchant(merchantData);
        updateOnboardingProgress(merchantData);
      } else {
        throw new Error(response.message || 'Failed to create merchant profile');
      }
    } catch (error) {
      console.error('Failed to create merchant profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMerchantProfile = useCallback(async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      console.log('Updating merchant profile with data:', data);
      
      const response = await apiService.updateMerchantProfile(data);
      console.log('Update merchant profile response:', response);
      
      if (response.success && response.data) {
        // Extract the merchant object from the response
        const merchantData = response.data.merchant || response.data;
        setMerchant(merchantData);
        updateOnboardingProgress(merchantData);
      } else {
        console.error('Update merchant profile failed:', response);
        throw new Error(response.message || 'Failed to update merchant profile');
      }
    } catch (error) {
      console.error('Failed to update merchant profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitVerification = async (data: any) => {
    try {
      setIsLoading(true);
      console.log('Submitting verification data:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data));
      console.log('Data values:', Object.values(data).map(v => ({ type: typeof v, isFile: v instanceof File, name: v instanceof File ? v.name : 'N/A' })));
      
      const response = await apiService.submitMerchantVerification(data);
      console.log('Verification response:', response);
      
      if (response.success) {
        // Refresh merchant profile to get updated verification status
        await loadMerchantProfile();
      } else {
        throw new Error(response.message || 'Failed to submit verification');
      }
    } catch (error) {
      console.error('Failed to submit verification:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getPaymentMethods();
      
      if (response.success && response.data) {
        setPaymentMethods(response.data);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPaymentMethod = async (method: PaymentMethodSetup) => {
    try {
      setIsLoading(true);
      const response = await apiService.addPaymentMethod(method);
      
      if (response.success && response.data) {
        setPaymentMethods(prev => [...prev, response.data]);
        // Refresh merchant profile to update onboarding progress
        await loadMerchantProfile();
      } else {
        throw new Error(response.message || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentMethod = async (id: string, method: Partial<PaymentMethodSetup>) => {
    try {
      setIsLoading(true);
      const response = await apiService.updatePaymentMethod(id, method);
      
      if (response.success && response.data) {
        setPaymentMethods(prev => 
          prev.map(pm => pm.id === id ? { ...pm, ...response.data } : pm)
        );
      } else {
        throw new Error(response.message || 'Failed to update payment method');
      }
    } catch (error) {
      console.error('Failed to update payment method:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.deletePaymentMethod(id);
      
      if (response.success) {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
        // Refresh merchant profile to update onboarding progress
        await loadMerchantProfile();
      } else {
        throw new Error(response.message || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOnboardingStatus = async () => {
    await loadMerchantProfile();
  };

  const refreshMerchantProfile = async () => {
    hasAttemptedLoadRef.current = false;
    await loadMerchantProfile();
  };

  // Reset the load attempt flag when user changes
  useEffect(() => {
    if (user?.id) {
      hasAttemptedLoadRef.current = false;
    }
  }, [user?.id]);

  const value: MerchantContextType = {
    merchant,
    onboardingProgress,
    paymentMethods,
    isLoading,
    isOnboardingComplete,
    loadMerchantProfile,
    createMerchantProfile,
    updateMerchantProfile,
    submitVerification,
    loadPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    refreshOnboardingStatus,
    refreshMerchantProfile,
  };

  return (
    <MerchantContext.Provider value={value}>
      {children}
    </MerchantContext.Provider>
  );
}; 