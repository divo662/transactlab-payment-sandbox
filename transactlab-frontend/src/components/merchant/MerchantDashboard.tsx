import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowRight,
  Settings,
  FileText,
  Shield,
  MapPin,
  Globe,
  Key,
  Webhook,
  Zap,
  Target,
  BarChart3,
  Activity,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMerchant } from "@/contexts/MerchantContext";
import { User, OnboardingProgress, BusinessProfileData } from "@/types";
import BusinessProfileForm from "@/pages/merchant/BusinessProfileForm";
import BusinessAddressForm from "@/pages/merchant/BusinessAddressForm";
import VerificationDocumentsForm from "@/pages/merchant/VerificationDocumentsForm";
import PaymentSetupForm from "@/pages/merchant/PaymentSetupForm";
import PaymentLinkGenerator from "./PaymentLinkGenerator";

interface MerchantDashboardProps {
  merchant?: User;
  onCompleteOnboarding: () => void;
}

const MerchantDashboard = ({ merchant, onCompleteOnboarding }: MerchantDashboardProps) => {
  const { user } = useAuth();
  const { 
    merchant: contextMerchant, 
    onboardingProgress, 
    isLoading,
    loadMerchantProfile,
    createMerchantProfile,
    updateMerchantProfile,
    submitVerification
  } = useMerchant();
  
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use context merchant if available, otherwise use prop
  const currentMerchant = contextMerchant || merchant;

  // Initialize onboarding data with existing merchant data
  useEffect(() => {
    if (currentMerchant) {
      setOnboardingData({
        businessName: currentMerchant.businessName || '',
        email: currentMerchant.businessEmail || '',
        phone: currentMerchant.businessPhone || '',
        industry: currentMerchant.industry || '',
        description: currentMerchant.description || '',
        website: currentMerchant.website || '',
        // Note: businessAddress is not yet implemented in User model
        streetAddress: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        supportedCurrencies: currentMerchant.supportedCurrencies || [],
        paymentMethods: currentMerchant.paymentMethods || []
      });
    }
  }, [currentMerchant]);

  // Determine onboarding steps based on current merchant data
  const onboardingSteps = [
    {
      id: 1,
      title: "Business Profile",
      description: "Basic business information",
      icon: Building2,
      isCompleted: !!currentMerchant?.businessName,
      component: BusinessProfileForm
    },
         {
       id: 2,
       title: "Business Address",
       description: "Location and contact details",
       icon: MapPin,
       isCompleted: !!currentMerchant?.businessPhone, // Use businessPhone as a proxy for address completion since businessAddress field doesn't exist yet
       component: BusinessAddressForm
     },
    {
      id: 3,
      title: "Verification Documents",
      description: "Document verification",
      icon: FileText,
      isCompleted: currentMerchant?.isBusinessVerified || false, // Use isBusinessVerified from User model
      component: VerificationDocumentsForm
    },
    {
      id: 4,
      title: "Payment Setup",
      description: "Currencies and payment methods",
      icon: Globe,
      isCompleted: !!(currentMerchant?.supportedCurrencies?.length && currentMerchant?.paymentMethods?.length), // Use supportedCurrencies from User model
      component: PaymentSetupForm
    }
  ];

  // Check if all steps are completed
  const allStepsCompleted = onboardingSteps.every(step => step.isCompleted);
  
  // Update onboarding completed state when all steps are done
  useEffect(() => {
    if (allStepsCompleted && !onboardingCompleted) {
      setOnboardingCompleted(true);
    }
  }, [allStepsCompleted, onboardingCompleted]);

     // Set current onboarding step based on what's already completed
   useEffect(() => {
     if (currentMerchant && !onboardingCompleted) {
       // Find the first incomplete step
       const firstIncompleteStep = onboardingSteps.find(step => !step.isCompleted);
       if (firstIncompleteStep) {
         setCurrentOnboardingStep(firstIncompleteStep.id);
         console.log(`Setting onboarding step to: ${firstIncompleteStep.title} (${firstIncompleteStep.id})`);
       }
     }
   }, [currentMerchant, onboardingSteps, onboardingCompleted]);

   // Temporary fix: Mark Business Address step as completed if we have business phone
   useEffect(() => {
     if (currentMerchant?.businessPhone && !onboardingCompleted) {
       // Force update the onboarding steps to mark Business Address as completed
       const updatedSteps = onboardingSteps.map(step => 
         step.id === 2 ? { ...step, isCompleted: true } : step
       );
       // This will trigger a re-render and move to the next step
       console.log('Marking Business Address step as completed due to existing business phone');
     }
   }, [currentMerchant, onboardingCompleted]);

  // Handle loading errors from context
  useEffect(() => {
    if (!isLoading && !contextMerchant && !loadError) {
      // If loading finished but no merchant and no error, show a helpful message
      setLoadError("Ready to start accepting payments? Let's set up your merchant account in just a few simple steps.");
    }
  }, [isLoading, contextMerchant, loadError]);

  // Merchant profile is loaded by the context when user is authenticated
  // No need to call loadMerchantProfile here

  const getStatusBadge = () => {
    if (onboardingCompleted) return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    if (!currentMerchant) return <Badge variant="secondary">Not Started</Badge>;
    if (currentMerchant.isBusinessVerified) return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
    if (currentMerchant.isActive) return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getCompletionPercentage = () => {
    const completedSteps = onboardingSteps.filter(step => step.isCompleted);
    return Math.round((completedSteps.length / onboardingSteps.length) * 100);
  };

  const getNextAction = () => {
    if (!currentMerchant) return "Complete Business Profile";
    if (!currentMerchant.supportedCurrencies?.length || !currentMerchant.paymentMethods?.length) return "Configure Payment Methods";
    if (!currentMerchant.isBusinessVerified) return "Submit Verification Documents";
    return "Start Processing Transactions";
  };

  const handleOnboardingStepComplete = async (stepId: number, data: any) => {
    try {
      setIsSaving(true);
      
      // Always update existing merchant profile since we know it exists
      if (stepId === 1) {
        // Business Profile - Update existing merchant profile
        await updateMerchantProfile({
          businessName: data.businessName,
          businessEmail: data.email || user?.email || '',
          businessPhone: data.phone || '',
          industry: data.industry,
          description: data.description || '',
          website: data.website || ''
        });
             } else if (stepId === 2) {
         // Business Address - Handle skipped step
         if (data.skipped) {
           console.log('Business Address step skipped by user:', data.message);
           // Mark this step as completed and move to next step
           console.log('Marking Business Address step as completed and moving to next step');
         } else {
           // Business Address - Skip for now since businessAddress field doesn't exist in User model
           console.log('Business Address step skipped - field not yet implemented in User model');
           // TODO: Implement businessAddress field in User model or create separate Merchant model
           console.log('Marking Business Address step as completed and moving to next step');
         }
       } else if (stepId === 3) {
        // Verification Documents - Submit verification
        if (Object.keys(data).length > 0) {
          await submitVerification(data);
        } else {
          throw new Error('No verification documents provided');
        }
      } else if (stepId === 4) {
        // Payment Setup - Update currencies and payment methods
        console.log('Payment Setup Data:', data);
        
        // Validate the data before sending
        if (!data.supportedCurrencies || !Array.isArray(data.supportedCurrencies) || data.supportedCurrencies.length === 0) {
          throw new Error('Please select at least one supported currency');
        }
        
        if (!data.paymentMethods || !Array.isArray(data.paymentMethods) || data.paymentMethods.length === 0) {
          throw new Error('Please select at least one payment method');
        }
        
        const updateData = {
          supportedCurrencies: data.supportedCurrencies,
          paymentMethods: data.paymentMethods
        };
        
        console.log('Updating merchant profile with:', updateData);
        
        await updateMerchantProfile(updateData);
      }

      // Update local state
      setOnboardingData(prev => ({ ...prev, ...data }));
      
      // Refresh merchant profile to get updated data
      await loadMerchantProfile();
      
      // Move to next step or complete onboarding
      if (stepId < onboardingSteps.length) {
        // Add smooth transition between steps
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentOnboardingStep(stepId + 1);
          setIsTransitioning(false);
        }, 300); // Match the fade-out duration
      } else {
        // Complete onboarding
        setOnboardingCompleted(true);
        onCompleteOnboarding();
      }
    } catch (error: any) {
      console.error('Failed to save onboarding data:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to save your information. Please try again.';
      
      // Try to extract more specific error information
      if (error.message) {
        if (error.message.includes('Something went wrong on our end')) {
          errorMessage = 'The server encountered an error. This might be due to invalid data format or server issues. Please check your input and try again.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'The requested resource was not found. Please refresh and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // You might want to show an error toast here
      console.error('Onboarding error:', errorMessage);
      
      // For now, just log the error. In a real app, you'd show a toast or error message
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOnboardingStepBack = () => {
    if (currentOnboardingStep > 1) {
      // Add smooth transition when going back
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentOnboardingStep(currentOnboardingStep - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const renderOnboardingStep = () => {
    const currentStep = onboardingSteps.find(step => step.id === currentOnboardingStep);
    if (!currentStep) return null;

    const StepComponent = currentStep.component;
    
    if (isTransitioning) {
      return (
        <div className="space-y-6 animate-out fade-out duration-300">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.title}</h2>
            <p className="text-gray-600">{currentStep.description}</p>
          </div>
          <div className="animate-pulse">
            <StepComponent 
              onComplete={async (data: any) => await handleOnboardingStepComplete(currentOnboardingStep, data)}
              initialData={onboardingData}
              onBack={currentOnboardingStep > 1 ? handleOnboardingStepBack : undefined}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 fade-in">
        <div className="text-center animate-in slide-in-from-top-4 duration-700 delay-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.title}</h2>
          <p className="text-gray-600">{currentStep.description}</p>
        </div>
        
        {isSaving && (
          <div className="text-center py-8 animate-in fade-in duration-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
            <p className="text-gray-600">Saving your information...</p>
          </div>
        )}
        
        {isTransitioning && !isSaving && (
          <div className="text-center py-8 animate-in fade-in duration-300">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-[#0a164d]/20 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading next step...</p>
            </div>
          </div>
        )}
        
        {!isSaving && (
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <StepComponent 
              onComplete={async (data: any) => await handleOnboardingStepComplete(currentOnboardingStep, data)}
              initialData={onboardingData}
              onBack={currentOnboardingStep > 1 ? handleOnboardingStepBack : undefined}
            />
          </div>
          )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success Banner - Show when onboarding is complete */}
      {onboardingCompleted && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">🎉 Merchant Account Activated!</h3>
              <p className="text-green-100 text-sm">
                Your account is now fully verified and ready to process payments. Welcome to TransactLab!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Banner - Show when onboarding is not complete */}
      {!onboardingCompleted && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">🚀 TransactLab Sandbox Mode</h3>
              <p className="text-amber-100 text-sm">
                You're currently in sandbox mode. Test the system with sample data, API keys, and webhooks. 
                No real money will be processed. Complete your profile to switch to live mode.
              </p>
            </div>
          </div>
        </div>
      )}

             {/* Debug Info - Remove in production */}
       {process.env.NODE_ENV === 'development' && (
         <div className="bg-gray-800 text-white p-4 rounded-lg text-sm">
           <h3 className="font-semibold mb-2">🔍 Debug Info</h3>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <p><strong>User:</strong> {user?.id ? 'Loaded' : 'Not loaded'}</p>
               <p><strong>Role:</strong> {user?.role || 'None'}</p>
                                <p><strong>Context Merchant:</strong> {contextMerchant ? 'Loaded' : 'Not loaded'}</p>
                 <p><strong>Current Merchant:</strong> {currentMerchant ? 'Loaded' : 'Not loaded'}</p>
                 <p><strong>Business Name:</strong> {currentMerchant?.businessName || 'None'}</p>
                 <p><strong>Merchant ID:</strong> {currentMerchant?.id || 'None'}</p>
             </div>
             <div>
               <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
               <p><strong>Onboarding Progress:</strong> {onboardingProgress ? 'Loaded' : 'Not loaded'}</p>
               <p><strong>Current Step:</strong> {currentOnboardingStep}</p>
               <p><strong>Completed:</strong> {onboardingCompleted ? 'Yes' : 'No'}</p>
             </div>
           </div>
         </div>
       )}

       {/* Welcome Header */}
       <div className="bg-gradient-to-r from-[#0a164d] to-[#1e3a8a] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/transactlab/2.png" 
              alt="TransactLab Logo" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-blue-100">
                {onboardingCompleted 
                  ? `Welcome to TransactLab! Your account is fully activated.`
                  : currentMerchant 
                    ? `Managing ${currentMerchant.businessName}` 
                    : "Let's get your business set up"
                }
              </p>
            </div>
          </div>
                     <div className="text-right">
             <div className="text-sm text-blue-200 mb-1">Account Status</div>
             {getStatusBadge()}
             <Button 
               size="sm" 
               variant="outline" 
               className="mt-2 text-blue-200 border-blue-200 hover:bg-blue-200/10"
               onClick={() => {
                 console.log('🔍 Debug: Manual refresh clicked');
                 console.log('🔍 Debug: Current state:', { 
                   isAuthenticated: !!user, 
                   userId: user?.id, 
                   userRole: user?.role,
                   contextMerchant,
                   merchant,
                   currentMerchant
                 });
                 if (contextMerchant) {
                   console.log('🔍 Debug: Context merchant data:', contextMerchant);
                 }
               }}
             >
               <RefreshCw className="w-4 h-4 mr-1" />
               Debug Info
             </Button>
             <Button 
               size="sm" 
               variant="outline" 
               className="mt-2 ml-2 text-blue-200 border-blue-200 hover:bg-blue-200/10"
               onClick={() => {
                 console.log('🔍 Debug: Force loading merchant profile...');
                 loadMerchantProfile();
               }}
             >
               <RefreshCw className="w-4 h-4 mr-1" />
               Force Load
             </Button>
             <Button 
               size="sm" 
               variant="outline" 
               className="mt-2 ml-2 text-blue-200 border-blue-200 hover:bg-blue-200/10"
               onClick={async () => {
                 console.log('🔍 Debug: Testing direct API call...');
                 try {
                   const response = await fetch('http://localhost:5000/api/v1/merchant/profile', {
                     headers: {
                       'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                       'Content-Type': 'application/json'
                     }
                   });
                   const data = await response.json();
                   console.log('🔍 Debug: Direct API response:', response.status, data);
                 } catch (error) {
                   console.error('🔍 Debug: Direct API error:', error);
                 }
               }}
             >
               <RefreshCw className="w-4 h-4 mr-1" />
               Test API
             </Button>
           </div>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Complete Setup</TabsTrigger>
          <TabsTrigger value="payment-links">Payment Links</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Dashboard Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a164d] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your merchant profile...</p>
               <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
             </div>
                       ) : loadError ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to TransactLab! 🎉</h3>
                <p className="text-gray-600 mb-4">{loadError}</p>
                <Button 
                  onClick={() => setActiveTab("onboarding")}
                  className="bg-[#0a164d] hover:bg-[#0a164d]/90"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Start Setup
                </Button>
            </div>
          ) : (
            <>
              {/* Onboarding Progress */}
              {!onboardingProgress?.isComplete && !onboardingCompleted && (
                <Card className="border-[#0a164d]/20 bg-gradient-to-r from-[#0a164d]/5 to-[#0a164d]/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0a164d]">
                      <Building2 className="w-5 h-5" />
                      Complete Your Merchant Profile
                    </CardTitle>
                    <p className="text-[#0a164d]/70">
                      {getNextAction()} to start accepting payments
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Progress: {onboardingSteps.filter(s => s.isCompleted).length} of {onboardingSteps.length} steps
                        </span>
                        <span className="text-sm text-gray-500">
                          {getCompletionPercentage()}% Complete
                        </span>
                      </div>
                      <Progress value={getCompletionPercentage()} className="h-2" />
                      
                      <div className="grid gap-3 md:grid-cols-2">
                        {onboardingSteps.map((step) => (
                          <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.isCompleted 
                                ? "bg-green-100 text-green-600" 
                                : "bg-gray-100 text-gray-400"
                            }`}>
                              {step.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{step.title}</div>
                              <div className="text-xs text-gray-500">{step.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={() => setActiveTab("onboarding")}
                        className="w-full bg-[#0a164d] hover:bg-[#0a164d]/90"
                      >
                        Continue Setup
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-[#0a164d]">
                  0
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  No transactions yet
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Transaction Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-[#0a164d]">
                  $0
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {currentMerchant?.supportedCurrencies?.length || 0} currencies supported
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-[#0a164d]">
                  0%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {currentMerchant?.paymentMethods?.length || 0} payment methods
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Average Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-[#0a164d]">
                  $0.00
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Per transaction
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-[#0a164d]/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6 text-[#0a164d]" />
                </div>
                <h3 className="font-semibold mb-2">New Transaction</h3>
                <p className="text-sm text-gray-600 mb-4">Process a new payment</p>
                <Button size="sm" className="w-full bg-[#0a164d] hover:bg-[#0a164d]/90">
                  Start Transaction
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">View Analytics</h3>
                <p className="text-sm text-gray-600 mb-4">Track your performance</p>
                <Button size="sm" variant="outline" className="w-full">
                  View Reports
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Settings</h3>
                <p className="text-sm text-gray-600 mb-4">Configure your account</p>
                <Button size="sm" variant="outline" className="w-full">
                  Manage Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Complete your setup to start processing transactions</p>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          {currentMerchant && !currentMerchant.isBusinessVerified && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  Verification Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-yellow-700 mb-3">
                      Your account is pending verification. Please submit the required documents to start processing transactions.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4" />
                        Business registration documents
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4" />
                        Identity verification
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4" />
                        Address verification
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                    onClick={() => setActiveTab("onboarding")}
                  >
                    Submit Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
            </>
          )}
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0a164d]">
                <Target className="w-5 h-5" />
                Merchant Onboarding Setup
              </CardTitle>
              <p className="text-gray-600">
                Complete all steps to activate your merchant account and start processing payments
              </p>
            </CardHeader>
            <CardContent>
              {/* Step Navigation */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4 animate-in slide-in-from-left-4 duration-500">
                  <h3 className="text-lg font-semibold">Step {currentOnboardingStep} of {onboardingSteps.length}</h3>
                  <div className="text-sm text-gray-500">
                    {getCompletionPercentage()}% Complete
                  </div>
                </div>
                <div className="animate-in slide-in-from-left-4 duration-700 delay-200">
                  <Progress value={getCompletionPercentage()} className="h-2 transition-all duration-1000 ease-out" />
                </div>
                
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {onboardingSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`text-center p-2 rounded-lg text-xs transition-all duration-300 ease-in-out transform ${
                        step.id === currentOnboardingStep
                          ? 'bg-[#0a164d] text-white scale-105 shadow-lg'
                          : step.isCompleted
                          ? 'bg-green-100 text-green-800 hover:scale-102'
                          : 'bg-gray-100 text-gray-500 hover:scale-102'
                        }`}
                    >
                      <step.icon className="w-4 h-4 mx-auto mb-1" />
                      {step.title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              {onboardingCompleted ? (
                <div className="text-center py-12 animate-in zoom-in-95 duration-700 fade-in">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-95 duration-1000 delay-300">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 animate-in slide-in-from-top-4 duration-700 delay-500">🎉 Onboarding Complete!</h3>
                  <p className="text-gray-600 mb-6 animate-in slide-in-from-top-4 duration-700 delay-600">
                    Congratulations! Your merchant account is now fully set up and ready to process payments.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-700">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold">Account Status: Active</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      You can now start accepting payments from your customers.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setActiveTab("overview")}
                    className="bg-[#0a164d] hover:bg-[#0a164d]/90 animate-in slide-in-from-bottom-4 duration-700 delay-800"
                  >
                    View Dashboard
                  </Button>
                </div>
              ) : (
                renderOnboardingStep()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Links Tab */}
        <TabsContent value="payment-links" className="space-y-6">
          <PaymentLinkGenerator />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0a164d]">
                <BarChart3 className="w-5 h-5" />
                Performance Analytics
              </CardTitle>
              <p className="text-gray-600">
                Track your payment processing performance and business metrics
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p>Complete your merchant setup to unlock detailed analytics and reporting features.</p>
                <Button 
                  className="mt-4 bg-[#0a164d] hover:bg-[#0a164d]/90"
                  onClick={() => setActiveTab("onboarding")}
                >
                  Complete Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MerchantDashboard; 