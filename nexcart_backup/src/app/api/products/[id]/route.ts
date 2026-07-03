import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { isAdmin, getCurrentUser } from '@/lib/authHelper';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const products = await dbService.getProducts();
    const product = products.find((p: any) => p.id === id || p.slug === id);

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("API Product GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await dbService.updateProduct(id, body);

    const user = await getCurrentUser();
    await dbService.createAuditLog({
      userId: user?.id,
      action: "PRODUCT_UPDATE",
      details: `Admin ${user?.email} updated product "${updated.name}" (ID: ${id}).`
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("API Product PUT Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const user = await getCurrentUser();
    await dbService.deleteProduct(id);

    await dbService.createAuditLog({
      userId: user?.id,
      action: "PRODUCT_DELETE",
      details: `Admin ${user?.email} deleted product ID: ${id}.`
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("API Product DELETE Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
