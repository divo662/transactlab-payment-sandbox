import cloudinary from '../config/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(
    file: Buffer | string,
    folder: string = 'transactlab',
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
    } = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn('Cloudinary environment variables not configured');
        return {
          success: false,
          error: 'Cloudinary not configured'
        };
      }

      const uploadOptions = {
        folder,
        resource_type: 'image' as const,
        quality: options.quality || 'auto',
        format: options.format || 'auto',
        transformation: [
          ...(options.width || options.height ? [{
            width: options.width,
            height: options.height,
            crop: 'limit' as const
          }] : [])
        ]
      };

      console.log('Attempting Cloudinary upload to folder:', folder);
      let uploadResult: UploadApiResponse;
      
      if (Buffer.isBuffer(file)) {
        // Upload from buffer
        uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            uploadOptions,
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
              if (error) {
                console.error('Cloudinary upload stream error:', error);
                reject(error);
              } else if (result) {
                console.log('Cloudinary upload stream success:', result.secure_url);
                resolve(result);
              } else {
                reject(new Error('Upload failed'));
              }
            }
          ).end(file);
        });
      } else {
        // Upload from base64 string
        console.log('Uploading base64 string, length:', file.length);
        uploadResult = await cloudinary.uploader.upload(file, uploadOptions);
        console.log('Cloudinary base64 upload success:', uploadResult.secure_url);
      }

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id
      };
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<CloudinaryUploadResult> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        return { success: true };
      } else {
        return {
          success: false,
          error: `Failed to delete: ${result.result}`
        };
      }
    } catch (error: any) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  static extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|gif|webp)$/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Upload product image with optimized settings
   */
  static async uploadProductImage(
    file: Buffer | string,
    productId: string
  ): Promise<CloudinaryUploadResult> {
    return this.uploadImage(file, `transactlab/products/${productId}`, {
      width: 800,
      height: 600,
      quality: 'auto',
      format: 'auto'
    });
  }

  /**
   * Upload avatar image with optimized settings
   */
  static async uploadAvatarImage(
    file: Buffer | string,
    userId: string
  ): Promise<CloudinaryUploadResult> {
    return this.uploadImage(file, `transactlab/avatars/${userId}`, {
      width: 300,
      height: 300,
      quality: 'auto',
      format: 'auto'
    });
  }
}

export default CloudinaryService;
