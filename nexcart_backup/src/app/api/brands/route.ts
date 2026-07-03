import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { isAdmin } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const brands = await dbService.getBrands();
    return NextResponse.json({ brands });
  } catch (error) {
    console.error("API Brands GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { name, description, logo } = await req.json();

    if (!name) {
      return NextResponse.json({ message: "Brand name is required" }, { status: 400 });
    }

    const newBrand = await dbService.createBrand({
      name,
      description,
      logo,
      slug: name.toLowerCase().replace(/ /g, '-')
    });

    return NextResponse.json({ success: true, brand: newBrand }, { status: 201 });
  } catch (error) {
    console.error("API Brands POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
