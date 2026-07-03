import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rateLimit';
import { signToken } from '@/lib/jwt';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (max 5 requests per 5 minutes for password resets)
    const limiter = rateLimit(req, { limit: 5, windowMs: 5 * 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json(
        { message: `Too many requests. Please retry in ${limiter.reset} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ message: result.error.issues[0].message }, { status: 400 });
    }

    const { email } = result.data;
    const user = await dbService.getUserByEmail(email);

    if (user) {
      // Sign a short-lived reset token (valid for 1 hour)
      const token = signToken(
        { id: user.id, email: user.email, purpose: 'password_reset' },
        { expiresIn: '1h' }
      );

      // Send the reset link email
      await sendPasswordResetEmail(user.email, user.name || 'Valued Customer', token);

      // Audit log
      await dbService.createAuditLog({
        userId: user.id,
        action: "PASSWORD_RESET_REQUEST",
        details: `Password reset request triggered for email: ${email}.`
      });
    }

    // Always return success status to prevent email harvesting/enumeration
    return NextResponse.json({
      success: true,
      message: "If the email is registered, a password reset link has been dispatched."
    });
  } catch (error) {
    console.error("API Forgot Password Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
