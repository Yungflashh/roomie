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
const MessageSchema = new mongoose_1.Schema({
    chatRoom: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000,
    },
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'file', 'location', 'game-invite'],
        default: 'text',
    },
    attachments: [{
            url: String,
            type: String,
            size: Number,
            name: String,
        }],
    metadata: {
        gameId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Game',
        },
        location: {
            latitude: Number,
            longitude: Number,
            address: String,
        },
    },
    readBy: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            readAt: Date,
        }],
    deliveredTo: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            deliveredAt: Date,
        }],
    isEdited: {
        type: Boolean,
        default: false,
    },
    editedAt: Date,
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date,
    deletedFor: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
    },
    reactions: {
        type: Map,
        of: [mongoose_1.Schema.Types.ObjectId],
        default: {},
    },
}, {
    timestamps: true,
});
// Indexes
MessageSchema.index({ chatRoom: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ 'readBy.user': 1 });
const Message = mongoose_1.default.model('Message', MessageSchema);
exports.default = Message;
//# sourceMappingURL=Message.model.js.map