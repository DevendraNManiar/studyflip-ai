import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/authHelper';
import { dbService } from '@/lib/dbWrapper';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    // Only permit this in development/local environments
    if ((process.env.NODE_ENV as string) === 'production') {
      return NextResponse.json({ message: "Forbidden: Dev utility only" }, { status: 403 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Login required" }, { status: 401 });
    }

    const newRole = user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';

    // Update in database
    const updatedUser = await dbService.updateUser(user.id, { role: newRole });

    // Generate new JWT with updated role
    const token = signToken({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });

    // Write updated cookie session
    const cookieStore = await cookies();
    cookieStore.set('nexcart_session', token, {
      httpOnly: true,
      secure: (process.env.NODE_ENV as string) === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    await dbService.createAuditLog({
      userId: user.id,
      action: "USER_DEV_ROLE_TOGGLE",
      details: `User ${user.email} toggled their developer status to ${newRole}.`
    });

    const { password: _, ...safeUser } = updatedUser as any;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: any) {
    console.error("❌ [Dev Role Toggle] Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
