import {
  Controller, Post, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/payments/create-order
   * Creates a Razorpay order and returns the order ID + key for frontend checkout.
   */
  @Post('create-order')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() dto: CreateRazorpayOrderDto) {
    const razorpayOrder = await this.paymentsService.createRazorpayOrder(
      dto.amount,
      dto.receipt,
    );
    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * POST /api/payments/verify
   * Verifies Razorpay payment signature and marks payment as paid.
   */
  @Post('verify')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.confirmPayment(
      dto.orderId,
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
  }

  /**
   * POST /api/payments/refund
   * Initiates a full refund for a cancelled Razorpay order. Admin only.
   */
  @Post('refund')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async refundPayment(@Body() body: { orderId: string }) {
    return this.paymentsService.refund(body.orderId);
  }
}
