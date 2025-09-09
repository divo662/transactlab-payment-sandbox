import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSEO } from "@/hooks/use-seo";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

const Customers = () => {
  useSEO("Customers — TransactLab", "Customer directory and activity.");
  const customers: any[] = []; // Mock data - replace with actual data source
  const addCustomer = (c: any) => {
    // Mock function - replace with actual implementation
    console.log('Adding customer:', c);
  };
  const [q, setQ] = useState("");
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const filtered = useMemo(() => customers.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase())), [customers, q]);

  const onSubmit = (data: FormValues) => {
    addCustomer({ id: crypto.randomUUID(), name: data.name, email: data.email, createdAt: new Date().toISOString() });
    toast({ title: "Customer added", description: data.name });
    reset();
  };

  return (
    <div className="space-y-6 animate-enter">
      <h1 className="text-2xl font-semibold">Customers</h1>

      <Card className="glass-panel">
        <CardHeader><CardTitle>Search</CardTitle></CardHeader>
        <CardContent>
          <Input placeholder="Search customers" value={q} onChange={(e) => setQ(e.target.value)} />
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader><CardTitle>Customer List ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-panel max-w-lg">
        <CardHeader><CardTitle>Add Customer</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;
