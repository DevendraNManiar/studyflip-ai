'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Trash2, Loader2, Star, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error("Failed to load reviews list", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApprove = async (id: string, currentApproved: boolean) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: !currentApproved })
      });
      if (res.ok) {
        setReviews(reviews.map(r => r.id === id ? { ...r, isApproved: !currentApproved } : r));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (e) {
      console.error(e);
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
      <div className="flex justify-between items-center border-b border-border/80 pb-4">
        <div>
          <h1 className="text-xl font-bold font-display">Review Moderation</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Approve, deny, or remove user-submitted product ratings and commentary.</p>
        </div>
        <button
          onClick={fetchReviews}
          className="p-2 border border-border rounded-full hover:bg-secondary text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase font-bold text-[10px] tracking-wider pb-3 bg-secondary/15">
                <th className="py-3 px-4">Product</th>
                <th>Author</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th className="text-right px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/10">
                  <td className="py-4 px-4 font-bold font-display text-foreground max-w-xs truncate">
                    {r.product?.name || 'Unknown Product'}
                  </td>
                  <td>
                    <div className="font-semibold">{r.userName || r.user?.name || 'Customer'}</div>
                    <div className="text-[9px] text-muted-foreground">{r.user?.email || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="flex text-amber-500 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-current' : 'opacity-30'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="max-w-md truncate pr-4 text-muted-foreground italic">
                    "{r.comment}"
                  </td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${r.isApproved ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                      {r.isApproved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </td>
                  <td className="text-right px-4 space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleApprove(r.id, r.isApproved)}
                      className={`p-1.5 border rounded hover:bg-secondary text-foreground inline-flex items-center gap-1 font-semibold ${r.isApproved ? 'text-amber-600 border-amber-500/30' : 'text-green-600 border-green-500/30'}`}
                    >
                      {r.isApproved ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      {r.isApproved ? 'Revoke' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 border border-border rounded hover:bg-secondary text-destructive inline-flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {reviews.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No product reviews found.
          </div>
        )}
      </div>
    </div>
  );
}
