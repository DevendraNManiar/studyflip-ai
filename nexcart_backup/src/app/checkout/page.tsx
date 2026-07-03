'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight, CreditCard, Home, ShieldCheck, Truck, ShoppingBag, Download, ArrowRight, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

type Step = 'address' | 'delivery' | 'payment' | 'review' | 'success';

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, coupon, subtotal, taxAmount, shippingCost, discountAmount, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'paypal' | 'mock'>('mock');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Address Details State
  const [address, setAddress] = useState({
    recipient: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
  });

  // Step 2: Shipping details State
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const finalShippingCost = deliveryMethod === 'express' ? 35 : shippingCost;
  const finalTotalAmount = Math.max(0, subtotal + taxAmount + finalShippingCost - discountAmount);
  const shippingString = `${address.recipient}, ${address.street}, ${address.city}, ${address.state} - ${address.postalCode}, ${address.country}. Ph: ${address.phone}`;

  // Step 3: Payment details State
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  // Placed Order details
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Populate user defaults if logged in
  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        recipient: user.name || '',
      }));
      // Fetch default address
      fetch('/api/users/addresses')
        .then(res => res.json())
        .then(data => {
          if (data.addresses && data.addresses.length > 0) {
            const def = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
            setAddress({
              recipient: def.recipient,
              street: def.street,
              city: def.city,
              state: def.state,
              postalCode: def.postalCode,
              country: def.country,
              phone: def.phone,
            });
          }
        })
        .catch(err => console.log("Default address not set"));
    }
  }, [user]);

  // Guard: Redirect if cart is empty and not on success screen
  useEffect(() => {
    if (items.length === 0 && currentStep !== 'success') {
      router.push('/cart');
    }
  }, [items, currentStep, router]);

  // Check for Stripe redirect success parameter
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      setLoading(true);
      
      const isSimulated = sessionId.startsWith('mock_stripe_');
      
      if (isSimulated) {
        // Simulated Stripe flow: create the mock order now
        const savedCart = localStorage.getItem('nexcart-cart');
        const savedCoupon = localStorage.getItem('nexcart-coupon');
        const itemsList = savedCart ? JSON.parse(savedCart) : [];
        const couponData = savedCoupon ? JSON.parse(savedCoupon) : null;
        
        const savedAddress = localStorage.getItem('nexcart-address');
        const addressDetails = savedAddress ? JSON.parse(savedAddress) : {
          recipient: user?.name || 'Customer Client',
          street: 'Simulated Stripe Address',
          city: 'Cupertino',
          state: 'CA',
          postalCode: '95014',
          country: 'United States',
          phone: '+1 (555) 0199'
        };

        const total = itemsList.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0);
        const tax = total * 0.18;
        const shipping = total > 300 ? 0 : 15;
        let discount = 0;
        if (couponData) {
          discount = couponData.isFlat ? Math.min(couponData.discount, total) : total * (couponData.discount / 100);
        }
        const grandTotal = Math.max(0, total + tax + shipping - discount);

        const orderPayload = {
          items: itemsList.map((it: any) => ({
            productId: it.productId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            variant: it.variantValue
          })),
          totalAmount: grandTotal,
          taxAmount: tax,
          shippingCost: shipping,
          discountAmount: discount,
          shippingAddress: `${addressDetails.recipient}, ${addressDetails.street}, ${addressDetails.city}, ${addressDetails.state} - ${addressDetails.postalCode}, ${addressDetails.country}. Ph: ${addressDetails.phone}`,
          appliedCoupon: couponData?.code || null,
          paymentMethod: "STRIPE_SIMULATED"
        };

        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setPlacedOrder(data.order);
              setCurrentStep('success');
              clearCart();
            }
          })
          .catch(err => console.error(err))
          .finally(() => setLoading(false));
      } else {
        // Real Stripe flow: order is already created by Stripe Webhook. Just fetch it.
        fetch('/api/orders')
          .then(res => res.json())
          .then(data => {
            if (data.orders && data.orders.length > 0) {
              setPlacedOrder(data.orders[0]);
              setCurrentStep('success');
              clearCart();
            }
          })
          .catch(err => console.error(err))
          .finally(() => setLoading(false));
      }
    }
  }, [searchParams, user]);

  // Form Validations
  const validateAddress = () => {
    const { recipient, street, city, state, postalCode, phone } = address;
    if (!recipient || !street || !city || !state || !postalCode || !phone) {
      setErrorMsg("Please populate all address credentials.");
      return false;
    }
    setErrorMsg('');
    localStorage.setItem('nexcart-address', JSON.stringify(address));
    return true;
  };

  const validateCard = () => {
    // Card details only required for local mock card checkout option
    if (paymentGateway !== 'mock') return true;
    const { number, expiry, cvc, name } = cardInfo;
    if (!number || !expiry || !cvc || !name) {
      setErrorMsg("Please populate all credit card payment details.");
      return false;
    }
    if (number.replace(/\s/g, '').length < 16) {
      setErrorMsg("Invalid credit card number.");
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      if (paymentGateway === 'stripe') {
        // Stripe payment checkout
        const res = await fetch('/api/payment/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(it => ({
              productId: it.productId,
              name: it.name,
              price: it.price,
              quantity: it.quantity,
              variantValue: it.variantValue,
              image: it.image
            })),
            successUrl: `${window.location.origin}/checkout`,
            cancelUrl: `${window.location.origin}/checkout`,
            shippingCost: finalShippingCost,
            discountAmount
          })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          setErrorMsg(data.message || "Failed to initiate Stripe Checkout.");
          setLoading(false);
        }
        return;
      }

      if (paymentGateway === 'paypal') {
        // PayPal mock express checkout integration
        const res = await fetch('/api/payment/paypal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderID: `PP-${Date.now()}`,
            items: items.map(it => ({
              productId: it.productId,
              name: it.name,
              price: it.price,
              quantity: it.quantity,
              variant: it.variantValue
            })),
            totalAmount: finalTotalAmount,
            taxAmount,
            shippingCost: finalShippingCost,
            discountAmount,
            shippingAddress: shippingString,
            appliedCoupon: coupon?.code || null
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPlacedOrder(data.order);
          setCurrentStep('success');
          clearCart();
        } else {
          setErrorMsg(data.message || "PayPal checkout transaction failed.");
        }
        setLoading(false);
        return;
      }

      // Default: Mock Card checkout
      const orderPayload = {
        items: items.map(it => ({
          productId: it.productId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          variant: it.variantValue
        })),
        totalAmount: finalTotalAmount,
        taxAmount,
        shippingCost: finalShippingCost,
        discountAmount,
        shippingAddress: shippingString,
        appliedCoupon: coupon?.code || null,
        paymentMethod: "MOCK_CARD"
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setPlacedOrder(data.order);
        setCurrentStep('success');
        clearCart();
      } else {
        setErrorMsg(data.message || "Order placement request failed.");
      }
    } catch (e) {
      setErrorMsg("Connection error failed to post checkout.");
    } finally {
      setLoading(false);
    }
  };

  // Client side PDF compilation via jsPDF
  const generateInvoicePDF = () => {
    if (!placedOrder) return;
    
    const doc = new jsPDF();
    
    // Header styling
    doc.setFillColor(15, 23, 42); // slate-900 background
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("NEXCART INVOICE", 15, 26);
    
    // Invoice details
    doc.setTextColor(60, 60, 60);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${placedOrder.orderNumber}`, 140, 18);
    doc.text(`Order Date: ${new Date(placedOrder.createdAt).toLocaleDateString()}`, 140, 24);
    doc.text(`Tracking ID: ${placedOrder.trackingNumber || 'Pending'}`, 140, 30);
    
    // Billing Details
    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DELIVERED TO:", 15, 55);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(address.recipient, 15, 61);
    doc.text(address.street, 15, 67);
    doc.text(`${address.city}, ${address.state} ${address.postalCode}`, 15, 73);
    doc.text(`${address.country} (Ph: ${address.phone})`, 15, 79);

    // Merchant details
    doc.setFont("Helvetica", "bold");
    doc.text("NEXCART CONCIERGE LOGISTICS:", 115, 55);
    doc.setFont("Helvetica", "normal");
    doc.text("NexCart Luxury Technologies Inc.", 115, 61);
    doc.text("One Infinite Loop, Suite 200", 115, 67);
    doc.text("Cupertino, CA 95014", 115, 73);
    doc.text("concierge@nexcart.luxury", 115, 79);

    // Items table header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 90, 180, 8, 'F');
    doc.setFont("Helvetica", "bold");
    doc.text("Item Details", 18, 95);
    doc.text("Qty", 125, 95);
    doc.text("Unit Price", 145, 95);
    doc.text("Total", 175, 95);
    
    let y = 105;
    doc.setFont("Helvetica", "normal");
    
    placedOrder.items.forEach((item: any) => {
      doc.text(item.name.substring(0, 50), 18, y);
      if (item.variant) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Option: ${item.variant}`, 18, y + 4);
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
      }
      doc.text(item.quantity.toString(), 125, y);
      doc.text(`$${item.price.toFixed(2)}`, 145, y);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 175, y);
      y += 14;
    });

    y += 4;
    doc.line(15, y, 195, y);
    y += 8;

    // Totals
    doc.text("Subtotal", 130, y);
    doc.text(`$${placedOrder.totalAmount.toFixed(2)}`, 175, y);
    y += 6;
    doc.text("Tax (18% inclusive)", 130, y);
    doc.text(`$${placedOrder.taxAmount.toFixed(2)}`, 175, y);
    y += 6;
    doc.text("Shipping speed", 130, y);
    doc.text(`$${placedOrder.shippingCost.toFixed(2)}`, 175, y);
    
    if (placedOrder.discountAmount > 0) {
      y += 6;
      doc.setTextColor(34, 197, 94); // Green
      doc.text(`Discount applied`, 130, y);
      doc.text(`-$${placedOrder.discountAmount.toFixed(2)}`, 175, y);
      doc.setTextColor(15, 23, 42);
    }
    
    y += 10;
    doc.line(125, y - 4, 195, y - 4);
    doc.setFont("Helvetica", "bold");
    doc.text("Total amount paid", 130, y);
    doc.text(`$${placedOrder.totalAmount.toFixed(2)}`, 175, y);

    // Footer signature
    y += 24;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Thank you for choosing NexCart. This is a secure digital invoice certificate.", 15, y);

    doc.save(`NexCart_Invoice_${placedOrder.orderNumber}.pdf`);
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Checkout Progress indicator */}
      {currentStep !== 'success' && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-semibold text-muted-foreground mb-8 border-b border-border pb-4">
          <span className={currentStep === 'address' ? 'text-accent font-bold' : ''}>1. Address</span>
          <ChevronRight className="h-3 w-3" />
          <span className={currentStep === 'delivery' ? 'text-accent font-bold' : ''}>2. Logistics</span>
          <ChevronRight className="h-3 w-3" />
          <span className={currentStep === 'payment' ? 'text-accent font-bold' : ''}>3. Secure Payment</span>
          <ChevronRight className="h-3 w-3" />
          <span className={currentStep === 'review' ? 'text-accent font-bold' : ''}>4. Review order</span>
        </div>
      )}

      {currentStep === 'success' ? (
        
        /* 5. SUCCESS SCREEN */
        <div className="text-center max-w-xl mx-auto py-16 bg-card border border-border rounded-2xl p-8 space-y-6 shadow-md transition-all">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-accent">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Order Success</span>
            <h1 className="text-2xl font-bold font-display">Receipt Confirmed</h1>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Your luxury consignment has been registered. An invoice receipt has been compiled.
            </p>
          </div>

          {placedOrder && (
            <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 text-xs space-y-3 font-semibold text-left">
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Order Reference</span><span>{placedOrder.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Tracking Number</span><span>{placedOrder.trackingNumber || 'Registering'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground font-medium">Amount Captured</span><span className="text-accent">${placedOrder.totalAmount.toFixed(2)}</span></div>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button
              onClick={generateInvoicePDF}
              className="flex-1 rounded-full bg-foreground text-background py-3 text-xs font-bold hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
            >
              <Download className="h-4.5 w-4.5" />
              Download Invoice PDF
            </button>
            <Link
              href="/"
              className="flex-1 text-center rounded-full border border-border bg-card py-3 text-xs font-bold hover:bg-secondary transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>

      ) : (

        /* ACTIVE FORM STEPS SPLIT GRID */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Columns: Forms */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            
            {/* Step error indicators */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3.5 flex items-center gap-2 text-xs text-red-500">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: SHIPPING ADDRESS */}
            {currentStep === 'address' && (
              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Home className="h-4.5 w-4.5 text-accent" />
                  Consignment Shipping Address
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={address.recipient}
                      onChange={(e) => setAddress({ ...address, recipient: e.target.value })}
                      placeholder="E.g., Victoria Sterling"
                      className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Street Address</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      placeholder="E.g., 742 Evergreen Terrace"
                      className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="Springfield"
                      className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">State</label>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        placeholder="IL"
                        className="w-full rounded border border-border bg-background px-1 py-2 text-center text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        placeholder="62704"
                        className="w-full rounded border border-border bg-background px-1 py-2 text-center text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Country</label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="+1 (555) 0199"
                      className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={() => { if (validateAddress()) setCurrentStep('delivery'); }}
                  className="w-full mt-6 rounded-full bg-foreground text-background py-3 text-xs font-bold hover:bg-foreground/90 transition-all flex items-center justify-center gap-1.5"
                >
                  Continue to Logistics Options
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* STEP 2: LOGISTICS SPEEDS */}
            {currentStep === 'delivery' && (
              <div className="space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Truck className="h-4.5 w-4.5 text-accent" />
                  Select Delivery Speed
                </h2>

                <div className="space-y-4">
                  {/* Option 1 */}
                  <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-accent">
                    <div className="flex gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === 'standard'}
                        onChange={() => setDeliveryMethod('standard')}
                        className="text-accent focus:ring-accent self-center"
                      />
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold">Standard Logistics Air</p>
                        <p className="text-muted-foreground">Fulfillment completes in 5 to 8 working business days.</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-accent">
                      {shippingCost === 0 ? 'Complimentary' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </label>

                  {/* Option 2 */}
                  <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-accent">
                    <div className="flex gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === 'express'}
                        onChange={() => setDeliveryMethod('express')}
                        className="text-accent focus:ring-accent self-center"
                      />
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold">Priority Express Air Courier</p>
                        <p className="text-muted-foreground">Premium, insured express consignment delivery in 2 to 3 days.</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-accent">$35.00</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setCurrentStep('address')}
                    className="w-1/2 rounded-full border border-border py-3 text-xs font-bold hover:bg-secondary transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep('payment')}
                    className="w-1/2 rounded-full bg-foreground text-background py-3 text-xs font-bold hover:bg-foreground/90 transition-all"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT METHOD */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4.5 w-4.5 text-accent" />
                    Select Payment Gateway
                  </h2>
                </div>

                {/* Gateway Selector Tabs */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => { setPaymentGateway('mock'); setErrorMsg(''); }}
                    className={`rounded-xl border p-4 text-center cursor-pointer transition-all ${paymentGateway === 'mock' ? 'border-accent bg-accent/5 font-bold' : 'border-border bg-card text-muted-foreground hover:border-foreground'}`}
                  >
                    <p className="text-xs">Mock Card</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentGateway('stripe'); setErrorMsg(''); }}
                    className={`rounded-xl border p-4 text-center cursor-pointer transition-all ${paymentGateway === 'stripe' ? 'border-accent bg-accent/5 font-bold' : 'border-border bg-card text-muted-foreground hover:border-foreground'}`}
                  >
                    <p className="text-xs">Stripe Portal</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentGateway('paypal'); setErrorMsg(''); }}
                    className={`rounded-xl border p-4 text-center cursor-pointer transition-all ${paymentGateway === 'paypal' ? 'border-accent bg-accent/5 font-bold' : 'border-border bg-card text-muted-foreground hover:border-foreground'}`}
                  >
                    <p className="text-xs">PayPal Express</p>
                  </button>
                </div>

                {paymentGateway === 'mock' && (
                  <div className="space-y-4 pt-2">
                    <p className="text-[10px] text-muted-foreground font-semibold">Simulated direct checkout with local credit card validations.</p>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardInfo.name}
                        onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value })}
                        placeholder="Victoria Sterling"
                        className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardInfo.number}
                        onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substring(0, 19) })}
                        placeholder="4111 2222 3333 4444"
                        className="w-full rounded border border-border bg-background px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Expiration Date</label>
                        <input
                          type="text"
                          value={cardInfo.expiry}
                          onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value.replace(/\D/g, '').replace(/(.{2})/g, '$1/').substring(0, 5).replace(/\/$/, '') })}
                          placeholder="MM/YY"
                          className="w-full rounded border border-border bg-background py-2 text-center text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">CVC Code</label>
                        <input
                          type="password"
                          value={cardInfo.cvc}
                          onChange={(e) => setCardInfo({ ...cardInfo, cvc: e.target.value.replace(/\D/g, '').substring(0, 3) })}
                          placeholder="123"
                          className="w-full rounded border border-border bg-background py-2 text-center text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentGateway === 'stripe' && (
                  <div className="bg-secondary/40 border border-border rounded-xl p-4 text-xs space-y-1.5 leading-relaxed">
                    <p className="font-bold text-foreground">Redirecting to Stripe</p>
                    <p className="text-muted-foreground">Upon clicking Review, we will prepare your consignment lines and forward you securely to Stripe to execute a verified credit card capture. Works dynamically in mock mode if Stripe keys are missing.</p>
                  </div>
                )}

                {paymentGateway === 'paypal' && (
                  <div className="bg-secondary/40 border border-border rounded-xl p-4 text-xs space-y-1.5 leading-relaxed">
                    <p className="font-bold text-foreground">Express PayPal Checkout</p>
                    <p className="text-muted-foreground">Select Review Order to trigger simulated capture of funds directly via PayPal Express Checkout adapter.</p>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => setCurrentStep('delivery')}
                    className="w-1/2 rounded-full border border-border py-3 text-xs font-bold hover:bg-secondary transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => { if (validateCard()) setCurrentStep('review'); }}
                    className="w-1/2 rounded-full bg-foreground text-background py-3 text-xs font-bold hover:bg-foreground/90 transition-all"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW ORDER */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-accent" />
                  Review Details &amp; Place Order
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl border border-border bg-secondary/30 text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Shipping Consignment Destination</p>
                    <p className="font-semibold">{address.recipient}</p>
                    <p className="text-muted-foreground leading-normal">{address.street}, {address.city}, {address.state} - {address.postalCode}, {address.country}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Logistics &amp; Payment Options</p>
                    <p className="font-semibold">Courier Speed: <span className="text-accent uppercase">{deliveryMethod}</span></p>
                    <p className="text-muted-foreground">Payment type: Card ending in **** {cardInfo.number.slice(-4)}</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setCurrentStep('payment')}
                    className="w-1/2 rounded-full border border-border py-3 text-xs font-bold hover:bg-secondary transition-all"
                    disabled={loading}
                  >
                    Back
                  </button>
                  {paymentGateway === 'paypal' && paypalClientId && !paypalClientId.includes('placeholder') ? (
                    <div className="w-1/2">
                      <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
                        <PayPalButtons
                          style={{ layout: "horizontal", height: 38, color: "gold", shape: "pill", label: "pay" }}
                          disabled={loading}
                          createOrder={async () => {
                            setLoading(true);
                            setErrorMsg('');
                            try {
                              const res = await fetch('/api/payment/paypal/create-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ totalAmount: finalTotalAmount })
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.message || "Failed to initiate PayPal order.");
                              return data.id;
                            } catch (e: any) {
                              setErrorMsg(e.message || "PayPal checkout initiation failed.");
                              setLoading(false);
                              return '';
                            }
                          }}
                          onApprove={async (data, actions) => {
                            try {
                              const res = await fetch('/api/payment/paypal/capture-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  orderID: data.orderID,
                                  items: items.map(it => ({
                                    productId: it.productId,
                                    name: it.name,
                                    price: it.price,
                                    quantity: it.quantity,
                                    variant: it.variantValue
                                  })),
                                  totalAmount: finalTotalAmount,
                                  taxAmount,
                                  shippingCost: finalShippingCost,
                                  discountAmount,
                                  shippingAddress: shippingString,
                                  appliedCoupon: coupon?.code || null
                                })
                              });
                              const result = await res.json();
                              if (res.ok && result.success) {
                                setPlacedOrder(result.order);
                                setCurrentStep('success');
                                clearCart();
                              } else {
                                setErrorMsg(result.message || "PayPal checkout transaction capture failed.");
                              }
                            } catch (e) {
                              setErrorMsg("Internal checkout connection error.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          onError={(err) => {
                            console.error("PayPal Smart Button Error:", err);
                            setErrorMsg("The PayPal checkout gateway encountered an error.");
                            setLoading(false);
                          }}
                        />
                      </PayPalScriptProvider>
                    </div>
                  ) : (
                    <button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="w-1/2 rounded-full bg-accent text-accent-foreground py-3 text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Place Secure Order'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Checkout Summary (Items list and total details) */}
          <div className="space-y-4 sticky top-20">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-accent" />
                Checkout Summary
              </h3>

              {/* Items iteration */}
              <div className="max-h-48 overflow-y-auto divide-y divide-border/60 pr-1.5">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 text-xs items-center">
                    <img src={item.image} alt="" className="h-12 w-12 rounded bg-muted object-cover border border-border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Qty: {item.quantity} {item.variantValue && `| Option: ${item.variantValue}`}</p>
                    </div>
                    <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdowns */}
              <div className="text-xs border-t border-border pt-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Total</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT / Sales Tax (18% code)</span>
                  <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Courier Speed Delivery</span>
                  <span className="font-semibold">
                    {finalShippingCost > 0 ? `$${finalShippingCost.toFixed(2)}` : 'Complimentary'}
                  </span>
                </div>
                
                {coupon && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                    <span>Discount applied ({coupon.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold pt-4 border-t border-border">
                  <span>Grand Total</span>
                  <span className="text-accent">${finalTotalAmount.toFixed(2)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <CheckoutPageInner />
    </Suspense>
  );
}
