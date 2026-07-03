'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Image, AlertCircle } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    description: '',
    image: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (e) {
      console.error("Failed to fetch categories list", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setForm({
      name: '',
      description: '',
      image: ''
    });
    setFormError('');
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const { name, description, image } = form;
    if (!name) {
      setFormError("Category segment title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, image })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOpen(false);
        fetchData();
      } else {
        setFormError(data.message || "Failed to save category.");
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
          <h1 className="text-xl font-bold font-display">Store Categories</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Manage the segments and catalog organization layout of NexCart.</p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-full bg-accent text-accent-foreground px-5 py-2 text-xs font-bold hover:opacity-95 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col justify-between shadow-sm">
            <div className="relative h-48 bg-neutral-100">
              <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Segment Segment</p>
                <h3 className="text-sm font-bold font-display">{c.name}</h3>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">{c.description || 'No description provided.'}</p>
              <div className="text-[10px] text-muted-foreground pt-3 border-t border-border/50">
                Created: {new Date(c.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE CATEGORY MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200">
            
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-sm font-bold font-display">Create Store Category</h2>
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
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Category Title *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="E.g., Timepieces, Leather Goods"
                  className="w-full rounded border border-border bg-card px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
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
                  placeholder="Summarize the core theme of this catalog category..."
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
                  {submitting ? "Creating..." : "Create Category"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
