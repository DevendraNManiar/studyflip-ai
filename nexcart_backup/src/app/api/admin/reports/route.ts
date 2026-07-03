import { NextRequest, NextResponse } from 'next/server';
import { compileReportData, convertToCSV } from '@/lib/reportHelper';
import { isAdmin } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'daily';
    const format = searchParams.get('format') || 'json';

    if (range !== 'daily' && range !== 'weekly' && range !== 'monthly') {
      return NextResponse.json({ message: "Invalid range parameter. Use 'daily', 'weekly', or 'monthly'" }, { status: 400 });
    }

    const report = await compileReportData(range);

    if (format === 'csv') {
      const csvContent = convertToCSV(report);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="nexcart_${range}_report_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("API Admin Reports GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
