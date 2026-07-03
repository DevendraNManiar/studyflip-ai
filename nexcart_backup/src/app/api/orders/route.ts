import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Login required" }, { status: 401 });
    }

    let orders;
    if (user.role === 'ADMIN') {
      orders = await dbService.getOrders();
    } else {
      orders = await dbService.getOrdersByUserId(user.id);
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("API Orders GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Login required" }, { status: 401 });
    }

    const body = await req.json();
    const { items, totalAmount, taxAmount, shippingCost, discountAmount, shippingAddress, appliedCoupon, paymentMethod } = body;

    if (!items || !items.length || !shippingAddress || !totalAmount) {
      return NextResponse.json({ message: "Missing order details" }, { status: 400 });
    }

    // Generate a unique luxury order number: NEX-YYYYMMDD-XXXX (random)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    const orderNumber = `NEX-${dateStr}-${randomStr}`;

    const newOrder = await dbService.createOrder({
      orderNumber,
      userId: user.id,
      status: "PAID", // Default to paid upon checkout in mock payment mode
      totalAmount: parseFloat(totalAmount),
      taxAmount: parseFloat(taxAmount || '0'),
      shippingCost: parseFloat(shippingCost || '0'),
      discountAmount: parseFloat(discountAmount || '0'),
      shippingAddress,
      appliedCoupon,
      items,
      payment: {
        paymentMethod: paymentMethod || "MOCK_CARD",
        status: "COMPLETED",
        transactionId: `txn_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        amount: parseFloat(totalAmount)
      }
    });

    // Write audit log
    await dbService.createAuditLog({
      userId: user.id,
      action: "ORDER_PLACE",
      details: `User ${user.email} placed order ${orderNumber} for $${totalAmount}.`
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error("API Orders POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
