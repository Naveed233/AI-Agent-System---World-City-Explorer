import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Image Search Tool
 * Fetches images for attractions, hotels, restaurants using multiple sources
 * Priority: Wikipedia → Unsplash API → Fallback
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'EHJfRWraI1VDKFexX8YiAihd0WcnLbWczBhmoWlz4R8';

export const imageSearchTool = createTool({
  id: 'imageSearchTool',
  description: 'Search for high-quality images of attractions, hotels, restaurants, or landmarks. Returns reliable image URLs with attribution.',
  inputSchema: z.object({
    query: z.string().describe('Search query for the image (e.g., "Eiffel Tower Paris", "Rijksmuseum Amsterdam")'),
    category: z.enum(['attraction', 'hotel', 'restaurant', 'landmark', 'city']).optional().describe('Category of the place'),
  }),
  outputSchema: z.object({
    image_url: z.string().describe('Full-size image URL'),
    thumb_url: z.string().describe('Thumbnail image URL (smaller, faster)'),
    source: z.enum(['wikipedia', 'unsplash', 'fallback']),
    attribution: z.string().describe('Attribution text (required by some sources)'),
    photographer: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
  execute: async ({ context }) => {
    const { query, category = 'attraction' } = context;
    
    console.log(`🖼️ [Image Search] Searching for: "${query}"`);

    // Try Wikipedia first (free, reliable for landmarks)
    try {
      const wikiImage = await searchWikipediaImage(query);
      if (wikiImage) {
        console.log(`✅ [Image Search] Found Wikipedia image for: "${query}"`);
        return wikiImage;
      }
    } catch (error) {
      console.log(`⚠️ [Image Search] Wikipedia failed for "${query}":`, error);
    }

    // Try Unsplash API (high quality, requires API key)
    try {
      const unsplashImage = await searchUnsplashImage(query);
      if (unsplashImage) {
        console.log(`✅ [Image Search] Found Unsplash image for: "${query}"`);
        return unsplashImage;
      }
    } catch (error) {
      console.log(`⚠️ [Image Search] Unsplash failed for "${query}":`, error);
    }

    // Fallback: Use Lorem Picsum with query-based ID
    console.log(`📷 [Image Search] Using fallback image for: "${query}"`);
    return getFallbackImage(query);
  },
});

/**
 * Search Wikipedia for images
 */
async function searchWikipediaImage(query: string): Promise<any | null> {
  try {
    // Clean query for Wikipedia search
    const cleanQuery = query.split(',')[0].trim(); // e.g., "Eiffel Tower" from "Eiffel Tower, Paris"
    
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'CityInformationAssistant/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Check for thumbnail or original image
    const imageUrl = data.thumbnail?.source || data.originalimage?.source;
    
    if (!imageUrl) {
      return null;
    }

    // Wikipedia images are high-res, create thumb by replacing width
    const thumbUrl = imageUrl.replace(/\/\d+px-/, '/400px-');

    return {
      image_url: imageUrl,
      thumb_url: thumbUrl,
      source: 'wikipedia' as const,
      attribution: 'Image from Wikipedia (CC BY-SA)',
      width: data.thumbnail?.width || data.originalimage?.width,
      height: data.thumbnail?.height || data.originalimage?.height,
    };
  } catch (error) {
    console.error('Wikipedia image search error:', error);
    return null;
  }
}

/**
 * Search Unsplash for images using their API
 */
async function searchUnsplashImage(query: string): Promise<any | null> {
  try {
    const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const photo = data.results[0];

    return {
      image_url: photo.urls.regular, // ~1080px width
      thumb_url: photo.urls.small,   // ~400px width
      source: 'unsplash' as const,
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      photographer: photo.user.name,
      width: photo.width,
      height: photo.height,
    };
  } catch (error) {
    console.error('Unsplash image search error:', error);
    return null;
  }
}

/**
 * Generate a consistent fallback image based on query
 */
function getFallbackImage(query: string): any {
  // Generate a consistent seed from the query for consistent images
  const seed = query.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
  
  return {
    image_url: `https://picsum.photos/seed/${seed}/800/600`,
    thumb_url: `https://picsum.photos/seed/${seed}/400/300`,
    source: 'fallback' as const,
    attribution: 'Image from Lorem Picsum',
  };
}

