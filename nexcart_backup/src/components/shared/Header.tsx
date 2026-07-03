'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useTheme } from '@/components/shared/ThemeProvider';
import { ShoppingBag, Heart, User, Sun, Moon, Search, LogOut, Menu, X, Shield } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { items, subtotal } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Logo & Main Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-widest text-foreground uppercase">
              Nex<span className="text-accent">Cart</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground transition-colors">
            <Link href="/search" className="hover:text-foreground">Shop All</Link>
            <Link href="/search?category=acoustics-audio" className="hover:text-foreground">Audio</Link>
            <Link href="/search?category=timepieces" className="hover:text-foreground">Timepieces</Link>
            <Link href="/search?category=leather-goods" className="hover:text-foreground">Leather</Link>
          </nav>
        </div>

        {/* Right Side: Search, Theme, Cart, Wishlist, User Profiles */}
        <div className="flex items-center gap-4">
          
          {/* Quick Search Input */}
          <div className="relative hidden lg:flex items-center">
            <form action="/search" method="GET" className="relative">
              <input
                type="text"
                name="search"
                placeholder="Search premium collections..."
                className="w-48 rounded-full border border-border bg-secondary/50 py-1.5 pl-8 pr-4 text-xs focus:w-64 focus:bg-background"
              />
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </form>
          </div>

          {/* Search Toggle for Mobile */}
          <button 
            className="lg:hidden text-foreground hover:text-accent" 
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Toggle Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-1.5 hover:bg-secondary text-foreground"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          {/* Wishlist Link */}
          <Link href="/wishlist" className="relative rounded-full p-1.5 hover:bg-secondary text-foreground hidden sm:block" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>

          {/* Cart Icon / Drawer Trigger */}
          <Link href="/cart" className="relative rounded-full p-1.5 hover:bg-secondary text-foreground" aria-label="Shopping Cart">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Section */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-1.5 rounded-full p-1 hover:bg-secondary text-foreground focus:outline-none">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="h-7 w-7 rounded-full object-cover border border-border" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="hidden sm:inline text-xs font-semibold max-w-[80px] truncate">{user.name}</span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md border border-border bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200">
                <div className="p-2 border-b border-border">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-secondary font-medium">
                      <Shield className="h-3.5 w-3.5 text-accent" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-secondary">
                    My Profile
                  </Link>
                  <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-secondary">
                    View Orders
                  </Link>
                  <Link href="/wishlist" className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-secondary sm:hidden">
                    My Wishlist
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-destructive hover:bg-secondary"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="hidden sm:flex items-center gap-1 text-xs font-medium text-primary bg-foreground hover:bg-foreground/90 text-background px-4 py-1.5 rounded-full transition-all"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-full p-1.5 hover:bg-secondary text-foreground"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <form action="/search" method="GET" className="relative w-full">
            <input
              type="text"
              name="search"
              placeholder="Search collections..."
              className="w-full rounded-md border border-border bg-secondary/50 py-2 pl-9 pr-4 text-sm focus:bg-background"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </form>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3 shadow-lg">
          <nav className="flex flex-col gap-2 font-medium">
            <Link href="/search" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-secondary text-sm">Shop All</Link>
            <Link href="/search?category=acoustics-audio" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-secondary text-sm">Acoustics & Audio</Link>
            <Link href="/search?category=timepieces" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-secondary text-sm">Timepieces</Link>
            <Link href="/search?category=leather-goods" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-secondary text-sm">Leather Goods</Link>
          </nav>
          {!user && (
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-md bg-foreground text-background text-sm font-semibold"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-md border border-border text-foreground text-sm font-medium"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
