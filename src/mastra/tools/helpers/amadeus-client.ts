/**
 * Amadeus API Client Helper
 * Handles authentication and provides methods for flight & hotel searches
 * Includes response caching to reduce API costs
 */

import { getOrSet, generateCacheKey } from '../../../middleware/cache-manager';

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY || 'vp3pPKkVcsZA4TAdQg3uIcO6p4OMhsEe';
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET || 'So8y0UcyZ00xPZYY';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

// Cache for access token
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get Amadeus access token (with caching)
 */
export async function getAmadeusToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  console.log('🔐 [Amadeus] Fetching new access token...');

  try {
    const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Amadeus auth failed: ${response.status}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Token expires in seconds, cache for 95% of that time to be safe
    tokenExpiry = Date.now() + (data.expires_in * 950);

    console.log('✅ [Amadeus] Access token obtained');
    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }
    return accessToken;

  } catch (error) {
    console.error('❌ [Amadeus] Authentication error:', error);
    throw error;
  }
}

/**
 * Make authenticated request to Amadeus API with caching
 * Cache TTL: Flight/Hotel offers = 30 minutes, Hotel list = 24 hours
 */
export async function amadeusRequest(endpoint: string, params: Record<string, any> = {}, useCache: boolean = true): Promise<any> {
  // Generate cache key
  const cacheKey = generateCacheKey(`amadeus${endpoint}`, params);
  
  // Determine cache TTL based on endpoint type
  let cacheTTL = 1800; // Default: 30 minutes
  if (endpoint.includes('/hotels/by-city')) {
    cacheTTL = 86400; // Hotel list: 24 hours (doesn't change often)
  } else if (endpoint.includes('/flight-offers') || endpoint.includes('/hotel-offers')) {
    cacheTTL = 1800; // Offers: 30 minutes (prices change)
  }

  // Use cache or fetch fresh
  return await getOrSet(
    cacheKey,
    async () => {
      const token = await getAmadeusToken();

      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString();

      const url = `${AMADEUS_BASE_URL}${endpoint}?${queryString}`;

      console.log(`📡 [Amadeus] API Request: ${endpoint}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Amadeus] API error (${response.status}):`, errorText);
        throw new Error(`Amadeus API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    },
    useCache ? cacheTTL : 0 // Skip cache if useCache=false
  );
}

