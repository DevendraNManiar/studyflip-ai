'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Home, Heart, User, MapPin, Plus, Trash2, CheckCircle, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const { addToCart } = useCart();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'wishlist'>('profile');

  // Profile Form state
  const [profileForm, setProfileForm] = useState({ name: '', image: '' });
  const [profileSuccess, setProfileSuccess] = useState('');

  // Address Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    recipient: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    isDefault: false
  });
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');

  const fetchProfileData = async () => {
    try {
      // 1. Fetch addresses
      const addrRes = await fetch('/api/users/addresses');
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        setAddresses(addrData.addresses || []);
      }

      // 2. Load wishlist
      const savedWishlist = localStorage.getItem('nexcart-wishlist');
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch (e) {
      console.error("Failed to load profile data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        image: user.image || ''
      });
      fetchProfileData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Profile Save
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    if (!user) return;

    try {
      // Direct local session update + simulated backend sync
      updateProfile(profileForm.name, profileForm.image);
      
      // Update in DB (dual fallback database update)
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileForm.name, image: profileForm.image })
      });
      
      if (res.ok) {
        setProfileSuccess("Your profile has been updated successfully.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Address
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');
    setAddressSuccess('');

    try {
      const res = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAddressSuccess("New address successfully added.");
        setShowAddressModal(false);
        setAddressForm({
          recipient: '',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'United States',
          phone: '',
          isDefault: false
        });
        fetchProfileData();
      } else {
        setAddressError(data.message || "Failed to add address.");
      }
    } catch (err) {
      setAddressError("Failed to connect to the server.");
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/users/addresses?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAddresses(addresses.filter(addr => addr.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Wishlist actions
  const removeFromWishlist = (id: string) => {
    const updated = wishlist.filter(p => p.id !== id);
    setWishlist(updated);
    localStorage.setItem('nexcart-wishlist', JSON.stringify(updated));
  };

  const moveWishlistItemToCart = (prod: any) => {
    addToCart(prod, 1);
    removeFromWishlist(prod.id);
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-lg font-bold font-display">Log In to View Profile</h2>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm">Please log in to your account to review address settings, wishlist, and profiles.</p>
        <Link
          href="/login?redirect=/profile"
          className="mt-6 rounded-full bg-foreground text-background px-8 py-3 text-xs font-bold hover:bg-foreground/90 transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-start">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-card border border-border rounded-2xl p-6 space-y-4 shrink-0">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <img
            src={user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover border border-border bg-muted"
          />
          <div className="min-w-0">
            <h3 className="text-xs font-bold truncate">{user.name}</h3>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold tracking-wider">{user.role}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left py-2.5 px-3 rounded-lg flex items-center gap-2 font-semibold transition-all ${activeTab === 'profile' ? 'bg-accent/10 text-foreground' : 'text-muted-foreground hover:bg-secondary/40'}`}
          >
            <User className="h-4 w-4" /> Personal Details
          </button>
          
          <button
            onClick={() => setActiveTab('addresses')}
            className={`w-full text-left py-2.5 px-3 rounded-lg flex items-center gap-2 font-semibold transition-all ${activeTab === 'addresses' ? 'bg-accent/10 text-foreground' : 'text-muted-foreground hover:bg-secondary/40'}`}
          >
            <MapPin className="h-4 w-4" /> Shipping Locations
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full text-left py-2.5 px-3 rounded-lg flex items-center gap-2 font-semibold transition-all ${activeTab === 'wishlist' ? 'bg-accent/10 text-foreground' : 'text-muted-foreground hover:bg-secondary/40'}`}
          >
            <Heart className="h-4 w-4" /> My Wishlist (${wishlist.length})
          </button>
        </nav>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        
        {/* TAB 1: PERSONAL DETAILS */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">Personal Details</h2>
            
            {profileSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs max-w-md">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Victoria Sterling"
                  required
                  className="w-full rounded border border-border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={profileForm.image}
                  onChange={(e) => setProfileForm({ ...profileForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded border border-border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded border border-border bg-secondary/50 px-3 py-2 text-muted-foreground cursor-not-allowed"
                />
                <span className="text-[9px] text-muted-foreground mt-1 block">Account emails cannot be altered directly.</span>
              </div>

              <button
                type="submit"
                className="rounded-full bg-foreground text-background px-6 py-2.5 text-xs font-bold hover:bg-foreground/90 transition-all"
              >
                Save Details
              </button>
            </form>

            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-8 pt-6 border-t border-border space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-xs space-y-2">
                  <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> Dev Settings: Role Switcher
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Toggle your account permissions between CUSTOMER and ADMIN to test both store and dashboard views.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/auth/toggle-role-dev', { method: 'POST' });
                        if (res.ok) {
                          window.location.reload();
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="mt-2 rounded-full bg-amber-500 text-white dark:text-black px-4 py-1.5 text-[10px] font-bold hover:bg-amber-500/90 transition-all cursor-pointer"
                  >
                    Toggle Role (Current: {user.role})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shipping Locations</h2>
              <button
                onClick={() => setShowAddressModal(true)}
                className="rounded-full bg-accent text-accent-foreground px-4 py-1.5 text-[10px] font-bold hover:opacity-95 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Location
              </button>
            </div>

            {addressSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{addressSuccess}</span>
              </div>
            )}

            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="border border-border rounded-xl p-5 bg-secondary/10 flex flex-col justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground">{addr.recipient}</h4>
                        {addr.isDefault && (
                          <span className="bg-accent/10 border border-accent/20 text-accent text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Default</span>
                        )}
                      </div>
                      <p className="text-muted-foreground leading-normal">{addr.street}</p>
                      <p className="text-muted-foreground leading-normal">{addr.city}, {addr.state} - {addr.postalCode}</p>
                      <p className="text-muted-foreground leading-normal">{addr.country}</p>
                      <p className="text-muted-foreground leading-normal font-semibold">Ph: {addr.phone}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-[10px] text-destructive font-bold hover:underline flex items-center gap-1 self-start"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Location
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-secondary/10 border border-dashed border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">You have not registered any shipping locations yet.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WISHLIST */}
        {activeTab === 'wishlist' && (
          <div className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">My Wishlist Curation</h2>
            
            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlist.map((prod) => (
                  <div key={prod.id} className="border border-border rounded-xl p-4 flex gap-4 bg-secondary/5 text-xs">
                    <img src={prod.images[0]} alt="" className="h-16 w-16 rounded object-cover border border-border bg-muted shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold truncate text-foreground">{prod.name}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">${prod.price}</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => moveWishlistItemToCart(prod)}
                          className="rounded-full bg-foreground text-background px-4 py-1 text-[9px] font-bold hover:bg-foreground/90 transition-all flex items-center gap-1"
                        >
                          <ShoppingBag className="h-3 w-3" /> Add to Bag
                        </button>
                        <button
                          onClick={() => removeFromWishlist(prod.id)}
                          className="text-[9px] text-destructive font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-secondary/10 border border-dashed border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Your wishlist is empty.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ADD ADDRESS DIALOG MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in duration-200">
            
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-sm font-bold font-display">Add Shipping Location</h2>
              <button onClick={() => setShowAddressModal(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Close
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="p-6 space-y-4 text-xs">
              
              {addressError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{addressError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    value={addressForm.recipient}
                    onChange={(e) => setAddressForm({ ...addressForm, recipient: e.target.value })}
                    placeholder="E.g., Victoria Sterling"
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Street Address *</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="E.g., 742 Evergreen Terrace"
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">City *</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Springfield"
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">State *</label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="IL"
                      className="w-full rounded border border-border bg-card px-1 py-2 text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Postal Code *</label>
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      placeholder="62704"
                      className="w-full rounded border border-border bg-card px-1 py-2 text-center"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Country *</label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+1 (555) 0199"
                    className="w-full rounded border border-border bg-card px-3 py-2"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-muted-foreground uppercase mt-2">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded border-border text-accent focus:ring-accent"
                    />
                    <span>Set as primary default address</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="w-1/2 rounded-full border border-border py-2.5 text-xs font-bold hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-full bg-foreground text-background py-2.5 text-xs font-bold hover:bg-foreground/90 transition-all"
                >
                  Save Address
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
