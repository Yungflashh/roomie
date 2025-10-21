"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ReportSchema = new mongoose_1.Schema({
    reporter: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reported: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['user', 'match', 'message', 'game', 'other'],
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['harassment', 'inappropriate', 'spam', 'fake', 'safety', 'other'],
        required: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000,
    },
    evidence: [String],
    status: {
        type: String,
        enum: ['pending', 'investigating', 'resolved', 'dismissed'],
        default: 'pending',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    resolution: String,
    actionTaken: {
        type: String,
        enum: ['warning', 'suspension', 'ban', 'none'],
    },
    resolvedAt: Date,
    relatedEntity: {
        entityType: String,
        entityId: mongoose_1.Schema.Types.ObjectId,
    },
}, {
    timestamps: true,
});
// Indexes
ReportSchema.index({ reporter: 1 });
ReportSchema.index({ reported: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });
const Report = mongoose_1.default.model('Report', ReportSchema);
exports.default = Report;
//# sourceMappingURL=Report.model.js.map