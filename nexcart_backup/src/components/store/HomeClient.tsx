'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { ShoppingBag, ArrowRight, Star, Clock, Plus, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

interface HomeClientProps {
  initialProducts: any[];
  initialCategories: any[];
}

const HERO_SLIDES = [
  {
    id: 1,
    title: "Acoustics of Silence",
    subtitle: "AERO STUDIO MAX",
    description: "Pure anodized aluminum, spatial audio, and industry-leading noise cancellation engineered for audiophiles.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    link: "/products/aero-max-wireless-studio",
    cta: "Experience Silence"
  },
  {
    id: 2,
    title: "Precision Timepieces",
    subtitle: "CHRONOS AUTOMATIC",
    description: "Hand-assembled Swiss mechanical chronographs. Timeless engineering designed to inherit generations.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    link: "/products/chronos-legacy-automatic-chronograph",
    cta: "Discover Legacy"
  },
  {
    id: 3,
    title: "Artisanal Journeys",
    subtitle: "ATELIER LEATHER DUFFEL",
    description: "Vegetable-tanned full-grain Italian leather weekenders. Patinas uniquely with every mile traveled.",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
    link: "/products/atelier-full-grain-leather-duffel",
    cta: "Explore Atelier"
  }
];

export default function HomeClient({ initialProducts, initialCategories }: HomeClientProps) {
  const { addToCart } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 14, minutes: 32, seconds: 45 });
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Auto cycle hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Flash Sale Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 }; // reset loop
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Separating products by tabs
  const featuredProducts = initialProducts.slice(0, 3);
  const newArrivals = [...initialProducts].reverse().slice(0, 4);
  const flashSaleProduct = initialProducts.find(p => p.id === 'prod-4') || initialProducts[0];

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const faqs = [
    {
      q: "What is your carbon shipping footprint?",
      a: "All NexCart items ship in 100% biodegradable custom crates. We offset our logistics footprints in collaboration with carbon reduction partners."
    },
    {
      q: "How does the concierge custom warranty work?",
      a: "Our signature timepieces and acoustics carry a 5-year bespoke protection program. Contact concierge@nexcart.luxury for direct pick-up repairs."
    },
    {
      q: "Do you ship worldwide?",
      a: "Yes, we ship to over 120 countries. Duty taxes and custom brokerage charges are computed during the final step of checkout."
    }
  ];

  return (
    <div className="flex flex-col gap-16 pb-16">
      
      {/* 1. HERO SLIDER */}
      <section className="relative h-[85vh] w-full overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${HERO_SLIDES[currentSlide].image})` }}
          />
        </AnimatePresence>

        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-20 sm:px-12 md:pb-28">
          <div className="mx-auto max-w-7xl w-full">
            <motion.span 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-bold tracking-widest text-accent uppercase font-display"
            >
              {HERO_SLIDES[currentSlide].subtitle}
            </motion.span>
            
            <motion.h1 
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl font-display max-w-3xl"
            >
              {HERO_SLIDES[currentSlide].title}
            </motion.h1>
            
            <motion.p 
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-sm text-neutral-300 max-w-lg leading-relaxed font-sans"
            >
              {HERO_SLIDES[currentSlide].description}
            </motion.p>
            
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex gap-4"
            >
              <Link
                href={HERO_SLIDES[currentSlide].link}
                className="rounded-full bg-accent text-accent-foreground px-8 py-3 text-xs font-bold hover:opacity-90 flex items-center gap-2 transition-all"
              >
                {HERO_SLIDES[currentSlide].cta}
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-accent' : 'w-2 bg-white/40'}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. USP FEATURES PANEL */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 rounded-2xl bg-card border border-border">
          <div className="flex gap-4 items-start">
            <Truck className="h-8 w-8 text-accent shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Priority Delivery</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Free, insured global air shipping on orders exceeding $300.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <ShieldCheck className="h-8 w-8 text-accent shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Concierge Assured</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Each timepiece and accessory includes a certified origin card.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <RefreshCw className="h-8 w-8 text-accent shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Unconditional Exchanges</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Return collections within 30 days in original packaging.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SHOWCASE */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Collections</span>
            <h2 className="text-xl font-bold tracking-tight mt-1 font-display sm:text-2xl">Browse by Category</h2>
          </div>
          <Link href="/search" className="text-xs font-bold text-accent hover:underline flex items-center gap-1.5">
            Shop All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {initialCategories.map((cat, idx) => (
            <Link key={cat.id} href={`/search?category=${cat.slug}`} className="group relative h-64 overflow-hidden rounded-xl bg-neutral-900">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-65 group-hover:scale-105 transition-transform duration-500" 
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h3 className="text-sm font-bold text-white tracking-wider font-display uppercase">{cat.name}</h3>
                <p className="text-[10px] text-neutral-300 mt-1 leading-relaxed">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Curations</span>
            <h2 className="text-xl font-bold tracking-tight mt-1 font-display sm:text-2xl">Featured Products</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {featuredProducts.map((prod: any) => (
            <div key={prod.id} className="group relative flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <Link href={`/products/${prod.slug}`} className="relative h-80 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                {prod.discountPrice && (
                  <span className="absolute left-3 top-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    Special Offer
                  </span>
                )}
              </Link>

              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">{prod.category?.name}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span className="text-xs font-medium text-foreground">{prod.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold tracking-tight mt-1.5 hover:text-accent font-display">
                    <Link href={`/products/${prod.slug}`}>{prod.name}</Link>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{prod.description}</p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                  <div className="flex items-baseline gap-2">
                    {prod.discountPrice ? (
                      <>
                        <span className="text-sm font-bold text-foreground">${prod.discountPrice}</span>
                        <span className="text-xs text-muted-foreground line-through">${prod.price}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-foreground">${prod.price}</span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(prod, 1)}
                    className="rounded-full bg-secondary hover:bg-accent hover:text-accent-foreground p-2 text-foreground transition-all duration-300"
                    aria-label="Add to cart"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FLASH SALE COUNTDOWN SECTION */}
      {flashSaleProduct && (
        <section className="bg-neutral-900 text-white py-16 transition-colors duration-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Product Visual */}
              <div className="relative h-96 w-full rounded-2xl overflow-hidden bg-neutral-800">
                <img
                  src={flashSaleProduct.images[0]}
                  alt={flashSaleProduct.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              {/* Offer Details */}
              <div className="space-y-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-accent uppercase border border-accent/30 rounded-full px-3 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  Limited Flash Sale
                </span>
                <h2 className="text-2xl font-bold tracking-tight font-display sm:text-4xl">{flashSaleProduct.name}</h2>
                <p className="text-sm text-neutral-300 leading-relaxed font-sans">{flashSaleProduct.description}</p>
                
                {/* Timer Display */}
                <div className="flex gap-4 py-4">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl sm:text-3xl font-bold font-display bg-neutral-800 rounded-lg p-3 w-16 text-center border border-neutral-700">{formatNumber(countdown.hours)}</span>
                    <span className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider font-semibold">Hours</span>
                  </div>
                  <div className="text-2xl font-bold self-center -mt-4">:</div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl sm:text-3xl font-bold font-display bg-neutral-800 rounded-lg p-3 w-16 text-center border border-neutral-700">{formatNumber(countdown.minutes)}</span>
                    <span className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider font-semibold">Mins</span>
                  </div>
                  <div className="text-2xl font-bold self-center -mt-4">:</div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl sm:text-3xl font-bold font-display bg-neutral-800 rounded-lg p-3 w-16 text-center border border-neutral-700">{formatNumber(countdown.seconds)}</span>
                    <span className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wider font-semibold">Secs</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <div>
                    <p className="text-xs text-neutral-400">Exclusive Price</p>
                    <p className="text-2xl font-bold text-accent mt-0.5">${flashSaleProduct.discountPrice || flashSaleProduct.price}</p>
                  </div>
                  <Link
                    href={`/products/${flashSaleProduct.slug}`}
                    className="rounded-full bg-accent text-accent-foreground px-8 py-3 text-xs font-bold hover:opacity-90 flex items-center gap-2 transition-all"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>

            </div>
          </div>
        </section>
      )}

      {/* 6. NEW ARRIVALS GRID */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-4">
          <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Releases</span>
          <h2 className="text-xl font-bold tracking-tight mt-1 font-display sm:text-2xl">New Arrivals</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {newArrivals.map((prod: any) => (
            <div key={prod.id} className="group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
              <Link href={`/products/${prod.slug}`} className="relative h-64 bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
              </Link>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider">{prod.category?.name}</span>
                  <h3 className="text-xs font-bold mt-1 text-foreground hover:text-accent font-display line-clamp-1">
                    <Link href={`/products/${prod.slug}`}>{prod.name}</Link>
                  </h3>
                </div>
                <div className="flex justify-between items-baseline mt-4">
                  <span className="text-xs font-bold">${prod.discountPrice || prod.price}</span>
                  <button 
                    onClick={() => addToCart(prod, 1)}
                    className="text-[10px] text-accent font-bold hover:underline"
                  >
                    + Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CUSTOMER TESTIMONIALS */}
      <section className="bg-secondary/40 py-16 border-y border-border transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Testimonials</span>
          <h2 className="text-xl font-bold tracking-tight mt-1 font-display sm:text-2xl">The NexCart Standard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-card border border-border/80 rounded-2xl p-8 text-left space-y-4">
              <div className="flex text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "The packaging is spectacular. Opening the Aero Max Headphones felt like unboxing a fine watch. Customer support helped track the courier custom taxes immediately."
              </p>
              <div>
                <p className="text-xs font-bold">Benjamin Howard</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">London, UK</p>
              </div>
            </div>
            <div className="bg-card border border-border/80 rounded-2xl p-8 text-left space-y-4">
              <div className="flex text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "I have collected chronographs for 15 years. The Chronos Legacy stands toe-to-toe with Swiss watches at double the price. Outstanding assembly precision."
              </p>
              <div>
                <p className="text-xs font-bold">Genevieve Vance</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Geneva, Switzerland</p>
              </div>
            </div>
            <div className="bg-card border border-border/80 rounded-2xl p-8 text-left space-y-4">
              <div className="flex text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4.5 w-4.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "The leather weekender bag has survived five international journeys. It has developed a dark, beautiful honey glaze patina. Will definitely purchase the matching wallet."
              </p>
              <div>
                <p className="text-xs font-bold">Carlos Mendoza</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">New York, USA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section className="mx-auto max-w-3xl w-full px-4 sm:px-6">
        <div className="text-center pb-8">
          <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Assistance</span>
          <h2 className="text-xl font-bold mt-1 font-display sm:text-2xl">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4 mt-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-border pb-4">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center text-left py-2.5 focus:outline-none"
              >
                <span className="text-sm font-semibold hover:text-accent transition-colors">{faq.q}</span>
                <span className="text-accent text-lg font-bold">{activeFaq === idx ? '−' : '+'}</span>
              </button>
              
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed pt-1.5 pb-2">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 9. BLOG / JOURNAL SECTION */}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-4 text-center">
          <span className="text-xs font-bold tracking-widest text-accent uppercase font-display">Editorials</span>
          <h2 className="text-xl font-bold tracking-tight mt-1 font-display sm:text-2xl">NexCart Journal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="group space-y-4">
            <div className="relative h-60 w-full overflow-hidden rounded-xl bg-neutral-100">
              <img
                src="https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=600&q=80"
                alt="Behind the design"
                className="h-full w-full object-cover group-hover:scale-102 transition-all duration-500"
              />
            </div>
            <div>
              <p className="text-[10px] text-accent font-bold uppercase font-display">Acoustics &bull; June 12, 2026</p>
              <h3 className="text-sm font-bold mt-1.5 hover:text-accent font-display">
                <span className="cursor-pointer">Engineering the Perfect Sound Chamber</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                An editorial look into how we tuned the spatial acoustic drivers inside the Aero Max studio headphones.
              </p>
            </div>
          </div>
          <div className="group space-y-4">
            <div className="relative h-60 w-full overflow-hidden rounded-xl bg-neutral-100">
              <img
                src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=600&q=80"
                alt="Horological history"
                className="h-full w-full object-cover group-hover:scale-102 transition-all duration-500"
              />
            </div>
            <div>
              <p className="text-[10px] text-accent font-bold uppercase font-display">Horology &bull; May 29, 2026</p>
              <h3 className="text-sm font-bold mt-1.5 hover:text-accent font-display">
                <span className="cursor-pointer">The Art of Automatic Movements</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Explore the intricacies of Swiss engineering and why mechanical calibers remain the pinnacle of timekeeping.
              </p>
            </div>
          </div>
          <div className="group space-y-4">
            <div className="relative h-60 w-full overflow-hidden rounded-xl bg-neutral-100">
              <img
                src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80"
                alt="Leather craft"
                className="h-full w-full object-cover group-hover:scale-102 transition-all duration-500"
              />
            </div>
            <div>
              <p className="text-[10px] text-accent font-bold uppercase font-display">Tanning &bull; May 14, 2026</p>
              <h3 className="text-sm font-bold mt-1.5 hover:text-accent font-display">
                <span className="cursor-pointer">Full-Grain Patinas and Travel Companions</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                How vegetable tanning processes respond to environment, sweat, and exposure, crafting a history unique to you.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
