'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Star, ShieldCheck, Share2, Check, Video, Plus, Minus, Send, Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface ProductClientProps {
  product: any;
  relatedProducts: any[];
  frequentlyBought: any[];
}

export default function ProductClient({ product, relatedProducts, frequentlyBought }: ProductClientProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  // Gallery and zoom state
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [showVideo, setShowVideo] = useState(false);

  // Selection states
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  // Load wishlist status on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nexcart-wishlist');
      if (saved) {
        const list = JSON.parse(saved);
        setWishlisted(list.some((p: any) => p.id === product.id));
      }
    } catch (e) {
      console.error("Failed to load wishlist status", e);
    }
  }, [product.id]);

  const handleWishlistToggle = () => {
    try {
      const saved = localStorage.getItem('nexcart-wishlist');
      let list = saved ? JSON.parse(saved) : [];
      if (wishlisted) {
        list = list.filter((p: any) => p.id !== product.id);
        setWishlisted(false);
      } else {
        list.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          images: product.images,
          price: product.price,
          discountPrice: product.discountPrice,
          brand: product.brand,
          category: product.category,
        });
        setWishlisted(true);
      }
      localStorage.setItem('nexcart-wishlist', JSON.stringify(list));
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (e) {
      console.error("Failed to toggle wishlist", e);
    }
  };

  // Bundle checkout state
  const [bundleChecked, setBundleChecked] = useState(true);

  // Review states
  const [reviews, setReviews] = useState<any[]>(product.reviews || []);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  // Image Hover Zoom effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '200%',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddBundle = () => {
    // Add main product to cart
    addToCart(product, 1, selectedVariant);
    
    // Add frequently bought companion
    if (frequentlyBought.length > 0 && bundleChecked) {
      addToCart(frequentlyBought[0], 1);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReviewMessage("Please log in to submit a review.");
      return;
    }
    if (!newComment.trim()) return;

    setReviewSubmitting(true);
    setReviewMessage('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: newRating,
          comment: newComment,
          userName: user.name,
          userImage: user.image
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReviews([data.review, ...reviews]);
        setNewComment('');
        setReviewMessage("Review submitted successfully! Thank you.");
      } else {
        setReviewMessage(data.message || "Failed to submit review.");
      }
    } catch (err) {
      setReviewMessage("Failed to connect to server.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const displayPrice = selectedVariant?.price || product.discountPrice || product.price;
  const bundleCompanion = frequentlyBought[0];
  const bundleTotal = bundleCompanion ? displayPrice + (bundleCompanion.discountPrice || bundleCompanion.price) : 0;

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-12">
      
      {/* 1. PRODUCT INFORMATION BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Side: Media Gallery */}
        <div className="space-y-4">
          
          {/* Main Showcase frame */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-secondary border border-border">
            {showVideo ? (
              <video src={product.videoUrl} controls className="h-full w-full object-cover" autoPlay />
            ) : (
              <>
                <div
                  className="h-full w-full bg-cover bg-center cursor-zoom-in"
                  style={{ backgroundImage: `url(${activeImage})` }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
                {/* Micro zoom canvas */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-150"
                  style={zoomStyle}
                />
              </>
            )}

            {/* Video preview button */}
            {product.videoUrl && (
              <button
                onClick={() => { setShowVideo(!showVideo); }}
                className="absolute bottom-4 right-4 bg-background/80 hover:bg-background text-foreground text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 backdrop-blur shadow"
              >
                <Video className="h-3.5 w-3.5 text-accent" />
                {showVideo ? "Show Image" : "Play Video"}
              </button>
            )}
          </div>

          {/* Thumbnail list */}
          {!showVideo && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-1">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`h-20 w-20 rounded-lg overflow-hidden border-2 shrink-0 ${activeImage === img ? 'border-accent' : 'border-border'}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Right Side: Configuration & Details */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">{product.brand?.name} &bull; {product.category?.name}</span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1.5 font-display">{product.name}</h1>
            
            {/* Rating summary */}
            <div className="flex items-center gap-2 mt-3 text-xs">
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span className="font-semibold text-foreground">{product.rating} / 5</span>
              <span className="text-muted-foreground">({reviews.length} Customer Reviews)</span>
            </div>
          </div>

          {/* Price details */}
          <div className="border-y border-border py-4 flex items-baseline gap-3">
            {product.discountPrice ? (
              <>
                <span className="text-2xl font-bold text-foreground">${product.discountPrice}</span>
                <span className="text-sm text-muted-foreground line-through">${product.price}</span>
              </>
            ) : (
              <span className="text-2xl font-bold text-foreground">${product.price}</span>
            )}
            <span className="text-[10px] text-muted-foreground">Tax inclusive (18% code)</span>
          </div>

          {/* Core Description */}
          <p className="text-xs text-muted-foreground leading-relaxed font-sans">{product.description}</p>

          {/* Specifications */}
          <div className="bg-secondary/40 rounded-xl p-4 text-[11px] space-y-2 border border-border/60">
            <div className="flex justify-between"><span className="text-muted-foreground">SKU Number</span><span className="font-semibold">{product.sku}</span></div>
            {product.barcode && <div className="flex justify-between"><span className="text-muted-foreground">Barcode</span><span className="font-semibold">{product.barcode}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping Weight</span><span className="font-semibold">{product.weight} kg</span></div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inventory Status</span>
              <span className={`font-bold ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} items)` : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Variant Selectors */}
          {product.variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select {product.variants[0].name}</h3>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                    className={`rounded-full px-5 py-2 text-xs font-semibold border ${selectedVariant?.id === v.id ? 'border-accent bg-accent/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-foreground'}`}
                  >
                    {v.value} {v.price && `(+$${v.price - product.price})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Actions */}
          <div className="flex flex-wrap gap-4 pt-4">
            
            {/* Quantity counters */}
            <div className="flex items-center border border-border rounded-full bg-card px-2">
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="p-2 text-muted-foreground hover:text-foreground"
                disabled={product.stock <= 0}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(prev => Math.min(selectedVariant?.stock || product.stock, prev + 1))}
                className="p-2 text-muted-foreground hover:text-foreground"
                disabled={product.stock <= 0}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Add to Cart button */}
            <button
              onClick={() => addToCart(product, quantity, selectedVariant)}
              disabled={product.stock <= 0}
              className="flex-1 min-w-[180px] rounded-full bg-foreground text-background py-3 text-xs font-bold hover:bg-foreground/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Shopping Bag
            </button>

            {/* Share and wishlist options */}
            <button
              onClick={handleShare}
              className="rounded-full border border-border p-3 text-foreground hover:bg-secondary transition-all"
              aria-label="Share URL"
            >
              {copied ? <Check className="h-4.5 w-4.5 text-green-500 animate-bounce" /> : <Share2 className="h-4.5 w-4.5" />}
            </button>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlistToggle}
              className={`rounded-full border border-border p-3 transition-all ${wishlisted ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'text-foreground hover:bg-secondary'}`}
              aria-label="Toggle Wishlist"
            >
              <Heart className={`h-4.5 w-4.5 ${wishlisted ? 'fill-current text-red-500' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-2">
            <ShieldCheck className="h-4 w-4 text-green-500" /> Secure checkout process backed by Stripe &amp; PayPal.
          </div>

        </div>

      </div>

      {/* 2. FREQUENTLY BOUGHT TOGETHER BUNDLE */}
      {bundleCompanion && (
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frequently Bought Together</h3>
          
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Product 1 image */}
              <div className="h-20 w-20 rounded-lg overflow-hidden border border-border bg-muted">
                <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
              </div>
              
              <span className="text-xl font-bold text-muted-foreground">+</span>

              {/* Product 2 image */}
              <div className="h-20 w-20 rounded-lg overflow-hidden border border-border bg-muted">
                <img src={bundleCompanion.images[0]} alt="" className="h-full w-full object-cover" />
              </div>

              {/* Bundle description */}
              <div className="space-y-1 text-xs pl-2">
                <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bundleChecked}
                    onChange={(e) => setBundleChecked(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Bundle Pack (Bundle with {bundleCompanion.name})</span>
                </label>
                <p className="text-muted-foreground text-[10px] leading-relaxed">Combine collections for immediate standard checkout.</p>
              </div>
            </div>

            {/* Total pricing and bundle buy */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-muted-foreground">Combined Price</p>
                <p className="text-lg font-bold text-foreground mt-0.5">
                  ${bundleChecked ? bundleTotal : displayPrice}
                </p>
              </div>
              <button
                onClick={handleAddBundle}
                className="rounded-full bg-accent text-accent-foreground px-6 py-2.5 text-xs font-bold hover:opacity-90 transition-all"
              >
                Add Bundle to Cart
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. REVIEWS & RATINGS MODERATION SECTION */}
      <section className="border-t border-border pt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left column: review lists */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold font-display tracking-tight">Reviews &amp; Customer Ratings</h2>

          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-card border border-border rounded-xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.userImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rev.userName)}`}
                        alt={rev.userName}
                        className="h-8 w-8 rounded-full border border-border"
                      />
                      <div>
                        <h4 className="text-xs font-bold">{rev.userName}</h4>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(rev.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">{rev.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-secondary/20 rounded-xl border border-dashed border-border p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">No reviews have been written for this product yet.</p>
            </div>
          )}
        </div>

        {/* Right column: submit reviews */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Submit a Review</h3>
          
          {user ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star selection */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Rating Choice</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star className={`h-5 w-5 ${star <= newRating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Your Comment</label>
                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share details of your experience with this premium product..."
                  required
                  className="w-full rounded-md border border-border bg-background p-3 text-xs focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full rounded-md bg-foreground text-background py-2 text-xs font-bold hover:bg-foreground/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Feedback
              </button>

              {reviewMessage && (
                <p className="text-[10px] font-medium text-center text-accent mt-2">
                  {reviewMessage}
                </p>
              )}
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground leading-relaxed">You must be logged in to leave product ratings.</p>
              <Link
                href="/login"
                className="inline-block mt-4 rounded-full bg-foreground text-background px-6 py-2 text-xs font-bold hover:bg-foreground/90 transition-all"
              >
                Log In
              </Link>
            </div>
          )}
        </div>

      </section>

      {/* 4. RELATED PRODUCTS CURATION */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-border pt-12">
          <div className="border-b border-border pb-4">
            <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Curation</span>
            <h2 className="text-lg font-bold font-display mt-1">Related Products</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {relatedProducts.map((prod) => (
              <div key={prod.id} className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
                <Link href={`/products/${prod.slug}`} className="relative h-56 bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="h-full w-full object-cover group-hover:scale-102 transition-all duration-500"
                  />
                </Link>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider">{prod.brand?.name}</span>
                    <h3 className="text-xs font-bold mt-1 text-foreground hover:text-accent font-display line-clamp-1">
                      <Link href={`/products/${prod.slug}`}>{prod.name}</Link>
                    </h3>
                  </div>
                  <div className="flex justify-between items-baseline mt-4">
                    <span className="text-xs font-bold">${prod.discountPrice || prod.price}</span>
                    <Link
                      href={`/products/${prod.slug}`}
                      className="text-[10px] text-accent font-bold hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
