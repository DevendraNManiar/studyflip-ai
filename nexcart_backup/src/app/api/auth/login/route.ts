import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { dbService } from '@/lib/dbWrapper';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const user = await dbService.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Verify password if user has one (OAuth users might not have a password field)
    if (!user.password) {
      return NextResponse.json({ message: "This account uses OAuth login. Please log in with Google." }, { status: 400 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    const cookieStore = await cookies();
    cookieStore.set('nexcart_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    const { password: _, ...safeUser } = user as any;

    // Log the successful login action in audit log
    await dbService.createAuditLog({
      userId: user.id,
      action: "USER_LOGIN",
      details: `User ${user.email} logged in successfully.`
    });

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("API Auth Login Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
