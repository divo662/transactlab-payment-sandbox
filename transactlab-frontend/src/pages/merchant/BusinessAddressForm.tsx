import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MapPin, Building, Globe, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

interface BusinessAddressFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
  onBack?: () => void;
}

const BusinessAddressForm: React.FC<BusinessAddressFormProps> = ({ onComplete, initialData = {}, onBack }) => {
  const [data, setData] = useState({
    streetAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    ...initialData
  });

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Check if form is valid
    const requiredFields = ['streetAddress', 'city', 'state', 'country', 'postalCode'];
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

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // Countries with states/provinces
  const countries = [
    { code: 'NG', name: 'Nigeria', states: [
      'Abuja FCT', 'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
      'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
      'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
      'Taraba', 'Yobe', 'Zamfara'
    ]},
    { code: 'KE', name: 'Kenya', states: [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Kakamega', 'Nyeri',
      'Garissa', 'Kisii', 'Embu', 'Machakos', 'Kiambu', 'Murang\'a', 'Nandi', 'Kericho', 'Bomet', 'Baringo',
      'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Makueni', 'Kitui', 'Taita Taveta', 'Tana River', 'Lamu', 'Kilifi',
      'Kwale', 'Tana River', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi', 'Embu',
      'Kirinyaga', 'Murang\'a', 'Nyeri', 'Nyandarua', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Samburu', 'Turkana',
      'West Pokot', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Makueni', 'Kitui', 'Taita Taveta', 'Tana River',
      'Lamu', 'Kilifi', 'Kwale', 'Tana River', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi'
    ]},
    { code: 'US', name: 'United States', states: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
      'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
      'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
      'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
      'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming'
    ]},
    { code: 'CA', name: 'Canada', states: [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories',
      'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'
    ]},
    { code: 'GB', name: 'United Kingdom', states: [
      'England', 'Scotland', 'Wales', 'Northern Ireland'
    ]}
  ];

  const selectedCountry = countries.find(c => c.name === data.country);
  const states = selectedCountry?.states || [];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#0a164d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-[#0a164d]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Business Address & Contact
        </h3>
        <p className="text-gray-600">
          Provide your business location for verification and compliance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Street Address */}
        <div className="md:col-span-2">
          <Label htmlFor="streetAddress" className="text-sm font-medium text-gray-700 mb-2 block">
            Street Address *
          </Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="streetAddress"
              type="text"
              placeholder="123 Business Street, Suite 100"
              value={data.streetAddress}
              onChange={(e) => updateData({ streetAddress: e.target.value })}
              className="pl-10 h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
            />
          </div>
        </div>

        {/* City */}
        <div>
          <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
            City *
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="Enter city"
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
            className="h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
          />
        </div>

        {/* State/Province/County */}
        <div>
          <Label htmlFor="state" className="text-sm font-medium text-gray-700 mb-2 block">
            State/Province/County *
          </Label>
          <Select value={data.state} onValueChange={(value) => updateData({ state: value })}>
            <SelectTrigger className="h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]">
              <SelectValue placeholder="Select state/province" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div>
          <Label htmlFor="country" className="text-sm font-medium text-gray-700 mb-2 block">
            Country *
          </Label>
          <Select value={data.country} onValueChange={(value) => {
            updateData({ country: value, state: '' }); // Reset state when country changes
          }}>
            <SelectTrigger className="h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d]">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Postal Code */}
        <div>
          <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700 mb-2 block">
            Postal Code *
          </Label>
          <Input
            id="postalCode"
            type="text"
            placeholder="Enter postal code"
            value={data.postalCode}
            onChange={(e) => updateData({ postalCode: e.target.value })}
            className="h-12 border-gray-300 focus:border-[#0a164d] focus:ring-[#0a164d] transition-all duration-200"
          />
        </div>
      </div>

      {/* Address Preview */}
      {data.streetAddress && data.city && data.state && data.country && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Address Preview:</h4>
          <div className="text-sm text-gray-600">
            <p>{data.streetAddress}</p>
            <p>{data.city}, {data.state} {data.postalCode}</p>
            <p>{data.country}</p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Globe className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Address Verification
            </h4>
            <p className="text-sm text-blue-700">
              Your business address is used for verification purposes and to comply with financial regulations. 
              Please ensure all information is accurate and up-to-date.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Required Fields:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className={`flex items-center space-x-2 ${data.streetAddress ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.streetAddress ? '✓' : '✗'}</span>
            <span>Street Address</span>
          </li>
          <li className={`flex items-center space-x-2 ${data.city ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.city ? '✓' : '✗'}</span>
            <span>City</span>
          </li>
          <li className={`flex items-center space-x-2 ${data.state ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.state ? '✓' : '✗'}</span>
            <span>State/Province/County</span>
          </li>
          <li className={`flex items-center space-x-2 ${data.country ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.country ? '✓' : '✗'}</span>
            <span>Country</span>
          </li>
          <li className={`flex items-center space-x-2 ${data.postalCode ? 'text-green-600' : 'text-red-600'}`}>
            <span>{data.postalCode ? '✓' : '✗'}</span>
            <span>Postal Code</span>
          </li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onComplete({ skipped: true, message: 'Business Address step skipped - will be implemented later' })}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            Skip for now
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isValid}
            className="bg-[#0a164d] hover:bg-[#0a164d]/90 disabled:opacity-50"
          >
            Continue to Documents
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessAddressForm;
