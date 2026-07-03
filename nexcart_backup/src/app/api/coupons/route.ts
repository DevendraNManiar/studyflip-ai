import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { isAdmin, getCurrentUser } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const coupons = await dbService.getCoupons();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("API Coupons GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { code, discount, isFlat, expiryDate, usageLimit } = await req.json();

    if (!code || !discount || !expiryDate) {
      return NextResponse.json({ message: "Code, discount, and expiry date are required" }, { status: 400 });
    }

    const newCoupon = await dbService.createCoupon({
      code: code.toUpperCase(),
      discount: parseFloat(discount),
      isFlat: !!isFlat,
      expiryDate: new Date(expiryDate).toISOString(),
      usageLimit: parseInt(usageLimit || '100')
    });

    const user = await getCurrentUser();
    await dbService.createAuditLog({
      userId: user?.id,
      action: "COUPON_CREATE",
      details: `Admin ${user?.email} created coupon "${code.toUpperCase()}" with discount of ${discount}${isFlat ? '$' : '%'}.`
    });

    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error) {
    console.error("API Coupons POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
