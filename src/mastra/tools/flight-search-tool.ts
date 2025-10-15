import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { amadeusRequest } from './helpers/amadeus-client';
import { webSearchTool } from './web-search-tool';

/**
 * Flight Search Tool
 * Searches for real flights using Amadeus API
 * Falls back to web search if API fails
 */
export const flightSearchTool = createTool({
  id: 'flightSearchTool',
  description: 'Search for real flights between cities using Amadeus API. Provides actual prices, airlines, flight times, and direct booking links.',
  inputSchema: z.object({
    origin: z.string().describe('Origin city or IATA airport code (e.g., "London", "LHR", "New York", "JFK")'),
    destination: z.string().describe('Destination city or IATA airport code'),
    departureDate: z.string().optional().describe('Departure date (YYYY-MM-DD). Defaults to 7 days from now.'),
    returnDate: z.string().optional().describe('Return date for round trip (YYYY-MM-DD)'),
    passengers: z.number().optional().describe('Number of adult passengers (default: 1)'),
    class: z.enum(['economy', 'premium', 'business', 'first']).optional().describe('Flight class'),
  }),
  outputSchema: z.object({
    origin: z.string(),
    destination: z.string(),
    flights: z.array(z.object({
      airline: z.string(),
      flightNumber: z.string(),
      duration: z.string(),
      stops: z.number(),
      price: z.number(),
      currency: z.string(),
      class: z.string(),
      departureTime: z.string(),
      arrivalTime: z.string(),
      bookingUrl: z.string(),
    })),
    cheapestPrice: z.number(),
    fastestDuration: z.string(),
    recommendations: z.array(z.string()),
    source: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate, 
      passengers = 1,
      class: flightClass = 'economy' 
    } = context;

    console.log(`✈️ [Flight Search] Searching flights: ${origin} → ${destination} (Live API)`);

    // Default departure date to 7 days from now if not provided
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const depDate = departureDate || defaultDate.toISOString().split('T')[0];

    // Map class to Amadeus format
    const classMap: Record<string, string> = {
      'economy': 'ECONOMY',
      'premium': 'PREMIUM_ECONOMY',
      'business': 'BUSINESS',
      'first': 'FIRST',
    };

    const travelClass = classMap[flightClass];

    try {
      // Get IATA codes for cities (if they're not already codes)
      const originCode = await getIATACode(origin);
      const destCode = await getIATACode(destination);

      console.log(`🔍 [Flight Search] Using airport codes: ${originCode} → ${destCode}`);

      // Build Amadeus API request
      const params: Record<string, any> = {
        originLocationCode: originCode,
        destinationLocationCode: destCode,
        departureDate: depDate,
        adults: passengers,
        travelClass,
        max: 5, // Return top 5 results
        currencyCode: 'USD', // TODO: Use user's preferred currency
      };

      if (returnDate) {
        params.returnDate = returnDate;
      }

      // Make Amadeus API request
      const data = await amadeusRequest('/v2/shopping/flight-offers', params);

      if (!data.data || data.data.length === 0) {
        throw new Error('No flights found');
      }

      console.log(`✅ [Flight Search] Found ${data.data.length} flight options`);

      // Parse Amadeus response
      const flights = data.data.slice(0, 5).map((offer: any) => {
        const itinerary = offer.itineraries[0]; // First itinerary (outbound)
        const firstSegment = itinerary.segments[0];
        const lastSegment = itinerary.segments[itinerary.segments.length - 1];
        
        const airline = firstSegment.carrierCode;
        const flightNumber = `${firstSegment.carrierCode}${firstSegment.number}`;
        const duration = itinerary.duration.replace('PT', '').toLowerCase();
        const stops = itinerary.segments.length - 1;
        const price = parseFloat(offer.price.total);
        const currency = offer.price.currency;

        return {
          airline: getAirlineName(airline),
          flightNumber,
          duration,
          stops,
          price,
          currency,
          class: offer.travelerPricings[0].fareDetailsBySegment[0].cabin,
          departureTime: firstSegment.departure.at,
          arrivalTime: lastSegment.arrival.at,
          bookingUrl: `https://www.google.com/travel/flights?q=${originCode}+to+${destCode}+${depDate}`,
        };
      });

      const cheapestPrice = Math.min(...flights.map(f => f.price));
      const fastestDuration = flights.reduce((min, f) => {
        const current = f.duration;
        return current < min ? current : min;
      }, flights[0].duration);

      const recommendations = [
        `💰 Cheapest: ${cheapestPrice} ${flights[0].currency} ${returnDate ? '(round trip)' : '(one-way)'}`,
        `⚡ Fastest: ${fastestDuration}`,
        `✈️ ${flights.filter(f => f.stops === 0).length} direct flight(s) available`,
        `📅 Book 2-3 months ahead for best prices`,
        `🔄 Compare with Google Flights for more options`,
      ];

      return {
        origin: originCode,
        destination: destCode,
        flights,
        cheapestPrice,
        fastestDuration,
        recommendations,
        source: 'Amadeus API (Live)',
      };

    } catch (error) {
      console.error(`❌ [Flight Search] Amadeus API error:`, error);
      console.log(`⚠️ [Flight Search] Falling back to web search`);

      // Fallback to web search
      const searchQuery = `flights from ${origin} to ${destination} ${depDate} ${passengers} passengers ${flightClass} class price`;
      
      const searchResult = await webSearchTool.execute({
        context: { query: searchQuery },
        runtimeContext: runtimeContext || ({} as any),
      });

      // Return web search results in a compatible format
      return {
        origin,
        destination,
        flights: [{
          airline: 'Multiple Airlines',
          flightNumber: 'See booking site',
          duration: 'Varies',
          stops: 0,
          price: 0,
          currency: 'USD',
          class: flightClass,
          departureTime: depDate,
          arrivalTime: depDate,
          bookingUrl: `https://www.google.com/travel/flights?q=${origin}+to+${destination}+${depDate}`,
        }],
        cheapestPrice: 0,
        fastestDuration: 'See search results',
        recommendations: [
          `🔍 Live flight search results:`,
          searchResult.summary,
          ``,
          `📱 Book on: Google Flights, Skyscanner, Kayak, or directly with airlines`,
          `⚠️ Amadeus API temporarily unavailable - showing web results`,
        ],
        source: 'Web Search (Fallback)',
      };
    }
  },
});

/**
 * Get IATA code for a city name
 * Uses simple mapping for major cities
 */
async function getIATACode(cityOrCode: string): Promise<string> {
  const city = cityOrCode.toUpperCase().trim();

  // If already a 3-letter code, return it
  if (/^[A-Z]{3}$/.test(city)) {
    return city;
  }

  // Major city to IATA code mapping
  const cityCodeMap: Record<string, string> = {
    // North America
    'NEW YORK': 'JFK',
    'NYC': 'JFK',
    'LOS ANGELES': 'LAX',
    'LA': 'LAX',
    'CHICAGO': 'ORD',
    'MIAMI': 'MIA',
    'SAN FRANCISCO': 'SFO',
    'BOSTON': 'BOS',
    'WASHINGTON': 'DCA',
    'SEATTLE': 'SEA',
    'LAS VEGAS': 'LAS',
    'TORONTO': 'YYZ',
    'VANCOUVER': 'YVR',
    'MEXICO CITY': 'MEX',
    
    // Europe
    'LONDON': 'LHR',
    'PARIS': 'CDG',
    'ROME': 'FCO',
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
    'MOSCOW': 'SVO',
    'ISTANBUL': 'IST',
    
    // Asia
    'TOKYO': 'NRT',
    'BEIJING': 'PEK',
    'SHANGHAI': 'PVG',
    'HONG KONG': 'HKG',
    'SINGAPORE': 'SIN',
    'SEOUL': 'ICN',
    'BANGKOK': 'BKK',
    'DUBAI': 'DXB',
    'DELHI': 'DEL',
    'MUMBAI': 'BOM',
    'MANILA': 'MNL',
    'JAKARTA': 'CGK',
    'KUALA LUMPUR': 'KUL',
    
    // Oceania
    'SYDNEY': 'SYD',
    'MELBOURNE': 'MEL',
    'AUCKLAND': 'AKL',
    
    // South America
    'SAO PAULO': 'GRU',
    'BUENOS AIRES': 'EZE',
    'RIO DE JANEIRO': 'GIG',
    'LIMA': 'LIM',
    'BOGOTA': 'BOG',
    
    // Africa
    'CAIRO': 'CAI',
    'JOHANNESBURG': 'JNB',
    'CAPE TOWN': 'CPT',
    'NAIROBI': 'NBO',
  };

  return cityCodeMap[city] || city;
}

/**
 * Get airline full name from carrier code
 */
function getAirlineName(code: string): string {
  const airlines: Record<string, string> = {
    'AA': 'American Airlines',
    'UA': 'United Airlines',
    'DL': 'Delta Air Lines',
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM',
    'EK': 'Emirates',
    'QR': 'Qatar Airways',
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'JL': 'Japan Airlines',
    'NH': 'ANA',
    'QF': 'Qantas',
    'EY': 'Etihad Airways',
    'TK': 'Turkish Airlines',
    'AC': 'Air Canada',
    'LX': 'Swiss International',
    'OS': 'Austrian Airlines',
    'AZ': 'ITA Airways',
  };

  return airlines[code] || code;
}
