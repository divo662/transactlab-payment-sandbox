import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMerchant } from "@/contexts/MerchantContext";
import { 
  CreditCard, 
  Building, 
  Smartphone, 
  Wallet, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { PaymentMethodSetup } from "@/types";

const paymentMethodSchema = z.object({
  type: z.string().min(1, "Payment method type is required"),
  label: z.string().min(2, "Label must be at least 2 characters"),
  isDefault: z.boolean(),
  provider: z.string().optional(),
  accountNumber: z.string().optional(),
  bankCode: z.string().optional(),
  cardType: z.string().optional(),
  last4: z.string().optional(),
});

type PaymentMethodForm = z.infer<typeof paymentMethodSchema>;

const PAYMENT_TYPES = [
  { id: "card", name: "Credit/Debit Card", icon: CreditCard, color: "blue" },
  { id: "bank_transfer", name: "Bank Transfer", icon: Building, color: "green" },
  { id: "ussd", name: "USSD", icon: Smartphone, color: "purple" },
  { id: "mobile_money", name: "Mobile Money", icon: Smartphone, color: "orange" },
  { id: "wallet", name: "Digital Wallet", icon: Wallet, color: "indigo" },
];

const CARD_TYPES = [
  { id: "visa", name: "Visa", icon: "💳" },
  { id: "mastercard", name: "Mastercard", icon: "💳" },
  { id: "amex", name: "American Express", icon: "💳" },
  { id: "discover", name: "Discover", icon: "💳" },
];

const BANKS = [
  { code: "058", name: "GT Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "033", name: "UBA" },
  { code: "011", name: "First Bank" },
  { code: "044", name: "Access Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "050", name: "Ecobank" },
  { code: "214", name: "FCMB" },
  { code: "032", name: "Union Bank" },
];

const MOBILE_MONEY_PROVIDERS = [
  { id: "paga", name: "Paga", icon: "📱" },
  { id: "opay", name: "OPay", icon: "📱" },
  { id: "palmpay", name: "PalmPay", icon: "📱" },
  { id: "airtel_money", name: "Airtel Money", icon: "📱" },
  { id: "mtn_momo", name: "MTN MoMo", icon: "📱" },
];

const PaymentMethodsSetup = () => {
  const { toast } = useToast();
  const { 
    paymentMethods, 
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod, 
    isLoading 
  } = useMerchant();
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodSetup | null>(null);

  const form = useForm<PaymentMethodForm>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: "",
      label: "",
      isDefault: false,
      provider: "",
      accountNumber: "",
      bankCode: "",
      cardType: "",
      last4: "",
    }
  });

  // Load payment methods when component mounts
  useEffect(() => {
    // Payment methods are loaded by the merchant context
  }, []);

  const handleAddMethod = () => {
    setIsAddingMethod(true);
    setEditingMethod(null);
    form.reset();
  };

  const handleEditMethod = (method: PaymentMethodSetup) => {
    setEditingMethod(method);
    setIsAddingMethod(true);
    form.reset({
      type: method.type,
      label: method.label,
      isDefault: method.isDefault,
      provider: method.provider || "",
      accountNumber: method.accountNumber || "",
      bankCode: method.bankCode || "",
      cardType: method.cardType || "",
      last4: method.last4 || "",
    });
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      await deletePaymentMethod(methodId);
      toast({
        title: "Payment method deleted",
        description: "Your payment method has been removed successfully.",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (data: PaymentMethodForm) => {
    try {
      if (editingMethod && editingMethod.id) {
        // Update existing method
        const updatedMethod: PaymentMethodSetup = {
          id: editingMethod.id,
          type: data.type || '',
          label: data.label || '',
          isDefault: data.isDefault || false,
          provider: data.provider,
          accountNumber: data.accountNumber,
          bankCode: data.bankCode,
          cardType: data.cardType,
          last4: data.last4,
        };
        await updatePaymentMethod(editingMethod.id, updatedMethod);
        toast({
          title: "Payment method updated",
          description: "Your payment method has been updated successfully.",
          variant: "default"
        });
      } else {
        // Add new method
        const newMethod: PaymentMethodSetup = {
          id: Date.now().toString(), // Generate temporary ID for new methods
          type: data.type || '',
          label: data.label || '',
          isDefault: data.isDefault || false,
          provider: data.provider,
          accountNumber: data.accountNumber,
          bankCode: data.bankCode,
          cardType: data.cardType,
          last4: data.last4,
        };
        await addPaymentMethod(newMethod);
        toast({
          title: "Payment method added",
          description: "Your payment method has been added successfully.",
          variant: "default"
        });
      }

      handleCancel();
    } catch (error: any) {
      toast({
        title: "Operation failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setIsAddingMethod(false);
    setEditingMethod(null);
    form.reset();
  };

  const getPaymentTypeIcon = (type: string) => {
    const paymentType = PAYMENT_TYPES.find(pt => pt.id === type);
    if (paymentType) {
      const IconComponent = paymentType.icon;
      return <IconComponent className="w-5 h-5" />;
    }
    return <CreditCard className="w-5 h-5" />;
  };

  const getPaymentTypeColor = (type: string) => {
    const paymentType = PAYMENT_TYPES.find(pt => pt.id === type);
    return paymentType?.color || "gray";
  };

  const renderMethodForm = () => {
    const selectedType = form.watch("type");
    
    return (
      <Card className="glass-panel border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">
            {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Payment Type *</Label>
                <Select onValueChange={(value) => form.setValue("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  placeholder="e.g., Main Business Account"
                  {...form.register("label")}
                  className={form.formState.errors.label ? "border-red-500" : ""}
                />
                {form.formState.errors.label && (
                  <p className="text-sm text-red-500">{form.formState.errors.label.message}</p>
                )}
              </div>
            </div>

            {/* Type-specific fields */}
            {selectedType === "card" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cardType">Card Type</Label>
                  <Select onValueChange={(value) => form.setValue("cardType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_TYPES.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          <div className="flex items-center gap-2">
                            <span>{card.icon}</span>
                            {card.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last4">Last 4 Digits</Label>
                  <Input
                    id="last4"
                    placeholder="1234"
                    maxLength={4}
                    {...form.register("last4")}
                  />
                </div>
              </div>
            )}

            {selectedType === "bank_transfer" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankCode">Bank</Label>
                  <Select onValueChange={(value) => form.setValue("bankCode", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Account number"
                    {...form.register("accountNumber")}
                  />
                </div>
              </div>
            )}

            {selectedType === "mobile_money" && (
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select onValueChange={(value) => form.setValue("provider", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOBILE_MONEY_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          <span>{provider.icon}</span>
                          {provider.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={form.watch("isDefault")}
                onCheckedChange={(checked) => form.setValue("isDefault", checked as boolean)}
              />
              <Label htmlFor="isDefault">Set as default payment method</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingMethod ? "Update Method" : "Add Method"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-gray-600">Configure how your customers can pay you</p>
        </div>
        <Button onClick={handleAddMethod} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Add/Edit Form */}
      {isAddingMethod && renderMethodForm()}

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Card className="glass-panel">
            <CardContent className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
              <p className="text-gray-500 mb-4">
                You haven't added any payment methods yet. Add your first payment method to start accepting payments.
              </p>
              <Button onClick={handleAddMethod} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                         {paymentMethods.map((method) => (
               <Card key={method.id || `temp-${Date.now()}`} className="glass-panel hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${getPaymentTypeColor(method.type)}-100`}>
                      {getPaymentTypeIcon(method.type)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditMethod(method)}
                      >
                        Edit
                      </Button>
                                             <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => handleDeleteMethod(method.id || '')}
                         className="text-red-600 hover:text-red-700"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{method.label}</h3>
                      {method.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Default</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 capitalize">
                      {PAYMENT_TYPES.find(pt => pt.id === method.type)?.name}
                    </p>

                    {method.provider && (
                      <p className="text-sm text-gray-500">
                        Provider: {method.provider}
                      </p>
                    )}

                    {method.last4 && (
                      <p className="text-sm text-gray-500">
                        Card ending in {method.last4}
                      </p>
                    )}

                    {method.accountNumber && (
                      <p className="text-sm text-gray-500">
                        Account: {method.accountNumber}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Setup Tips */}
      <Card className="glass-panel border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            Setup Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-green-800">Best Practices</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Offer multiple payment options for customer convenience</li>
                <li>• Set a default method for recurring transactions</li>
                <li>• Keep payment method information up to date</li>
                <li>• Test all payment methods before going live</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-green-800">Security</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Never store sensitive card details</li>
                <li>• Use secure connections for all transactions</li>
                <li>• Regularly review and update access controls</li>
                <li>• Monitor for suspicious activity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethodsSetup; 