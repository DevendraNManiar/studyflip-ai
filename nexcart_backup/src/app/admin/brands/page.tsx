'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    description: '',
    logo: ''
  });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || []);
      }
    } catch (e) {
      console.error("Failed to load brands catalog list", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const openAddModal = () => {
    setForm({
      name: '',
      description: '',
      logo: ''
    });
    setFormError('');
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const { name, description, logo } = form;
    if (!name) {
      setFormError("Brand curation title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, logo })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOpen(false);
        fetchBrands();
      } else {
        setFormError(data.message || "Failed to save brand.");
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
          <h1 className="text-xl font-bold font-display">Brands Curation</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Configure luxury brand alignments and descriptions for the NexCart collections.</p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-full bg-accent text-accent-foreground px-5 py-2 text-xs font-bold hover:opacity-95 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Premium Brand
        </button>
      </div>

      {/* Brand lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center font-bold text-accent text-lg font-display uppercase">
                {b.logo ? (
                  <img src={b.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  b.name.substring(0, 2)
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold font-display">{b.name}</h3>
                <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Curation Alignment</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">{b.description || 'No description provided.'}</p>
            <div className="text-[10px] text-muted-foreground pt-3 border-t border-border/50">
              Identifier: {b.slug}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE BRAND MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200">
            
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-sm font-bold font-display">Create Curation Brand</h2>
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="E.g., Aero Studio, Chronos Legacy"
                  className="w-full rounded border border-border bg-card px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Logo URL</label>
                <input
                  type="text"
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded border border-border bg-card px-3 py-2"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summarize the brand history, target audience, and craftsmanship..."
                  className="w-full rounded border border-border bg-card p-3"
                />
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
                  {submitting ? "Creating..." : "Create Brand"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
