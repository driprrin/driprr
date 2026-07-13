import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(private readonly prisma: PrismaService) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }

  /**
   * Create a Razorpay order for the given amount (in INR).
   * Returns the razorpay order object with `id`, `amount`, `currency`.
   */
  async createRazorpayOrder(amountInRupees: number, receipt: string) {
    const options = {
      amount: Math.round(amountInRupees * 100), // Razorpay expects paise
      currency: 'INR',
      receipt,
      payment_capture: 1, // auto-capture
    };

    try {
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to create Razorpay order: ${err.message ?? 'Unknown error'}`,
      );
    }
  }

  /**
   * Verify Razorpay payment signature.
   * Returns true if signature is valid.
   */
  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    return expectedSignature === razorpaySignature;
  }

  /**
   * After successful payment verification, update the Payment record.
   */
  async confirmPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const isValid = this.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Update the Payment record
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId },
    });

    if (!payment) {
      // Create payment record if it doesn't exist yet
      // Get the order total for the amount
      const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { total: true } });
      await this.prisma.payment.create({
        data: {
          orderId,
          method: 'RAZORPAY',
          status: 'PAID',
          amount: order?.total ?? 0,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          paidAt: new Date(),
        },
      });
    } else {
      await this.prisma.payment.update({
        where: { razorpayOrderId },
        data: {
          status: 'PAID',
          razorpayPaymentId,
          razorpaySignature,
          paidAt: new Date(),
        },
      });
    }

    return { success: true, message: 'Payment verified successfully' };
  }

  /**
   * Initiate a full refund for a cancelled order via Razorpay.
   */
  async refund(orderId: string) {
    // Find the payment record for this order
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      throw new BadRequestException('No payment record found for this order');
    }

    if (payment.status === 'REFUNDED') {
      return { success: true, message: 'Already refunded' };
    }

    if (!payment.razorpayPaymentId) {
      throw new BadRequestException('No Razorpay payment ID found — cannot refund COD orders');
    }

    try {
      const refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
        speed: 'normal',
      });

      // Update payment status
      await this.prisma.payment.update({
        where: { orderId },
        data: { status: 'REFUNDED' },
      });

      return {
        success: true,
        message: 'Refund initiated successfully',
        refundId: (refund as any).id,
        amount: ((refund as any).amount ?? 0) / 100,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `Refund failed: ${err.error?.description ?? err.message ?? 'Unknown error'}`,
      );
    }
  }
}
