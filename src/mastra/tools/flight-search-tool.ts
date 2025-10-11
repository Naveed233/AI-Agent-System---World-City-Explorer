import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Flight Search Tool
 * Searches for flights between origin and destination cities
 * Uses mock data for demonstration (can be connected to Skyscanner, Amadeus, etc.)
 */
export const flightSearchTool = createTool({
  id: 'flightSearchTool',
  description: 'Search for flights between cities with price estimates and airline options. Provides flight duration, layovers, and booking recommendations.',
  inputSchema: z.object({
    origin: z.string().describe('Origin city or airport code'),
    destination: z.string().describe('Destination city or airport code'),
    departureDate: z.string().optional().describe('Departure date (YYYY-MM-DD)'),
    returnDate: z.string().optional().describe('Return date for round trip (YYYY-MM-DD)'),
    passengers: z.number().optional().describe('Number of passengers (default: 1)'),
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
      class: z.string(),
      departureTime: z.string(),
      arrivalTime: z.string(),
      bookingUrl: z.string(),
    })),
    cheapestPrice: z.number(),
    fastestDuration: z.string(),
    recommendations: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { 
      origin, 
      destination, 
      departureDate, 
      returnDate, 
      passengers = 1,
      class: flightClass = 'economy' 
    } = context;

    console.log(`✈️ [Flight Search] Searching flights: ${origin} → ${destination}`);

    // Calculate base price based on distance/routes (mock calculation)
    const routePrices: Record<string, number> = {
      'domestic': 150,      // < 500 miles
      'regional': 300,      // 500-1500 miles
      'international': 600, // 1500-3000 miles
      'longhaul': 900,      // > 3000 miles
    };

    // Class multipliers
    const classMultipliers = {
      economy: 1.0,
      premium: 1.8,
      business: 3.5,
      first: 5.0,
    };

    // Determine route type (simplified)
    const isLongHaul = ['asia', 'europe', 'africa', 'oceania'].some(continent => 
      destination.toLowerCase().includes(continent) || origin.toLowerCase().includes(continent)
    );
    
    const basePrice = isLongHaul ? routePrices.longhaul : routePrices.international;
    const classMultiplier = classMultipliers[flightClass];

    // Generate mock flight options
    const airlines = [
      { name: 'United Airlines', code: 'UA', priceVar: 1.0 },
      { name: 'Delta', code: 'DL', priceVar: 1.05 },
      { name: 'American Airlines', code: 'AA', priceVar: 0.95 },
      { name: 'Emirates', code: 'EK', priceVar: 1.15 },
      { name: 'Singapore Airlines', code: 'SQ', priceVar: 1.20 },
      { name: 'Lufthansa', code: 'LH', priceVar: 1.10 },
    ];

    const flights = airlines.slice(0, 4).map((airline, index) => {
      const stops = index === 0 ? 0 : index === 1 ? 1 : Math.floor(Math.random() * 2);
      const durationHours = isLongHaul ? 10 + (stops * 3) : 3 + (stops * 2);
      const price = Math.round(basePrice * classMultiplier * airline.priceVar * passengers);
      
      return {
        airline: airline.name,
        flightNumber: `${airline.code}${Math.floor(Math.random() * 9000) + 1000}`,
        duration: `${durationHours}h ${Math.floor(Math.random() * 60)}m`,
        stops,
        price,
        class: flightClass,
        departureTime: departureDate ? `${departureDate} 08:00 AM` : 'Flexible',
        arrivalTime: departureDate ? `${departureDate} ${8 + durationHours}:00 ${8 + durationHours >= 12 ? 'PM' : 'AM'}` : 'Flexible',
        bookingUrl: `https://www.google.com/flights?q=${origin}+to+${destination}`,
      };
    });

    // Sort by price
    flights.sort((a, b) => a.price - b.price);

    const cheapestPrice = flights[0].price;
    const fastestFlight = flights.reduce((fastest, flight) => 
      parseInt(flight.duration) < parseInt(fastest.duration) ? flight : fastest
    );

    const recommendations = [
      `💰 Best Price: ${flights[0].airline} at $${flights[0].price} (${flights[0].stops} stop${flights[0].stops !== 1 ? 's' : ''})`,
      `⚡ Fastest: ${fastestFlight.airline} at ${fastestFlight.duration} for $${fastestFlight.price}`,
      `✨ Best Value: Direct flights save time but cost 15-20% more`,
      returnDate ? `🔄 Round trip: Multiply prices by 2 (or less with round-trip discounts)` : '🎫 One-way flight prices shown',
      `📅 Book ${isLongHaul ? '2-3 months' : '3-6 weeks'} in advance for best prices`,
      `🕐 Midweek flights (Tue-Thu) are typically 10-15% cheaper`,
    ];

    console.log(`✅ [Flight Search] Found ${flights.length} flight options, cheapest: $${cheapestPrice}`);

    return {
      origin,
      destination,
      flights,
      cheapestPrice,
      fastestDuration: fastestFlight.duration,
      recommendations,
    };
  },
});

