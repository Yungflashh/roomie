export declare class CloudinaryUpload {
    static uploadImage(buffer: Buffer, folder: string, options?: {
        width?: number;
        height?: number;
        quality?: number;
    }): Promise<string>;
    static uploadVideo(buffer: Buffer, folder: string): Promise<string>;
    static uploadDocument(buffer: Buffer, folder: string): Promise<string>;
    static deleteFile(publicId: string, resourceType?: 'image' | 'video' | 'raw'): Promise<void>;
    static uploadMultipleImages(buffers: Buffer[], folder: string, options?: {
        width?: number;
        height?: number;
        quality?: number;
    }): Promise<string[]>;
}
//# sourceMappingURL=cloudinary.upload.d.ts.map