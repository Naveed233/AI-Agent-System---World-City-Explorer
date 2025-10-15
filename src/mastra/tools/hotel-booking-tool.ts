import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { amadeusRequest } from './helpers/amadeus-client';
import { webSearchTool } from './web-search-tool';

/**
 * Hotel Booking Tool
 * Searches for real hotels using Amadeus API
 * Falls back to web search if API fails
 */
export const hotelBookingTool = createTool({
  id: 'hotelBookingTool',
  description: 'Search for real hotels using Amadeus API. Provides actual hotel names, ratings, prices, amenities, and booking links.',
  inputSchema: z.object({
    city: z.string().describe('City to search hotels in (e.g., "Paris", "Tokyo", "New York")'),
    checkIn: z.string().optional().describe('Check-in date (YYYY-MM-DD). Defaults to 7 days from now.'),
    checkOut: z.string().optional().describe('Check-out date (YYYY-MM-DD). Defaults to 8 days from now.'),
    guests: z.number().optional().describe('Number of guests (default: 1)'),
    priceRange: z.enum(['budget', 'mid-range', 'luxury']).optional().describe('Price range preference'),
    amenities: z.array(z.string()).optional().describe('Required amenities (wifi, pool, gym, parking, etc.)'),
  }),
  outputSchema: z.object({
    city: z.string(),
    hotels: z.array(z.object({
      name: z.string(),
      category: z.string(),
      pricePerNight: z.number(),
      rating: z.number(),
      reviewCount: z.number(),
      amenities: z.array(z.string()),
      location: z.string(),
      distance: z.string(),
      bookingUrls: z.object({
        booking: z.string(),
        hotels: z.string(),
        airbnb: z.string().optional(),
      }),
      highlights: z.array(z.string()),
    })),
    averagePrice: z.number(),
    recommendations: z.array(z.string()),
    source: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { 
      city, 
      checkIn, 
      checkOut, 
      guests = 1, 
      priceRange = 'mid-range',
      amenities = []
    } = context;

    console.log(`🏨 [Hotel Booking] Searching hotels in ${city} for ${guests} guest(s) (Live API)`);

    // Default dates
    const defaultCheckIn = new Date();
    defaultCheckIn.setDate(defaultCheckIn.getDate() + 7);
    const checkInDate = checkIn || defaultCheckIn.toISOString().split('T')[0];

    const defaultCheckOut = new Date(checkInDate);
    defaultCheckOut.setDate(defaultCheckOut.getDate() + 1);
    const checkOutDate = checkOut || defaultCheckOut.toISOString().split('T')[0];

    try {
      // Step 1: Get city IATA code
      const cityCode = await getCityCode(city);
      console.log(`🔍 [Hotel Booking] Using city code: ${cityCode}`);

      // Step 2: Search hotels by city
      const hotelListData = await amadeusRequest('/v1/reference-data/locations/hotels/by-city', {
        cityCode,
      });

      if (!hotelListData.data || hotelListData.data.length === 0) {
        throw new Error('No hotels found in this city');
      }

      // Get hotel IDs (limit to first 10)
      const hotelIds = hotelListData.data.slice(0, 10).map((h: any) => h.hotelId).join(',');

      // Step 3: Get hotel offers with pricing
      const offersData = await amadeusRequest('/v3/shopping/hotel-offers', {
        hotelIds,
        checkInDate,
        checkOutDate,
        adults: guests,
        currency: 'USD', // TODO: Use user's preferred currency
      });

      if (!offersData.data || offersData.data.length === 0) {
        throw new Error('No hotel offers available');
      }

      console.log(`✅ [Hotel Booking] Found ${offersData.data.length} hotel offers`);

      // Parse hotel offers
      const hotels = offersData.data.slice(0, 5).map((hotel: any) => {
        const offer = hotel.offers[0]; // First offer
        const pricePerNight = parseFloat(offer.price.total);
        const rating = hotel.hotel.rating || 0;

        return {
          name: hotel.hotel.name,
          category: hotel.hotel.type || 'Hotel',
          pricePerNight,
          rating,
          reviewCount: 0, // Amadeus doesn't provide review count
          amenities: hotel.hotel.amenities || ['WiFi', '24-hour Reception'],
          location: hotel.hotel.address?.cityName || city,
          distance: hotel.hotel.address?.lines?.join(', ') || 'City Center',
          bookingUrls: {
            booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`,
            hotels: `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(city)}`,
            airbnb: `https://www.airbnb.com/s/${encodeURIComponent(city)}`,
          },
          highlights: [
            rating >= 4 ? '⭐ Highly rated' : '',
            pricePerNight < 100 ? '💰 Great value' : '',
            'Central location',
          ].filter(Boolean),
        };
      });

      const averagePrice = Math.round(hotels.reduce((sum, h) => sum + h.pricePerNight, 0) / hotels.length);

      const recommendations = [
        `💰 Average price: $${averagePrice}/night`,
        `🏨 ${hotels.length} hotels available for your dates`,
        `📅 ${checkInDate} to ${checkOutDate}`,
        `💡 Book directly with hotels for possible discounts`,
        `🔄 Compare prices on Booking.com, Hotels.com, and Airbnb`,
      ];

      return {
        city,
        hotels,
        averagePrice,
        recommendations,
        source: 'Amadeus API (Live)',
      };

    } catch (error) {
      console.error(`❌ [Hotel Booking] Amadeus API error:`, error);
      console.log(`⚠️ [Hotel Booking] Falling back to web search`);

      // Fallback to web search
      const searchQuery = `best hotels in ${city} ${priceRange} ${checkInDate} to ${checkOutDate} ${guests} guests price ratings`;
      
      const searchResult = await webSearchTool.execute({
        context: { query: searchQuery },
        runtimeContext: runtimeContext || ({} as any),
      });

      // Return web search results in a compatible format
      return {
        city,
        hotels: [{
          name: `Hotels in ${city}`,
          category: 'Multiple Options',
          pricePerNight: 0,
          rating: 0,
          reviewCount: 0,
          amenities: [],
          location: city,
          distance: 'Various locations',
          bookingUrls: {
            booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`,
            hotels: `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(city)}`,
            airbnb: `https://www.airbnb.com/s/${encodeURIComponent(city)}`,
          },
          highlights: [],
        }],
        averagePrice: 0,
        recommendations: [
          `🔍 Live hotel search results:`,
          searchResult.summary,
          ``,
          `📱 Book on: Booking.com, Hotels.com, Airbnb, or directly with hotels`,
          `⚠️ Amadeus API temporarily unavailable - showing web results`,
        ],
        source: 'Web Search (Fallback)',
      };
    }
  },
});

/**
 * Get IATA city code for hotel search
 * Uses simple mapping for major cities
 */
async function getCityCode(cityName: string): Promise<string> {
  const city = cityName.toUpperCase().trim();

  // Major city to IATA code mapping (same as flight search)
  const cityCodeMap: Record<string, string> = {
    'NEW YORK': 'NYC',
    'NYC': 'NYC',
    'LOS ANGELES': 'LAX',
    'LA': 'LAX',
    'CHICAGO': 'CHI',
    'MIAMI': 'MIA',
    'SAN FRANCISCO': 'SFO',
    'BOSTON': 'BOS',
    'WASHINGTON': 'WAS',
    'SEATTLE': 'SEA',
    'LAS VEGAS': 'LAS',
    'TORONTO': 'YTO',
    'VANCOUVER': 'YVR',
    'MEXICO CITY': 'MEX',
    'LONDON': 'LON',
    'PARIS': 'PAR',
    'ROME': 'ROM',
    'MADRID': 'MAD',
    'BARCELONA': 'BCN',
    'AMSTERDAM': 'AMS',
    'BERLIN': 'BER',
    'MUNICH': 'MUC',
    'ZURICH': 'ZRH',
    'VIENNA': 'VIE',
    'ATHENS': 'ATH',
    'DUBLIN': 'DUB',
    'LISBON': 'LIS',
    'MOSCOW': 'MOW',
    'ISTANBUL': 'IST',
    'TOKYO': 'TYO',
    'BEIJING': 'BJS',
    'SHANGHAI': 'SHA',
    'HONG KONG': 'HKG',
    'SINGAPORE': 'SIN',
    'SEOUL': 'SEL',
    'BANGKOK': 'BKK',
    'DUBAI': 'DXB',
    'DELHI': 'DEL',
    'MUMBAI': 'BOM',
    'MANILA': 'MNL',
    'JAKARTA': 'JKT',
    'KUALA LUMPUR': 'KUL',
    'SYDNEY': 'SYD',
    'MELBOURNE': 'MEL',
    'AUCKLAND': 'AKL',
    'SAO PAULO': 'SAO',
    'BUENOS AIRES': 'BUE',
    'RIO DE JANEIRO': 'RIO',
    'LIMA': 'LIM',
    'BOGOTA': 'BOG',
    'CAIRO': 'CAI',
    'JOHANNESBURG': 'JNB',
    'CAPE TOWN': 'CPT',
    'NAIROBI': 'NBO',
  };

  return cityCodeMap[city] || city.substring(0, 3);
}
