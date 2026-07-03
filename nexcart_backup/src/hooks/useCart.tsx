'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { MockProduct } from '../lib/mockData';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  variantValue?: string;
  stock: number;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  isFlat: boolean;
}

type CartContextType = {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  addToCart: (product: MockProduct, quantity: number, variant?: { id: string; name: string; value: string; price?: number; stock: number }) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  clearCart: () => void;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load cart on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('nexcart-cart');
    const savedCoupon = localStorage.getItem('nexcart-coupon');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart items", e);
      }
    }
    if (savedCoupon) {
      try {
        setCoupon(JSON.parse(savedCoupon));
      } catch (e) {
        console.error("Failed to parse coupon", e);
      }
    }
    setMounted(true);
  }, []);

  // Save cart to localstorage when items or coupon change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('nexcart-cart', JSON.stringify(items));
      if (coupon) {
        localStorage.setItem('nexcart-coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('nexcart-coupon');
      }
    }
  }, [items, coupon, mounted]);

  const addToCart = (
    product: MockProduct,
    quantity: number,
    variant?: { id: string; name: string; value: string; price?: number; stock: number }
  ) => {
    setItems(prevItems => {
      // Find matching item by ID and variant value
      const matchIndex = prevItems.findIndex(
        item => item.productId === product.id && (!variant || item.variantId === variant.id)
      );

      const price = variant?.price || product.discountPrice || product.price;
      const stock = variant?.stock ?? product.stock;

      if (matchIndex > -1) {
        const updatedItems = [...prevItems];
        const newQty = updatedItems[matchIndex].quantity + quantity;
        updatedItems[matchIndex].quantity = Math.min(newQty, stock);
        return updatedItems;
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${variant ? variant.id : 'default'}`,
          productId: product.id,
          name: product.name,
          price: price,
          image: product.images[0],
          quantity: Math.min(quantity, stock),
          variantId: variant?.id,
          variantName: variant?.name,
          variantValue: variant?.value,
          stock: stock
        };
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) };
        }
        return item;
      })
    );
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch(`/api/coupons/validate?code=${code.toUpperCase()}`);
      const data = await res.json();
      
      if (res.ok && data.valid) {
        const newCoupon: AppliedCoupon = {
          code: data.coupon.code,
          discount: data.coupon.discount,
          isFlat: data.coupon.isFlat
        };
        setCoupon(newCoupon);
        return { success: true, message: `Coupon "${code}" applied successfully!` };
      } else {
        return { success: false, message: data.message || "Invalid coupon code." };
      }
    } catch (e) {
      return { success: false, message: "Server connection failed." };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  // Pricing calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Tax calculations (standard 18% inclusive/exclusive, let's treat it as 18% extra)
  const taxAmount = subtotal * 0.18;
  
  // Shipping calculation ($15 shipping, free above $300, or $0 if cart is empty)
  const shippingCost = subtotal > 300 || subtotal === 0 ? 0 : 15;
  
  // Discount calculation
  let discountAmount = 0;
  if (coupon) {
    if (coupon.isFlat) {
      discountAmount = Math.min(coupon.discount, subtotal);
    } else {
      discountAmount = subtotal * (coupon.discount / 100);
    }
  }

  const totalAmount = Math.max(0, subtotal + taxAmount + shippingCost - discountAmount);

  return (
    <CartContext.Provider
      value={{
        items,
        coupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        applyCoupon,
        removeCoupon,
        clearCart,
        subtotal,
        taxAmount,
        shippingCost,
        discountAmount,
        totalAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
