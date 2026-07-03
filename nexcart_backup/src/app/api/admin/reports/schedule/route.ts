import { NextRequest, NextResponse } from 'next/server';
import { compileReportData, convertToCSV } from '@/lib/reportHelper';
import { sendEmail } from '@/lib/email';
import { isAdmin } from '@/lib/authHelper';

export async function POST(req: NextRequest) {
  return handleTrigger(req);
}

export async function GET(req: NextRequest) {
  return handleTrigger(req);
}

async function handleTrigger(req: NextRequest) {
  try {
    // Check Authorization
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const customHeader = req.headers.get('x-cron-secret');
    
    let isAuthorized = false;
    
    if (cronSecret) {
      if (authHeader === `Bearer ${cronSecret}` || customHeader === cronSecret) {
        isAuthorized = true;
      }
    }
    
    // Fallback to Admin session verification
    if (!isAuthorized) {
      const admin = await isAdmin();
      if (admin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized: Invalid token or admin session required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'daily';

    if (range !== 'daily' && range !== 'weekly' && range !== 'monthly') {
      return NextResponse.json({ message: "Invalid range parameter. Use 'daily', 'weekly', or 'monthly'" }, { status: 400 });
    }

    // Compile report data
    const report = await compileReportData(range);
    const csvContent = convertToCSV(report);

    // Prepare email parameters
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nexcart.luxury';
    const subject = `NexCart Luxury E-Commerce: ${range.toUpperCase()} Sales Report Digest`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #d4af37; padding-bottom: 8px;">
          ${range.toUpperCase()} SALES REPORT DIGEST
        </h2>
        <p style="font-size: 14px; color: #71717a;">
          Here is your automated luxury sales activity digest for the period starting <strong>${report.startDate.toLocaleString()}</strong> to <strong>${report.endDate.toLocaleString()}</strong>.
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em;">
            Key Performance Indicators
          </h3>
          
          <table style="width: 100%; font-size: 13px; border-collapse: collapse; line-height: 2;">
            <tr>
              <td style="color: #71717a;">Total Orders Placed:</td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">${report.totalOrders}</td>
            </tr>
            <tr>
              <td style="color: #71717a;">Completed Sales Volume:</td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">${report.completedOrdersCount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7; padding-bottom: 8px;">
              <td style="color: #71717a;">Average Order Value (AOV):</td>
              <td style="text-align: right; font-weight: 700; color: #d4af37;">$${report.averageOrderValue.toFixed(2)}</td>
            </tr>
            <tr style="padding-top: 8px;">
              <td style="color: #71717a;">Total Discounts Applied:</td>
              <td style="text-align: right; font-weight: 700; color: #ef4444;">-$${report.totalDiscounts.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #71717a;">Total Taxes Collected (18% inc):</td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">$${report.totalTaxes.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #71717a;">Total Logistics Shipping:</td>
              <td style="text-align: right; font-weight: 700; color: #0f172a;">$${report.totalShipping.toFixed(2)}</td>
            </tr>
            <tr style="font-size: 16px; border-top: 2px solid #0f172a; font-weight: 700;">
              <td style="padding-top: 8px; color: #0f172a;">Gross Revenue Captured:</td>
              <td style="padding-top: 8px; text-align: right; color: #d4af37;">$${report.totalRevenue.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; text-transform: uppercase;">
          Recent Orders In Scope (${report.orders.slice(0, 5).length} shown)
        </h3>
        ${report.orders.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 1px solid #e4e4e7; color: #71717a; text-transform: uppercase; font-weight: 700; font-size: 10px;">
                <th style="padding: 8px 0;">Order #</th>
                <th style="padding: 8px 0;">Customer Email</th>
                <th style="padding: 8px 0;">Status</th>
                <th style="padding: 8px 0; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${report.orders.slice(0, 5).map(o => `
                <tr style="border-bottom: 1px dashed #e4e4e7;">
                  <td style="padding: 8px 0; font-family: monospace;">${o.orderNumber}</td>
                  <td style="padding: 8px 0; color: #3f3f46;">${o.customerEmail}</td>
                  <td style="padding: 8px 0;"><span style="font-weight: 600;">${o.status}</span></td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #d4af37;">$${o.totalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${report.orders.length > 5 ? `<p style="font-size: 12px; color: #a1a1aa; font-style: italic; margin-bottom: 24px;">And ${report.orders.length - 5} other order entries... (Full details available in CSV attachment)</p>` : ''}
        ` : `<p style="font-size: 13px; color: #a1a1aa; font-style: italic; margin-bottom: 24px;">No transactions recorded during this period.</p>`}

        <p style="font-size: 12px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 16px; font-style: italic;">
          This is an automated administrative notification dispatched by the NexCart E-Commerce Cron Service. The full spreadsheet database is attached as <code>nexcart_${range}_report.csv</code>.
        </p>
      </div>
    `;

    const emailSent = await sendEmail({
      to: adminEmail,
      subject,
      html: htmlBody,
      attachments: [
        {
          filename: `nexcart_${range}_report_${new Date().toISOString().slice(0, 10)}.csv`,
          content: csvContent,
        }
      ]
    });

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Report compiled and emailed successfully to ${adminEmail}`,
        metrics: {
          totalOrders: report.totalOrders,
          totalRevenue: report.totalRevenue
        }
      });
    } else {
      return NextResponse.json({ message: "Failed to dispatch email digest" }, { status: 500 });
    }
  } catch (error) {
    console.error("API Admin Reports Schedule Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
