import cloudinary from '../config/cloudinary';
import sharp from 'sharp';
import { logger } from './logger';

export class CloudinaryUpload {
  // Upload image
  static async uploadImage(
    buffer: Buffer,
    folder: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ): Promise<string> {
    try {
      // Process image with sharp
      let processedBuffer = buffer;

      if (options) {
        processedBuffer = await sharp(buffer)
          .resize(options.width, options.height, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: options.quality || 80 })
          .toBuffer();
      }

      // Upload to Cloudinary
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              logger.error(`Cloudinary upload error: ${error}`);
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          }
        );

        uploadStream.end(processedBuffer);
      });
    } catch (error) {
      logger.error(`Image processing error: ${error}`);
      throw error;
    }
  }

  // Upload video
  static async uploadVideo(buffer: Buffer, folder: string): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'video',
            chunk_size: 6000000, // 6MB chunks
          },
          (error, result) => {
            if (error) {
              logger.error(`Cloudinary video upload error: ${error}`);
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      logger.error(`Video upload error: ${error}`);
      throw error;
    }
  }

  // Upload document
  static async uploadDocument(buffer: Buffer, folder: string): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'raw',
          },
          (error, result) => {
            if (error) {
              logger.error(`Cloudinary document upload error: ${error}`);
              reject(error);
            } else {
              resolve(result!.secure_url);
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      logger.error(`Document upload error: ${error}`);
      throw error;
    }
  }

  // Delete file
  static async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      logger.info(`File deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      logger.error(`Error deleting file from Cloudinary: ${error}`);
      throw error;
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(
    buffers: Buffer[],
    folder: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ): Promise<string[]> {
    const uploadPromises = buffers.map(buffer => this.uploadImage(buffer, folder, options));
    return Promise.all(uploadPromises);
  }
}