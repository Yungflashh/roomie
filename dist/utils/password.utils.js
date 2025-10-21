"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordUtils = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PasswordUtils {
    // Hash Password
    static async hash(password) {
        const salt = await bcryptjs_1.default.genSalt(12);
        return bcryptjs_1.default.hash(password, salt);
    }
    // Compare Password
    static async compare(candidatePassword, hashedPassword) {
        return bcryptjs_1.default.compare(candidatePassword, hashedPassword);
    }
    // Validate Password Strength
    static validateStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.PasswordUtils = PasswordUtils;
//# sourceMappingURL=password.utils.js.map