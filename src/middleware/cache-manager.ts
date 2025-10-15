/**
 * Cache Manager
 * Flexible caching layer that supports both Redis (production) and in-memory (development)
 * Automatically falls back to in-memory if Redis is unavailable
 */

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

// Redis client (optional)
let redisClient: any = null;
let useRedis = false;

/**
 * Initialize Redis client
 * Call this at app startup with Railway Redis URL
 */
export async function initializeCache(): Promise<void> {
  const REDIS_URL = process.env.REDIS_URL;
  
  if (REDIS_URL) {
    try {
      // Dynamically import ioredis only if Redis URL is provided
      const { default: Redis } = await import('ioredis');
      redisClient = new Redis(REDIS_URL, {
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('⚠️ [Cache] Redis connection failed, falling back to in-memory cache');
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
      });
      
      await redisClient.ping();
      useRedis = true;
      console.log('✅ [Cache] Connected to Redis');
    } catch (error) {
      console.warn('⚠️ [Cache] Redis not available, using in-memory cache:', error);
      useRedis = false;
    }
  } else {
    console.log('💾 [Cache] Using in-memory cache (no REDIS_URL provided)');
    useRedis = false;
  }
}

/**
 * Get value from cache
 */
export async function getFromCache<T = any>(key: string): Promise<T | null> {
  try {
    if (useRedis && redisClient) {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    }
    
    // Fallback to in-memory cache
    const cached = memoryCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value as T;
    }
    
    // Clean up expired entry
    if (cached) {
      memoryCache.delete(key);
    }
    
    return null;
  } catch (error) {
    console.error(`❌ [Cache] Error getting key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL (time to live in seconds)
 */
export async function setInCache(
  key: string,
  value: any,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    if (useRedis && redisClient) {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    }
    
    // Fallback to in-memory cache
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    memoryCache.set(key, { value, expiresAt });
  } catch (error) {
    console.error(`❌ [Cache] Error setting key ${key}:`, error);
  }
}

/**
 * Delete value from cache
 */
export async function deleteFromCache(key: string): Promise<void> {
  try {
    if (useRedis && redisClient) {
      await redisClient.del(key);
      return;
    }
    
    memoryCache.delete(key);
  } catch (error) {
    console.error(`❌ [Cache] Error deleting key ${key}:`, error);
  }
}

/**
 * Clear all cache entries (use with caution!)
 */
export async function clearCache(): Promise<void> {
  try {
    if (useRedis && redisClient) {
      await redisClient.flushdb();
      console.log('🧹 [Cache] Redis cache cleared');
      return;
    }
    
    memoryCache.clear();
    console.log('🧹 [Cache] Memory cache cleared');
  } catch (error) {
    console.error('❌ [Cache] Error clearing cache:', error);
  }
}

/**
 * Generate cache key for API responses
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

/**
 * Get or Set pattern (fetch-and-cache)
 * If value exists in cache, return it. Otherwise, execute fetcher, cache result, and return.
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // Try to get from cache first
  const cached = await getFromCache<T>(key);
  if (cached !== null) {
    console.log(`📦 [Cache] HIT for key: ${key}`);
    return cached;
  }
  
  console.log(`📭 [Cache] MISS for key: ${key}, fetching...`);
  
  // Cache miss - fetch fresh data
  const freshData = await fetcher();
  
  // Cache the result
  await setInCache(key, freshData, ttlSeconds);
  
  return freshData;
}

/**
 * Clean up expired entries from in-memory cache
 */
function cleanupExpiredMemoryCache(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 [Cache] Cleaned up ${cleaned} expired memory cache entries`);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory';
  keys: number;
  size?: string;
}> {
  try {
    if (useRedis && redisClient) {
      const dbsize = await redisClient.dbsize();
      const info = await redisClient.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';
      
      return {
        type: 'redis',
        keys: dbsize,
        size: memory,
      };
    }
    
    return {
      type: 'memory',
      keys: memoryCache.size,
    };
  } catch (error) {
    console.error('❌ [Cache] Error getting stats:', error);
    return { type: 'memory', keys: 0 };
  }
}

// Auto-cleanup in-memory cache every 5 minutes
setInterval(cleanupExpiredMemoryCache, 300000);

// Initialize cache on module load
initializeCache();

console.log('✅ [Cache Manager] Initialized');

