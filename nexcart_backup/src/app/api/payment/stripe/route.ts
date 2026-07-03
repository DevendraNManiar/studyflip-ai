import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authHelper';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' as any }) : null;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Login required" }, { status: 401 });
    }

    const { items, successUrl, cancelUrl, shippingCost, discountAmount } = await req.json();

    if (!items || !items.length) {
      return NextResponse.json({ message: "Missing cart items" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!stripe) {
      // Mock payment simulation mode (when Stripe keys are placeholder or omitted)
      console.log("ℹ️ [Stripe Payment] Stripe secret key missing. Initiating simulated checkout session.");
      const mockSessionId = `mock_stripe_${Date.now()}`;
      const mockRedirectUrl = `${appUrl}/checkout?session_id=${mockSessionId}&mock_success=true`;
      
      return NextResponse.json({ url: mockRedirectUrl });
    }

    // Compile line items for Stripe Checkout
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    // Add shipping cost if applicable
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Logistics Air Shipping Speed',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Add discount discount coupon if applicable (simulated as line item credit)
    if (discountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Promotional Discount Credit',
          },
          unit_amount: -Math.round(discountAmount * 100), // credit
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        itemsJson: JSON.stringify(items.map((it: any) => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          variant: it.variantValue
        }))),
        shippingCost,
        discountAmount,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("API Stripe Checkout Session Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
