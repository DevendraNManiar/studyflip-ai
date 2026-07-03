import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authHelper';

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
    const text = await response.text();
    throw new Error(`PayPal auth token retrieval failed: ${text}`);
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

    const { totalAmount } = await req.json();
    if (!totalAmount) {
      return NextResponse.json({ message: "Total amount is required" }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    
    if (!accessToken) {
      // Return a simulated mock PayPal order ID
      console.warn("⚠️ [PayPal Payment] PayPal credentials missing. Generating simulated order ID.");
      return NextResponse.json({ id: `MOCK-PP-${Date.now()}`, simulated: true });
    }

    const PAYPAL_API = process.env.NODE_ENV === 'production' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: parseFloat(totalAmount).toFixed(2)
          }
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [PayPal API Error] Order creation failed:", errorText);
      return NextResponse.json({ message: "PayPal REST API order creation failed" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ id: data.id, simulated: false });
  } catch (error: any) {
    console.error("❌ [PayPal API Handler] Error creating order:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
