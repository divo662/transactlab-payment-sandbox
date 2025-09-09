import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Loader2, CreditCard } from 'lucide-react';

interface PaymentMethodForm {
  type: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  isDefault: boolean;
}

interface EnhancedPaymentMethodModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: PaymentMethodForm;
  setForm: React.Dispatch<React.SetStateAction<PaymentMethodForm>>;
  submitting: boolean;
  formatCardNumber: (value: string) => string;
}

const EnhancedPaymentMethodModal: React.FC<EnhancedPaymentMethodModalProps> = ({
  show,
  onClose,
  onSubmit,
  form,
  setForm,
  submitting,
  formatCardNumber
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Add Payment Method</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Payment Method Type */}
          <div>
            <Label htmlFor="payment-type">Payment Method Type</Label>
            <Select 
              value={form.type} 
              onValueChange={(value) => setForm({...form, type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="bank_account">Bank Account</SelectItem>
                <SelectItem value="wallet">Digital Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Card Details */}
          {form.type === 'card' && (
            <>
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">Card Information</h3>
                
                <div>
                  <Label htmlFor="cardholder-name">Cardholder Name</Label>
                  <Input
                    id="cardholder-name"
                    value={form.cardholderName}
                    onChange={(e) => setForm({...form, cardholderName: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    value={form.cardNumber}
                    onChange={(e) => setForm({...form, cardNumber: formatCardNumber(e.target.value)})}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      value={form.expiryMonth + form.expiryYear}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setForm({
                          ...form,
                          expiryMonth: value.slice(0, 2),
                          expiryYear: value.slice(2, 4)
                        });
                      }}
                      placeholder="MM/YY"
                      maxLength={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      value={form.cvv}
                      onChange={(e) => setForm({...form, cvv: e.target.value.replace(/\D/g, '')})}
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">Billing Address</h3>
                
                <div>
                  <Label htmlFor="address-line1">Address Line 1</Label>
                  <Input
                    id="address-line1"
                    value={form.billingAddress.line1}
                    onChange={(e) => setForm({
                      ...form,
                      billingAddress: {...form.billingAddress, line1: e.target.value}
                    })}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address-line2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address-line2"
                    value={form.billingAddress.line2}
                    onChange={(e) => setForm({
                      ...form,
                      billingAddress: {...form.billingAddress, line2: e.target.value}
                    })}
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={form.billingAddress.city}
                      onChange={(e) => setForm({
                        ...form,
                        billingAddress: {...form.billingAddress, city: e.target.value}
                      })}
                      placeholder="Lagos"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={form.billingAddress.state}
                      onChange={(e) => setForm({
                        ...form,
                        billingAddress: {...form.billingAddress, state: e.target.value}
                      })}
                      placeholder="Lagos State"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postal-code">Postal Code</Label>
                    <Input
                      id="postal-code"
                      value={form.billingAddress.postalCode}
                      onChange={(e) => setForm({
                        ...form,
                        billingAddress: {...form.billingAddress, postalCode: e.target.value}
                      })}
                      placeholder="100001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={form.billingAddress.country} 
                      onValueChange={(value) => setForm({
                        ...form,
                        billingAddress: {...form.billingAddress, country: value}
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NG">Nigeria</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="IT">Italy</SelectItem>
                        <SelectItem value="ES">Spain</SelectItem>
                        <SelectItem value="NL">Netherlands</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900">Contact Information</h3>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    placeholder="+234 801 234 5678"
                    required
                  />
                </div>
              </div>

              {/* Default Payment Method */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-default"
                  checked={form.isDefault}
                  onChange={(e) => setForm({...form, isDefault: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is-default" className="text-sm">
                  Set as default payment method
                </Label>
              </div>
            </>
          )}

          {/* Bank Account Details */}
          {form.type === 'bank_account' && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Bank Account Information</h3>
              <p className="text-sm text-gray-600">Bank account payment methods will be implemented in a future update.</p>
            </div>
          )}

          {/* Digital Wallet Details */}
          {form.type === 'wallet' && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Digital Wallet Information</h3>
              <p className="text-sm text-gray-600">Digital wallet payment methods will be implemented in a future update.</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Payment Method
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedPaymentMethodModal;
