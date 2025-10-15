/**
 * Unsplash Image API Client
 * Fetches high-quality images for cities, hotels, landmarks
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'EHJfRWraI1VDKFexX8YiAihd0WcnLbWczBhmoWlz4R8';
const UNSPLASH_API_BASE = 'https://api.unsplash.com';

export interface UnsplashImage {
  id: string;
  url: string;
  thumbnail: string;
  regularSize: string;
  fullSize: string;
  photographer: string;
  photographerUrl: string;
  description?: string;
  altDescription?: string;
}

/**
 * Search for images on Unsplash
 */
export async function searchUnsplashImages(
  query: string,
  count: number = 1,
  orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape'
): Promise<UnsplashImage[]> {
  try {
    const url = `${UNSPLASH_API_BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=${orientation}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ [Unsplash] API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log(`📷 [Unsplash] No images found for: "${query}"`);
      return [];
    }

    const images: UnsplashImage[] = data.results.map((photo: any) => ({
      id: photo.id,
      url: photo.links.html, // Clickable URL to Unsplash photo page
      thumbnail: photo.urls.thumb, // 200x200
      regularSize: photo.urls.regular, // ~1080px width
      fullSize: photo.urls.full, // Original size
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      description: photo.description,
      altDescription: photo.alt_description,
    }));

    console.log(`✅ [Unsplash] Found ${images.length} image(s) for: "${query}"`);
    return images;

  } catch (error) {
    console.error(`❌ [Unsplash] Error fetching images:`, error);
    return [];
  }
}

/**
 * Get a random image from Unsplash
 */
export async function getRandomUnsplashImage(
  query: string,
  orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape'
): Promise<UnsplashImage | null> {
  try {
    const url = `${UNSPLASH_API_BASE}/photos/random?query=${encodeURIComponent(query)}&orientation=${orientation}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ [Unsplash] Random image error: ${response.status}`);
      return null;
    }

    const photo = await response.json();

    return {
      id: photo.id,
      url: photo.links.html,
      thumbnail: photo.urls.thumb,
      regularSize: photo.urls.regular,
      fullSize: photo.urls.full,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      description: photo.description,
      altDescription: photo.alt_description,
    };

  } catch (error) {
    console.error(`❌ [Unsplash] Error fetching random image:`, error);
    return null;
  }
}

/**
 * Get image for a city
 * Tries multiple search strategies for best results
 */
export async function getCityImage(cityName: string, country?: string): Promise<UnsplashImage | null> {
  // Strategy 1: City + Country (most specific)
  if (country) {
    const images = await searchUnsplashImages(`${cityName} ${country} city skyline`, 1);
    if (images.length > 0) return images[0];
  }

  // Strategy 2: City + "landmark" or "cityscape"
  const images = await searchUnsplashImages(`${cityName} landmark cityscape`, 1);
  if (images.length > 0) return images[0];

  // Strategy 3: Just city name
  const fallbackImages = await searchUnsplashImages(cityName, 1);
  if (fallbackImages.length > 0) return fallbackImages[0];

  return null;
}

/**
 * Get image for a hotel
 */
export async function getHotelImage(hotelName: string, city?: string): Promise<UnsplashImage | null> {
  // Try hotel name + city
  if (city) {
    const images = await searchUnsplashImages(`luxury hotel ${city}`, 1);
    if (images.length > 0) return images[0];
  }

  // Fallback to generic hotel image
  const images = await searchUnsplashImages('luxury hotel', 1);
  if (images.length > 0) return images[0];

  return null;
}

/**
 * Get image for a landmark or attraction
 */
export async function getLandmarkImage(landmarkName: string, city?: string): Promise<UnsplashImage | null> {
  const query = city ? `${landmarkName} ${city}` : landmarkName;
  const images = await searchUnsplashImages(query, 1);
  return images.length > 0 ? images[0] : null;
}

/**
 * Extract image from Wikipedia article
 * Returns the main image URL if available
 */
export async function getWikipediaImage(pageTitle: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Check for thumbnail or original image
    if (data.thumbnail?.source) {
      console.log(`✅ [Wikipedia] Found image for: "${pageTitle}"`);
      return data.thumbnail.source;
    }

    if (data.originalimage?.source) {
      console.log(`✅ [Wikipedia] Found original image for: "${pageTitle}"`);
      return data.originalimage.source;
    }

    return null;

  } catch (error) {
    console.error(`❌ [Wikipedia] Error fetching image:`, error);
    return null;
  }
}

/**
 * Get best available image for a city
 * Tries Wikipedia first (free, unlimited), then Unsplash
 */
export async function getBestCityImage(cityName: string, country?: string): Promise<{
  imageUrl: string;
  clickableUrl: string;
  source: 'wikipedia' | 'unsplash';
  photographer?: string;
  photographerUrl?: string;
} | null> {
  // Try Wikipedia first (unlimited, free)
  const wikiImage = await getWikipediaImage(cityName);
  if (wikiImage) {
    return {
      imageUrl: wikiImage,
      clickableUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(cityName.replace(/ /g, '_'))}`,
      source: 'wikipedia',
    };
  }

  // Fallback to Unsplash (50/hour limit)
  const unsplashImage = await getCityImage(cityName, country);
  if (unsplashImage) {
    return {
      imageUrl: unsplashImage.regularSize,
      clickableUrl: unsplashImage.url,
      source: 'unsplash',
      photographer: unsplashImage.photographer,
      photographerUrl: unsplashImage.photographerUrl,
    };
  }

  return null;
}

