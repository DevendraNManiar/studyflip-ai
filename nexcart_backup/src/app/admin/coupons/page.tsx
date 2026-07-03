'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Tag, AlertCircle } from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    code: '',
    discount: '',
    isFlat: 'false',
    expiryDate: '',
    usageLimit: '100'
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons);
      }
    } catch (e) {
      console.error("Failed to load coupons log", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddModal = () => {
    setForm({
      code: '',
      discount: '',
      isFlat: 'false',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // Default 7 days
      usageLimit: '100'
    });
    setFormError('');
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon code?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons(coupons.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error("Delete coupon request failed", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const { code, discount, isFlat, expiryDate, usageLimit } = form;
    if (!code || !discount || !expiryDate) {
      setFormError("Code, discount amount, and expiration date are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          discount: parseFloat(discount),
          isFlat: isFlat === 'true',
          expiryDate: new Date(expiryDate).toISOString(),
          usageLimit: parseInt(usageLimit)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOpen(false);
        fetchCoupons();
      } else {
        setFormError(data.message || "Failed to create coupon.");
      }
    } catch (err) {
      setFormError("Server connection failed.");
    } finally {
      setSubmitting(false);
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
          <h1 className="text-xl font-bold font-display">Coupons Control</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Generate and control promotional coupons, usage boundaries, and expiration limits.</p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-full bg-accent text-accent-foreground px-5 py-2 text-xs font-bold hover:opacity-95 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Promo Coupon
        </button>
      </div>

      {/* Coupons Table List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider pb-3 bg-secondary/15">
                <th className="py-3 px-4">Coupon Code</th>
                <th>Discount Details</th>
                <th>Type</th>
                <th>Expirations</th>
                <th>Usage Details</th>
                <th>Active Status</th>
                <th className="text-right px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/10">
                  <td className="py-3.5 px-4 font-bold font-display text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-accent" />
                    {c.code}
                  </td>
                  <td className="font-semibold text-foreground">
                    {c.isFlat ? `$${c.discount}` : `${c.discount}%`}
                  </td>
                  <td>{c.isFlat ? 'Flat rate' : 'Percentage'}</td>
                  <td>{new Date(c.expiryDate).toLocaleDateString()}</td>
                  <td>{c.usageCount} / {c.usageLimit} checkouts</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${c.isActive ? 'bg-green-500/10 text-green-600' : 'bg-neutral-500/10 text-neutral-600'}`}>
                      {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="text-right px-4">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 border border-border rounded hover:bg-secondary text-destructive inline-flex items-center gap-1"
                      aria-label="Delete coupon"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE COUPON MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200">
            
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-sm font-bold font-display">Generate Promo Coupon</h2>
              <button onClick={() => setIsOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Coupon Promo Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="E.g., LUXURY50"
                  className="w-full rounded border border-border bg-card px-3 py-2 uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Discount Magnitude *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    placeholder="15"
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Discount Type *</label>
                  <select
                    value={form.isFlat}
                    onChange={(e) => setForm({ ...form, isFlat: e.target.value })}
                    className="w-full rounded border border-border bg-card px-3 py-2"
                  >
                    <option value="false">Percentage (%)</option>
                    <option value="true">Flat Discount ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Expiration Date *</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full rounded border border-border bg-card px-3 py-2 text-center"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Usage Checkouts Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full rounded border border-border bg-card px-3 py-2"
                  />
                </div>
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
                  {submitting ? "Generating..." : "Generate Coupon"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
