import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMerchant } from "@/contexts/MerchantContext";
import { 
  Upload, 
  FileText, 
  Building2, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Download
} from "lucide-react";

const verificationSchema = z.object({
  businessRegistration: z.string().min(1, "Business registration document is required"),
  identityDocument: z.string().min(1, "Identity document is required"),
  addressProof: z.string().min(1, "Address proof is required"),
  bankStatement: z.string().optional(),
  taxCertificate: z.string().optional(),
  additionalDocuments: z.string().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

type VerificationForm = z.infer<typeof verificationSchema>;

const DOCUMENT_TYPES = [
  { id: "business_registration", name: "Business Registration Certificate", required: true },
  { id: "identity_document", name: "Government ID (Passport/Driver's License)", required: true },
  { id: "address_proof", name: "Utility Bill or Bank Statement", required: true },
  { id: "bank_statement", name: "Recent Bank Statement (3 months)", required: false },
  { id: "tax_certificate", name: "Tax Registration Certificate", required: false },
  { id: "additional", name: "Additional Supporting Documents", required: false },
];

const MerchantVerification = () => {
  const { toast } = useToast();
  const { submitVerification, isLoading } = useMerchant();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      businessRegistration: "",
      identityDocument: "",
      addressProof: "",
      bankStatement: "",
      taxCertificate: "",
      additionalDocuments: "",
      notes: "",
    }
  });

  const handleFileUpload = (fieldName: string, file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));
    
    // Update form value with file name
    form.setValue(fieldName as keyof VerificationForm, file.name);
  };

  const handleSubmit = async (data: VerificationForm) => {
    try {
      setIsSubmitting(true);
      
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add form data
      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });
      
      // Add files
      Object.entries(uploadedFiles).forEach(([fieldName, file]) => {
        formData.append(`${fieldName}_file`, file);
      });
      
      // Submit verification
      await submitVerification(formData);
      
      toast({
        title: "Verification submitted!",
        description: "Your documents have been submitted for review. We'll notify you once verified.",
        variant: "default"
      });
      
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileUpload = (fieldName: string, label: string, required: boolean = false) => {
    const file = uploadedFiles[fieldName];
    const hasError = form.formState.errors[fieldName as keyof VerificationForm];
    
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldName}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="outline" className="text-xs">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUploadedFiles(prev => {
                    const newFiles = { ...prev };
                    delete newFiles[fieldName];
                    return newFiles;
                  });
                  form.setValue(fieldName as keyof VerificationForm, "");
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG up to 10MB
              </p>
              <Input
                id={fieldName}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(fieldName, file);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(fieldName)?.click()}
              >
                Choose File
              </Button>
            </div>
          )}
        </div>
        {hasError && (
          <p className="text-sm text-red-500">{hasError.message}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Verification</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          To complete your merchant account setup and start processing transactions, 
          please submit the required verification documents. This helps us ensure 
          compliance and security for all our users.
        </p>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Verification Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DOCUMENT_TYPES.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  doc.required 
                    ? "bg-red-100 text-red-600" 
                    : "bg-blue-100 text-blue-600"
                }`}>
                  {doc.required ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{doc.name}</div>
                  <div className="text-xs text-gray-500">
                    {doc.required ? "Required" : "Optional"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <p className="text-sm text-gray-600">
              Please upload clear, legible copies of the required documents
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {renderFileUpload("businessRegistration", "Business Registration Certificate", true)}
              {renderFileUpload("identityDocument", "Identity Document", true)}
              {renderFileUpload("addressProof", "Address Proof", true)}
              {renderFileUpload("bankStatement", "Bank Statement (Optional)")}
              {renderFileUpload("taxCertificate", "Tax Certificate (Optional)")}
              {renderFileUpload("additionalDocuments", "Additional Documents (Optional)")}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information or context about your business..."
                {...form.register("notes")}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Submit Verification
              </>
            )}
          </Button>
        </div>
      </form>

      <Card className="glass-panel border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <CheckCircle2 className="w-5 h-5" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Our compliance team will review your documents within 1-2 business days</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>You'll receive email notifications about the verification status</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>Once verified, your account will be fully activated for transactions</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p>If additional documents are needed, we'll contact you directly</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantVerification; 