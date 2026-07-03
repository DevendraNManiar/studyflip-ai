'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MessageSquare, X, Send, Sparkles, Percent, Truck, CreditCard, Tag, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  images: string[];
  description: string;
  categoryId: string;
}

interface Message {
  sender: 'bot' | 'user';
  text: string;
  products?: Product[];
}

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hello! I am your personal NexCart Curation Concierge. I can recommend timepieces, audio gear, or leather goods, search our premium catalog, find discount coupons, or explain shipping speeds. How may I assist you today?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Fetch products catalog on mount to enable real-time local search recommendations
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products?limit=50');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Failed to load products list for AI Assistant search context", err);
      }
    }
    loadProducts();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const response = generateBotResponse(textToSend);
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 600);
  };

  const generateBotResponse = (text: string): Message => {
    const query = text.toLowerCase().trim();

    // 1. COUPON CODES QUERY
    if (query.includes('coupon') || query.includes('code') || query.includes('discount') || query.includes('promo')) {
      return {
        sender: 'bot',
        text: "Here are our active promotional certificates for checkout discount credits:\n\n• **LUXURY50**: $50 off flat discount credit (Minimum checkout amount applies).\n• **NEXWELCOME10**: 10% off percentage discount applied across all items.\n\nYou can input these promo codes directly in your Shopping Bag summary before proceeding to checkout!"
      };
    }

    // 2. SHIPPING / LOGISTICS SPEEDS
    if (query.includes('shipping') || query.includes('delivery') || query.includes('courier') || query.includes('express') || query.includes('speed')) {
      return {
        sender: 'bot',
        text: "NexCart offers two bespoke logistics delivery classes:\n\n• **Standard Logistics Air**: 5 to 8 working business days. Fully complimentary for orders over $300 (else $15).\n• **Priority Express Air Courier**: 2 to 3 days courier. Insured premium logistics handling for a flat rate of $35.\n\nYou can select your speed in the checkout portal after adding your address details."
      };
    }

    // 3. PAYMENT INTEGRATION INFO
    if (query.includes('payment') || query.includes('pay') || query.includes('stripe') || query.includes('paypal') || query.includes('card')) {
      return {
        sender: 'bot',
        text: "We support industry-standard secure payment checkouts:\n\n• **Stripe Checkout Portal**: Insured, direct client card integrations for MasterCard, Visa, American Express, and Discover.\n• **PayPal Smart Buttons**: Express checkout using credit cards or your PayPal account balance.\n\nTransactions are processed securely via server-side REST API captures. You can configure credentials in `.env` to switch them from sandbox to live."
      };
    }

    // 4. PRODUCT RECOMMENDATION BY CATEGORIES
    if (query.includes('audio') || query.includes('headphone') || query.includes('speaker') || query.includes('acoustics')) {
      const audioProds = products.filter(p => p.categoryId === 'cat-1' || p.slug.includes('audio') || p.slug.includes('headphone'));
      return {
        sender: 'bot',
        text: "I highly recommend checking out our acoustics collection. Here are our premium audio devices:",
        products: audioProds.slice(0, 3)
      };
    }

    if (query.includes('watch') || query.includes('timepiece') || query.includes('chronograph') || query.includes('clock')) {
      const watchProds = products.filter(p => p.categoryId === 'cat-2' || p.slug.includes('watch') || p.slug.includes('timepiece') || p.slug.includes('chronograph'));
      return {
        sender: 'bot',
        text: "Our timepieces represent Swiss mechanical horology and titanium wearables. Take a look at these curations:",
        products: watchProds.slice(0, 3)
      };
    }

    if (query.includes('bag') || query.includes('leather') || query.includes('duffel') || query.includes('wallet')) {
      const bagProds = products.filter(p => p.categoryId === 'cat-3' || p.slug.includes('bag') || p.slug.includes('leather') || p.slug.includes('duffel'));
      return {
        sender: 'bot',
        text: "For travel and design, our handcrafted full-grain leather bags develop a gorgeous patina. Here are our leather goods:",
        products: bagProds.slice(0, 3)
      };
    }

    // 5. NATURAL LANGUAGE PRODUCT SEARCH MATCHES
    const keywordMatches = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    );

    if (query.length > 2 && keywordMatches.length > 0) {
      return {
        sender: 'bot',
        text: `I found ${keywordMatches.length} item(s) matching "${text}" in our luxury catalog:`,
        products: keywordMatches.slice(0, 3)
      };
    }

    // 6. DEFAULT CURIOSITY FALLBACK
    return {
      sender: 'bot',
      text: "I am here to guide your luxury consignment shopping experience. Try asking me:\n\n• *\"Do you have any watches?\"*\n• *\"What active coupons can I use?\"*\n• *\"Tell me about express shipping speeds\"*\n• *\"How do I pay with Stripe or PayPal?\"*"
    };
  };

  const suggestedQuestions = [
    { text: "🏷️ Promo Coupon Codes", query: "What active coupon codes do you have?" },
    { text: "💼 Curation Bags", query: "Recommend a luxury bag" },
    { text: "⌚ Chrono Watches", query: "Do you have any premium watches?" },
    { text: "✈️ Shipping Options", query: "What is your fastest shipping delivery speed?" }
  ];

  return (
    <>
      {/* Floating Chat Bubble Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-xl hover:scale-105 hover:bg-accent/90 active:scale-95 transition-all duration-300 border border-accent/30 cursor-pointer"
        aria-label="Toggle AI Curation Assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground text-background text-[8px] font-bold animate-pulse">
              AI
            </span>
          </div>
        )}
      </button>

      {/* Expandable Chat Widget Frame */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-[370px] sm:max-w-[400px] h-[500px] rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Glassmorphic Header */}
          <div className="p-4 border-b border-border bg-secondary/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-display text-foreground leading-none">Curation Concierge</h3>
                <p className="text-[9px] text-muted-foreground mt-0.5">Virtual Luxury Assistant • Online</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs p-1"
              aria-label="Close Chat"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages scroll content area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-foreground text-background font-medium rounded-tr-none' : 'bg-secondary text-foreground rounded-tl-none border border-border/50'}`}>
                  {msg.text}
                </div>

                {/* Inline product recommendations preview list */}
                {msg.products && msg.products.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pt-2 w-full max-w-[85%]">
                    {msg.products.map(prod => (
                      <Link 
                        key={prod.id} 
                        href={`/products/${prod.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-2 bg-card border border-border hover:border-accent rounded-xl transition-all cursor-pointer"
                      >
                        <img 
                          src={prod.images[0]} 
                          alt="" 
                          className="h-10 w-10 rounded-lg object-cover bg-muted border border-border/80 shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate text-[11px] text-foreground font-display leading-tight">{prod.name}</p>
                          <p className="text-[10px] text-accent font-semibold mt-0.5">${prod.price.toFixed(2)}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 pr-1" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading typing bubble */}
            {loading && (
              <div className="flex items-center gap-1.5 p-2 bg-secondary rounded-xl w-16 border border-border/30">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Pre-defined prompt tags suggestion shelf */}
          {messages.length === 1 && (
            <div className="px-4 py-2.5 border-t border-border bg-secondary/10 flex gap-2 overflow-x-auto scrollbar-none shrink-0 py-1.5 select-none">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.query)}
                  className="rounded-full border border-border bg-card hover:border-accent hover:bg-secondary px-3 py-1 text-[9px] font-bold text-muted-foreground hover:text-foreground shrink-0 transition-all cursor-pointer"
                >
                  {q.text}
                </button>
              ))}
            </div>
          )}

          {/* User message input submission footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="p-4 border-t border-border bg-secondary/30 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for recommendations, coupons, shipping..."
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-xs focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-foreground text-background h-8 w-8 flex items-center justify-center hover:bg-foreground/90 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Send Message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
