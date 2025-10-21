"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const models_1 = require("../../models");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const apiResponse_1 = require("../../utils/apiResponse");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const stripe_service_1 = require("../../services/stripe.service");
const types_1 = require("../../types");
class PaymentController {
}
exports.PaymentController = PaymentController;
_a = PaymentController;
// Create payment intent for one-time payment
PaymentController.createPaymentIntent = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { amount, description, type } = req.body;
    const paymentIntent = await stripe_service_1.StripeService.processOneTimePayment(userId, amount, description, type);
    apiResponse_1.ApiResponse.success(res, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    }, 'Payment intent created successfully');
});
// Get payment history
PaymentController.getPaymentHistory = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status } = req.query;
    const query = { user: userId };
    if (status) {
        query.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const payments = await models_1.Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await models_1.Payment.countDocuments(query);
    apiResponse_1.ApiResponse.paginated(res, payments, Number(page), Number(limit), total, 'Payment history retrieved successfully');
});
// Get payment by ID
PaymentController.getPaymentById = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { paymentId } = req.params;
    const payment = await models_1.Payment.findOne({
        _id: paymentId,
        user: userId,
    });
    if (!payment) {
        throw new ApiError_1.default(404, 'Payment not found');
    }
    apiResponse_1.ApiResponse.success(res, { payment }, 'Payment retrieved successfully');
});
// Request refund
PaymentController.requestRefund = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { paymentId } = req.params;
    const { reason } = req.body;
    const payment = await models_1.Payment.findOne({
        _id: paymentId,
        user: userId,
    });
    if (!payment) {
        throw new ApiError_1.default(404, 'Payment not found');
    }
    if (payment.status !== 'completed') {
        throw new ApiError_1.default(400, 'Only completed payments can be refunded');
    }
    // Check if payment is within refund window (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (payment.paidAt < thirtyDaysAgo) {
        throw new ApiError_1.default(400, 'Refund window has expired (30 days)');
    }
    // TODO: Implement Stripe refund
    // const refund = await stripe.refunds.create({
    //   payment_intent: payment.stripePaymentIntentId,
    //   reason: 'requested_by_customer',
    // });
    payment.status = types_1.PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.refundReason = reason;
    await payment.save();
    apiResponse_1.ApiResponse.success(res, { payment }, 'Refund requested successfully');
});
// Get available payment methods
PaymentController.getPaymentMethods = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const user = await models_1.User.findById(userId);
    if (!user || !user.stripeCustomerId) {
        return apiResponse_1.ApiResponse.success(res, { paymentMethods: [] }, 'No payment methods found');
    }
    const paymentMethods = await stripe_service_1.StripeService.listPaymentMethods(user.stripeCustomerId);
    apiResponse_1.ApiResponse.success(res, { paymentMethods }, 'Payment methods retrieved successfully');
});
// Remove payment method
PaymentController.removePaymentMethod = (0, catchAsync_1.default)(async (req, res) => {
    const { paymentMethodId } = req.params;
    await stripe_service_1.StripeService.detachPaymentMethod(paymentMethodId);
    apiResponse_1.ApiResponse.success(res, null, 'Payment method removed successfully');
});
// Get invoices
PaymentController.getInvoices = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;
    const user = await models_1.User.findById(userId);
    if (!user || !user.stripeCustomerId) {
        return apiResponse_1.ApiResponse.success(res, { invoices: [] }, 'No invoices found');
    }
    const invoices = await stripe_service_1.StripeService.getInvoices(user.stripeCustomerId, Number(limit));
    apiResponse_1.ApiResponse.success(res, { invoices }, 'Invoices retrieved successfully');
});
//# sourceMappingURL=payment.controller.js.map