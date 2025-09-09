import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";

const schema = z.object({ current: z.string(), password: z.string().min(6) });

type FormValues = z.infer<typeof schema>;

const Security = () => {
  useSEO("Security Settings — TransactLab", "Password & 2FA settings.");
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = () => toast({ title: "Saved", description: "Security updated" });

  return (
    <div className="space-y-6 animate-enter">
      <h1 className="text-2xl font-semibold">Security</h1>
      <Card className="glass-panel max-w-xl">
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
            <div className="grid gap-2"><Label>Current password</Label><Input type="password" {...register("current")} />{errors.current && <p className="text-sm text-destructive">{errors.current.message}</p>}</div>
            <div className="grid gap-2"><Label>New password</Label><Input type="password" {...register("password")} />{errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}</div>
            <Button type="submit">Update</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Security;
