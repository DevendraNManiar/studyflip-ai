import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { dbService } from '@/lib/dbWrapper';
import { signToken } from '@/lib/jwt';
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Default first user to ADMIN to make developer onboarding easier, otherwise CUSTOMER
    const allUsers = await dbService.getUsers();
    const role = allUsers.length === 0 ? 'ADMIN' : 'CUSTOMER';

    const newUser = await dbService.createUser({
      name,
      email,
      password: hashedPassword,
      role,
      image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    });

    const token = signToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

    const cookieStore = await cookies();
    cookieStore.set('nexcart_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    const { password: _, ...safeUser } = newUser as any;

    // Send verification and welcome email notifications
    try {
      const verifyTokenString = signToken(
        { id: newUser.id, email: newUser.email, purpose: 'email_verification' },
        { expiresIn: '1d' }
      );
      await sendVerificationEmail(newUser.email, newUser.name || 'Valued Customer', verifyTokenString);
      await sendWelcomeEmail(newUser.email, newUser.name || 'Valued Customer');
    } catch (emailErr) {
      console.error("⚠️ Failed to dispatch registration emails:", emailErr);
    }

    // Log the successful registration in audit log
    await dbService.createAuditLog({
      userId: newUser.id,
      action: "USER_REGISTER",
      details: `User ${newUser.email} registered successfully with role ${newUser.role}.`
    });

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error("API Auth Register Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
