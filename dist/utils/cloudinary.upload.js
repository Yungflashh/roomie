"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryUpload = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = require("./logger");
class CloudinaryUpload {
    // Upload image
    static async uploadImage(buffer, folder, options) {
        try {
            // Process image with sharp
            let processedBuffer = buffer;
            if (options) {
                processedBuffer = await (0, sharp_1.default)(buffer)
                    .resize(options.width, options.height, {
                    fit: 'cover',
                    position: 'center',
                })
                    .jpeg({ quality: options.quality || 80 })
                    .toBuffer();
            }
            // Upload to Cloudinary
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder,
                    resource_type: 'image',
                    transformation: [
                        { quality: 'auto' },
                        { fetch_format: 'auto' },
                    ],
                }, (error, result) => {
                    if (error) {
                        logger_1.logger.error(`Cloudinary upload error: ${error}`);
                        reject(error);
                    }
                    else {
                        resolve(result.secure_url);
                    }
                });
                uploadStream.end(processedBuffer);
            });
        }
        catch (error) {
            logger_1.logger.error(`Image processing error: ${error}`);
            throw error;
        }
    }
    // Upload video
    static async uploadVideo(buffer, folder) {
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder,
                    resource_type: 'video',
                    chunk_size: 6000000, // 6MB chunks
                }, (error, result) => {
                    if (error) {
                        logger_1.logger.error(`Cloudinary video upload error: ${error}`);
                        reject(error);
                    }
                    else {
                        resolve(result.secure_url);
                    }
                });
                uploadStream.end(buffer);
            });
        }
        catch (error) {
            logger_1.logger.error(`Video upload error: ${error}`);
            throw error;
        }
    }
    // Upload document
    static async uploadDocument(buffer, folder) {
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder,
                    resource_type: 'raw',
                }, (error, result) => {
                    if (error) {
                        logger_1.logger.error(`Cloudinary document upload error: ${error}`);
                        reject(error);
                    }
                    else {
                        resolve(result.secure_url);
                    }
                });
                uploadStream.end(buffer);
            });
        }
        catch (error) {
            logger_1.logger.error(`Document upload error: ${error}`);
            throw error;
        }
    }
    // Delete file
    static async deleteFile(publicId, resourceType = 'image') {
        try {
            await cloudinary_1.default.uploader.destroy(publicId, { resource_type: resourceType });
            logger_1.logger.info(`File deleted from Cloudinary: ${publicId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting file from Cloudinary: ${error}`);
            throw error;
        }
    }
    // Upload multiple images
    static async uploadMultipleImages(buffers, folder, options) {
        const uploadPromises = buffers.map(buffer => this.uploadImage(buffer, folder, options));
        return Promise.all(uploadPromises);
    }
}
exports.CloudinaryUpload = CloudinaryUpload;
//# sourceMappingURL=cloudinary.upload.js.map