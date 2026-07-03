import { dbService } from './dbWrapper';

export interface ReportData {
  range: string;
  startDate: Date;
  endDate: Date;
  totalOrders: number;
  completedOrdersCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalDiscounts: number;
  totalTaxes: number;
  totalShipping: number;
  orders: any[];
}

export async function compileReportData(range: string): Promise<ReportData> {
  const endDate = new Date();
  const startDate = new Date();
  
  if (range === 'weekly') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (range === 'monthly') {
    startDate.setDate(endDate.getDate() - 30);
  } else {
    // Default daily (last 24 hours)
    startDate.setDate(endDate.getDate() - 1);
  }

  const allOrders = await dbService.getOrders();
  const allUsers = await dbService.getUsers();
  const userMap = new Map(allUsers.map((u: any) => [u.id, u]));

  // Filter orders in range
  const rangeOrders = allOrders.filter((order: any) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && orderDate <= endDate;
  });

  // Calculate metrics
  const completedOrders = rangeOrders.filter((o: any) => 
    o.status === 'PAID' || 
    o.status === 'PROCESSING' || 
    o.status === 'SHIPPED' || 
    o.status === 'DELIVERED'
  );

  const completedOrdersCount = completedOrders.length;
  const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
  const averageOrderValue = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;
  const totalDiscounts = completedOrders.reduce((sum: number, o: any) => sum + (o.discountAmount || 0), 0);
  const totalTaxes = completedOrders.reduce((sum: number, o: any) => sum + (o.taxAmount || 0), 0);
  const totalShipping = completedOrders.reduce((sum: number, o: any) => sum + (o.shippingCost || 0), 0);

  const formattedOrders = rangeOrders.map((order: any) => {
    const user = userMap.get(order.userId) as any;
    const payment = (order as any).payments?.[0] || (order as any).payment;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customerName: user?.name || 'Guest Customer',
      customerEmail: user?.email || 'N/A',
      status: order.status,
      itemsCount: order.items?.reduce((sum: number, it: any) => sum + it.quantity, 0) || 0,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount || 0,
      taxAmount: order.taxAmount || 0,
      shippingCost: order.shippingCost || 0,
      paymentMethod: payment?.paymentMethod || 'MOCK',
      transactionId: payment?.transactionId || 'N/A',
    };
  });

  return {
    range,
    startDate,
    endDate,
    totalOrders: rangeOrders.length,
    completedOrdersCount,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    totalDiscounts: Number(totalDiscounts.toFixed(2)),
    totalTaxes: Number(totalTaxes.toFixed(2)),
    totalShipping: Number(totalShipping.toFixed(2)),
    orders: formattedOrders,
  };
}

export function convertToCSV(report: ReportData): string {
  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Customer Email',
    'Status',
    'Items Count',
    'Discounts ($)',
    'Taxes ($)',
    'Shipping ($)',
    'Total Amount ($)',
    'Payment Method',
    'Transaction ID'
  ];

  const rows = report.orders.map(o => [
    o.orderNumber,
    o.createdAt,
    o.customerName,
    o.customerEmail,
    o.status,
    o.itemsCount,
    o.discountAmount,
    o.taxAmount,
    o.shippingCost,
    o.totalAmount,
    o.paymentMethod,
    o.transactionId
  ]);

  const csvRows = [
    [`NexCart E-Commerce ${report.range.toUpperCase()} Sales Report`],
    [`Period: ${report.startDate.toISOString()} to ${report.endDate.toISOString()}`],
    [],
    [`Summary Metrics`],
    [`Metric`, `Value`],
    [`Total Orders Placed`, report.totalOrders],
    [`Completed Sales Volume`, report.completedOrdersCount],
    [`Total Revenue`, `$${report.totalRevenue}`],
    [`Average Order Value`, `$${report.averageOrderValue}`],
    [`Total Discounts Applied`, `$${report.totalDiscounts}`],
    [`Total Taxes Collected`, `$${report.totalTaxes}`],
    [`Total Logistics Shipping`, `$${report.totalShipping}`],
    [],
    [`Order Details`],
    headers,
    ...rows
  ];

  return csvRows
    .map(row => row.map(val => {
      const stringVal = String(val ?? '');
      // Escape double quotes and wrap in quotes if contains comma, quote, or newline
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    }).join(','))
    .join('\n');
}
