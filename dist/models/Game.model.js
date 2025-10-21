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
const GameSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['trivia', 'puzzle', 'icebreaker', 'challenge', 'personality'],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true,
    },
    type: {
        type: String,
        enum: ['daily', 'weekly', 'multiplayer', 'solo'],
        required: true,
    },
    thumbnail: String,
    duration: Number,
    maxPlayers: {
        type: Number,
        default: 4,
    },
    minPlayers: {
        type: Number,
        default: 1,
    },
    rules: String,
    questions: [{
            question: String,
            type: {
                type: String,
                enum: ['multiple-choice', 'true-false', 'open-ended'],
            },
            options: [String],
            correctAnswer: String,
            points: Number,
            timeLimit: Number,
        }],
    achievements: [{
            id: String,
            name: String,
            description: String,
            icon: String,
            condition: String,
        }],
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
// Indexes
GameSchema.index({ category: 1, type: 1 });
GameSchema.index({ isActive: 1 });
const Game = mongoose_1.default.model('Game', GameSchema);
exports.default = Game;
//# sourceMappingURL=Game.model.js.map