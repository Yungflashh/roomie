import { Response } from 'express';
import { AuthRequest } from '../../types';
import { ChatRoom, Message, User, Match } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import mongoose from 'mongoose';
import { CloudinaryUpload } from '../../utils/cloudinary.upload';

export class ChatController {
  // Get all chat rooms for user
  static getChatRooms = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { archived } = req.query;

    const query: any = {
      participants: userId,
    };

    if (archived !== undefined) {
      query.isArchived = archived === 'true';
    }

    const chatRooms = await ChatRoom.find(query)
      .populate('participants', 'firstName lastName email profilePicture')
      .populate('lastMessage.sender', 'firstName lastName')
      .sort({ 'lastMessage.sentAt': -1 });

    // Format response with unread counts for current user
    const formattedRooms = chatRooms.map((room) => ({
      ...room.toObject(),
      unreadCount: room.unreadCount.get(userId!) || 0,
      isPinned: room.isPinned.get(userId!) || false,
      isMuted: room.isMuted.get(userId!) || false,
    }));

    ApiResponse.success(res, { chatRooms: formattedRooms }, 'Chat rooms retrieved successfully');
  });

  // Get or create direct chat room
  static getOrCreateDirectChat = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { participantId } = req.body;

    if (userId === participantId) {
      throw new ApiError(400, 'Cannot create chat with yourself');
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      throw new ApiError(404, 'User not found');
    }

    // Check if users are matched
    const match = await Match.findOne({
      $or: [
        { user1: userId, user2: participantId },
        { user1: participantId, user2: userId },
      ],
      status: 'accepted',
    });

    if (!match) {
      throw new ApiError(403, 'You can only chat with matched users');
    }

    // Check if chat room already exists
    let chatRoom = await ChatRoom.findOne({
      type: 'direct',
      participants: { $all: [userId, participantId], $size: 2 },
    }).populate('participants', 'firstName lastName email profilePicture');

    // Create if doesn't exist
    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        participants: [userId, participantId],
        type: 'direct',
        relatedMatch: match._id,
        createdBy: userId,
      });

      await chatRoom.populate('participants', 'firstName lastName email profilePicture');
    }

    ApiResponse.success(res, { chatRoom }, 'Chat room retrieved successfully');
  });

  // Get chat room by ID
  static getChatRoomById = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId)
      .populate('participants', 'firstName lastName email profilePicture')
      .populate('relatedMatch');

    if (!chatRoom) {
      throw new ApiError(404, 'Chat room not found');
    }

    // Check if user is participant
    if (!chatRoom.participants.some((p: any) => p._id.toString() === userId)) {
      throw new ApiError(403, 'You do not have access to this chat room');
    }

    ApiResponse.success(res, { chatRoom }, 'Chat room retrieved successfully');
  });

  // Send message
  static sendMessage = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const { content, type, replyTo } = req.body;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      throw new ApiError(404, 'Chat room not found');
    }

    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
      throw new ApiError(403, 'You are not a participant in this chat room');
    }

    // Create message
    const message = await Message.create({
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
      sender: new mongoose.Types.ObjectId(userId),
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
        const { Notification } = await import('../../models');
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

    ApiResponse.created(res, { message }, 'Message sent successfully');
  });

  // Get messages in a chat room
  static getMessages = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      throw new ApiError(404, 'Chat room not found');
    }

    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
      throw new ApiError(403, 'You do not have access to this chat room');
    }

    const query: any = {
      chatRoom: roomId,
      deletedFor: { $ne: userId },
    };

    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName profilePicture')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments(query);

    // Mark messages as delivered
    const undeliveredMessages = messages.filter(
      (msg) =>
        msg.sender.toString() !== userId &&
        !msg.deliveredTo.some((d: any) => d.user.toString() === userId)
    );

    if (undeliveredMessages.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: undeliveredMessages.map((m) => m._id) },
        },
        {
          $push: {
            deliveredTo: {
              user: userId,
              deliveredAt: new Date(),
            },
          },
        }
      );
    }

    ApiResponse.paginated(
      res,
      messages.reverse(),
      Number(page),
      Number(limit),
      total,
      'Messages retrieved successfully'
    );
  });

  // Mark messages as read
  static markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const { messageIds } = req.body;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      throw new ApiError(404, 'Chat room not found');
    }

    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
      throw new ApiError(403, 'You do not have access to this chat room');
    }

    // Update messages
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        chatRoom: roomId,
        'readBy.user': { $ne: userId },
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date(),
          },
        },
      }
    );

    // Reset unread count for this user
    chatRoom.unreadCount.set(userId!, 0);
    await chatRoom.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`room:${roomId}`).emit('messages-read', {
      userId,
      messageIds,
      readAt: new Date(),
    });

    ApiResponse.success(res, null, 'Messages marked as read');
  });

  // Delete message
  static deleteMessage = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { messageId } = req.params;
    const { deleteFor } = req.body; // 'me' or 'everyone'

    const message = await Message.findById(messageId);

    if (!message) {
      throw new ApiError(404, 'Message not found');
    }

    if (deleteFor === 'everyone') {
      // Only sender can delete for everyone
      if (message.sender.toString() !== userId) {
        throw new ApiError(403, 'You can only delete your own messages for everyone');
      }

      // Check if message is less than 1 hour old
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (message.createdAt < oneHourAgo) {
        throw new ApiError(400, 'Can only delete messages within 1 hour of sending');
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
    } else {
      // Delete for self
      message.deletedFor.push(new mongoose.Types.ObjectId(userId));
      await message.save();
    }

    ApiResponse.success(res, null, 'Message deleted successfully');
  });

  // Edit message
  static editMessage = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      throw new ApiError(404, 'Message not found');
    }

    if (message.sender.toString() !== userId) {
      throw new ApiError(403, 'You can only edit your own messages');
    }

    // Check if message is less than 15 minutes old
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      throw new ApiError(400, 'Can only edit messages within 15 minutes of sending');
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

    ApiResponse.success(res, { message }, 'Message edited successfully');
  });

  // Add reaction to message
  static addReaction = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      throw new ApiError(404, 'Message not found');
    }

    // Get or create reaction array for this emoji
    const reactions = message.reactions.get(emoji) || [];
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Toggle reaction
    const userIndex = reactions.findIndex((id: mongoose.Types.ObjectId) => id.equals(userIdObj));
    
    if (userIndex > -1) {
      reactions.splice(userIndex, 1);
    } else {
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

    ApiResponse.success(res, { reactions: Object.fromEntries(message.reactions) }, 'Reaction updated');
  });

  // Upload media in chat
  static uploadMedia = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new ApiError(400, 'No files uploaded');
    }

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      throw new ApiError(404, 'Chat room not found');
    }

    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
      throw new ApiError(403, 'You are not a participant in this chat room');
    }

    // Upload files
    const uploadPromises = files.map(async (file) => {
      let url: string;
      let type: string;

      if (file.mimetype.startsWith('image/')) {
        url = await CloudinaryUpload.uploadImage(file.buffer, `roommate-finder/chat/${roomId}`);
        type = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        url = await CloudinaryUpload.uploadVideo(file.buffer, `roommate-finder/chat/${roomId}`);
        type = 'video';
      } else {
        url = await CloudinaryUpload.uploadDocument(file.buffer, `roommate-finder/chat/${roomId}`);
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

    ApiResponse.success(res, { attachments }, 'Media uploaded successfully');
  });

  // Pin/Unpin chat
  static togglePin = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      throw new ApiError(404, 'Chat room not found');
    }

    const currentValue = chatRoom.isPinned.get(userId!) || false;
    chatRoom.isPinned.set(userId!, !currentValue);
    await chatRoom.save();

    ApiResponse.success(res, { isPinned: !currentValue }, 'Chat pin status updated');
  });

  // Mute/Unmute chat
  static toggleMute = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      throw new ApiError(404, 'Chat room not found');
    }

    const currentValue = chatRoom.isMuted.get(userId!) || false;
    chatRoom.isMuted.set(userId!, !currentValue);
    await chatRoom.save();

    ApiResponse.success(res, { isMuted: !currentValue }, 'Chat mute status updated');
  });

  // Archive/Unarchive chat
  static toggleArchive = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      throw new ApiError(404, 'Chat room not found');
    }

    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
      throw new ApiError(403, 'You do not have access to this chat room');
    }

    chatRoom.isArchived = !chatRoom.isArchived;
    await chatRoom.save();

    ApiResponse.success(res, { isArchived: chatRoom.isArchived }, 'Chat archive status updated');
  });

  // Search messages
  static searchMessages = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { roomId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      throw new ApiError(400, 'Search query is required');
    }

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      throw new ApiError(404, 'Chat room not found');
    }

    // Check if user is participant
    if (!chatRoom.participants.some((p) => p.toString() === userId)) {
      throw new ApiError(403, 'You do not have access to this chat room');
    }

    const searchQuery = {
      chatRoom: roomId,
      content: { $regex: query, $options: 'i' },
      deletedFor: { $ne: userId },
      isDeleted: false,
    };

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find(searchQuery)
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments(searchQuery);

    ApiResponse.paginated(
      res,
      messages,
      Number(page),
      Number(limit),
      total,
      'Search results retrieved successfully'
    );
  });
}