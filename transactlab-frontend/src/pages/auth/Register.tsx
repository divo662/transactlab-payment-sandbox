import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// removed unused Card imports
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './PhoneInputCustom.css';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  securityQuestion: string;
  securityAnswer: string;
  agreeToTerms: boolean;
  businessTypeDisplay: string;
  businessType: string;
  businessName: string;
  industry: string;
  website: string;
  description: string;
}

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: "",
    agreeToTerms: false,
    businessTypeDisplay: "",
    businessType: "",
    businessName: "",
    industry: "",
    website: "",
    description: "",
  });

  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const totalSteps = 5;

  const updateFormData = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessTypeChange = (displayValue: string) => {
    const displayToInternal: Record<string, string> = {
      "Individual Developer": "individual",
      "Startup": "startup",
      "Enterprise": "enterprise",
      "Development Agency": "agency",
    };

    setFormData(prev => ({
      ...prev,
      businessTypeDisplay: displayValue,
      businessType: displayToInternal[displayValue] || "",
    }));
  };

  // Helper function to format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "Not provided";
    
    try {
      // Format the phone number for better display
      const formatted = phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
      return formatted;
    } catch {
      return phone;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const prevStep = () => {
    if (currentStep > 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate phone number if provided
      if (formData.phone && !isValidPhoneNumber(formData.phone)) {
        toast({
          title: "Invalid phone number",
          description: "Please enter a valid phone number with country code.",
          variant: "destructive"
        });
        return;
      }

      // Prepare user data for backend (merchant fields removed)
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
      };

      await register(userData);
      
      toast({
        title: "Account created successfully!",
        description: "Welcome to TransactLab. Please check your email for verification.",
        variant: "default"
      });
      // Always send user to login for email verification before they can sign in
      navigate("/auth/login?verification=required");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName;
      case 2:
        return formData.email; // Phone is optional, only email is required
      case 3:
        return formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
      case 4:
        return formData.securityQuestion && formData.securityAnswer;
      case 5:
        return formData.agreeToTerms;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex space-x-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-3 h-1 rounded-full transition-all duration-500 ease-in-out ${
              index + 1 <= currentStep ? "bg-[#0a164d] w-8" : "bg-gray-300 w-3"
            }`}
          />
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className={`space-y-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="animate-fadeIn">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Name *
        </label>
        <Input
          type="text"
          placeholder="Enter your first name"
          value={formData.firstName}
          onChange={(e) => updateFormData("firstName", e.target.value)}
          className="w-full h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
        />
      </div>
      <div className="animate-fadeIn animation-delay-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Name *
        </label>
        <Input
          type="text"
          placeholder="Enter your last name"
          value={formData.lastName}
          onChange={(e) => updateFormData("lastName", e.target.value)}
          className="w-full h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={`space-y-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="animate-fadeIn">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <Input
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={(e) => updateFormData("email", e.target.value)}
          className="w-full h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
        />
      </div>
      <div className="animate-fadeIn animation-delay-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number (Optional)
        </label>
        <div className="relative">
          <PhoneInput
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(value) => updateFormData("phone", value || "")}
            international
            defaultCountry="NG"
            countries={[
              // Major African countries (TransactLab focus)
              "NG", "KE", "GH", "UG", "TZ", "RW", "ZM", "MW", "BW", "NA", "ZW",
              "ET", "SD", "EG", "DZ", "MA", "TN", "LY", "ML", "BF", "NE",
              "TD", "CM", "CF", "CG", "CD", "AO", "ST", "GQ", "GA", "BI",
              "DJ", "SO", "ER", "SS", "MG", "MU", "SC", "KM", "CV", "GW",
              // Major global markets
              "US", "GB", "CA", "AU", "DE", "FR", "IT", "ES", "NL", "BE",
              "CH", "AT", "SE", "NO", "DK", "FI", "PL", "CZ", "HU", "RO",
              "BG", "HR", "SI", "SK", "LT", "LV", "EE", "LU", "MT", "CY",
              "GR", "PT", "IE", "IS", "TR", "IL", "AE", "SA", "QA", "KW",
              "BH", "OM", "JO", "LB", "SY", "IQ", "IR", "PK", "AF", "IN",
              "BD", "LK", "NP", "BT", "MM", "TH", "VN", "LA", "KH", "MY",
              "SG", "ID", "PH", "JP", "KR", "CN", "TW", "HK", "MO", "BR",
              "MX", "AR", "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY",
              "GY", "SR", "FK", "GL", "FO", "AX", "SJ"
            ]}
            className={`PhoneInput ${formData.phone ? (isValidPhoneNumber(formData.phone) ? 'PhoneInput--success' : 'PhoneInput--error') : ''}`}
            onFocus={() => {
              const phoneInput = document.querySelector('.PhoneInput');
              phoneInput?.classList.add('PhoneInput--focus');
            }}
            onBlur={() => {
              const phoneInput = document.querySelector('.PhoneInput');
              phoneInput?.classList.remove('PhoneInput--focus');
            }}
          />
          {formData.phone && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidPhoneNumber(formData.phone) ? (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter your phone number with country code (e.g., +234 801 234 5678)
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={`space-y-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="animate-fadeIn animation-delay-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password *
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Type your password"
            value={formData.password}
            onChange={(e) => updateFormData("password", e.target.value)}
            className="w-full h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] pr-10 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Must be at least 8 characters with uppercase, lowercase, and number
        </p>
      </div>
      <div className="animate-fadeIn animation-delay-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password *
        </label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => updateFormData("confirmPassword", e.target.value)}
            className="w-full h-12 border-gray-300 focus:ring-[#0a164d] pr-10 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
    </div>
  );



  // removed Business Information step

  const renderSecurityStep = () => (
    <div className={`space-y-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="text-center animate-fadeIn">
        <div className="w-16 h-16 bg-[#0a164d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#0a164d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Question</h3>
        <p className="text-gray-600">Set up a security question for additional account protection</p>
      </div>
      
      <div className="space-y-6 animate-fadeIn animation-delay-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Question *
          </label>
          <select
            value={formData.securityQuestion}
            onChange={(e) => updateFormData("securityQuestion", e.target.value)}
            className="w-full h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] rounded-md px-3 transition-all duration-200"
          >
            <option value="">Select a security question</option>
            <option value="What was your first pet's name?">What was your first pet's name?</option>
            <option value="In what city were you born?">In what city were you born?</option>
            <option value="What was your mother's maiden name?">What was your mother's maiden name?</option>
            <option value="What was the name of your first school?">What was the name of your first school?</option>
            <option value="What is your favorite book?">What is your favorite book?</option>
            <option value="What was your childhood nickname?">What was your childhood nickname?</option>
            <option value="What is the name of the street you grew up on?">What is the name of the street you grew up on?</option>
            <option value="What is your favorite movie?">What is your favorite movie?</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Answer *
          </label>
          <Input
            type="text"
            placeholder="Enter your answer"
            value={formData.securityAnswer}
            onChange={(e) => updateFormData("securityAnswer", e.target.value)}
            className="w-full h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
          />
          <p className="text-xs text-gray-500 mt-1">
            This answer will be required every time you log in
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className={`space-y-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <div className="text-center animate-fadeIn">
        <div className="w-16 h-16 bg-[#0a164d]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-8 h-8 text-[#0a164d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Your Information</h3>
        <p className="text-gray-600">Please review your details before creating your account</p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-3 animate-fadeIn animation-delay-100">
        <div className="flex justify-between">
          <span className="text-gray-600">Name:</span>
          <span className="font-medium">{formData.firstName} {formData.lastName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Email:</span>
          <span className="font-medium">{formData.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Phone:</span>
          <span className="font-medium">{formatPhoneNumber(formData.phone)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Security Question:</span>
          <span className="font-medium">{formData.securityQuestion}</span>
        </div>
      </div>

      <div className="flex items-start space-x-3 animate-fadeIn animation-delay-200">
        <Checkbox
          id="terms"
          checked={formData.agreeToTerms}
          onCheckedChange={(checked) => updateFormData("agreeToTerms", checked as boolean)}
        />
        <label htmlFor="terms" className="text-sm text-gray-600">
          By creating an account means you agree to the{" "}
          <a href="#" className="text-[#0a164d] hover:underline">Terms and Conditions</a>
          , and our{" "}
          <a href="#" className="text-[#0a164d] hover:underline">Privacy Policy</a>.
        </label>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderSecurityStep();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Personal Information";
      case 2:
        return "Contact Details";
      case 3:
        return "Password Setup";
      case 4:
        return "Security Question";
      case 5:
        return "Review & Submit";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Empty for Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#0a164d]/10 via-[#0a164d]/20 to-[#0a164d]/30 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-[#0a164d]/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#0a164d]/25 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#0a164d]/15 rounded-full blur-lg"></div>
        </div>

        {/* Content Panel */}
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 max-w-md text-center border border-white/30 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-[#0a164d]/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#0a164d]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#0a164d] mb-2">Create. Test. Launch.</h2>
            <p className="text-[#0a164d]/80 text-lg">Join TransactLab to build and validate payment integrations in a safe developer sandbox.</p>
          </div>
        </div>
      </div>

      {/* Right Section - Step-by-Step Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fadeIn">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600">It's free and easy</p>
          </div>

          {renderStepIndicator()}
          
          <div className="text-center mb-6 animate-fadeIn animation-delay-200">
            <h2 className="text-lg font-semibold text-gray-800">{getStepTitle()}</h2>
            <p className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</p>
          </div>

          <div className="min-h-[320px] flex items-center justify-center">
            {renderCurrentStep()}
          </div>

          <div className="flex items-center justify-between gap-3 pt-6 animate-fadeIn animation-delay-300">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                disabled={isLoading || isTransitioning}
              >
                <ChevronLeft size={20} />
                Previous
              </Button>
            )}
            
            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid() || isLoading || isTransitioning}
                className="flex items-center space-x-2 ml-auto bg-gradient-to-r from-[#0a164d] to-[#1a2a6b] hover:from-[#08123a] hover:to-[#0a164d] transition-all duration-200 hover:scale-105"
              >
                Next Step
                <ChevronRight size={20} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid() || isLoading || isTransitioning}
                className="bg-gradient-to-r from-[#0a164d] to-[#1a2a6b] hover:from-[#08123a] hover:to-[#0a164d] transition-all duration-200 hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            )}
          </div>

          {currentStep === 1 && (
            <div className="text-center pt-6 animate-fadeIn animation-delay-400">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/auth/login" className="text-[#0a164d] hover:underline font-medium transition-colors duration-200">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
