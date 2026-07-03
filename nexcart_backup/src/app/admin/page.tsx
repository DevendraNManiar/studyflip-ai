'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingCart, UserCheck, Percent, Download, Loader2, ArrowRight } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (e) {
        console.error("Failed to load analytics data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  // PDF report compilation
  const exportPDFReport = (type: 'Daily' | 'Weekly' | 'Monthly') => {
    if (!data) return;
    const doc = new jsPDF();
    
    // Title Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text(`NEXCART - ${type.toUpperCase()} SALES REPORT`, 15, 26);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Generated Date: ${new Date().toLocaleString()}`, 15, 34);
    
    // Core KPIs
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("CORE METRICS SUMMARY", 15, 60);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Total Accumulated Revenue: $${data.metrics.totalRevenue.toFixed(2)}`, 15, 70);
    doc.text(`Captured Sales Volume: ${data.metrics.totalSales} checkouts`, 15, 78);
    doc.text(`Average Order Value (AOV): $${data.metrics.averageOrderValue.toFixed(2)}`, 15, 86);
    doc.text(`Customer Registrations: ${data.metrics.customersCount} users`, 15, 94);
    doc.text(`Simulated Conversion Rate: ${data.metrics.conversionRate}%`, 15, 102);

    // Top Selling Products header
    doc.setFont("Helvetica", "bold");
    doc.text("TOP 5 PERFORMING LUXURY CURATIONS", 15, 120);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 126, 180, 8, 'F');
    doc.text("Product Name", 18, 131);
    doc.text("Volume Sold", 130, 131);
    doc.text("Total Revenue", 160, 131);
    
    let y = 142;
    doc.setFont("Helvetica", "normal");
    data.topProducts.forEach((p: any, idx: number) => {
      doc.text(`${idx + 1}. ${p.name.substring(0, 45)}`, 18, y);
      doc.text(p.sales.toString(), 130, y);
      doc.text(`$${p.revenue.toFixed(2)}`, 160, y);
      y += 10;
    });

    y += 15;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.text("NexCart Administrative Report. Confidential. Powered by dbService adapter.", 15, y);

    doc.save(`NexCart_Sales_Report_${type}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // CSV Spreadsheet Export
  const exportCSVMetrics = () => {
    if (!data) return;
    
    const rows = [
      ["Metric", "Value"],
      ["Total Revenue", `$${data.metrics.totalRevenue}`],
      ["Total Sales Volume", data.metrics.totalSales],
      ["Customer Signups", data.metrics.customersCount],
      ["Average Order Value", `$${data.metrics.averageOrderValue}`],
      ["Conversion Rate (%)", `${data.metrics.conversionRate}%`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NexCart_Analytics_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const { metrics, timeline, topProducts, categoryDistribution } = data;

  const kpis = [
    { name: 'Total Revenue', value: `$${metrics.totalRevenue.toLocaleString()}`, icon: DollarSign, description: 'Accumulated captures' },
    { name: 'Sales Volume', value: metrics.totalSales, icon: ShoppingCart, description: 'Completed checkout orders' },
    { name: 'Average Order Value', value: `$${metrics.averageOrderValue}`, icon: UserCheck, description: 'Revenue per transaction' },
    { name: 'Conversion Rate', value: `${metrics.conversionRate}%`, icon: Percent, description: 'Signups vs transactions ratio' },
  ];

  const COLORS = ['#d4af37', '#71717a', '#3f3f46', '#18181b'];

  return (
    <div className="space-y-8">
      
      {/* Dashboard header and export controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl font-bold font-display">Administrative Analytics</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Real-time aggregate analytics monitoring NexCart metrics.</p>
        </div>

        {/* Report downloads dropdowns */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => exportPDFReport('Weekly')}
            className="rounded-full bg-accent text-accent-foreground px-4 py-2 text-[10px] font-bold hover:opacity-95 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> PDF Weekly Report
          </button>
          
          <button
            onClick={exportCSVMetrics}
            className="rounded-full border border-border bg-card px-4 py-2 text-[10px] font-bold text-foreground hover:bg-secondary flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV Sheet
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-card border border-border rounded-xl p-6 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{kpi.name}</span>
                <p className="text-xl font-bold font-display">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.description}</p>
              </div>
              <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center text-accent border border-border">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      {isMounted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Area Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">Revenue Timeline (Past 7 Days)</h3>
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category distribution pie */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Category Revenue Distribution</h3>
            {categoryDistribution.length > 0 ? (
              <div className="h-60 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-muted-foreground">No category sales record.</div>
            )}
            
            {/* Category legends */}
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-4 border-t border-border/60">
              {categoryDistribution.map((entry: any, idx: number) => (
                <div key={entry.name} className="flex items-center gap-1.5 font-semibold">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{entry.name} (${entry.value})</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Top Performing Collections */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">Top Selling Luxury Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground uppercase font-bold text-[10px] tracking-wider pb-3">
                <th className="py-2.5">Product Details</th>
                <th>Price</th>
                <th>Stock Quantity</th>
                <th>Units Sold</th>
                <th className="text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {topProducts.map((p: any) => (
                <tr key={p.name} className="hover:bg-secondary/20">
                  <td className="py-3.5 font-bold font-display text-foreground max-w-sm truncate">{p.name}</td>
                  <td>${p.price}</td>
                  <td className={p.stock < 10 ? 'text-red-500 font-bold' : ''}>{p.stock} units</td>
                  <td>{p.sales} checkouts</td>
                  <td className="text-right font-bold text-accent">${p.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
