import { Response } from 'express';
import { AuthRequest } from '../../types';
import { User, Payment, Subscription } from '../../models';
import ApiError from '../../utils/ApiError';
import { ApiResponse } from '../../utils/apiResponse';
import catchAsync from '../../utils/catchAsync';
import { StripeService } from '../../services/stripe.service';
import { PaymentStatus } from '../../types';


export class PaymentController {
  // Create payment intent for one-time payment
  static createPaymentIntent = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { amount, description, type } = req.body;

    const paymentIntent = await StripeService.processOneTimePayment(
      userId!,
      amount,
      description,
      type
    );

    ApiResponse.success(
      res,
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
      'Payment intent created successfully'
    );
  });

  // Get payment history
  static getPaymentHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status } = req.query;

    const query: any = { user: userId };

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);

    ApiResponse.paginated(
      res,
      payments,
      Number(page),
      Number(limit),
      total,
      'Payment history retrieved successfully'
    );
  });

  // Get payment by ID
  static getPaymentById = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      _id: paymentId,
      user: userId,
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    ApiResponse.success(res, { payment }, 'Payment retrieved successfully');
  });

  // Request refund
  static requestRefund = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findOne({
      _id: paymentId,
      user: userId,
    });

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new ApiError(400, 'Only completed payments can be refunded');
    }

    // Check if payment is within refund window (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (payment.paidAt! < thirtyDaysAgo) {
      throw new ApiError(400, 'Refund window has expired (30 days)');
    }

    // TODO: Implement Stripe refund
    // const refund = await stripe.refunds.create({
    //   payment_intent: payment.stripePaymentIntentId,
    //   reason: 'requested_by_customer',
    // });

payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.refundReason = reason;
    await payment.save();

    ApiResponse.success(res, { payment }, 'Refund requested successfully');
  });

  // Get available payment methods
  static getPaymentMethods = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    const user = await User.findById(userId);

    if (!user || !user.stripeCustomerId) {
      return ApiResponse.success(res, { paymentMethods: [] }, 'No payment methods found');
    }

    const paymentMethods = await StripeService.listPaymentMethods(user.stripeCustomerId);

    ApiResponse.success(
      res,
      { paymentMethods },
      'Payment methods retrieved successfully'
    );
  });

  // Remove payment method
  static removePaymentMethod = catchAsync(async (req: AuthRequest, res: Response) => {
    const { paymentMethodId } = req.params;

    await StripeService.detachPaymentMethod(paymentMethodId);

    ApiResponse.success(res, null, 'Payment method removed successfully');
  });

  // Get invoices
  static getInvoices = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;

    const user = await User.findById(userId);

    if (!user || !user.stripeCustomerId) {
      return ApiResponse.success(res, { invoices: [] }, 'No invoices found');
    }

    const invoices = await StripeService.getInvoices(user.stripeCustomerId, Number(limit));

    ApiResponse.success(res, { invoices }, 'Invoices retrieved successfully');
  });
}