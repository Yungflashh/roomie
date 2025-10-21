"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFields = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
// Configure multer storage
const storage = multer_1.default.memoryStorage();
// File filter
const fileFilter = (req, file, cb) => {
    // Allowed extensions
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|mov|avi|webm/;
    const allowedDocTypes = /pdf|doc|docx/;
    const extname = path_1.default.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;
    // Check file type based on field name
    if (file.fieldname === 'profilePicture' || file.fieldname === 'photos') {
        if (allowedImageTypes.test(extname) && mimetype.startsWith('image/')) {
            return cb(null, true);
        }
        return cb(new ApiError_1.default(400, 'Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
    if (file.fieldname === 'videoIntro') {
        if (allowedVideoTypes.test(extname) && mimetype.startsWith('video/')) {
            return cb(null, true);
        }
        return cb(new ApiError_1.default(400, 'Only video files are allowed (mp4, mov, avi, webm)'));
    }
    if (file.fieldname === 'documents' || file.fieldname === 'verificationDocuments') {
        if (allowedDocTypes.test(extname)) {
            return cb(null, true);
        }
        return cb(new ApiError_1.default(400, 'Only document files are allowed (pdf, doc, docx)'));
    }
    cb(new ApiError_1.default(400, 'Invalid file type'));
};
// Create multer upload instance
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});
const uploadSingle = (fieldName) => upload.single(fieldName);
exports.uploadSingle = uploadSingle;
const uploadMultiple = (fieldName, maxCount) => upload.array(fieldName, maxCount);
exports.uploadMultiple = uploadMultiple;
const uploadFields = (fields) => upload.fields(fields);
exports.uploadFields = uploadFields;
exports.default = upload;
//# sourceMappingURL=upload.middleware.js.map