import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Upload, Download, Trash2, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface VerificationDocumentsFormProps {
  onComplete: (data: any) => void;
  initialData?: any;
  onBack?: () => void;
}

interface DocumentFile {
  id: string;
  file: File;
  type: string;
  name: string;
  size: number;
  preview?: string;
}

const VerificationDocumentsForm: React.FC<VerificationDocumentsFormProps> = ({ onComplete, initialData = {}, onBack }) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if form is valid - need at least business license and ID document
    const hasBusinessLicense = documents.some(doc => doc.type === 'businessLicense');
    const hasIdDocument = documents.some(doc => doc.type === 'idDocument');
    setIsValid(hasBusinessLicense && hasIdDocument);
  }, [documents]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (isValid && !isSubmitting) {
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        
        // Only send documents that actually have files
        const formData = {
          businessLicense: documents.find(doc => doc.type === 'businessLicense')?.file || null,
          taxCertificate: documents.find(doc => doc.type === 'taxCertificate')?.file || null,
          idDocument: documents.find(doc => doc.type === 'idDocument')?.file || null
        };
        
        // Filter out null values and only send documents with actual files
        const validDocuments = Object.entries(formData)
          .filter(([key, value]) => value !== null)
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as any);
        
        // Validate that we have at least the required documents
        if (!validDocuments.businessLicense || !validDocuments.idDocument) {
          const errorMsg = 'Missing required documents. Please upload both Business License and ID Document.';
          setSubmitError(errorMsg);
          console.error('Missing required documents:', { 
            businessLicense: !!validDocuments.businessLicense, 
            idDocument: !!validDocuments.idDocument 
          });
          return;
        }
        
        console.log('Submitting verification documents:', Object.keys(validDocuments));
        await onComplete(validDocuments);
      } catch (error: any) {
        console.error('Error submitting verification:', error);
        setSubmitError(error.message || 'Failed to submit verification. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const onDrop = (acceptedFiles: File[], documentType: string) => {
    const newDocuments = acceptedFiles.map(file => ({
      id: `${documentType}-${Date.now()}-${Math.random()}`,
      file,
      type: documentType,
      name: file.name,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    // Remove existing documents of the same type
    setDocuments(prev => prev.filter(doc => doc.type !== documentType).concat(newDocuments));
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prev => {
      const docToRemove = prev.find(doc => doc.id === documentId);
      if (docToRemove?.preview) {
        URL.revokeObjectURL(docToRemove.preview);
      }
      return prev.filter(doc => doc.id !== documentId);
    });
  };

  const downloadDocument = (docFile: DocumentFile) => {
    const url = URL.createObjectURL(docFile.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = docFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const documentTypes = [
    {
      type: 'businessLicense',
      title: 'Business License',
      description: 'Official business registration or license document',
      required: true,
      acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    {
      type: 'taxCertificate',
      title: 'Tax Certificate',
      description: 'Tax identification or compliance certificate',
      required: false,
      acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
      maxSize: 10 * 1024 * 1024 // 10MB
    },
    {
      type: 'idDocument',
      title: 'ID Document',
      description: 'Government-issued ID or passport',
      required: true,
      acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
      maxSize: 10 * 1024 * 1024 // 10MB
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#0a164d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[#0a164d]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Verification Documents
        </h3>
        <p className="text-gray-600">
          Upload required documents to verify your business identity
        </p>
      </div>

      {/* Document Upload Sections */}
      <div className="space-y-6">
        {documentTypes.map((docType) => {
          const existingDoc = documents.find(doc => doc.type === docType.type);
          
          return (
            <Card key={docType.type} className="border-2 border-dashed border-gray-200 hover:border-[#0a164d]/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {docType.title}
                        {docType.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{docType.description}</p>
                    
                    {/* File Info */}
                    {existingDoc && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">{existingDoc.name}</span>
                            <span className="text-xs text-green-600">({formatFileSize(existingDoc.size)})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadDocument(existingDoc)}
                              className="h-8 px-2 text-green-700 border-green-300 hover:bg-green-50"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeDocument(existingDoc.id)}
                              className="h-8 px-2 text-red-700 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Image Preview */}
                        {existingDoc.preview && (
                          <div className="mt-3">
                            <img 
                              src={existingDoc.preview} 
                              alt="Document preview" 
                              className="max-w-full h-32 object-contain rounded border"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload Area */}
                    {!existingDoc && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#0a164d]/50 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Drag & drop files here, or click to select
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Accepted: {docType.acceptedTypes.join(', ')} (Max: {formatFileSize(docType.maxSize)})
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = docType.acceptedTypes.join(',');
                            input.multiple = false;
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files.length > 0) {
                                onDrop(Array.from(files), docType.type);
                              }
                            };
                            input.click();
                          }}
                          className="bg-[#0a164d] text-white hover:bg-[#0a164d]/90 border-[#0a164d]"
                        >
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error Display */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">
                Submission Error
              </h4>
              <p className="text-sm text-red-700">
                {submitError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Security & Privacy
            </h4>
            <p className="text-sm text-blue-700">
              All documents are encrypted and stored securely. We use industry-standard security measures 
              to protect your information. Documents are only used for verification purposes and are not 
              shared with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Guidelines */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Guidelines:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Ensure documents are clear and legible</li>
          <li>• Supported formats: PDF, JPG, JPEG, PNG</li>
          <li>• Maximum file size: 10MB per document</li>
          <li>• Documents must be current and valid</li>
          <li>• Business license must show your business name</li>
        </ul>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Required Documents:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className={`flex items-center space-x-2 ${documents.some(doc => doc.type === 'businessLicense') ? 'text-green-600' : 'text-red-600'}`}>
            <span>{documents.some(doc => doc.type === 'businessLicense') ? '✓' : '✗'}</span>
            <span>Business License</span>
          </li>
          <li className={`flex items-center space-x-2 ${documents.some(doc => doc.type === 'idDocument') ? 'text-green-600' : 'text-red-600'}`}>
            <span>{documents.some(doc => doc.type === 'idDocument') ? '✓' : '✗'}</span>
            <span>ID Document</span>
          </li>
          <li className={`flex items-center space-x-2 ${documents.some(doc => doc.type === 'taxCertificate') ? 'text-green-600' : 'text-gray-500'}`}>
            <span>{documents.some(doc => doc.type === 'taxCertificate') ? '✓' : '○'}</span>
            <span>Tax Certificate (Optional)</span>
          </li>
        </ul>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="bg-[#0a164d] hover:bg-[#0a164d]/90 disabled:opacity-50 ml-auto"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              Continue to Payment Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerificationDocumentsForm;
