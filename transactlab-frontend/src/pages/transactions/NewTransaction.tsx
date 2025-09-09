import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(1),
  customerId: z.string().min(1),
  methodId: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

const NewTransaction = ({ compact = false }: { compact?: boolean }) => {
  const { customers, paymentMethods, addTransaction } = useAppStore();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    addTransaction({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: data.amount,
      currency: data.currency,
      customerId: data.customerId,
      methodId: data.methodId,
      status: "pending",
      reference: `INV-${Math.floor(Math.random()*9000)+1000}`,
    });
    toast({ title: "Transaction created", description: `${data.currency} ${data.amount.toFixed(2)}` });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`grid gap-3 ${compact ? '' : 'max-w-lg'}`}>
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register("amount")} />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label>Currency</Label>
        <Select onValueChange={(v) => (document.getElementById('currency-hidden') as HTMLInputElement).value = v}>
          <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
          <SelectContent>
            {['USD','EUR','GBP'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <input id="currency-hidden" type="hidden" {...register("currency")} />
        {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label>Customer</Label>
        <Select onValueChange={(v) => (document.getElementById('customer-hidden') as HTMLInputElement).value = v}>
          <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
          <SelectContent>
            {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <input id="customer-hidden" type="hidden" {...register("customerId")} />
        {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label>Payment Method</Label>
        <Select onValueChange={(v) => (document.getElementById('method-hidden') as HTMLInputElement).value = v}>
          <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
          <SelectContent>
            {paymentMethods.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <input id="method-hidden" type="hidden" {...register("methodId")} />
        {errors.methodId && <p className="text-sm text-destructive">{errors.methodId.message}</p>}
      </div>
      <div className="pt-1"><Button type="submit" className="w-full">Create</Button></div>
    </form>
  );
};

export default NewTransaction;
