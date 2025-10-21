"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionValidator = exports.PaymentValidator = void 0;
const express_validator_1 = require("express-validator");
class PaymentValidator {
    static createPaymentIntent() {
        return [
            (0, express_validator_1.body)('amount')
                .isFloat({ min: 0.5 })
                .withMessage('Amount must be at least $0.50'),
            (0, express_validator_1.body)('description')
                .trim()
                .notEmpty()
                .withMessage('Description is required')
                .isLength({ max: 200 })
                .withMessage('Description cannot exceed 200 characters'),
            (0, express_validator_1.body)('type')
                .isIn(['verification', 'background_check', 'feature', 'premium'])
                .withMessage('Invalid payment type'),
        ];
    }
    static requestRefund() {
        return [
            (0, express_validator_1.param)('paymentId').isMongoId().withMessage('Invalid payment ID'),
            (0, express_validator_1.body)('reason')
                .trim()
                .notEmpty()
                .withMessage('Reason is required')
                .isLength({ max: 500 })
                .withMessage('Reason cannot exceed 500 characters'),
        ];
    }
    static getPaymentById() {
        return [(0, express_validator_1.param)('paymentId').isMongoId().withMessage('Invalid payment ID')];
    }
    static removePaymentMethod() {
        return [(0, express_validator_1.param)('paymentMethodId').notEmpty().withMessage('Payment method ID is required')];
    }
}
exports.PaymentValidator = PaymentValidator;
class SubscriptionValidator {
    static createCheckoutSession() {
        return [
            (0, express_validator_1.body)('plan')
                .isIn(['premium', 'pro'])
                .withMessage('Plan must be premium or pro'),
        ];
    }
    static cancelSubscription() {
        return [
            (0, express_validator_1.body)('immediately')
                .optional()
                .isBoolean()
                .withMessage('immediately must be a boolean'),
        ];
    }
    static updateSubscription() {
        return [
            (0, express_validator_1.body)('newPlan')
                .isIn(['premium', 'pro'])
                .withMessage('Plan must be premium or pro'),
        ];
    }
    static checkFeatureAccess() {
        return [
            (0, express_validator_1.param)('feature')
                .trim()
                .notEmpty()
                .withMessage('Feature name is required'),
        ];
    }
}
exports.SubscriptionValidator = SubscriptionValidator;
//# sourceMappingURL=payment.validator.js.map