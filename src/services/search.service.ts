import { Message, ChatRoom } from '../models';
import { logger } from '../utils/logger';

export class SearchService {
  // Global message search across all user's chats
  static async searchAllMessages(
    userId: string,
    query: string,
    options: {
      page?: number;
      limit?: number;
      type?: string;
    } = {}
  ): Promise<any> {
    try {
      const { page = 1, limit = 20, type } = options;

      // Get all chat rooms user is part of
      const chatRooms = await ChatRoom.find({ participants: userId }).select('_id');
      const roomIds = chatRooms.map((room) => room._id);

      const searchQuery: any = {
        chatRoom: { $in: roomIds },
        content: { $regex: query, $options: 'i' },
        deletedFor: { $ne: userId },
        isDeleted: false,
      };

      if (type) {
        searchQuery.type = type;
      }

      const skip = (page - 1) * limit;

      const messages = await Message.find(searchQuery)
        .populate('sender', 'firstName lastName profilePicture')
        .populate('chatRoom')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Message.countDocuments(searchQuery);

      return {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error searching messages: ${error}`);
      throw error;
    }
  }

  // Search for media in chats
  static async searchMedia(
    userId: string,
    roomId: string,
    mediaType: 'image' | 'video' | 'file',
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<any> {
    try {
      const { page = 1, limit = 20 } = options;

      const searchQuery: any = {
        chatRoom: roomId,
        type: mediaType,
        deletedFor: { $ne: userId },
        isDeleted: false,
      };

      const skip = (page - 1) * limit;

      const messages = await Message.find(searchQuery)
        .populate('sender', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Message.countDocuments(searchQuery);

      return {
        media: messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error searching media: ${error}`);
      throw error;
    }
  }
}