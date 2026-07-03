import fs from 'fs';
import path from 'path';
import prisma from './db';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BRANDS, MOCK_COUPONS, MockProduct, MockCategory, MockBrand, MockCoupon, MockReview } from './mockData';

// Paths for persistent JSON database fallbacks
const DB_DIR = path.join(process.cwd(), 'public', 'database');
const FILES = {
  users: path.join(DB_DIR, 'users.json'),
  products: path.join(DB_DIR, 'products.json'),
  categories: path.join(DB_DIR, 'categories.json'),
  brands: path.join(DB_DIR, 'brands.json'),
  orders: path.join(DB_DIR, 'orders.json'),
  coupons: path.join(DB_DIR, 'coupons.json'),
  reviews: path.join(DB_DIR, 'reviews.json'),
  auditLogs: path.join(DB_DIR, 'audit_logs.json'),
  newsletters: path.join(DB_DIR, 'newsletters.json'),
  notifications: path.join(DB_DIR, 'notifications.json'),
  addresses: path.join(DB_DIR, 'addresses.json'),
};

// Memory fallback cache in case of serverless file writing issues
const memoryDb: Record<string, any[]> = {};

function initLocalFolder() {
  if (typeof window !== 'undefined') return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn("Could not create local JSON database folder. Using in-memory fallback.", e);
  }
}

function readJsonFile<T>(key: keyof typeof FILES, defaultData: T[]): T[] {
  if (typeof window !== 'undefined') return defaultData;
  initLocalFolder();
  const filePath = FILES[key];
  try {
    if (fs.existsSync(filePath)) {
      const dataStr = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(dataStr);
    }
  } catch (e) {
    console.warn(`Error reading local JSON db file for ${key}:`, e);
  }
  
  if (!memoryDb[key]) {
    memoryDb[key] = defaultData;
  }
  return memoryDb[key];
}

function writeJsonFile<T>(key: keyof typeof FILES, data: T[]): boolean {
  if (typeof window !== 'undefined') return false;
  initLocalFolder();
  const filePath = FILES[key];
  memoryDb[key] = data;
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn(`Error writing local JSON db file for ${key}:`, e);
    return false;
  }
}

// Check if PostgreSQL is actually available
let isDbOnline: boolean | null = null;
async function checkDbConnection(): Promise<boolean> {
  if (isDbOnline !== null) return isDbOnline;
  
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('placeholder') || url.includes('localhost:5432/nexcart')) {
    console.log("ℹ️ [NexCart] Using persistent local JSON database (DB_URL is placeholder or default).");
    isDbOnline = false;
    return false;
  }

  try {
    // Try a quick light query
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ [NexCart] Successfully connected to PostgreSQL Database!");
    isDbOnline = true;
    return true;
  } catch (e) {
    console.warn("⚠️ [NexCart] Database connection failed. Falling back to persistent local JSON files.");
    isDbOnline = false;
    return false;
  }
}

// Wrapper for safe execution
export async function runDb<T = any>(prismaCall: () => Promise<any>, fallbackCall: () => Promise<any> | any): Promise<any> {
  const online = await checkDbConnection();
  if (online) {
    try {
      return await prismaCall();
    } catch (e) {
      console.error("Database query failed on active connection, falling back to local storage...", e);
      return await fallbackCall();
    }
  }
  return await fallbackCall();
}

// Define data interfaces
export interface DbUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'CUSTOMER' | 'ADMIN';
  image?: string;
  createdAt: string;
}

export interface DbAddress {
  id: string;
  userId: string;
  name: string;
  recipient: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface DbOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  totalAmount: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  shippingAddress: string;
  trackingNumber?: string;
  appliedCoupon?: string;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
  }[];
  payment?: {
    id: string;
    paymentMethod: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    transactionId: string;
    amount: number;
    createdAt: string;
  };
}

export interface DbAuditLog {
  id: string;
  userId?: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

// Exportable Service Layer
export const dbService = {
  // PRODUCTS
  getProducts: async () => {
    return runDb(
      () => prisma.product.findMany({ include: { category: true, brand: true, variants: true, reviews: true } }),
      () => {
        const prods = readJsonFile<MockProduct>('products', MOCK_PRODUCTS);
        const cats = readJsonFile<MockCategory>('categories', MOCK_CATEGORIES);
        const brs = readJsonFile<MockBrand>('brands', MOCK_BRANDS);
        return prods.map(p => ({
          ...p,
          category: cats.find(c => c.id === p.categoryId) || null,
          brand: brs.find(b => b.id === p.brandId) || null,
        }));
      }
    );
  },

  getProductBySlug: async (slug: string) => {
    return runDb(
      () => prisma.product.findUnique({ where: { slug }, include: { category: true, brand: true, variants: true, reviews: true } }),
      () => {
        const prods = readJsonFile<MockProduct>('products', MOCK_PRODUCTS);
        const cats = readJsonFile<MockCategory>('categories', MOCK_CATEGORIES);
        const brs = readJsonFile<MockBrand>('brands', MOCK_BRANDS);
        const p = prods.find(item => item.slug === slug);
        if (!p) return null;
        return {
          ...p,
          category: cats.find(c => c.id === p.categoryId) || null,
          brand: brs.find(b => b.id === p.brandId) || null,
        };
      }
    );
  },

  createProduct: async (productData: any) => {
    return runDb(
      () => prisma.product.create({ data: productData }),
      () => {
        const prods = readJsonFile<any>('products', MOCK_PRODUCTS);
        const newProduct = {
          id: `prod-${Date.now()}`,
          rating: 0,
          reviews: [],
          variants: [],
          ...productData,
          createdAt: new Date().toISOString()
        };
        prods.push(newProduct);
        writeJsonFile('products', prods);
        return newProduct;
      }
    );
  },

  updateProduct: async (id: string, productData: any) => {
    return runDb(
      () => prisma.product.update({ where: { id }, data: productData }),
      () => {
        const prods = readJsonFile<any>('products', MOCK_PRODUCTS);
        const index = prods.findIndex((p: any) => p.id === id);
        if (index === -1) throw new Error("Product not found");
        prods[index] = { ...prods[index], ...productData, updatedAt: new Date().toISOString() };
        writeJsonFile('products', prods);
        return prods[index];
      }
    );
  },

  deleteProduct: async (id: string) => {
    return runDb(
      () => prisma.product.delete({ where: { id } }),
      () => {
        const prods = readJsonFile<any>('products', MOCK_PRODUCTS);
        const filtered = prods.filter((p: any) => p.id !== id);
        writeJsonFile('products', filtered);
        return { id };
      }
    );
  },

  // CATEGORIES
  getCategories: async () => {
    return runDb(
      () => prisma.category.findMany({ include: { products: true } }),
      () => readJsonFile<MockCategory>('categories', MOCK_CATEGORIES)
    );
  },

  createCategory: async (categoryData: any) => {
    return runDb(
      () => prisma.category.create({ data: categoryData }),
      () => {
        const cats = readJsonFile<any>('categories', MOCK_CATEGORIES);
        const newCat = {
          id: `cat-${Date.now()}`,
          slug: categoryData.name.toLowerCase().replace(/ /g, '-'),
          ...categoryData,
          createdAt: new Date().toISOString()
        };
        cats.push(newCat);
        writeJsonFile('categories', cats);
        return newCat;
      }
    );
  },

  updateCategory: async (id: string, data: any) => {
    return runDb(
      () => prisma.category.update({ where: { id }, data }),
      () => {
        const cats = readJsonFile<any>('categories', MOCK_CATEGORIES);
        const idx = cats.findIndex((c: any) => c.id === id);
        if (idx === -1) throw new Error("Category not found");
        cats[idx] = { ...cats[idx], ...data };
        writeJsonFile('categories', cats);
        return cats[idx];
      }
    );
  },

  deleteCategory: async (id: string) => {
    return runDb(
      () => prisma.category.delete({ where: { id } }),
      () => {
        const cats = readJsonFile<any>('categories', MOCK_CATEGORIES);
        const filtered = cats.filter((c: any) => c.id !== id);
        writeJsonFile('categories', filtered);
        return { id };
      }
    );
  },

  // BRANDS
  getBrands: async () => {
    return runDb(
      () => prisma.brand.findMany(),
      () => readJsonFile<MockBrand>('brands', MOCK_BRANDS)
    );
  },

  createBrand: async (brandData: any) => {
    return runDb(
      () => prisma.brand.create({ data: brandData }),
      () => {
        const brands = readJsonFile<any>('brands', MOCK_BRANDS);
        const newBrand = {
          id: `brand-${Date.now()}`,
          slug: brandData.name.toLowerCase().replace(/ /g, '-'),
          ...brandData,
          createdAt: new Date().toISOString()
        };
        brands.push(newBrand);
        writeJsonFile('brands', brands);
        return newBrand;
      }
    );
  },

  // USERS & AUTHENTICATION
  getUsers: async () => {
    return runDb(
      () => prisma.user.findMany(),
      () => readJsonFile<DbUser>('users', getInitialUsers())
    );
  },

  getUserByEmail: async (email: string) => {
    return runDb(
      () => prisma.user.findUnique({ where: { email } }),
      async () => {
        const users = readJsonFile<DbUser>('users', getInitialUsers());
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      }
    );
  },

  createUser: async (userData: any) => {
    return runDb(
      () => prisma.user.create({ data: userData }),
      async () => {
        const users = readJsonFile<DbUser>('users', getInitialUsers());
        const newUser = {
          id: `user-${Date.now()}`,
          role: 'CUSTOMER',
          createdAt: new Date().toISOString(),
          ...userData,
        };
        users.push(newUser);
        writeJsonFile('users', users);
        return newUser;
      }
    );
  },

  updateUser: async (id: string, data: any) => {
    return runDb(
      () => prisma.user.update({ where: { id }, data }),
      () => {
        const users = readJsonFile<any>('users', getInitialUsers());
        const idx = users.findIndex((u: any) => u.id === id);
        if (idx === -1) throw new Error("User not found");
        users[idx] = { ...users[idx], ...data };
        writeJsonFile('users', users);
        return users[idx];
      }
    );
  },

  // ADDRESSES
  getAddresses: async (userId: string) => {
    return runDb(
      () => prisma.address.findMany({ where: { userId } }),
      () => {
        const allAddresses = readJsonFile<DbAddress>('addresses', getInitialAddresses());
        return allAddresses.filter(addr => addr.userId === userId);
      }
    );
  },

  addAddress: async (userId: string, data: any) => {
    return runDb(
      () => {
        if (data.isDefault) {
          // Unset others
          return prisma.$transaction([
            prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
            prisma.address.create({ data: { ...data, userId } })
          ]).then(res => res[1]);
        }
        return prisma.address.create({ data: { ...data, userId } });
      },
      () => {
        const allAddresses = readJsonFile<DbAddress>('addresses', getInitialAddresses());
        if (data.isDefault) {
          allAddresses.forEach(addr => {
            if (addr.userId === userId) addr.isDefault = false;
          });
        }
        const newAddr = {
          id: `addr-${Date.now()}`,
          userId,
          ...data,
        };
        allAddresses.push(newAddr);
        writeJsonFile('addresses', allAddresses);
        return newAddr;
      }
    );
  },

  deleteAddress: async (id: string, userId: string) => {
    return runDb(
      () => prisma.address.delete({ where: { id } }),
      () => {
        const allAddresses = readJsonFile<DbAddress>('addresses', getInitialAddresses());
        const filtered = allAddresses.filter(addr => addr.id !== id);
        writeJsonFile('addresses', filtered);
        return { id };
      }
    );
  },

  // COUPONS
  getCoupons: async () => {
    return runDb(
      () => prisma.coupon.findMany(),
      () => readJsonFile<MockCoupon>('coupons', MOCK_COUPONS)
    );
  },

  getCouponByCode: async (code: string) => {
    return runDb(
      () => prisma.coupon.findUnique({ where: { code } }),
      () => {
        const coupons = readJsonFile<MockCoupon>('coupons', MOCK_COUPONS);
        return coupons.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
      }
    );
  },

  createCoupon: async (couponData: any) => {
    return runDb(
      () => prisma.coupon.create({ data: couponData }),
      () => {
        const coupons = readJsonFile<any>('coupons', MOCK_COUPONS);
        const newCoupon = {
          id: `coup-${Date.now()}`,
          usageCount: 0,
          isActive: true,
          ...couponData,
          createdAt: new Date().toISOString()
        };
        coupons.push(newCoupon);
        writeJsonFile('coupons', coupons);
        return newCoupon;
      }
    );
  },

  deleteCoupon: async (id: string) => {
    return runDb(
      () => prisma.coupon.delete({ where: { id } }),
      () => {
        const coupons = readJsonFile<any>('coupons', MOCK_COUPONS);
        const filtered = coupons.filter((c: any) => c.id !== id);
        writeJsonFile('coupons', filtered);
        return { id };
      }
    );
  },

  // ORDERS
  getOrders: async () => {
    return runDb(
      () => prisma.order.findMany({ include: { items: true, payments: true, user: true }, orderBy: { createdAt: 'desc' } }),
      () => readJsonFile<DbOrder>('orders', [])
    );
  },

  getOrdersByUserId: async (userId: string) => {
    return runDb(
      () => prisma.order.findMany({ where: { userId }, include: { items: true, payments: true }, orderBy: { createdAt: 'desc' } }),
      () => {
        const orders = readJsonFile<DbOrder>('orders', []);
        return orders.filter(o => o.userId === userId);
      }
    );
  },

  getOrderById: async (id: string) => {
    return runDb(
      () => prisma.order.findUnique({ where: { id }, include: { items: true, payments: true, user: true } }),
      () => {
        const orders = readJsonFile<DbOrder>('orders', []);
        return orders.find(o => o.id === id || o.orderNumber === id) || null;
      }
    );
  },

  createOrder: async (orderData: any) => {
    return runDb(
      () => {
        return prisma.order.create({
          data: {
            orderNumber: orderData.orderNumber,
            userId: orderData.userId,
            status: orderData.status,
            totalAmount: orderData.totalAmount,
            taxAmount: orderData.taxAmount,
            shippingCost: orderData.shippingCost,
            discountAmount: orderData.discountAmount,
            shippingAddress: orderData.shippingAddress,
            trackingNumber: orderData.trackingNumber,
            appliedCoupon: orderData.appliedCoupon,
            items: {
              create: orderData.items.map((item: any) => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                variant: item.variant
              }))
            },
            payments: {
              create: {
                paymentMethod: orderData.payment.paymentMethod,
                status: orderData.payment.status,
                transactionId: orderData.payment.transactionId,
                amount: orderData.payment.amount
              }
            }
          },
          include: { items: true, payments: true }
        });
      },
      () => {
        const orders = readJsonFile<DbOrder>('orders', []);
        const newOrder: DbOrder = {
          id: `ord-${Date.now()}`,
          orderNumber: orderData.orderNumber,
          userId: orderData.userId,
          status: orderData.status || 'PENDING',
          totalAmount: orderData.totalAmount,
          taxAmount: orderData.taxAmount,
          shippingCost: orderData.shippingCost,
          discountAmount: orderData.discountAmount || 0,
          shippingAddress: orderData.shippingAddress,
          trackingNumber: orderData.trackingNumber || `TRK${Math.floor(10000000 + Math.random() * 90000000)}`,
          appliedCoupon: orderData.appliedCoupon,
          createdAt: new Date().toISOString(),
          items: orderData.items.map((it: any) => ({ id: `ordit-${Date.now()}-${Math.random()}`, ...it })),
          payment: {
            id: `pay-${Date.now()}`,
            paymentMethod: orderData.payment?.paymentMethod || 'MOCK',
            status: orderData.payment?.status || 'PENDING',
            transactionId: orderData.payment?.transactionId || `txn_${Date.now()}`,
            amount: orderData.payment?.amount || orderData.totalAmount,
            createdAt: new Date().toISOString()
          }
        };
        orders.unshift(newOrder); // Add to beginning
        writeJsonFile('orders', orders);
        return newOrder;
      }
    );
  },

  updateOrderStatus: async (id: string, status: any, trackingNumber?: string) => {
    return runDb(
      () => prisma.order.update({ where: { id }, data: { status, trackingNumber } }),
      () => {
        const orders = readJsonFile<DbOrder>('orders', []);
        const idx = orders.findIndex(o => o.id === id);
        if (idx === -1) throw new Error("Order not found");
        orders[idx].status = status;
        if (trackingNumber) orders[idx].trackingNumber = trackingNumber;
        writeJsonFile('orders', orders);
        return orders[idx];
      }
    );
  },

  // REVIEWS
  getReviewsByProductId: async (productId: string) => {
    return runDb(
      () => prisma.review.findMany({ where: { productId, isApproved: true }, include: { user: true } }),
      () => {
        const products = readJsonFile<MockProduct>('products', MOCK_PRODUCTS);
        const product = products.find(p => p.id === productId);
        return product ? product.reviews : [];
      }
    );
  },

  createReview: async (reviewData: any) => {
    return runDb(
      () => prisma.review.create({ data: reviewData }),
      () => {
        const products = readJsonFile<MockProduct>('products', MOCK_PRODUCTS);
        const idx = products.findIndex(p => p.id === reviewData.productId);
        if (idx === -1) throw new Error("Product not found");
        
        const newReview: MockReview = {
          id: `rev-${Date.now()}`,
          userId: reviewData.userId,
          userName: reviewData.userName || "Customer",
          userImage: reviewData.userImage,
          productId: reviewData.productId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          createdAt: new Date().toISOString()
        };
        products[idx].reviews.push(newReview);
        
        // Recalculate rating
        const sum = products[idx].reviews.reduce((acc, r) => acc + r.rating, 0);
        products[idx].rating = Number((sum / products[idx].reviews.length).toFixed(1));
        
        writeJsonFile('products', products);
        return newReview;
      }
    );
  },

  // AUDIT LOGS
  getAuditLogs: async () => {
    return runDb(
      () => prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } }),
      () => readJsonFile<DbAuditLog>('auditLogs', [])
    );
  },

  createAuditLog: async (logData: any) => {
    return runDb(
      () => prisma.auditLog.create({ data: logData }),
      () => {
        const logs = readJsonFile<DbAuditLog>('auditLogs', []);
        const newLog: DbAuditLog = {
          id: `log-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...logData,
        };
        logs.unshift(newLog);
        writeJsonFile('auditLogs', logs);
        return newLog;
      }
    );
  },

  // NEWSLETTERS
  subscribeNewsletter: async (email: string) => {
    return runDb(
      () => prisma.newsletter.create({ data: { email } }),
      () => {
        const subs = readJsonFile<any>('newsletters', []);
        if (subs.find((s: any) => s.email.toLowerCase() === email.toLowerCase())) {
          return { email, alreadySubscribed: true };
        }
        subs.push({ id: `sub-${Date.now()}`, email, isActive: true, createdAt: new Date().toISOString() });
        writeJsonFile('newsletters', subs);
        return { email };
      }
    );
  }
};

// Initial state generator functions
function getInitialUsers(): DbUser[] {
  // Returns default seeded users: an Admin and a Customer
  return [
    {
      id: "user-admin",
      name: "Bespoke Admin",
      email: "admin@nexcart.luxury",
      // hashed bcrypt password for "admin123"
      password: "$2a$10$tMh4zHl0GvH.vB3Z9bWKeOgT9D59Cg7e.yQe4CqD11D1X9x0Xp7wO",
      role: 'ADMIN',
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
      createdAt: new Date().toISOString()
    },
    {
      id: "user-cust",
      name: "Victoria Sterling",
      email: "sterling@customer.com",
      // hashed bcrypt password for "customer123"
      password: "$2a$10$7Z8VfXwM5.w91Z1/r3o8G.6x.hB7qS1L2Rj8w9Xz2qP5n7v6c2q2m",
      role: 'CUSTOMER',
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      createdAt: new Date().toISOString()
    }
  ];
}

function getInitialAddresses(): DbAddress[] {
  return [
    {
      id: "addr-1",
      userId: "user-cust",
      name: "Residence",
      recipient: "Victoria Sterling",
      street: "742 Evergreen Terrace",
      city: "Springfield",
      state: "IL",
      postalCode: "62704",
      country: "United States",
      phone: "+1 (555) 0199",
      isDefault: true
    }
  ];
}
