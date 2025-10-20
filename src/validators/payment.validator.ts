import { body, param, query, ValidationChain } from 'express-validator';

export class PaymentValidator {
  static createPaymentIntent(): ValidationChain[] {
    return [
      body('amount')
        .isFloat({ min: 0.5 })
        .withMessage('Amount must be at least $0.50'),

      body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 200 })
        .withMessage('Description cannot exceed 200 characters'),

      body('type')
        .isIn(['verification', 'background_check', 'feature', 'premium'])
        .withMessage('Invalid payment type'),
    ];
  }

  static requestRefund(): ValidationChain[] {
    return [
      param('paymentId').isMongoId().withMessage('Invalid payment ID'),

      body('reason')
        .trim()
        .notEmpty()
        .withMessage('Reason is required')
        .isLength({ max: 500 })
        .withMessage('Reason cannot exceed 500 characters'),
    ];
  }

  static getPaymentById(): ValidationChain[] {
    return [param('paymentId').isMongoId().withMessage('Invalid payment ID')];
  }

  static removePaymentMethod(): ValidationChain[] {
    return [param('paymentMethodId').notEmpty().withMessage('Payment method ID is required')];
  }
}

export class SubscriptionValidator {
  static createCheckoutSession(): ValidationChain[] {
    return [
      body('plan')
        .isIn(['premium', 'pro'])
        .withMessage('Plan must be premium or pro'),
    ];
  }

  static cancelSubscription(): ValidationChain[] {
    return [
      body('immediately')
        .optional()
        .isBoolean()
        .withMessage('immediately must be a boolean'),
    ];
  }

  static updateSubscription(): ValidationChain[] {
    return [
      body('newPlan')
        .isIn(['premium', 'pro'])
        .withMessage('Plan must be premium or pro'),
    ];
  }

  static checkFeatureAccess(): ValidationChain[] {
    return [
      param('feature')
        .trim()
        .notEmpty()
        .withMessage('Feature name is required'),
    ];
  }
}