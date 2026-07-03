import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email("Invalid email address format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const addressSchema = z.object({
  recipient: z.string().min(2, "Recipient name is required"),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State code/name is required"),
  postalCode: z.string().min(3, "Postal/ZIP code is required"),
  country: z.string().default("United States"),
  phone: z.string().min(5, "Phone number is required"),
  isDefault: z.boolean().optional().default(false),
});

export const reviewSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5 stars"),
  comment: z.string().min(3, "Comment must be at least 3 characters"),
});

export const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  discount: z.number().positive("Discount must be a positive value"),
  isFlat: z.boolean().default(false),
  expiryDate: z.string().datetime("Invalid expiration datetime format"),
  usageLimit: z.number().int().positive().default(100),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  price: z.number().positive("Price must be positive"),
  discountPrice: z.number().positive().nullable().optional(),
  sku: z.string().min(3, "SKU is required"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().min(1, "Brand is required"),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  images: z.array(z.string().url("Invalid image URL format")).default([]),
});
