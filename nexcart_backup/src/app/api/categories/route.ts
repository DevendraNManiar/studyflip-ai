import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { isAdmin, getCurrentUser } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const categories = await dbService.getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("API Categories GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { name, description, image } = await req.json();

    if (!name) {
      return NextResponse.json({ message: "Category name is required" }, { status: 400 });
    }

    const newCategory = await dbService.createCategory({
      name,
      description,
      image: image || "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80"
    });

    const user = await getCurrentUser();
    await dbService.createAuditLog({
      userId: user?.id,
      action: "CATEGORY_CREATE",
      details: `Admin ${user?.email} created category "${name}".`
    });

    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error) {
    console.error("API Categories POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
