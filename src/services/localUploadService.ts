import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface LocalUploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

export class LocalUploadService {
  private static uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Ensure uploads directory exists
   */
  private static ensureUploadsDir(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Convert base64 to buffer
   */
  private static base64ToBuffer(base64String: string): { buffer: Buffer; extension: string } {
    const matches = base64String.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image format');
    }

    const extension = matches[1] || 'jpg';
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return { buffer, extension };
  }

  /**
   * Upload base64 image to local uploads directory
   */
  static async uploadImage(
    base64String: string,
    folder: string = 'products'
  ): Promise<LocalUploadResult> {
    try {
      this.ensureUploadsDir();

      const { buffer, extension } = this.base64ToBuffer(base64String);
      
      // Generate unique filename
      const fileName = `${folder}-${uuidv4()}-${Date.now()}.${extension}`;
      const filePath = path.join(this.uploadsDir, fileName);

      // Write file to uploads directory
      fs.writeFileSync(filePath, buffer);

      // Return relative URL for serving
      const url = `/uploads/${fileName}`;

      return {
        success: true,
        url,
        fileName
      };
    } catch (error: any) {
      console.error('Local upload error:', error);
      return {
        success: false,
        error: error.message || 'Local upload failed'
      };
    }
  }

  /**
   * Delete local file
   */
  static async deleteFile(fileName: string): Promise<LocalUploadResult> {
    try {
      const filePath = path.join(this.uploadsDir, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Local delete error:', error);
      return {
        success: false,
        error: error.message || 'Local delete failed'
      };
    }
  }

  /**
   * Extract filename from URL
   */
  static extractFileName(url: string): string | null {
    try {
      const matches = url.match(/\/uploads\/(.+)$/);
      return matches ? matches[1] : null;
    } catch {
      return null;
    }
  }
}

export default LocalUploadService;
