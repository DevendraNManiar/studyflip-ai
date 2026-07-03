import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { dbService } from '@/lib/dbWrapper';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexcart_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Refresh user details from DB to capture any role changes or image updates
    const user = await dbService.getUserByEmail(decoded.email);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Don't return password hash
    const { password, ...safeUser } = user as any;

    return NextResponse.json({ authenticated: true, user: safeUser });
  } catch (error) {
    console.error("API Auth Me Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nexcart_session')?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, image } = await req.json();
    const user = await dbService.getUserByEmail(decoded.email);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updatedUser = await dbService.updateUser(user.id, { name, image });
    const { password, ...safeUser } = updatedUser as any;

    await dbService.createAuditLog({
      userId: user.id,
      action: "PROFILE_UPDATE",
      details: `User ${user.email} updated profile details.`
    });

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("API Auth Me PUT Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
