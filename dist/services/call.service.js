"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallService = void 0;
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
class CallService {
    // Create call notification
    static async createCallNotification(callerId, receiverId, roomId, callType) {
        try {
            await models_1.Notification.create({
                recipient: receiverId,
                sender: callerId,
                type: 'system',
                title: `Incoming ${callType} call`,
                message: `You have an incoming ${callType} call`,
                data: {
                    chatRoomId: roomId,
                },
                priority: 'urgent',
            });
        }
        catch (error) {
            logger_1.logger.error(`Error creating call notification: ${error}`);
        }
    }
    // Log call history (optional - create CallLog model if needed)
    static async logCall(caller, receiver, duration, callType, status) {
        // TODO: Create CallLog model and implement
        logger_1.logger.info(`Call logged: ${caller} -> ${receiver}, ${duration}s, ${status}`);
    }
}
exports.CallService = CallService;
//# sourceMappingURL=call.service.js.map