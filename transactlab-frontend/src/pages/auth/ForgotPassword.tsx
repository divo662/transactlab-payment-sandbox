import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import apiService from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({ email: z.string().email() });

type FormValues = z.infer<typeof schema>;

const ForgotPassword = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => { document.title = "Forgot Password — TransactLab"; }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const response = await apiService.forgotPassword({ email: data.email });
      
      if (response.success) {
        setIsSubmitted(true);
        toast({ 
          title: "Reset link sent", 
          description: `If an account with ${data.email} exists, a password reset link has been sent to your email.`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "Error", 
          description: response.message || "Failed to send reset link",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      const errorMessage = formatApiError(error);
      toast({ 
        title: errorMessage.includes('waking up') || errorMessage.includes('60 seconds') ? "Server Waking Up" : "Error", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="w-full max-w-md glass-panel animate-enter">
          <CardHeader>
            <CardTitle className="text-xl text-center">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-muted-foreground">
              <p>We've sent a password reset link to your email address.</p>
              <p className="mt-2">The link will expire in 1 hour for security reasons.</p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => setIsSubmitted(false)} 
                variant="outline" 
                className="w-full"
              >
                Send Another Link
              </Button>
              <Link to="/auth/login">
                <Button variant="ghost" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md glass-panel animate-enter">
        <CardHeader className="text-center pb-6">
          {/* TransactLab Logo and Branding */}
          <div className="flex flex-col items-center space-y-4 mb-6">
            <img 
              src="/transactlab/1.png" 
              alt="TransactLab Logo" 
              className="w-16 h-16 object-contain"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                TransactLab
              </h1>
              <p className="text-sm text-muted-foreground">Secure Payment Gateway</p>
            </div>
          </div>
          
          <CardTitle className="text-xl">Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                {...register("email")} 
                placeholder="Enter your email address"
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4">
            <Link to="/auth/login" className="underline">Back to sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
