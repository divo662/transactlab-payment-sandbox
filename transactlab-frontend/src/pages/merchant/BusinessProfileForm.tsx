import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "@/pages/auth/PhoneInputCustom.css";
import { Building2, Globe, Phone, Mail, Briefcase, ArrowRight } from 'lucide-react';

interface BusinessProfileFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
  onBack?: () => void;
}

const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({ onComplete, initialData = {}, onBack }) => {
  const [data, setData] = useState({
    businessName: '',
    businessType: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    ...initialData
  });

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check if form is valid
    const requiredFields = ['businessName', 'businessType', 'industry', 'email'];
    const isValidForm = requiredFields.every(field => data[field as keyof typeof data]);
    setIsValid(isValidForm);
  }, [data]);

  const updateData = (newData: Partial<typeof data>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handleSubmit = () => {
    if (isValid) {
      onComplete(data);
    }
  };

  const businessTypes = [
    'Sole Proprietorship',
    'Partnership',
    'Limited Liability Company (LLC)',
    'Corporation (C-Corp)',
    'S-Corporation',
    'Non-Profit',
    'Other'
  ];

  const industries = [
    'E-commerce & Retail',
    'Technology & Software',
    'Healthcare & Medical',
    'Financial Services',
    'Education & Training',
    'Real Estate',
    'Food & Beverage',
    'Travel & Tourism',
    'Manufacturing',
    'Professional Services',
    'Entertainment & Media',
    'Automotive',
    'Fashion & Apparel',
    'Home & Garden',
    'Sports & Fitness',
    'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#0a164d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-[#0a164d]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Tell us about your business
        </h3>
        <p className="text-gray-600">
          This information helps us customize your payment experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Name */}
        <div className="md:col-span-2">
          <Label htmlFor="businessName" className="text-sm font-medium text-gray-700 mb-2 block">
            Business Name *
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="businessName"
              type="text"
              placeholder="Enter your business name"
              value={data.businessName}
              onChange={(e) => updateData({ businessName: e.target.value })}
              className="pl-10 h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
            />
          </div>
        </div>

        {/* Business Type */}
        <div>
          <Label htmlFor="businessType" className="text-sm font-medium text-gray-700 mb-2 block">
            Business Type *
          </Label>
          <Select value={data.businessType} onValueChange={(value) => updateData({ businessType: value })}>
            <SelectTrigger className="h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]">
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Industry */}
        <div>
          <Label htmlFor="industry" className="text-sm font-medium text-gray-700 mb-2 block">
            Industry *
          </Label>
          <Select value={data.industry} onValueChange={(value) => updateData({ industry: value })}>
            <SelectTrigger className="h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Website */}
        <div>
          <Label htmlFor="website" className="text-sm font-medium text-gray-700 mb-2 block">
            Website
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              value={data.website}
              onChange={(e) => updateData({ website: e.target.value })}
              className="pl-10 h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
            Business Phone
          </Label>
          <PhoneInput
            id="phone"
            placeholder="+234 801 234 5678"
            value={data.phone}
            onChange={(value) => updateData({ phone: value || "" })}
            className="PhoneInput"
            defaultCountry="NG"
            international
            countryCallingCodeEditable={false}
            withCountryCallingCode={true}
            addInternationalOption={false}
          />
          <p className="text-xs text-gray-500 mt-1">Enter your business phone number with country code</p>
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
            Business Email *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="business@yourcompany.com"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              className="pl-10 h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Briefcase className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Why do we need this information?
            </h4>
            <p className="text-sm text-blue-700">
              Your business details help us comply with financial regulations, customize your payment experience, 
              and provide better support. This information is kept secure and confidential.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Required Fields:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className={`flex items-center space-x-2 ${data.businessName ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.businessName ? '✓' : '✗'}</span>
            <span>Business Name</span>
          </li>
          <li className={`flex items-center space-x-2 ${data.businessType ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.businessType ? '✓' : '✗'}</span>
            <span>Business Type</span>
          </li>
          <li className={`flex items-center space-x-2 ${data.industry ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.industry ? '✓' : '✗'}</span>
            <span>Industry</span>
          </li>
          <li className={`flex items-center space-x-2 ${data.email ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.email ? '✓' : '✗'}</span>
            <span>Business Email</span>
          </li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button 
            onClick={onBack}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Back
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={!isValid}
          className="bg-[#0a164d] hover:bg-[#0a164d]/90 disabled:opacity-50 ml-auto"
        >
          Continue to Address
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default BusinessProfileForm;
