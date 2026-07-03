import { NextRequest } from 'next/server';

interface RateLimitCache {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitCache>();

export interface RateLimiterOptions {
  limit?: number;        // Max requests per window
  windowMs?: number;     // Window size in ms
}

/**
 * Basic memory rate limiter helper for API routes.
 * Returns true if request is allowed, false if rate limited.
 */
export function rateLimit(req: NextRequest, options?: RateLimiterOptions): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const limit = options?.limit || 60; // 60 requests
  const windowMs = options?.windowMs || 60 * 1000; // 1 minute window
  
  // Get IP address from headers
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             '127.0.0.1';
  
  const now = Date.now();
  const clientStore = memoryStore.get(ip);
  
  if (!clientStore || now > clientStore.resetTime) {
    // New window or new IP
    const resetTime = now + windowMs;
    memoryStore.set(ip, { count: 1, resetTime });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((resetTime - now) / 1000),
    };
  }
  
  clientStore.count += 1;
  const remaining = Math.max(0, limit - clientStore.count);
  const reset = Math.ceil((clientStore.resetTime - now) / 1000);
  
  if (clientStore.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }
  
  return {
    success: true,
    limit,
    remaining,
    reset,
  };
}
