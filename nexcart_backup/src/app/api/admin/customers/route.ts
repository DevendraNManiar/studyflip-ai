import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { isAdmin, getCurrentUser } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const users = await dbService.getUsers();
    // Return all users
    return NextResponse.json({ users });
  } catch (error) {
    console.error("API Admin Customers GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id, role } = await req.json();

    if (!id || !role) {
      return NextResponse.json({ message: "User ID and Role are required" }, { status: 400 });
    }

    if (role !== 'ADMIN' && role !== 'CUSTOMER') {
      return NextResponse.json({ message: "Invalid role specified" }, { status: 400 });
    }

    const updatedUser = await dbService.updateUser(id, { role });

    const activeUser = await getCurrentUser();
    await dbService.createAuditLog({
      userId: activeUser?.id,
      action: "USER_ROLE_UPDATE",
      details: `Admin ${activeUser?.email} updated user ${updatedUser.email} role to ${role}.`
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("API Admin Customers PUT Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
