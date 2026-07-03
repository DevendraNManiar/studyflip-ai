import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { isAdmin, getCurrentUser } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const minRating = parseFloat(searchParams.get('rating') || '0');
    const inStock = searchParams.get('inStock') === 'true';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Retrieve all products from dbService
    const allProducts = await dbService.getProducts();

    // Filter products
    let filtered = allProducts.filter((p: any) => {
      // Search term
      if (search && !p.name.toLowerCase().includes(search) && !p.description.toLowerCase().includes(search)) {
        return false;
      }
      
      // Category slug or ID
      if (category && p.categoryId !== category && p.category?.slug !== category) {
        return false;
      }

      // Brand slug or ID
      if (brand && p.brandId !== brand && p.brand?.slug !== brand) {
        return false;
      }

      // Price (take discountPrice if present, else base price)
      const price = p.discountPrice || p.price;
      if (price < minPrice || price > maxPrice) {
        return false;
      }

      // Rating
      if (p.rating < minRating) {
        return false;
      }

      // Stock
      if (inStock && p.stock <= 0) {
        return false;
      }

      return true;
    });

    // Sort products
    filtered.sort((a: any, b: any) => {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;

      if (sort === 'price_asc') {
        return priceA - priceB;
      }
      if (sort === 'price_desc') {
        return priceB - priceA;
      }
      if (sort === 'rating_desc') {
        return b.rating - a.rating;
      }
      // Newest first
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return dateB - dateA;
    });

    // Paginate results
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      products: paginated,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("API Products GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, price, discountPrice, categoryId, brandId, sku, stock, images } = body;

    if (!name || !description || !price || !categoryId || !brandId || !sku) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Slug generation
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const user = await getCurrentUser();
    const newProduct = await dbService.createProduct({
      name,
      slug,
      description,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      categoryId,
      brandId,
      sku,
      stock: parseInt(stock || '0'),
      images: images && images.length ? images : ["https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80"],
      tax: 18.0,
      weight: 0.5,
      barcode: `BAR${Date.now()}`
    });

    // Write audit log
    await dbService.createAuditLog({
      userId: user?.id,
      action: "PRODUCT_CREATE",
      details: `Admin ${user?.email} created product "${name}" (SKU: ${sku}).`
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("API Products POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
