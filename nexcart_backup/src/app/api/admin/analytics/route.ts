import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/dbWrapper';
import { isAdmin } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const orders = await dbService.getOrders();
    const users = await dbService.getUsers();
    const products = await dbService.getProducts();

    // 1. Calculate General KPI Metrics
    const customersCount = users.filter((u: any) => u.role === 'CUSTOMER').length;
    const completedOrders = orders.filter((o: any) => o.status === 'PAID' || o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'DELIVERED');
    const totalSales = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
    const averageOrderValue = totalSales > 0 ? Number((totalRevenue / totalSales).toFixed(2)) : 0;
    
    // Conversion rate simulation (customers vs total orders place attempts)
    const conversionRate = customersCount > 0 ? Number(((totalSales / (customersCount * 1.5)) * 100).toFixed(1)) : 0;

    // 2. Sales Timeline Data (e.g. past 7 days)
    const past7DaysData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      const daysOrders = completedOrders.filter((o: any) => (o.createdAt as string).slice(0, 10) === dateStr);
      const revenue = daysOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
      
      return {
        date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        revenue: Number(revenue.toFixed(2)),
        sales: daysOrders.length
      };
    }).reverse();

    // 3. Top Products Sold (mocking volume based on orders items)
    const productSalesMap: Record<string, { name: string; sales: number; revenue: number; price: number; stock: number }> = {};
    
    // Seed with existing products
    products.forEach((p: any) => {
      productSalesMap[p.id] = {
        name: p.name,
        sales: 0,
        revenue: 0,
        price: p.discountPrice || p.price,
        stock: p.stock
      };
    });

    completedOrders.forEach((o: any) => {
      o.items.forEach((item: any) => {
        if (productSalesMap[item.productId]) {
          productSalesMap[item.productId].sales += item.quantity;
          productSalesMap[item.productId].revenue += item.price * item.quantity;
        } else {
          productSalesMap[item.productId] = {
            name: item.name,
            sales: item.quantity,
            revenue: item.price * item.quantity,
            price: item.price,
            stock: 0
          };
        }
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        revenue: Number(p.revenue.toFixed(2))
      }));

    // 4. Category share distribution
    const categoryShareMap: Record<string, number> = {};
    completedOrders.forEach((o: any) => {
      o.items.forEach((item: any) => {
        const prod = products.find((p: any) => p.id === item.productId);
        const catName = prod?.category?.name || "Other";
        categoryShareMap[catName] = (categoryShareMap[catName] || 0) + (item.price * item.quantity);
      });
    });

    const categoryDistribution = Object.entries(categoryShareMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));

    return NextResponse.json({
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalSales,
        customersCount,
        averageOrderValue,
        conversionRate: Math.min(conversionRate, 100)
      },
      timeline: past7DaysData,
      topProducts,
      categoryDistribution
    });
  } catch (error) {
    console.error("API Admin Analytics Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
