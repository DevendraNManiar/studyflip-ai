'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Image, Check, AlertCircle } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null); // Null for 'Add Product' mode
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    price: '',
    discountPrice: '',
    sku: '',
    categoryId: '',
    brandId: '',
    stock: '',
    description: '',
    images: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/brands')
      ]);
      
      const pData = await prodRes.json();
      setProducts(pData.products);

      const cData = await catRes.json();
      setCategories(cData.categories);

      const bData = await brandRes.json();
      setBrands(bData.brands || []);
    } catch (e) {
      console.error("Failed to load products page data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditProduct(null);
    setForm({
      name: '',
      price: '',
      discountPrice: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      categoryId: categories[0]?.id || '',
      brandId: brands[0]?.id || '',
      stock: '10',
      description: '',
      images: ''
    });
    setFormError('');
    setIsOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      price: product.price.toString(),
      discountPrice: product.discountPrice ? product.discountPrice.toString() : '',
      sku: product.sku,
      categoryId: product.categoryId,
      brandId: product.brandId,
      stock: product.stock.toString(),
      description: product.description,
      images: product.images.join(', ')
    });
    setFormError('');
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product? This action is irreversible.")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error("Delete product request failed", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const { name, price, discountPrice, sku, categoryId, brandId, stock, description, images } = form;
    if (!name || !price || !sku || !categoryId || !brandId || !stock || !description) {
      setFormError("Please populate all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        sku,
        categoryId,
        brandId,
        stock: parseInt(stock),
        description,
        images: images ? images.split(',').map(s => s.trim()) : []
      };

      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsOpen(false);
        fetchData(); // Reload list
      } else {
        setFormError(data.message || "Failed to save product.");
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
      
      {/* Page header and controls */}
      <div className="flex justify-between items-center border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl font-bold font-display">Products Catalog</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Directly update pricing, stock, descriptions, and catalog alignments.</p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-full bg-accent text-accent-foreground px-5 py-2 text-xs font-bold hover:opacity-95 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Premium Product
        </button>
      </div>

      {/* Products list grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider pb-3 bg-secondary/15">
                <th className="py-3 px-4">Thumbnail</th>
                <th>Product Details</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Inventory</th>
                <th className="text-right px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/10">
                  <td className="py-3.5 px-4 shrink-0">
                    <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover border border-border bg-muted" />
                  </td>
                  <td className="font-bold font-display text-foreground max-w-xs truncate pr-4">
                    {p.name}
                  </td>
                  <td className="font-semibold text-muted-foreground">{p.sku}</td>
                  <td>{p.category?.name || 'Unassigned'}</td>
                  <td>
                    {p.discountPrice ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">${p.discountPrice}</span>
                        <span className="text-[10px] text-muted-foreground line-through">${p.price}</span>
                      </div>
                    ) : (
                      <span className="font-bold">${p.price}</span>
                    )}
                  </td>
                  <td className={`font-semibold ${p.stock < 10 ? 'text-red-500 font-bold' : ''}`}>
                    {p.stock} units
                  </td>
                  <td className="text-right px-4 whitespace-nowrap space-x-1.5">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 border border-border rounded hover:bg-secondary text-foreground inline-flex items-center gap-1"
                      aria-label="Edit product"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 border border-border rounded hover:bg-secondary text-destructive inline-flex items-center gap-1"
                      aria-label="Delete product"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD DIALOG MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-background border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
            
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-sm font-bold font-display">
                {editProduct ? `Edit "${editProduct.name}"` : "Add Premium Product"}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Product Title *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="E.g., Aero Watch Pro Smart Wearable"
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="799.00"
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Special Discount Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                    placeholder="749.00"
                    className="w-full rounded border border-border bg-card px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Stock SKU *</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full rounded border border-border bg-card px-3 py-2 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Inventory Stock Count *</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Category Segment *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Brand Curation *</label>
                  <select
                    value={form.brandId}
                    onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  >
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Image URLs (comma separated)</label>
                  <input
                    type="text"
                    value={form.images}
                    onChange={(e) => setForm({ ...form, images: e.target.value })}
                    placeholder="https://images.unsplash.com/..., https://..."
                    className="w-full rounded border border-border bg-card px-3 py-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Description *</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the features, materials, and premium craft of this item..."
                    className="w-full rounded border border-border bg-card p-3"
                    required
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
                  className="w-1/2 rounded-full bg-foreground text-background py-2.5 text-xs font-bold hover:bg-foreground/90 transition-all flex items-center justify-center gap-1"
                >
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
