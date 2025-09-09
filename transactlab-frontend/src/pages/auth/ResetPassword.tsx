import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import apiService from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ 
    resolver: zodResolver(schema) 
  });

  const token = searchParams.get('token');

  useEffect(() => { 
    document.title = "Reset Password — TransactLab"; 
    
    if (!token) {
      toast({
        title: "Invalid Request",
        description: "Password reset token is missing",
        variant: "destructive"
      });
      navigate('/auth/forgot-password');
      return;
    }

    // Validate the reset token
    const validateToken = async () => {
      try {
        const response = await apiService.verifyResetToken(token);
        if (response.success) {
          setIsValidToken(true);
          setUserEmail(response.data.email);
        } else {
          setIsValidToken(false);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, navigate, toast]);

  const onSubmit = async (data: FormValues) => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await apiService.resetPassword({
        token,
        password: data.password
      });
      
      if (response.success) {
        toast({ 
          title: "Password Reset Successful", 
          description: "Your password has been reset successfully. You can now log in with your new password.",
          variant: "default"
        });
        navigate('/auth/login');
      } else {
        toast({ 
          title: "Error", 
          description: response.message || "Failed to reset password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({ 
        title: "Error", 
        description: "Failed to reset password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="w-full max-w-md glass-panel animate-enter">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Validating reset token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="w-full max-w-md glass-panel animate-enter">
          <CardHeader>
            <CardTitle className="text-xl text-center text-destructive">Invalid Reset Token</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-muted-foreground">
              <p>The password reset link is invalid or has expired.</p>
              <p className="mt-2">Please request a new password reset link.</p>
            </div>
            <Link to="/auth/forgot-password">
              <Button className="w-full">
                Request New Reset Link
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="ghost" className="w-full">
                Back to Sign In
              </Button>
            </Link>
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
              className="w-12.5 h-12 object-cover"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                TransactLab
              </h1>
              <p className="text-sm text-muted-foreground">Secure Payment Gateway</p>
            </div>
          </div>
          
          <CardTitle className="text-xl">Reset Your Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your new password for {userEmail}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  {...register("password")} 
                  placeholder="Enter new password"
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  {...register("confirmPassword")} 
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Link to="/auth/login" className="text-sm text-muted-foreground underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
