import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";

const schema = z.object({
  label: z.string().min(2),
  type: z.enum(["card","bank","wallet"]),
});

type FormValues = z.infer<typeof schema>;

const PaymentMethods = () => {
  useSEO("Payment Methods — TransactLab", "Manage payment options.");
  const paymentMethods: any[] = []; // Mock data - replace with actual data source
  const addPaymentMethod = (pm: any) => {
    // Mock function - replace with actual implementation
    console.log('Adding payment method:', pm);
  };
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    addPaymentMethod({ id: crypto.randomUUID(), label: data.label, type: data.type });
    toast({ title: "Payment method added", description: data.label });
    reset();
  };

  return (
    <div className="space-y-6 animate-enter">
      <h1 className="text-2xl font-semibold">Payment Methods</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paymentMethods.map((m) => (
          <Card key={m.id} className="glass-panel">
            <CardHeader><CardTitle className="text-base">{m.label}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground capitalize">{m.type}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-panel max-w-lg">
        <CardHeader><CardTitle>Add Payment Method</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
            <div className="grid gap-2">
              <Label>Label</Label>
              <Input {...register("label")} />
              {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <select className="h-10 rounded-md border bg-background px-3" {...register("type")}>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="wallet">Wallet</option>
              </select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethods;
