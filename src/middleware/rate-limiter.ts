/**
 * Rate Limiter Middleware
 * Prevents API abuse by limiting requests per user/IP
 * In-memory implementation (can be upgraded to Redis for distributed systems)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  firstRequest: number;
}

// In-memory storage for rate limits
const rateLimits = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  // Free tier: 100 requests per hour
  FREE_TIER: {
    maxRequests: 100,
    windowMs: 3600000, // 1 hour
  },
  // Premium tier: 1000 requests per hour (for future use)
  PREMIUM_TIER: {
    maxRequests: 1000,
    windowMs: 3600000,
  },
  // Per-tool limits (to prevent expensive API abuse)
  TOOL_LIMITS: {
    flight: 20, // 20 flight searches per hour
    hotel: 20, // 20 hotel searches per hour
    currency: 50, // 50 currency conversions per hour
  },
};

/**
 * Check if user/IP has exceeded rate limit
 */
export function checkRateLimit(
  identifier: string,
  tier: 'FREE_TIER' | 'PREMIUM_TIER' = 'FREE_TIER'
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  message?: string;
} {
  const now = Date.now();
  const config = RATE_LIMIT_CONFIG[tier];
  const limit = rateLimits.get(identifier);

  // No existing limit or window expired
  if (!limit || now > limit.resetAt) {
    rateLimits.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
      firstRequest: now,
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (limit.count >= config.maxRequests) {
    const minutesUntilReset = Math.ceil((limit.resetAt - now) / 60000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: limit.resetAt,
      message: `Rate limit exceeded. Try again in ${minutesUntilReset} minute(s).`,
    };
  }

  // Increment counter
  limit.count++;
  
  return {
    allowed: true,
    remaining: config.maxRequests - limit.count,
    resetAt: limit.resetAt,
  };
}

/**
 * Check rate limit for specific tools
 * More restrictive limits for expensive API calls
 */
export function checkToolRateLimit(
  identifier: string,
  toolName: 'flight' | 'hotel' | 'currency'
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  message?: string;
} {
  const now = Date.now();
  const toolKey = `${identifier}:${toolName}`;
  const maxRequests = RATE_LIMIT_CONFIG.TOOL_LIMITS[toolName];
  const windowMs = 3600000; // 1 hour
  
  const limit = rateLimits.get(toolKey);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(toolKey, {
      count: 1,
      resetAt: now + windowMs,
      firstRequest: now,
    });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (limit.count >= maxRequests) {
    const minutesUntilReset = Math.ceil((limit.resetAt - now) / 60000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: limit.resetAt,
      message: `${toolName} rate limit exceeded (${maxRequests}/hour). Try again in ${minutesUntilReset} minute(s).`,
    };
  }

  limit.count++;
  
  return {
    allowed: true,
    remaining: maxRequests - limit.count,
    resetAt: limit.resetAt,
  };
}

/**
 * Get rate limit stats for a user
 */
export function getRateLimitStats(identifier: string): {
  globalLimit: RateLimitEntry | null;
  toolLimits: Record<string, RateLimitEntry | null>;
} {
  const globalLimit = rateLimits.get(identifier) || null;
  
  return {
    globalLimit,
    toolLimits: {
      flight: rateLimits.get(`${identifier}:flight`) || null,
      hotel: rateLimits.get(`${identifier}:hotel`) || null,
      currency: rateLimits.get(`${identifier}:currency`) || null,
    },
  };
}

/**
 * Reset rate limit for a user (admin function)
 */
export function resetRateLimit(identifier: string): void {
  rateLimits.delete(identifier);
  rateLimits.delete(`${identifier}:flight`);
  rateLimits.delete(`${identifier}:hotel`);
  rateLimits.delete(`${identifier}:currency`);
  
  console.log(`✅ [Rate Limiter] Reset limits for: ${identifier}`);
}

/**
 * Clean up expired rate limit entries (garbage collection)
 * Run this periodically to prevent memory leaks
 */
export function cleanupExpiredLimits(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, limit] of rateLimits.entries()) {
    if (now > limit.resetAt) {
      rateLimits.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 [Rate Limiter] Cleaned up ${cleaned} expired entries`);
  }
}

/**
 * Get identifier from request (IP or user ID)
 * For demo purposes, uses IP. In production, use authenticated user ID.
 */
export function getIdentifier(req: any): string {
  // Try to get user ID from auth token (if authenticated)
  const userId = req.user?.id;
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress || 
             'unknown';
  
  return `ip:${ip}`;
}

// Auto-cleanup every 10 minutes
setInterval(cleanupExpiredLimits, 600000);

console.log('✅ [Rate Limiter] Initialized with limits:', RATE_LIMIT_CONFIG);

