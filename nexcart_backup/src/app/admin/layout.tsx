'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Package, Layers, FileSpreadsheet, Tag, ShieldAlert, LogOut, ArrowLeft, Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // 1. Loading state spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // 2. RBAC check: Redirect / show Access Denied if user is not ADMIN
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight font-display text-foreground">Access Denied</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
          The credentials for your account do not possess administrator rights to modify NexCart collections.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="rounded-full bg-foreground text-background px-6 py-2 text-xs font-bold hover:bg-foreground/90 transition-all"
          >
            Authenticate Admin
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border px-6 py-2 text-xs font-bold hover:bg-secondary transition-all"
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  // Navigation tabs config
  const navItems = [
    { name: 'Analytics', href: '/admin', icon: BarChart3 },
    { name: 'Products Catalog', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: Layers },
    { name: 'Brands Curation', href: '/admin/brands', icon: Layers },
    { name: 'Order Management', href: '/admin/orders', icon: FileSpreadsheet },
    { name: 'Coupons Control', href: '/admin/coupons', icon: Tag },
    { name: 'Review Moderation', href: '/admin/reviews', icon: ShieldAlert },
    { name: 'User Permissions', href: '/admin/customers', icon: ShieldAlert },
    { name: 'Security Audits', href: '/admin/audit-logs', icon: ShieldAlert },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[80vh]">
      
      {/* Side Navigation bar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="border-b border-border pb-4 hidden md:block">
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Administrative Control</p>
            <h2 className="text-sm font-bold font-display mt-0.5">NexCart Manager</h2>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-xs font-semibold shrink-0 transition-all ${isActive ? 'bg-accent/10 border border-accent/25 text-accent font-bold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-border mt-6 hidden md:block">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit to Storefront
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 p-6 md:p-8 bg-secondary/10 overflow-x-hidden">
        {children}
      </main>

    </div>
  );
}
