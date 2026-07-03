import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { getCurrentUser } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    const reviews = await dbService.getReviewsByProductId(productId);
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("API Reviews GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Login required" }, { status: 401 });
    }

    const { productId, rating, comment } = await req.json();

    if (!productId || !rating || !comment) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const parsedRating = parseInt(rating);
    if (parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ message: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const review = await dbService.createReview({
      userId: user.id,
      userName: user.name || "Customer",
      userImage: user.image,
      productId,
      rating: parsedRating,
      comment
    });

    await dbService.createAuditLog({
      userId: user.id,
      action: "REVIEW_CREATE",
      details: `User ${user.email} reviewed product ID ${productId} with ${rating} stars.`
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error("API Reviews POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
