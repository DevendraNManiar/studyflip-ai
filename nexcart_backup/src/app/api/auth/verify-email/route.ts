import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { verifyToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ message: "Verification token is required" }, { status: 400 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.purpose !== 'email_verification') {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    const user = await dbService.getUserByEmail(decoded.email);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    await dbService.updateUser(user.id, { emailVerified: new Date() });

    await dbService.createAuditLog({
      userId: user.id,
      action: "EMAIL_VERIFICATION",
      details: `Email verified successfully for: ${user.email}.`
    });

    return NextResponse.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("API Verify Email Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
