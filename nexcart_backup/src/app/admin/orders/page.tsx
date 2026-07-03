'use client';

import React, { useState, useEffect } from 'react';
import { Edit2, ShieldAlert, Loader2, RefreshCw, CheckCircle } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Modal edit states
  const [isOpen, setIsOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [form, setForm] = useState({
    status: '',
    trackingNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Failed to load admin orders log", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openStatusModal = (order: any) => {
    setActiveOrder(order);
    setForm({
      status: order.status,
      trackingNumber: order.trackingNumber || ''
    });
    setIsOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${activeOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          trackingNumber: form.trackingNumber
        })
      });
      if (res.ok) {
        setIsOpen(false);
        fetchOrders();
      }
    } catch (e) {
      console.error("Failed to update order details", e);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'PAID': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'PROCESSING': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'SHIPPED': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'DELIVERED': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      default: return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl font-bold font-display">Order Management</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Track shipping consignments, verify captured payments, and update tracking references.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 border border-border rounded-full hover:bg-secondary text-foreground"
          aria-label="Refresh Order List"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Orders List Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider pb-3 bg-secondary/15">
                <th className="py-3 px-4">Order Ref</th>
                <th>Purchaser Email</th>
                <th>Fulfillment Status</th>
                <th>Consignment Speed</th>
                <th>Tracking ID</th>
                <th>Captured Total</th>
                <th className="text-right px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-secondary/10">
                  <td className="py-3.5 px-4 font-bold font-display text-foreground">{o.orderNumber}</td>
                  <td className="truncate max-w-[150px]">{o.user?.email || 'Guest Client'}</td>
                  <td>
                    <span className={`border rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="font-semibold text-muted-foreground">
                    {o.shippingCost === 35 ? 'Express Air' : 'Standard Air'}
                  </td>
                  <td className="font-mono">{o.trackingNumber || 'Not Dispatched'}</td>
                  <td className="font-bold text-accent">${o.totalAmount.toFixed(2)}</td>
                  <td className="text-right px-4">
                    <button
                      onClick={() => openStatusModal(o)}
                      className="p-1.5 border border-border rounded hover:bg-secondary text-foreground inline-flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Adjust Fulfill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* fulFillment adjustment modal */}
      {isOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200">
            
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Consignment: {activeOrder.orderNumber}</p>
                <h2 className="text-sm font-bold font-display">Fulfilment Adjustments</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Close
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Fulfilment Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded border border-border bg-card px-3 py-2"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Carrier Tracking Reference</label>
                <input
                  type="text"
                  value={form.trackingNumber}
                  onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
                  placeholder="E.g., TRK8420021"
                  className="w-full rounded border border-border bg-card px-3 py-2 font-mono uppercase"
                />
              </div>

              <div className="bg-secondary/40 border border-border rounded-xl p-3.5 flex items-start gap-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Updating states triggers automated transactional emails if key services are active, updating clients immediately.
                </p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 rounded-full border border-border py-2.5 text-xs font-bold hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 rounded-full bg-foreground text-background py-2.5 text-xs font-bold hover:bg-foreground/90 transition-all"
                >
                  {submitting ? "Updating..." : "Save Adjustments"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
