"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
class SearchService {
    // Global message search across all user's chats
    static async searchAllMessages(userId, query, options = {}) {
        try {
            const { page = 1, limit = 20, type } = options;
            // Get all chat rooms user is part of
            const chatRooms = await models_1.ChatRoom.find({ participants: userId }).select('_id');
            const roomIds = chatRooms.map((room) => room._id);
            const searchQuery = {
                chatRoom: { $in: roomIds },
                content: { $regex: query, $options: 'i' },
                deletedFor: { $ne: userId },
                isDeleted: false,
            };
            if (type) {
                searchQuery.type = type;
            }
            const skip = (page - 1) * limit;
            const messages = await models_1.Message.find(searchQuery)
                .populate('sender', 'firstName lastName profilePicture')
                .populate('chatRoom')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await models_1.Message.countDocuments(searchQuery);
            return {
                messages,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.logger.error(`Error searching messages: ${error}`);
            throw error;
        }
    }
    // Search for media in chats
    static async searchMedia(userId, roomId, mediaType, options = {}) {
        try {
            const { page = 1, limit = 20 } = options;
            const searchQuery = {
                chatRoom: roomId,
                type: mediaType,
                deletedFor: { $ne: userId },
                isDeleted: false,
            };
            const skip = (page - 1) * limit;
            const messages = await models_1.Message.find(searchQuery)
                .populate('sender', 'firstName lastName profilePicture')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await models_1.Message.countDocuments(searchQuery);
            return {
                media: messages,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.logger.error(`Error searching media: ${error}`);
            throw error;
        }
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=search.service.js.map