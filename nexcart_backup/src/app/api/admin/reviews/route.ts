import { NextRequest, NextResponse } from 'next/server';
import { dbService, runDb } from '@/lib/dbWrapper';
import { isAdmin, getCurrentUser } from '@/lib/authHelper';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Helper for local database reading/writing of reviews
const DB_DIR = path.join(process.cwd(), 'public', 'database');
const REVIEWS_FILE = path.join(DB_DIR, 'reviews.json');
const PRODUCTS_FILE = path.join(DB_DIR, 'products.json');

export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const reviews = await runDb(
      () => prisma.review.findMany({ include: { product: true, user: true }, orderBy: { createdAt: 'desc' } }),
      () => {
        // Fallback: read from local JSON files
        try {
          if (fs.existsSync(PRODUCTS_FILE)) {
            const productsData = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
            const allReviews: any[] = [];
            productsData.forEach((p: any) => {
              if (p.reviews && p.reviews.length > 0) {
                p.reviews.forEach((r: any) => {
                  allReviews.push({
                    ...r,
                    product: { id: p.id, name: p.name, slug: p.slug }
                  });
                });
              }
            });
            return allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
        } catch (e) {
          console.error(e);
        }
        return [];
      }
    );

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("API Admin Reviews GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id, isApproved } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "Review ID is required" }, { status: 400 });
    }

    await runDb(
      () => prisma.review.update({ where: { id }, data: { isApproved } }),
      () => {
        // Fallback: update in products.json reviews array
        if (fs.existsSync(PRODUCTS_FILE)) {
          const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
          let found = false;
          products.forEach((p: any) => {
            const rIdx = p.reviews?.findIndex((r: any) => r.id === id);
            if (rIdx !== undefined && rIdx !== -1) {
              p.reviews[rIdx].isApproved = isApproved;
              found = true;
            }
          });
          if (found) {
            fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
          }
        }
      }
    );

    const user = await getCurrentUser();
    await dbService.createAuditLog({
      userId: user?.id,
      action: "REVIEW_MODERATE",
      details: `Admin ${user?.email} updated review ID ${id} isApproved to ${isApproved}.`
    });

    return NextResponse.json({ success: true, message: "Review status updated successfully" });
  } catch (error) {
    console.error("API Admin Reviews PUT Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: "Review ID is required" }, { status: 400 });
    }

    await runDb(
      () => prisma.review.delete({ where: { id } }),
      () => {
        // Fallback: delete from products.json reviews array
        if (fs.existsSync(PRODUCTS_FILE)) {
          const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
          products.forEach((p: any) => {
            if (p.reviews) {
              p.reviews = p.reviews.filter((r: any) => r.id !== id);
            }
          });
          fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
        }
      }
    );

    const user = await getCurrentUser();
    await dbService.createAuditLog({
      userId: user?.id,
      action: "REVIEW_DELETE",
      details: `Admin ${user?.email} deleted review ID ${id}.`
    });

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("API Admin Reviews DELETE Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
