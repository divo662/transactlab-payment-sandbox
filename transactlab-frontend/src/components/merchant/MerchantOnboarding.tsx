import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMerchant } from "@/contexts/MerchantContext";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "@/pages/auth/PhoneInputCustom.css";
import { 
  Building2, 
  CreditCard, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Settings
} from "lucide-react";
import { BusinessProfileData, OnboardingStep, OnboardingProgress } from "@/types";

// Form schemas for each step
const businessInfoSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessEmail: z.string().email("Please enter a valid email address"),
  businessPhone: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  industry: z.string().min(1, "Please select an industry"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

const paymentSchema = z.object({
  currencies: z.array(z.string()).min(1, "Please select at least one currency"),
  paymentMethods: z.array(z.string()).min(1, "Please select at least one payment method"),
});

type BusinessInfoForm = z.infer<typeof businessInfoSchema>;
type AddressForm = z.infer<typeof addressSchema>;
type PaymentForm = z.infer<typeof paymentSchema>;

const INDUSTRIES = [
  "E-commerce",
  "SaaS",
  "Healthcare",
  "Education",
  "Finance",
  "Real Estate",
  "Travel",
  "Food & Beverage",
  "Entertainment",
  "Professional Services",
  "Manufacturing",
  "Retail",
  "Other"
];

const COUNTRIES = [
  "Nigeria",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "India",
  "Brazil",
  "South Africa",
  "Other"
];

const CURRENCIES = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
];

const PAYMENT_METHODS = [
  { id: "card", name: "Credit/Debit Cards", icon: "💳" },
  { id: "bank_transfer", name: "Bank Transfer", icon: "🏦" },
  { id: "ussd", name: "USSD", icon: "📱" },
  { id: "mobile_money", name: "Mobile Money", icon: "📲" },
  { id: "wallet", name: "Digital Wallet", icon: "👛" },
];

const MerchantOnboarding = () => {
  const { toast } = useToast();
  const { createMerchantProfile, isLoading } = useMerchant();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form instances for each step
  const businessForm = useForm<BusinessInfoForm>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: "",
      businessEmail: "",
      businessPhone: "",
      website: "",
      industry: "",
      description: "",
    }
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    }
  });

  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      currencies: [],
      paymentMethods: [],
    }
  });

  const steps: OnboardingStep[] = [
    {
      id: "business-info",
      title: "Business Information",
      description: "Tell us about your business",
      isCompleted: false,
      isRequired: true,
    },
    {
      id: "address",
      title: "Business Address",
      description: "Where is your business located?",
      isCompleted: false,
      isRequired: true,
    },
    {
      id: "payment-setup",
      title: "Payment Configuration",
      description: "Configure payment methods and currencies",
      isCompleted: false,
      isRequired: true,
    },
    {
      id: "verification",
      title: "Verification",
      description: "Submit documents for verification",
      isCompleted: false,
      isRequired: false,
    },
  ];

  const progress: OnboardingProgress = {
    currentStep: currentStep + 1,
    totalSteps: steps.length,
    completedSteps: [],
    isComplete: false,
  };

  const handleNext = async () => {
    let isValid = false;

    switch (currentStep) {
      case 0:
        isValid = await businessForm.trigger();
        break;
      case 1:
        isValid = await addressForm.trigger();
        break;
      case 2:
        isValid = await paymentForm.trigger();
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Collect all form data
      const businessData = businessForm.getValues();
      const addressData = addressForm.getValues();
      const paymentData = paymentForm.getValues();

      const onboardingData: BusinessProfileData = {
        businessName: businessData.businessName,
        businessEmail: businessData.businessEmail,
        businessPhone: businessData.businessPhone,
        website: businessData.website,
        industry: businessData.industry,
        description: businessData.description,
        businessType: 'individual', // Default to individual for now
        defaultCurrency: paymentData.currencies[0] || 'NGN',
        supportedCurrencies: paymentData.currencies,
        paymentMethods: paymentData.paymentMethods,
      };

      // Submit to backend using merchant context
      await createMerchantProfile(onboardingData);
      
      toast({
        title: "Profile setup complete!",
        description: "Your merchant profile has been created successfully.",
        variant: "default"
      });

      // The merchant context will handle updating the state
      // and the parent component will show the updated dashboard
      
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Your Business Name"
                  {...businessForm.register("businessName")}
                  className={businessForm.formState.errors.businessName ? "border-red-500" : ""}
                />
                {businessForm.formState.errors.businessName && (
                  <p className="text-sm text-red-500">{businessForm.formState.errors.businessName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email *</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="business@example.com"
                  {...businessForm.register("businessEmail")}
                  className={businessForm.formState.errors.businessEmail ? "border-red-500" : ""}
                />
                {businessForm.formState.errors.businessEmail && (
                  <p className="text-sm text-red-500">{businessForm.formState.errors.businessEmail.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <PhoneInput
                  id="businessPhone"
                  placeholder="+234 801 234 5678"
                  value={businessForm.watch("businessPhone")}
                  onChange={(value) => businessForm.setValue("businessPhone", value || "")}
                  className="PhoneInput"
                  defaultCountry="NG"
                  international
                  countryCallingCodeEditable={false}
                  withCountryCallingCode={true}
                  addInternationalOption={false}
                />
                <p className="text-xs text-gray-500">Enter your business phone number with country code</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://yourbusiness.com"
                  {...businessForm.register("website")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select onValueChange={(value) => businessForm.setValue("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {businessForm.formState.errors.industry && (
                <p className="text-sm text-red-500">{businessForm.formState.errors.industry.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your business..."
                rows={4}
                {...businessForm.register("description")}
              />
              <p className="text-xs text-gray-500">
                {businessForm.watch("description")?.length || 0}/500 characters
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                placeholder="123 Business Street"
                {...addressForm.register("street")}
                className={addressForm.formState.errors.street ? "border-red-500" : ""}
              />
              {addressForm.formState.errors.street && (
                <p className="text-sm text-red-500">{addressForm.formState.errors.street.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Lagos"
                  {...addressForm.register("city")}
                  className={addressForm.formState.errors.city ? "border-red-500" : ""}
                />
                {addressForm.formState.errors.city && (
                  <p className="text-sm text-red-500">{addressForm.formState.errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  id="state"
                  placeholder="Lagos State"
                  {...addressForm.register("state")}
                  className={addressForm.formState.errors.state ? "border-red-500" : ""}
                />
                {addressForm.formState.errors.state && (
                  <p className="text-sm text-red-500">{addressForm.formState.errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select onValueChange={(value) => addressForm.setValue("country", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addressForm.formState.errors.country && (
                  <p className="text-sm text-red-500">{addressForm.formState.errors.country.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  placeholder="100001"
                  {...addressForm.register("postalCode")}
                  className={addressForm.formState.errors.postalCode ? "border-red-500" : ""}
                />
                {addressForm.formState.errors.postalCode && (
                  <p className="text-sm text-red-500">{addressForm.formState.errors.postalCode.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Supported Currencies *</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {CURRENCIES.map((currency) => (
                  <div key={currency.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`currency-${currency.code}`}
                      checked={paymentForm.watch("currencies").includes(currency.code)}
                      onCheckedChange={(checked) => {
                        const current = paymentForm.watch("currencies");
                        if (checked) {
                          paymentForm.setValue("currencies", [...current, currency.code]);
                        } else {
                          paymentForm.setValue("currencies", current.filter(c => c !== currency.code));
                        }
                      }}
                    />
                    <Label htmlFor={`currency-${currency.code}`} className="flex items-center gap-2">
                      <span className="text-lg">{currency.symbol}</span>
                      <span>{currency.code}</span>
                      <span className="text-sm text-gray-500">({currency.name})</span>
                    </Label>
                  </div>
                ))}
              </div>
              {paymentForm.formState.errors.currencies && (
                <p className="text-sm text-red-500">{paymentForm.formState.errors.currencies.message}</p>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Payment Methods *</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {PAYMENT_METHODS.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`method-${method.id}`}
                      checked={paymentForm.watch("paymentMethods").includes(method.id)}
                      onCheckedChange={(checked) => {
                        const current = paymentForm.watch("paymentMethods");
                        if (checked) {
                          paymentForm.setValue("paymentMethods", [...current, method.id]);
                        } else {
                          paymentForm.setValue("paymentMethods", current.filter(m => m !== method.id));
                        }
                      }}
                    />
                    <Label htmlFor={`method-${method.id}`} className="flex items-center gap-2">
                      <span className="text-lg">{method.icon}</span>
                      <span>{method.name}</span>
                    </Label>
                  </div>
                ))}
              </div>
              {paymentForm.formState.errors.paymentMethods && (
                <p className="text-sm text-red-500">{paymentForm.formState.errors.paymentMethods.message}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Almost Done!</h3>
            <p className="text-gray-600">
              Your merchant profile has been set up successfully. 
              Our team will review your information and get back to you within 24-48 hours.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Complete your merchant profile setup</li>
                <li>• Configure your payment methods</li>
                <li>• Start processing your first transactions</li>
                <li>• Explore our analytics and reporting tools</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Merchant Profile</h1>
          <p className="text-gray-600">Set up your business profile to start accepting payments</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {progress.currentStep} of {progress.totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((progress.currentStep / progress.totalSteps) * 100)}% Complete
            </span>
          </div>
          <Progress value={(progress.currentStep / progress.totalSteps) * 100} className="h-2" />
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index < currentStep 
                  ? "bg-green-500 border-green-500 text-white" 
                  : index === currentStep 
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300 text-gray-400"
              }`}>
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  index < currentStep ? "bg-green-500" : "bg-gray-300"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {steps[currentStep].title}
            </CardTitle>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Completing Setup...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantOnboarding; 