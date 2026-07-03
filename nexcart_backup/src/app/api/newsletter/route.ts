import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ message: "A valid email address is required" }, { status: 400 });
    }

    const res = await dbService.subscribeNewsletter(email);
    
    if ((res as any).alreadySubscribed) {
      return NextResponse.json({ success: true, message: "You are already subscribed to our newsletter!" });
    }

    return NextResponse.json({ success: true, message: "Thank you for subscribing to NexCart!" });
  } catch (error) {
    console.error("API Newsletter Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
