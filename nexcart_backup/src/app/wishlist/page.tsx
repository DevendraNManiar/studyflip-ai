'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load wishlist on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexcart-wishlist');
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
    setMounted(true);
  }, []);

  const removeFromWishlist = (id: string) => {
    const updated = wishlist.filter(p => p.id !== id);
    setWishlist(updated);
    localStorage.setItem('nexcart-wishlist', JSON.stringify(updated));
  };

  const handleMoveToCart = (prod: any) => {
    addToCart(prod, 1);
    removeFromWishlist(prod.id);
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
      
      <div className="border-b border-border pb-4 mb-8">
        <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Favorites</span>
        <h1 className="text-2xl font-bold mt-1 font-display">My Wishlist</h1>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((prod) => (
            <div key={prod.id} className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
              
              <Link href={`/products/${prod.slug}`} className="relative h-60 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
              </Link>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[9px] font-semibold text-muted-foreground tracking-widest uppercase">{prod.category?.name || 'Luxury'}</span>
                  <h3 className="text-xs font-bold tracking-tight mt-1 hover:text-accent font-display line-clamp-1">
                    <Link href={`/products/${prod.slug}`}>{prod.name}</Link>
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{prod.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-xs font-bold">${prod.price}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(prod)}
                      className="rounded-full bg-foreground text-background px-4 py-1.5 text-[10px] font-bold hover:bg-foreground/90 flex items-center gap-1 transition-all"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      Add to Bag
                    </button>
                    <button
                      onClick={() => removeFromWishlist(prod.id)}
                      className="p-1.5 border border-border rounded-full hover:bg-secondary text-destructive transition-all"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Empty wishlist state */
        <div className="text-center py-20 border border-border bg-card rounded-2xl p-6">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h2 className="text-sm font-bold text-foreground font-display">Your wishlist is empty</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
            Review our collections catalog and click the wishlist button to save items for future purchases.
          </p>
          <Link
            href="/search"
            className="inline-block mt-8 rounded-full bg-foreground text-background px-8 py-3 text-xs font-bold hover:bg-foreground/90 transition-all"
          >
            Explore Collections
          </Link>
        </div>
      )}

    </div>
  );
}
