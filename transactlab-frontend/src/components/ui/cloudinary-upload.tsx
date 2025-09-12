import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CloudinaryUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  folder?: string;
  className?: string;
}

const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  value,
  onChange,
  label = "Upload Image",
  accept = "image/*",
  maxSize = 5,
  folder = "transactlab/checkout",
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'transactlab_checkout'); // You'll need to create this preset
    formData.append('folder', folder);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo'}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      throw new Error('Failed to upload image');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Please select a file smaller than ${maxSize}MB`,
        variant: 'destructive'
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
      toast({
        title: 'Upload successful',
        description: 'Image uploaded successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      {value ? (
        <div className="space-y-2">
          <div className="relative">
            <img 
              src={value} 
              alt="Uploaded" 
              className="w-full h-32 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">Click to change image</p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to {maxSize}MB</p>
        </div>
      )}

      <Input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById(`upload-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {value ? 'Change Image' : 'Upload Image'}
          </>
        )}
      </Button>
    </div>
  );
};

export default CloudinaryUpload;
