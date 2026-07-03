'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Download, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function CustomerOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        }
      } catch (e) {
        console.error("Failed to load user orders list", e);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchUserOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const generateInvoicePDF = (order: any) => {
    const doc = new jsPDF();
    
    // Header banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("NEXCART INVOICE", 15, 26);
    
    // Invoice meta
    doc.setTextColor(60, 60, 60);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${order.orderNumber}`, 140, 18);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 24);
    doc.text(`Tracking ID: ${order.trackingNumber || 'Pending Dispatch'}`, 140, 30);
    
    // Billing Details
    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DELIVERED TO:", 15, 55);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    // Parse address details or use standard fallback
    doc.text(user?.name || "Customer Client", 15, 61);
    doc.text(order.shippingAddress.split(',')[1]?.trim() || order.shippingAddress, 15, 67);
    doc.text(order.shippingAddress.split(',')[2]?.trim() || '', 15, 73);

    // Merchant details
    doc.setFont("Helvetica", "bold");
    doc.text("NEXCART LOGISTICS CENTRE:", 115, 55);
    doc.setFont("Helvetica", "normal");
    doc.text("NexCart Luxury Technologies Inc.", 115, 61);
    doc.text("One Infinite Loop, Suite 200", 115, 67);
    doc.text("Cupertino, CA 95014", 115, 73);
    doc.text("concierge@nexcart.luxury", 115, 79);

    // Items table header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 90, 180, 8, 'F');
    doc.setFont("Helvetica", "bold");
    doc.text("Item Details", 18, 95);
    doc.text("Qty", 125, 95);
    doc.text("Unit Price", 145, 95);
    doc.text("Total", 175, 95);
    
    let y = 105;
    doc.setFont("Helvetica", "normal");
    
    order.items.forEach((item: any) => {
      doc.text(item.name.substring(0, 50), 18, y);
      doc.text(item.quantity.toString(), 125, y);
      doc.text(`$${item.price.toFixed(2)}`, 145, y);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 175, y);
      y += 12;
    });

    y += 4;
    doc.line(15, y, 195, y);
    y += 8;

    // Totals
    doc.text("Subtotal", 130, y);
    doc.text(`$${(order.totalAmount - order.shippingCost).toFixed(2)}`, 175, y);
    y += 6;
    doc.text("VAT inclusive (18% code)", 130, y);
    doc.text(`$${order.taxAmount.toFixed(2)}`, 175, y);
    y += 6;
    doc.text("Shipping logistics speed", 130, y);
    doc.text(`$${order.shippingCost.toFixed(2)}`, 175, y);
    
    if (order.discountAmount > 0) {
      y += 6;
      doc.setTextColor(34, 197, 94); // Green
      doc.text(`Discount applied`, 130, y);
      doc.text(`-$${order.discountAmount.toFixed(2)}`, 175, y);
      doc.setTextColor(15, 23, 42);
    }
    
    y += 10;
    doc.line(125, y - 4, 195, y - 4);
    doc.setFont("Helvetica", "bold");
    doc.text("Total amount paid", 130, y);
    doc.text(`$${order.totalAmount.toFixed(2)}`, 175, y);

    // Footer signature
    y += 24;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Thank you for choosing NexCart. This is a secure digital invoice certificate.", 15, y);

    doc.save(`NexCart_Invoice_${order.orderNumber}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'PAID': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'PROCESSING': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'SHIPPED': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
      case 'DELIVERED': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      default: return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h2 className="text-lg font-bold font-display">Log In to View Orders</h2>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm">Please log in to your registered customer account to track purchases.</p>
        <Link
          href="/login?redirect=/orders"
          className="mt-6 rounded-full bg-foreground text-background px-8 py-3 text-xs font-bold hover:bg-foreground/90 transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8">
      
      <div className="border-b border-border pb-4">
        <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Client Area</span>
        <h1 className="text-2xl font-bold mt-1 font-display">My Purchase History</h1>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((o) => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
              
              {/* Order Meta row */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/60">
                <div className="space-y-1">
                  <p className="text-xs font-bold font-display text-foreground">{o.orderNumber}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Ordered: {new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${getStatusColor(o.status)}`}>
                    {o.status}
                  </span>
                  <button
                    onClick={() => generateInvoicePDF(o)}
                    className="p-2 border border-border rounded-full hover:bg-secondary text-foreground inline-flex items-center gap-1 text-[10px] font-bold transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF Invoice
                  </button>
                </div>
              </div>

              {/* Items Summary list */}
              <div className="divide-y divide-border/40">
                {o.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center py-2.5 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      {item.variant && <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Option: {item.variant}</p>}
                    </div>
                    <div className="text-right whitespace-nowrap pl-4">
                      <span className="text-muted-foreground">{item.quantity} x </span>
                      <span className="font-bold">${item.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Courier tracking segment */}
              <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-muted-foreground">
                <div>
                  {o.trackingNumber ? (
                    <p>Logistics Carrier Code: <span className="font-mono font-bold text-foreground text-xs uppercase">{o.trackingNumber}</span></p>
                  ) : (
                    <p>Consignment status: <span className="font-bold text-foreground">Processing at logistics center</span></p>
                  )}
                </div>
                <p className="font-bold text-foreground text-xs">Total Captured: <span className="text-accent">${o.totalAmount.toFixed(2)}</span></p>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Zero orders placeholder */
        <div className="text-center py-20 border border-border bg-card rounded-2xl p-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-4 animate-bounce" />
          <h3 className="text-sm font-bold text-foreground font-display font-semibold">No orders placed yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
            You haven't checked out any items. Check our collections page to purchase items.
          </p>
          <Link
            href="/search"
            className="inline-block mt-6 rounded-full bg-foreground text-background px-6 py-2 text-xs font-bold hover:bg-foreground/90 transition-all"
          >
            Explore Collections
          </Link>
        </div>
      )}

    </div>
  );
}
