import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { sendOrderConfirmationEmail, sendPaymentSuccessEmail } from '@/lib/email';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' as any }) : null;

// Disable body parsing so we can read the raw request buffer for signature verification
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!stripe || !webhookSecret) {
      console.warn("⚠️ [Stripe Webhook] Stripe secret or webhook secret missing. Processing mock webhook event.");
      return NextResponse.json({ received: true, simulated: true });
    }

    if (!signature) {
      return NextResponse.json({ message: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error(`❌ Stripe Webhook signature verification failed:`, err.message);
      return NextResponse.json({ message: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`ℹ️ [Stripe Webhook] Received Stripe Event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      
      const { userId, itemsJson, shippingCost, discountAmount } = session.metadata || {};
      const customerEmail = session.customer_details?.email || session.customer_email;
      const transactionId = session.payment_intent as string || `stripe_txn_${Date.now()}`;
      const totalAmount = (session.amount_total || 0) / 100;

      if (userId && itemsJson && customerEmail) {
        const items = JSON.parse(itemsJson);

        // Generate Order ID
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
        const orderNumber = `NEX-${dateStr}-${randomStr}`;

        // Create user order record
        const newOrder = await dbService.createOrder({
          orderNumber,
          userId,
          status: "PAID",
          totalAmount,
          taxAmount: parseFloat((totalAmount * 0.18).toFixed(2)), // 18% tax
          shippingCost: parseFloat(shippingCost || '0'),
          discountAmount: parseFloat(discountAmount || '0'),
          shippingAddress: session.shipping_details
            ? `${session.shipping_details.name}, ${session.shipping_details.address?.line1}, ${session.shipping_details.address?.city}, ${session.shipping_details.address?.state} - ${session.shipping_details.address?.postal_code}, ${session.shipping_details.address?.country}`
            : `Client Checkout Address`,
          items,
          payment: {
            paymentMethod: "STRIPE",
            status: "COMPLETED",
            transactionId,
            amount: totalAmount
          }
        });

        // Send order status emails
        const user = await dbService.getUserByEmail(customerEmail);
        const name = user?.name || session.customer_details?.name || 'Valued Customer';
        
        try {
          await sendOrderConfirmationEmail(customerEmail, name, newOrder);
          await sendPaymentSuccessEmail(customerEmail, name, orderNumber, transactionId, totalAmount);
        } catch (emailErr) {
          console.error("⚠️ Failed to dispatch Stripe confirmation emails:", emailErr);
        }

        // Log audit
        await dbService.createAuditLog({
          userId,
          action: "ORDER_PLACE_STRIPE",
          details: `Stripe Webhook confirmed order ${orderNumber} for transaction ${transactionId}.`
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("API Stripe Webhook Router Error:", error);
    return NextResponse.json({ message: "Webhook Handler Error" }, { status: 500 });
  }
}
