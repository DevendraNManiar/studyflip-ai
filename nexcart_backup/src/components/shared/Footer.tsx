'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ success: true, message: data.message });
        setEmail('');
      } else {
        setStatus({ success: false, message: data.message });
      }
    } catch (err) {
      setStatus({ success: false, message: "Server connection failed. Try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-card border-t border-border text-foreground transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          
          {/* Brand Bio Section */}
          <div className="space-y-6">
            <span className="font-display text-2xl font-bold tracking-widest uppercase">
              Nex<span className="text-accent">Cart</span>
            </span>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              A premium, curated marketplace crafting timeless collections, custom acoustics, mechanical watchcraft, and artisanal leather accessories. Engineered for luxury.
            </p>
            <div className="flex gap-4">
              {/* Simple generic social icons placeholder */}
              <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Instagram</span>
              <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Pinterest</span>
              <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">Journal</span>
            </div>
          </div>

          {/* Nav Links columns */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collections</h3>
                <ul className="mt-4 space-y-2.5 text-xs text-foreground">
                  <li><Link href="/search?category=acoustics-audio" className="hover:text-accent">Audio Gear</Link></li>
                  <li><Link href="/search?category=timepieces" className="hover:text-accent">Timepieces</Link></li>
                  <li><Link href="/search?category=leather-goods" className="hover:text-accent">Leather Goods</Link></li>
                  <li><Link href="/search?category=wearables" className="hover:text-accent">Smart Wearables</Link></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Support</h3>
                <ul className="mt-4 space-y-2.5 text-xs text-foreground">
                  <li><Link href="/faq" className="hover:text-accent">Fulfillment FAQ</Link></li>
                  <li><span className="hover:text-accent cursor-pointer">Track Consignment</span></li>
                  <li><span className="hover:text-accent cursor-pointer">Returns & Exchanges</span></li>
                  <li><span className="hover:text-accent cursor-pointer">Bespoke Concierge</span></li>
                </ul>
              </div>
            </div>
            
            {/* Newsletter form */}
            <div className="flex flex-col">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NexCart Journal</h3>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                Subscribe to receive private collection arrivals, exclusive brand pricing, and visual editorials.
              </p>
              <form onSubmit={handleSubscribe} className="mt-4 flex max-w-md flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-xs focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-foreground text-background px-5 py-2 text-xs font-semibold hover:bg-foreground/90 transition-all disabled:opacity-50"
                >
                  {submitting ? '...' : 'Subscribe'}
                </button>
              </form>
              
              {status && (
                <p className={`mt-2.5 text-[11px] font-medium ${status.success ? 'text-green-500' : 'text-destructive'}`}>
                  {status.message}
                </p>
              )}
            </div>
          </div>
          
        </div>
        
        <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-muted-foreground">
            &copy; {new Date().getFullYear()} NexCart Luxury Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-4 text-[10px] text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer">Privacy Charter</span>
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer">System Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
