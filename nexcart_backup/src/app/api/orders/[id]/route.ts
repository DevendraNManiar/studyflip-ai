import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { getCurrentUser, isAdmin } from '@/lib/authHelper';
import { broadcastSSE } from '@/app/api/notifications/stream/route';
import { sendOrderShippedEmail, sendOrderDeliveredEmail, sendRefundIssuedEmail } from '@/lib/email';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const order = await dbService.getOrderById(id);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Verify ownership (Admin can view all, users only their own)
    if (user.role !== 'ADMIN' && order.userId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("API Order GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { status, trackingNumber } = await req.json();

    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    const updatedOrder = await dbService.updateOrderStatus(id, status, trackingNumber);

    // Fetch the client details to send transactional updates
    const users = await dbService.getUsers();
    const orderUser = users.find((u: any) => u.id === updatedOrder.userId);
    
    if (orderUser) {
      try {
        if (status === 'SHIPPED') {
          await sendOrderShippedEmail(orderUser.email, orderUser.name || 'Valued Customer', updatedOrder.orderNumber, trackingNumber || 'TRK-PENDING');
        } else if (status === 'DELIVERED') {
          await sendOrderDeliveredEmail(orderUser.email, orderUser.name || 'Valued Customer', updatedOrder.orderNumber);
        } else if (status === 'REFUNDED') {
          await sendRefundIssuedEmail(orderUser.email, orderUser.name || 'Valued Customer', updatedOrder.orderNumber, updatedOrder.totalAmount);
        }
      } catch (emailErr) {
        console.error("⚠️ Failed to dispatch status change notification email:", emailErr);
      }

      // Dispatch real-time notification via Server-Sent Events (SSE)
      try {
        broadcastSSE('order_update', {
          userId: orderUser.id,
          orderNumber: updatedOrder.orderNumber,
          status,
          message: `Your order ${updatedOrder.orderNumber} status has shifted to: ${status}.`
        });
      } catch (sseErr) {
        console.error("⚠️ SSE broadcast failed:", sseErr);
      }
    }

    const user = await getCurrentUser();
    await dbService.createAuditLog({
      userId: user?.id,
      action: "ORDER_STATUS_UPDATE",
      details: `Admin ${user?.email} updated order ${updatedOrder.orderNumber} status to ${status} (Tracking: ${trackingNumber || 'N/A'}).`
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("API Order PUT Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
