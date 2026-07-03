'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { Trash2, ShoppingBag, ArrowRight, Tag, X, ShieldAlert } from 'lucide-react';

export default function CartPage() {
  const {
    items,
    coupon,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    subtotal,
    taxAmount,
    shippingCost,
    discountAmount,
    totalAmount
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ success?: boolean; text?: string } | null>(null);
  const [submittingCoupon, setSubmittingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setSubmittingCoupon(true);
    setCouponMsg(null);
    
    const res = await applyCoupon(couponCode);
    setSubmittingCoupon(false);
    
    if (res.success) {
      setCouponMsg({ success: true, text: res.message });
      setCouponCode('');
    } else {
      setCouponMsg({ success: false, text: res.message });
    }
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
      
      <div className="border-b border-border pb-4 mb-8">
        <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Review Bag</span>
        <h1 className="text-2xl font-bold mt-1 font-display">Shopping Cart</h1>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Side: Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-border/80 transition-all"
              >
                {/* Item Thumbnail */}
                <div className="h-24 w-24 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-xs font-bold text-foreground truncate hover:text-accent font-display">
                    <Link href={`/products/${item.id.split('-')[0]}`}>{item.name}</Link>
                  </h3>
                  {item.variantValue && (
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      Option: {item.variantValue}
                    </p>
                  )}
                  <p className="text-xs font-bold text-foreground">${item.price}</p>
                </div>

                {/* Quantity adjustments */}
                <div className="flex items-center border border-border rounded-full bg-background px-1.5 py-0.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 hover:text-foreground text-muted-foreground"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 hover:text-foreground text-muted-foreground"
                  >
                    +
                  </button>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Right Side: Price Details & Coupon */}
          <div className="space-y-6">
            
            {/* Price Calculations */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Curation Summary</h3>
              
              <div className="text-xs space-y-2.5 pt-2 border-t border-border/60">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal Amount</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT / Sales Tax (18% rate)</span>
                  <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Logistics Courier (Free over $300)</span>
                  <span className="font-semibold">{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'Complimentary'}</span>
                </div>
                
                {coupon && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                    <span className="flex items-center gap-1">
                      Discount coupon ({coupon.code})
                    </span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold pt-4 border-t border-border/80">
                  <span>Grand Total</span>
                  <span className="text-accent">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout actions */}
              <div className="pt-4 space-y-3">
                <Link
                  href="/checkout"
                  className="w-full text-center block rounded-full bg-foreground text-background py-3 text-xs font-bold hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                
                <Link
                  href="/search"
                  className="w-full text-center block rounded-full border border-border bg-card py-3 text-xs font-bold hover:bg-secondary transition-all"
                >
                  Continue Curation
                </Link>
              </div>

            </div>

            {/* Coupon Entry widget */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-accent" />
                Promotion Codes
              </h4>
              
              {coupon ? (
                <div className="flex items-center justify-between bg-green-500/10 dark:bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-green-600 dark:text-green-400">{coupon.code}</p>
                    <p className="text-[10px] text-muted-foreground">Promo discount applied.</p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Remove coupon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code (e.g. LUXURY50)"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-accent uppercase"
                  />
                  <button
                    type="submit"
                    disabled={submittingCoupon}
                    className="rounded-md bg-secondary text-foreground px-4 py-2 text-xs font-bold hover:bg-border transition-all disabled:opacity-50"
                  >
                    {submittingCoupon ? '...' : 'Apply'}
                  </button>
                </form>
              )}

              {couponMsg && (
                <p className={`text-[10px] font-medium ${couponMsg.success ? 'text-green-500' : 'text-destructive'}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-secondary/30 rounded-xl p-3 border border-border/50">
              <ShieldAlert className="h-4.5 w-4.5 text-accent shrink-0" />
              <span>Duty calculations and express delivery options are updated during multi-step checkout.</span>
            </div>

          </div>

        </div>
      ) : (
        /* Empty shopping bag */
        <div className="text-center py-24 border border-border bg-card rounded-2xl p-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h2 className="text-sm font-bold text-foreground font-display">Your bag is empty</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
            Discover our luxury acoustic timepieces, duffel curations, and smart accessories to start building your cart.
          </p>
          <Link
            href="/search"
            className="inline-block mt-8 rounded-full bg-foreground text-background px-8 py-3 text-xs font-bold hover:bg-foreground/90 transition-all"
          >
            Start Shopping
          </Link>
        </div>
      )}

    </div>
  );
}
