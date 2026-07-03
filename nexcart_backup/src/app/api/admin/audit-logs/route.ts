import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { isAdmin } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const auditLogs = await dbService.getAuditLogs();
    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error("API Admin Audit Logs GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
