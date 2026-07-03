import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ valid: false, message: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await dbService.getCouponByCode(code);
    if (!coupon) {
      return NextResponse.json({ valid: false, message: "Invalid coupon code" }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, message: "This coupon is no longer active" }, { status: 400 });
    }

    const expiry = new Date(coupon.expiryDate);
    if (expiry < new Date()) {
      return NextResponse.json({ valid: false, message: "This coupon has expired" }, { status: 400 });
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: "This coupon has reached its maximum usage limit" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        isFlat: coupon.isFlat
      }
    });
  } catch (error) {
    console.error("API Coupon Validate Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
