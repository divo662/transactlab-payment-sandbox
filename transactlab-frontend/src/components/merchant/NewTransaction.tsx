import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMerchant } from "@/contexts/MerchantContext";
import { transactionApi } from "@/lib/transactionApi";
import { 
  CreditCard, 
  DollarSign, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

const transactionSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerPhone: z.string().optional(),
  description: z.string().min(1, "Transaction description is required"),
  reference: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  saveCustomer: z.boolean().default(false),
  sendReceipt: z.boolean().default(true),
});

type TransactionForm = z.infer<typeof transactionSchema>;

const CURRENCIES = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
];

const PAYMENT_METHODS = [
  { id: "card", name: "Credit/Debit Card", icon: "💳", fee: "2.9% + ₦30" },
  { id: "bank_transfer", name: "Bank Transfer", icon: "🏦", fee: "1.5% + ₦50" },
  { id: "ussd", name: "USSD", icon: "📱", fee: "1.0% + ₦25" },
  { id: "mobile_money", name: "Mobile Money", icon: "📲", fee: "1.2% + ₦20" },
  { id: "wallet", name: "Digital Wallet", icon: "👛", fee: "1.8% + ₦15" },
];

const NewTransaction = () => {
  const { toast } = useToast();
  const { merchant } = useMerchant();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("NGN");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [transactionFee, setTransactionFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      currency: "NGN",
      customerEmail: "",
      customerName: "",
      customerPhone: "",
      description: "",
      reference: "",
      paymentMethod: "",
      saveCustomer: false,
      sendReceipt: true,
    }
  });

  // Calculate fees when amount or payment method changes
  const calculateFees = (amount: number, method: string) => {
    const methodInfo = PAYMENT_METHODS.find(m => m.id === method);
    if (!methodInfo) return 0;

    let fee = 0;
    if (method === "card") {
      fee = (amount * 0.029) + 30;
    } else if (method === "bank_transfer") {
      fee = (amount * 0.015) + 50;
    } else if (method === "ussd") {
      fee = (amount * 0.01) + 25;
    } else if (method === "mobile_money") {
      fee = (amount * 0.012) + 20;
    } else if (method === "wallet") {
      fee = (amount * 0.018) + 15;
    }

    return Math.round(fee);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    form.setValue("amount", amount);
    
    if (selectedPaymentMethod) {
      const fee = calculateFees(amount, selectedPaymentMethod);
      setTransactionFee(fee);
      setTotalAmount(amount + fee);
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
    form.setValue("paymentMethod", method);
    
    const amount = form.getValues("amount");
    if (amount > 0) {
      const fee = calculateFees(amount, method);
      setTransactionFee(fee);
      setTotalAmount(amount + fee);
    }
  };

  const generateReference = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const reference = `TXN_${timestamp}_${random}`.toUpperCase();
    form.setValue("reference", reference);
  };

  const handleSubmit = async (data: TransactionForm) => {
    try {
      setIsProcessing(true);
      
      // Prepare transaction data for backend
      const transactionData = {
        amount: data.amount,
        currency: data.currency,
        email: data.customerEmail,
        reference: data.reference,
        payment_method: data.paymentMethod,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        description: data.description,
        metadata: {
          saveCustomer: data.saveCustomer,
          sendReceipt: data.sendReceipt,
          merchantId: merchant?.id
        }
      };

      // Call backend API to initialize transaction
      const response = await transactionApi.initializeTransaction(transactionData);

      if (response.success) {
        toast({
          title: "Transaction created successfully!",
          description: `Transaction ${response.data.transaction.reference} has been initialized.`,
          variant: "default"
        });

        // Reset form
        form.reset();
        setSelectedCurrency("NGN");
        setSelectedPaymentMethod("");
        setTransactionFee(0);
        setTotalAmount(0);

        // Optionally redirect to payment page or show payment details
        if (response.data.paymentUrl) {
          // You can either redirect to the payment URL or show it in a modal
          window.open(response.data.paymentUrl, '_blank');
        }
      } else {
        throw new Error(response.message || 'Failed to create transaction');
      }
      
    } catch (error: any) {
      console.error('Transaction creation error:', error);
      toast({
        title: "Transaction failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transaction Form */}
        <div className="lg:col-span-2">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Amount and Currency */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {getCurrencySymbol(selectedCurrency)}
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="pl-8"
                        value={form.watch("amount") || ""}
                        onChange={handleAmountChange}
                      />
                    </div>
                    {form.formState.errors.amount && (
                      <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select 
                      value={selectedCurrency} 
                      onValueChange={(value) => {
                        setSelectedCurrency(value);
                        form.setValue("currency", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span>{currency.symbol}</span>
                              <span>{currency.code}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Information
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        placeholder="John Doe"
                        {...form.register("customerName")}
                        className={form.formState.errors.customerName ? "border-red-500" : ""}
                      />
                      {form.formState.errors.customerName && (
                        <p className="text-sm text-red-500">{form.formState.errors.customerName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Customer Email *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        placeholder="customer@example.com"
                        {...form.register("customerEmail")}
                        className={form.formState.errors.customerName ? "border-red-500" : ""}
                      />
                      {form.formState.errors.customerEmail && (
                        <p className="text-sm text-red-500">{form.formState.errors.customerEmail.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Customer Phone</Label>
                    <Input
                      id="customerPhone"
                      placeholder="+234 801 234 5678"
                      {...form.register("customerPhone")}
                    />
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Transaction Details
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="What is this payment for?"
                      rows={3}
                      {...form.register("description")}
                      className={form.formState.errors.description ? "border-red-500" : ""}
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="reference">Reference</Label>
                      <div className="flex gap-2">
                        <Input
                          id="reference"
                          placeholder="Auto-generated"
                          {...form.register("reference")}
                          readOnly
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={generateReference}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method *</Label>
                      <Select 
                        value={selectedPaymentMethod} 
                        onValueChange={handlePaymentMethodChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span>{method.icon}</span>
                                  <span>{method.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{method.fee}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.paymentMethod && (
                        <p className="text-sm text-red-500">{form.formState.errors.paymentMethod.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveCustomer"
                      checked={form.watch("saveCustomer")}
                      onCheckedChange={(checked) => form.setValue("saveCustomer", checked as boolean)}
                    />
                    <Label htmlFor="saveCustomer">Save customer information for future transactions</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendReceipt"
                      checked={form.watch("sendReceipt")}
                      onCheckedChange={(checked) => form.setValue("sendReceipt", checked as boolean)}
                    />
                    <Label htmlFor="sendReceipt">Send receipt to customer email</Label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isProcessing}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Transaction...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Create Transaction
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Summary */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="glass-panel sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    {getCurrencySymbol(selectedCurrency)} {form.watch("amount")?.toLocaleString() || "0.00"}
                  </span>
                </div>
                
                {transactionFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction Fee:</span>
                    <span className="text-sm text-gray-500">
                      {getCurrencySymbol(selectedCurrency)} {transactionFee.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    {getCurrencySymbol(selectedCurrency)} {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedPaymentMethod && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">Payment Method</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Fee: {PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod)?.fee}
                  </p>
                </div>
              )}

              {/* Quick Tips */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Quick Tips</span>
                </div>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Double-check customer information</li>
                  <li>• Ensure payment method is supported</li>
                  <li>• Keep transaction descriptions clear</li>
                  <li>• Verify currency conversion rates</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="glass-panel border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800 mb-1">Security Notice</p>
                  <p className="text-orange-700">
                    All transactions are encrypted and processed securely. 
                    Never share sensitive payment information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewTransaction; 