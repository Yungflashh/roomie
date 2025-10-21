import { ValidationChain } from 'express-validator';
export declare class ChatValidator {
    static createDirectChat(): ValidationChain[];
    static sendMessage(): ValidationChain[];
    static getMessages(): ValidationChain[];
    static markAsRead(): ValidationChain[];
    static deleteMessage(): ValidationChain[];
    static editMessage(): ValidationChain[];
    static addReaction(): ValidationChain[];
    static uploadMedia(): ValidationChain[];
    static searchMessages(): ValidationChain[];
    static getChatRoomById(): ValidationChain[];
}
//# sourceMappingURL=chat.validator.d.ts.map