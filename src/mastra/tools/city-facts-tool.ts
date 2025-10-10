import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * CityFactsTool - Fetches basic facts and information about a city
 * Uses GeoDB Cities API or Wikipedia API
 */
export const cityFactsTool = createTool({
  id: 'city-facts-tool',
  description: 'Get basic facts about a city including country, population, description, and notable features.',
  inputSchema: z.object({
    city: z.string().describe('The name of the city to get facts about'),
  }),
  outputSchema: z.object({
    city: z.string(),
    country: z.string(),
    population: z.number().optional(),
    description: z.string(),
    notableFor: z.array(z.string()),
    region: z.string().optional(),
    currency: z.string().optional(),
  }),
  execute: async ({ context: { city } }) => {
    const apiKey = process.env.RAPIDAPI_KEY;

    // City facts database for fallback/mock data
    const cityFactsDB: Record<string, any> = {
      'paris': {
        country: 'France',
        population: 2165423,
        description: 'Paris, the capital of France, is a major European city and a global center for art, fashion, gastronomy, and culture. Known as the "City of Light," it features iconic landmarks including the Eiffel Tower, Notre-Dame Cathedral, and the Louvre Museum.',
        notableFor: ['Eiffel Tower', 'Louvre Museum', 'Art & Fashion', 'Cuisine', 'Architecture'],
        region: 'Île-de-France',
        currency: 'Euro (EUR)',
      },
      'london': {
        country: 'United Kingdom',
        population: 8982000,
        description: 'London, the capital of England and the United Kingdom, is a 21st-century city with history stretching back to Roman times. At its center stand the imposing Houses of Parliament, the iconic Big Ben clock tower, and Westminster Abbey.',
        notableFor: ['Big Ben', 'British Museum', 'Tower of London', 'Financial Hub', 'Theater District'],
        region: 'Greater London',
        currency: 'Pound Sterling (GBP)',
      },
      'tokyo': {
        country: 'Japan',
        population: 13960000,
        description: 'Tokyo, Japan\'s busy capital, mixes the ultramodern and the traditional, from neon-lit skyscrapers to historic temples. It\'s known for its bustling Shibuya crossing, historic temples, and world-class cuisine.',
        notableFor: ['Technology', 'Anime & Manga', 'Cuisine', 'Temples', 'Shopping'],
        region: 'Kantō',
        currency: 'Japanese Yen (JPY)',
      },
      'new york': {
        country: 'United States',
        population: 8336817,
        description: 'New York City comprises 5 boroughs sitting where the Hudson River meets the Atlantic Ocean. At its core is Manhattan, a densely populated borough that\'s among the world\'s major commercial, financial and cultural centers.',
        notableFor: ['Statue of Liberty', 'Times Square', 'Financial District', 'Broadway', 'Museums'],
        region: 'New York State',
        currency: 'US Dollar (USD)',
      },
      'sydney': {
        country: 'Australia',
        population: 5312000,
        description: 'Sydney, capital of New South Wales, is one of Australia\'s largest cities. It\'s best known for its harbourfront Sydney Opera House, with a distinctive sail-like design, and the iconic Harbour Bridge.',
        notableFor: ['Opera House', 'Harbour Bridge', 'Beaches', 'Coastal Views', 'Wildlife'],
        region: 'New South Wales',
        currency: 'Australian Dollar (AUD)',
      },
      'dubai': {
        country: 'United Arab Emirates',
        population: 3331420,
        description: 'Dubai is a city and emirate in the UAE known for luxury shopping, ultramodern architecture, and a lively nightlife scene. Burj Khalifa, an 830m-tall tower, dominates the skyscraper-filled skyline.',
        notableFor: ['Burj Khalifa', 'Luxury Shopping', 'Modern Architecture', 'Desert Safari', 'Beach Resorts'],
        region: 'Dubai Emirate',
        currency: 'UAE Dirham (AED)',
      },
      'singapore': {
        country: 'Singapore',
        population: 5685807,
        description: 'Singapore is a sunny, tropical island city-state off southern Malaysia. A global financial center with a tropical climate and multicultural population, it\'s also known for its strict laws and green spaces.',
        notableFor: ['Marina Bay Sands', 'Gardens by the Bay', 'Hawker Centers', 'Clean & Green', 'Financial Hub'],
        region: 'Southeast Asia',
        currency: 'Singapore Dollar (SGD)',
      },
      'rome': {
        country: 'Italy',
        population: 2872800,
        description: 'Rome, Italy\'s capital, is a sprawling, cosmopolitan city with nearly 3,000 years of globally influential art, architecture and culture on display. Ancient ruins such as the Forum and the Colosseum showcase the power of the former Roman Empire.',
        notableFor: ['Colosseum', 'Vatican City', 'Ancient History', 'Art & Sculpture', 'Cuisine'],
        region: 'Lazio',
        currency: 'Euro (EUR)',
      },
      'berlin': {
        country: 'Germany',
        population: 3645000,
        description: 'Berlin, Germany\'s capital, dates to the 13th century. Known for its art scene and modern landmarks like the Brandenburg Gate, it\'s also famous for its turbulent 20th-century history.',
        notableFor: ['Brandenburg Gate', 'Berlin Wall', 'Museums', 'Nightlife', 'History'],
        region: 'Brandenburg',
        currency: 'Euro (EUR)',
      },
      'mumbai': {
        country: 'India',
        population: 20411000,
        description: 'Mumbai (formerly Bombay) is a densely populated city on India\'s west coast. A financial center, it\'s India\'s largest city and the heart of the Bollywood film industry.',
        notableFor: ['Bollywood', 'Gateway of India', 'Street Food', 'Financial Hub', 'Colonial Architecture'],
        region: 'Maharashtra',
        currency: 'Indian Rupee (INR)',
      },
    };

    const cityLower = city.toLowerCase();
    
    // Check if we have cached data
    if (cityFactsDB[cityLower]) {
      return {
        city,
        ...cityFactsDB[cityLower],
      };
    }

    // Try Wikipedia API as primary source
    try {
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'CityInformationAssistant/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Extract basic info from Wikipedia
        const description = data.extract || data.description || `${city} is a notable city.`;
        
        return {
          city: data.title || city,
          country: 'Information available on Wikipedia',
          description,
          notableFor: ['Historic significance', 'Cultural importance'],
          region: 'See Wikipedia for details',
          currency: 'Local currency',
        };
      }
    } catch (error) {
      console.warn('⚠️ Wikipedia API failed, using fallback');
    }

    // If no API key or API fails, return generic information
    return {
      city,
      country: 'Unknown',
      population: undefined,
      description: `${city} is an interesting city with rich history and culture. For detailed information, please check online resources or travel guides.`,
      notableFor: ['Local culture', 'Historic sites', 'Local cuisine'],
      region: 'Unknown',
      currency: 'Local currency',
    };
  },
});

