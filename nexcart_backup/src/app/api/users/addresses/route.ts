import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/authHelper';
import { addressSchema } from '@/lib/zodSchemas';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const addresses = await dbService.getAddresses(user.id);
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("API Get Addresses Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = addressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: result.error.issues[0].message }, { status: 400 });
    }

    const newAddress = await dbService.addAddress(user.id, result.data);

    // Audit log
    await dbService.createAuditLog({
      userId: user.id,
      action: "ADDRESS_CREATE",
      details: `User ${user.email} added address: ${newAddress.street}, ${newAddress.city}.`
    });

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
  } catch (error) {
    console.error("API Post Address Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: "Address ID is required" }, { status: 400 });
    }

    await dbService.deleteAddress(id, user.id);

    // Audit log
    await dbService.createAuditLog({
      userId: user.id,
      action: "ADDRESS_DELETE",
      details: `User ${user.email} deleted address ID: ${id}.`
    });

    return NextResponse.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("API Delete Address Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
