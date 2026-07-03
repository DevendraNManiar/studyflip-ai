import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authHelper';
import { dbService } from '@/lib/dbWrapper';
import { sendOrderConfirmationEmail, sendPaymentSuccessEmail } from '@/lib/email';

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret || clientId.includes('placeholder')) {
    return null;
  }

  const PAYPAL_API = process.env.NODE_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Login required" }, { status: 401 });
    }

    const { orderID, items, totalAmount, taxAmount, shippingCost, discountAmount, shippingAddress, appliedCoupon } = await req.json();

    if (!orderID || !items || !items.length) {
      return NextResponse.json({ message: "Missing required order details" }, { status: 400 });
    }

    console.log(`ℹ️ [PayPal Capture] Initiating capture for PayPal order ID: ${orderID}`);

    const accessToken = await getPayPalAccessToken();
    let transactionId = `paypal_sim_${orderID}_${Date.now()}`;

    if (accessToken && !orderID.startsWith('MOCK-PP-')) {
      const PAYPAL_API = process.env.NODE_ENV === 'production' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';

      // Capture PayPal order
      const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [PayPal Capture API Error]:", errorText);
        return NextResponse.json({ message: "PayPal REST API payment capture failed" }, { status: 500 });
      }

      const captureData = await response.json();
      
      if (captureData.status !== 'COMPLETED') {
        return NextResponse.json({ 
          message: `Capture status is not COMPLETED: ${captureData.status}` 
        }, { status: 400 });
      }

      // Extract transaction ID from captures list
      const captureInfo = captureData.purchase_units?.[0]?.payments?.captures?.[0];
      if (captureInfo && captureInfo.id) {
        transactionId = captureInfo.id;
      }
    } else {
      console.warn("⚠️ [PayPal Capture] Credentials missing or mock ID detected. Processing mock capture.");
    }

    // Generate Order ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    const orderNumber = `NEX-${dateStr}-${randomStr}`;

    // Create the order in the database
    const newOrder = await dbService.createOrder({
      orderNumber,
      userId: user.id,
      status: "PAID",
      totalAmount: parseFloat(totalAmount),
      taxAmount: parseFloat(taxAmount || '0'),
      shippingCost: parseFloat(shippingCost || '0'),
      discountAmount: parseFloat(discountAmount || '0'),
      shippingAddress,
      appliedCoupon,
      items,
      payment: {
        paymentMethod: "PAYPAL",
        status: "COMPLETED",
        transactionId,
        amount: parseFloat(totalAmount)
      }
    });

    // Send emails
    try {
      await sendOrderConfirmationEmail(user.email, user.name || 'Valued Customer', newOrder);
      await sendPaymentSuccessEmail(user.email, user.name || 'Valued Customer', orderNumber, transactionId, parseFloat(totalAmount));
    } catch (emailErr) {
      console.error("⚠️ Failed to dispatch PayPal checkout verification emails:", emailErr);
    }

    // Log audit
    await dbService.createAuditLog({
      userId: user.id,
      action: "ORDER_PLACE_PAYPAL",
      details: `PayPal payment transaction ${transactionId} captured for order ${orderNumber}.`
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error("❌ [PayPal Capture Handler] Error capturing order:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
