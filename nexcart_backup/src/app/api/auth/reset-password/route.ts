import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { verifyToken } from '@/lib/jwt';
import { rateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export async function POST(req: NextRequest) {
  try {
    // Limit rate of reset password attempts
    const limiter = rateLimit(req, { limit: 10, windowMs: 5 * 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json(
        { message: `Too many attempts. Retry in ${limiter.reset} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: result.error.issues[0].message }, { status: 400 });
    }

    const { token, password } = result.data;
    const decoded = verifyToken(token);

    if (!decoded || decoded.purpose !== 'password_reset') {
      return NextResponse.json({ message: "Invalid or expired reset token" }, { status: 400 });
    }

    const user = await dbService.getUserByEmail(decoded.email);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await dbService.updateUser(user.id, { password: hashedPassword });

    await dbService.createAuditLog({
      userId: user.id,
      action: "PASSWORD_RESET_SUCCESS",
      details: `Password reset succeeded for user: ${user.email}.`
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("API Reset Password Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
