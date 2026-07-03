export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface MockBrand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
}

export interface MockProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  richText: string;
  sku: string;
  barcode: string;
  price: number;
  discountPrice?: number;
  tax: number;
  weight: number;
  stock: number;
  images: string[];
  videoUrl?: string;
  rating: number;
  categoryId: string;
  brandId: string;
  variants: { id: string; name: string; value: string; price?: number; stock: number }[];
  reviews: MockReview[];
}

export interface MockReview {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MockCoupon {
  id: string;
  code: string;
  discount: number;
  isFlat: boolean;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
}

export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: "cat-1",
    name: "Acoustics & Audio",
    slug: "acoustics-audio",
    description: "Immersive luxury audio gear designed for audiophiles.",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cat-2",
    name: "Timepieces",
    slug: "timepieces",
    description: "Precision chronographs and mechanical horology.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cat-3",
    name: "Leather Goods",
    slug: "leather-goods",
    description: "Handcrafted full-grain leather bags and travel accessories.",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "cat-4",
    name: "Wearables",
    slug: "wearables",
    description: "Sleek smart wearables merging tech with design.",
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80"
  }
];

export const MOCK_BRANDS: MockBrand[] = [
  {
    id: "brand-1",
    name: "Aero",
    slug: "aero",
    description: "Modern minimalist design philosophy.",
    logo: "/brands/aero.png"
  },
  {
    id: "brand-2",
    name: "Chronos",
    slug: "chronos",
    description: "Timeless Swiss legacy craft.",
    logo: "/brands/chronos.png"
  },
  {
    id: "brand-3",
    name: "Atelier",
    slug: "atelier",
    description: "Artisanal leatherwork.",
    logo: "/brands/atelier.png"
  }
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "prod-1",
    name: "Aero Max Wireless Studio Headphones",
    slug: "aero-max-wireless-studio",
    description: "Experience premium active noise-cancelling luxury. Featuring custom high-excursion dynamic drivers, personalized spatial audio with dynamic head tracking, and up to 30 hours of battery life with single-piece anodized aluminum ear cups.",
    richText: "<h3>The Ultimate Listening Experience</h3><p>Designed with custom acoustics, custom-built driver systems, and dual H2-chip performance, the Aero Max redefines spatial audio. The memory foam cushions are wrapped in a custom textile mesh providing pillow-like softness.</p>",
    sku: "AERO-HEAD-MAX-001",
    barcode: "8400293021",
    price: 549.00,
    discountPrice: 499.00,
    tax: 18.0,
    weight: 0.38,
    stock: 24,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    rating: 4.8,
    categoryId: "cat-1",
    brandId: "brand-1",
    variants: [
      { id: "v1-1", name: "Color", value: "Space Grey", stock: 10 },
      { id: "v1-2", name: "Color", value: "Satin Gold", price: 599.00, stock: 8 },
      { id: "v1-3", name: "Color", value: "Alpine Silver", stock: 6 }
    ],
    reviews: [
      {
        id: "rev-1",
        userId: "user-cust",
        userName: "Sarah Jenkins",
        userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
        productId: "prod-1",
        rating: 5,
        comment: "Absolutely outstanding soundstage. Build quality is luxury at its finest. Noise cancellation is spooky good.",
        createdAt: "2026-05-10T14:32:00.000Z"
      },
      {
        id: "rev-2",
        userId: "user-admin",
        userName: "Alex Rivers",
        userImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
        productId: "prod-1",
        rating: 4,
        comment: "Sounds sublime. Slightly heavy on the neck after 4 hours of consecutive use, but the audio makes up for it.",
        createdAt: "2026-06-01T09:15:00.000Z"
      }
    ]
  },
  {
    id: "prod-2",
    name: "Chronos Legacy Automatic Chronograph",
    slug: "chronos-legacy-automatic-chronograph",
    description: "A masterclass in horological precision. Hand-assembled self-winding mechanics, premium double-domed sapphire crystal face, and a bespoke vegetable-tanned Italian calfskin strap.",
    richText: "<p>The Chronos Legacy is our homage to historic motorsports watchcraft. Powered by the caliber CR-90 automatic movement with a 48-hour reserve, and visible through an exhibition sapphire caseback.</p>",
    sku: "CHRO-TIME-LEG-002",
    barcode: "8400293022",
    price: 1850.00,
    tax: 18.0,
    weight: 0.15,
    stock: 8,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=80"
    ],
    rating: 4.9,
    categoryId: "cat-2",
    brandId: "brand-2",
    variants: [
      { id: "v2-1", name: "Strap", value: "Midnight Black Leather", stock: 4 },
      { id: "v2-2", name: "Strap", value: "Cognac Brown Leather", stock: 4 }
    ],
    reviews: [
      {
        id: "rev-3",
        userId: "user-cust",
        userName: "Jonathan K.",
        productId: "prod-2",
        rating: 5,
        comment: "This piece is breathtaking. The sweep of the second hand is liquid-smooth. A true heirloom watch.",
        createdAt: "2026-05-24T18:22:00.000Z"
      }
    ]
  },
  {
    id: "prod-3",
    name: "Atelier Full-Grain Leather Duffel Bag",
    slug: "atelier-full-grain-leather-duffel",
    description: "The ultimate weekender companion. Crafted from water-resistant, vegetable-tanned full-grain leather that will develop a unique vintage patina. Solid brass hardware and zippers.",
    richText: "<p>Designed for multi-day voyages. Includes a dedicated padded compartment for 16-inch laptops, an isolated waterproof shoe drawer, and a detachable custom woven shoulder strap.</p>",
    sku: "ATE-BAG-DUF-003",
    barcode: "8400293023",
    price: 380.00,
    discountPrice: 320.00,
    tax: 18.0,
    weight: 1.8,
    stock: 15,
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80"
    ],
    rating: 4.7,
    categoryId: "cat-3",
    brandId: "brand-3",
    variants: [
      { id: "v3-1", name: "Color", value: "Tan Brown", stock: 8 },
      { id: "v3-2", name: "Color", value: "Espresso Black", stock: 7 }
    ],
    reviews: []
  },
  {
    id: "prod-4",
    name: "Aero Watch Pro Smart Wearable",
    slug: "aero-watch-pro-smart-wearable",
    description: "Luxury meets intelligence. Titanium chassis, ultra-bright Always-On Retina OLED display, advanced ECG cardiac sensors, GPS route-tracking, and a breathable custom elastomer ocean band.",
    richText: "<p>The Aero Watch Pro is built to withstand extreme environments. Featuring 100m water resistance, dual-frequency precision GPS, and comprehensive athletic tracking sensors.</p>",
    sku: "AERO-WATCH-PRO-004",
    barcode: "8400293024",
    price: 799.00,
    tax: 18.0,
    weight: 0.06,
    stock: 32,
    images: [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=1000&q=80"
    ],
    rating: 4.6,
    categoryId: "cat-4",
    brandId: "brand-1",
    variants: [
      { id: "v4-1", name: "Case Size", value: "45mm Titanium", stock: 20 },
      { id: "v4-2", name: "Case Size", value: "49mm Ultra Titanium", price: 899.00, stock: 12 }
    ],
    reviews: [
      {
        id: "rev-4",
        userId: "user-cust",
        userName: "Emma Watson",
        productId: "prod-4",
        rating: 4,
        comment: "Excellent battery life (easily gets 3 full days), looks wonderful with formal clothing too.",
        createdAt: "2026-06-03T11:45:00.000Z"
      }
    ]
  }
];

export const MOCK_COUPONS: MockCoupon[] = [
  {
    id: "coup-1",
    code: "NEXWELCOME10",
    discount: 10,
    isFlat: false,
    expiryDate: "2026-12-31T23:59:59.000Z",
    usageLimit: 500,
    usageCount: 42,
    isActive: true
  },
  {
    id: "coup-2",
    code: "LUXURY50",
    discount: 50,
    isFlat: true,
    expiryDate: "2026-09-30T23:59:59.000Z",
    usageLimit: 100,
    usageCount: 15,
    isActive: true
  }
];
