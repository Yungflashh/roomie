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
const LocationTrackingSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
        address: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
    },
    isTrackingEnabled: {
        type: Boolean,
        default: false,
    },
    sharedWith: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            expiresAt: Date,
            canSeeRealtime: {
                type: Boolean,
                default: false,
            },
        }],
    locationHistory: [{
            location: {
                type: {
                    type: String,
                    enum: ['Point'],
                },
                coordinates: [Number],
                address: String,
                city: String,
                state: String,
                country: String,
            },
            timestamp: Date,
        }],
    safeZones: [{
            name: String,
            location: {
                type: {
                    type: String,
                    enum: ['Point'],
                },
                coordinates: [Number],
            },
            radius: Number,
            notifyOnExit: { type: Boolean, default: true },
            notifyOnEnter: { type: Boolean, default: true },
        }],
    sosContacts: [{
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            name: String,
            phoneNumber: String,
        }],
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    accuracy: Number,
    batteryLevel: Number,
}, {
    timestamps: true,
});
// Indexes
LocationTrackingSchema.index({ 'currentLocation.coordinates': '2dsphere' });
LocationTrackingSchema.index({ user: 1 });
LocationTrackingSchema.index({ 'sharedWith.user': 1 });
LocationTrackingSchema.index({ lastUpdated: -1 });
// Cleanup old location history (keep last 30 days)
LocationTrackingSchema.pre('save', function (next) {
    if (this.locationHistory.length > 0) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        this.locationHistory = this.locationHistory.filter((loc) => loc.timestamp > thirtyDaysAgo);
    }
    next();
});
const LocationTracking = mongoose_1.default.model('LocationTracking', LocationTrackingSchema);
exports.default = LocationTracking;
//# sourceMappingURL=LocationTracking.model.js.map