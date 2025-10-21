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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_upload_1 = require("../../utils/cloudinary.upload");
class ChatController {
}
exports.ChatController = ChatController;
_a = ChatController;
// Get all chat rooms for user
ChatController.getChatRooms = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { archived } = req.query;
    const query = {
        participants: userId,
    };
    if (archived !== undefined) {
        query.isArchived = archived === 'true';
    }
    const chatRooms = await models_1.ChatRoom.find(query)
        .populate('participants', 'firstName lastName email profilePicture')
        .populate('lastMessage.sender', 'firstName lastName')
        .sort({ 'lastMessage.sentAt': -1 });
    // Format response with unread counts for current user
    const formattedRooms = chatRooms.map((room) => ({
        ...room.toObject(),
        unreadCount: room.unreadCount.get(userId) || 0,
        isPinned: room.isPinned.get(userId) || false,
        isMuted: room.isMuted.get(userId) || false,
    }));
    apiResponse_1.ApiResponse.success(res, { chatRooms: formattedRooms }, 'Chat rooms retrieved successfully');
});
// Get or create direct chat room
ChatController.getOrCreateDirectChat = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { participantId } = req.body;
    if (userId === participantId) {
        throw new ApiError_1.default(400, 'Cannot create chat with yourself');
    }
    // Check if participant exists
    const participant = await models_1.User.findById(participantId);
    if (!participant) {
        throw new ApiError_1.default(404, 'User not found');
    }
    // Check if users are matched
    const match = await models_1.Match.findOne({
        $or: [
            { user1: userId, user2: participantId },
            { user1: participantId, user2: userId },
        ],
        status: 'accepted',
    });
    if (!match) {
        throw new ApiError_1.default(403, 'You can only chat with matched users');
    }
    // Check if chat room already exists
    let chatRoom = await models_1.ChatRoom.findOne({
        type: 'direct',
        participants: { $all: [userId, participantId], $size: 2 },
    }).populate('participants', 'firstName lastName email profilePicture');
    // Create if doesn't exist
    if (!chatRoom) {
        chatRoom = await models_1.ChatRoom.create({
            participants: [userId, participantId],
            type: 'direct',
            relatedMatch: match._id,
            createdBy: userId,
        });
        await chatRoom.populate('participants', 'firstName lastName email profilePicture');
    }
    apiResponse_1.ApiResponse.success(res, { chatRoom }, 'Chat room retrieved successfully');
});
// Get chat room by ID
ChatController.getChatRoomById = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const chatRoom = await models_1.ChatRoom.findById(roomId)
        .populate('participants', 'firstName lastName email profilePicture')
        .populate('relatedMatch');
    if (!chatRoom) {
        throw new ApiError_1.default(404, 'Chat room not found');
    }
    // Check if user is participant
    if (!chatRoom.participants.some((p) => p._id.toString() === userId)) {
        throw new ApiError_1.default(403, 'You do not have access to this chat room');
    }
    apiResponse_1.ApiResponse.success(res, { chatRoom }, 'Chat room retrieved successfully');
});
// Send message
ChatController.sendMessage = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const { content, type, replyTo } = req.body;
    const chatRoom = await models_1.ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError_1.default(404, 'Chat room not found');
    }
    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
        throw new ApiError_1.default(403, 'You are not a participant in this chat room');
    }
    // Create message
    const message = await models_1.Message.create({
        chatRoom: roomId,
        sender: userId,
        content,
        type: type || 'text',
        replyTo,
    });
    await message.populate('sender', 'firstName lastName profilePicture');
    if (replyTo) {
        await message.populate('replyTo');
    }
    // Update chat room's last message
    chatRoom.lastMessage = {
        text: content,
        sender: new mongoose_1.default.Types.ObjectId(userId),
        sentAt: new Date(),
    };
    // Increment unread count for other participants
    chatRoom.participants.forEach((participantId) => {
        if (participantId.toString() !== userId) {
            const currentCount = chatRoom.unreadCount.get(participantId.toString()) || 0;
            chatRoom.unreadCount.set(participantId.toString(), currentCount + 1);
        }
    });
    await chatRoom.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(`room:${roomId}`).emit('new-message', {
        message,
        chatRoom: roomId,
    });
    // Send notification to offline users
    const onlineUsers = new Set(); // TODO: Track online users via socket service
    chatRoom.participants.forEach(async (participantId) => {
        if (participantId.toString() !== userId && !onlineUsers.has(participantId.toString())) {
            const { Notification } = await Promise.resolve().then(() => __importStar(require('../../models')));
            await Notification.create({
                recipient: participantId,
                sender: userId,
                type: 'message',
                title: 'New Message',
                message: content.substring(0, 100),
                data: {
                    chatRoomId: roomId,
                },
            });
        }
    });
    apiResponse_1.ApiResponse.created(res, { message }, 'Message sent successfully');
});
// Get messages in a chat room
ChatController.getMessages = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const chatRoom = await models_1.ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError_1.default(404, 'Chat room not found');
    }
    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
        throw new ApiError_1.default(403, 'You do not have access to this chat room');
    }
    const query = {
        chatRoom: roomId,
        deletedFor: { $ne: userId },
    };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const messages = await models_1.Message.find(query)
        .populate('sender', 'firstName lastName profilePicture')
        .populate('replyTo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await models_1.Message.countDocuments(query);
    // Mark messages as delivered
    const undeliveredMessages = messages.filter((msg) => msg.sender.toString() !== userId &&
        !msg.deliveredTo.some((d) => d.user.toString() === userId));
    if (undeliveredMessages.length > 0) {
        await models_1.Message.updateMany({
            _id: { $in: undeliveredMessages.map((m) => m._id) },
        }, {
            $push: {
                deliveredTo: {
                    user: userId,
                    deliveredAt: new Date(),
                },
            },
        });
    }
    apiResponse_1.ApiResponse.paginated(res, messages.reverse(), Number(page), Number(limit), total, 'Messages retrieved successfully');
});
// Mark messages as read
ChatController.markAsRead = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const { messageIds } = req.body;
    const chatRoom = await models_1.ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError_1.default(404, 'Chat room not found');
    }
    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
        throw new ApiError_1.default(403, 'You do not have access to this chat room');
    }
    // Update messages
    await models_1.Message.updateMany({
        _id: { $in: messageIds },
        chatRoom: roomId,
        'readBy.user': { $ne: userId },
    }, {
        $push: {
            readBy: {
                user: userId,
                readAt: new Date(),
            },
        },
    });
    // Reset unread count for this user
    chatRoom.unreadCount.set(userId, 0);
    await chatRoom.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(`room:${roomId}`).emit('messages-read', {
        userId,
        messageIds,
        readAt: new Date(),
    });
    apiResponse_1.ApiResponse.success(res, null, 'Messages marked as read');
});
// Delete message
ChatController.deleteMessage = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { messageId } = req.params;
    const { deleteFor } = req.body; // 'me' or 'everyone'
    const message = await models_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(404, 'Message not found');
    }
    if (deleteFor === 'everyone') {
        // Only sender can delete for everyone
        if (message.sender.toString() !== userId) {
            throw new ApiError_1.default(403, 'You can only delete your own messages for everyone');
        }
        // Check if message is less than 1 hour old
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (message.createdAt < oneHourAgo) {
            throw new ApiError_1.default(400, 'Can only delete messages within 1 hour of sending');
        }
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = 'This message was deleted';
        await message.save();
        // Emit socket event
        const io = req.app.get('io');
        io.to(`room:${message.chatRoom.toString()}`).emit('message-deleted', {
            messageId,
            deletedFor: 'everyone',
        });
    }
    else {
        // Delete for self
        message.deletedFor.push(new mongoose_1.default.Types.ObjectId(userId));
        await message.save();
    }
    apiResponse_1.ApiResponse.success(res, null, 'Message deleted successfully');
});
// Edit message
ChatController.editMessage = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { messageId } = req.params;
    const { content } = req.body;
    const message = await models_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(404, 'Message not found');
    }
    if (message.sender.toString() !== userId) {
        throw new ApiError_1.default(403, 'You can only edit your own messages');
    }
    // Check if message is less than 15 minutes old
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
        throw new ApiError_1.default(400, 'Can only edit messages within 15 minutes of sending');
    }
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(`room:${message.chatRoom.toString()}`).emit('message-edited', {
        message,
    });
    apiResponse_1.ApiResponse.success(res, { message }, 'Message edited successfully');
});
// Add reaction to message
ChatController.addReaction = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { messageId } = req.params;
    const { emoji } = req.body;
    const message = await models_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(404, 'Message not found');
    }
    // Get or create reaction array for this emoji
    const reactions = message.reactions.get(emoji) || [];
    const userIdObj = new mongoose_1.default.Types.ObjectId(userId);
    // Toggle reaction
    const userIndex = reactions.findIndex((id) => id.equals(userIdObj));
    if (userIndex > -1) {
        reactions.splice(userIndex, 1);
    }
    else {
        reactions.push(userIdObj);
    }
    message.reactions.set(emoji, reactions);
    await message.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(`room:${message.chatRoom.toString()}`).emit('message-reaction', {
        messageId,
        emoji,
        userId,
        action: userIndex > -1 ? 'removed' : 'added',
    });
    apiResponse_1.ApiResponse.success(res, { reactions: Object.fromEntries(message.reactions) }, 'Reaction updated');
});
// Upload media in chat
ChatController.uploadMedia = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const files = req.files;
    if (!files || files.length === 0) {
        throw new ApiError_1.default(400, 'No files uploaded');
    }
    const chatRoom = await models_1.ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError_1.default(404, 'Chat room not found');
    }
    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
        throw new ApiError_1.default(403, 'You are not a participant in this chat room');
    }
    // Upload files
    const uploadPromises = files.map(async (file) => {
        let url;
        let type;
        if (file.mimetype.startsWith('image/')) {
            url = await cloudinary_upload_1.CloudinaryUpload.uploadImage(file.buffer, `roommate-finder/chat/${roomId}`);
            type = 'image';
        }
        else if (file.mimetype.startsWith('video/')) {
            url = await cloudinary_upload_1.CloudinaryUpload.uploadVideo(file.buffer, `roommate-finder/chat/${roomId}`);
            type = 'video';
        }
        else {
            url = await cloudinary_upload_1.CloudinaryUpload.uploadDocument(file.buffer, `roommate-finder/chat/${roomId}`);
            type = 'file';
        }
        return {
            url,
            type: file.mimetype,
            size: file.size,
            name: file.originalname,
        };
    });
    const attachments = await Promise.all(uploadPromises);
    apiResponse_1.ApiResponse.success(res, { attachments }, 'Media uploaded successfully');
});
// Pin/Unpin chat
ChatController.togglePin = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const chatRoom = await models_1.ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError_1.default(404, 'Chat room not found');
    }
    const currentValue = chatRoom.isPinned.get(userId) || false;
    chatRoom.isPinned.set(userId, !currentValue);
    await chatRoom.save();
    apiResponse_1.ApiResponse.success(res, { isPinned: !currentValue }, 'Chat pin status updated');
});
// Mute/Unmute chat
ChatController.toggleMute = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const chatRoom = await models_1.ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError_1.default(404, 'Chat room not found');
    }
    const currentValue = chatRoom.isMuted.get(userId) || false;
    chatRoom.isMuted.set(userId, !currentValue);
    await chatRoom.save();
    apiResponse_1.ApiResponse.success(res, { isMuted: !currentValue }, 'Chat mute status updated');
});
// Archive/Unarchive chat
ChatController.toggleArchive = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const chatRoom = await models_1.ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError_1.default(404, 'Chat room not found');
    }
    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
        throw new ApiError_1.default(403, 'You do not have access to this chat room');
    }
    chatRoom.isArchived = !chatRoom.isArchived;
    await chatRoom.save();
    apiResponse_1.ApiResponse.success(res, { isArchived: chatRoom.isArchived }, 'Chat archive status updated');
});
// Search messages
ChatController.searchMessages = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;
    if (!query) {
        throw new ApiError_1.default(400, 'Search query is required');
    }
    const chatRoom = await models_1.ChatRoom.findById(roomId);
    if (!chatRoom) {
        throw new ApiError_1.default(404, 'Chat room not found');
    }
    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
        throw new ApiError_1.default(403, 'You do not have access to this chat room');
    }
    const searchQuery = {
        chatRoom: roomId,
        content: { $regex: query, $options: 'i' },
        deletedFor: { $ne: userId },
        isDeleted: false,
    };
    const skip = (Number(page) - 1) * Number(limit);
    const messages = await models_1.Message.find(searchQuery)
        .populate('sender', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await models_1.Message.countDocuments(searchQuery);
    apiResponse_1.ApiResponse.paginated(res, messages, Number(page), Number(limit), total, 'Search results retrieved successfully');
});
//# sourceMappingURL=chat.controller.js.map