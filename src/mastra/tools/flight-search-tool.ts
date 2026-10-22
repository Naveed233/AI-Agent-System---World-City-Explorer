import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { serpApiSearch, describeSerpApiError, SerpApiError } from './helpers/serpapi-client';
import { getIATACode } from './helpers/city-iata-mapper';
import { isValidIsoDate, todayIso, addDaysIso, daysBetween, formatMinutes } from './helpers/trip-dates';
import { checkToolRateLimit } from '../../middleware/rate-limiter';

/**
 * Flight Search Tool
 * Live prices from Google Flights through SerpApi.
 *
 * Amadeus Self-Service (the previous source) shut down, and the old fallback
 * returned a Google Flights link with price 0, so the bot never had real fares.
 * This tool now returns either real flights or an explicit status explaining why not.
 */

const CABIN_TO_SERPAPI: Record<string, number> = { economy: 1, premium: 2, business: 3, first: 4 };
// SerpApi "stops": 1 = nonstop only, 2 = up to 1 stop, 3 = up to 2 stops
const MAX_STOPS_TO_SERPAPI: Record<number, number> = { 0: 1, 1: 2, 2: 3 };
const MAX_PASSENGERS = 9; // Google Flights allows at most 9 passengers per booking

const flightSchema = z.object({
  airlines: z.string(),
  flightNumbers: z.array(z.string()),
  departure: z.object({ airport: z.string(), code: z.string(), time: z.string() }),
  arrival: z.object({ airport: z.string(), code: z.string(), time: z.string() }),
  durationMinutes: z.number().optional(),
  duration: z.string().optional(),
  stops: z.number(),
  layovers: z.array(z.object({ airport: z.string(), duration: z.string().optional(), overnight: z.boolean().optional() })),
  price: z.number().optional(),
  isBestOption: z.boolean(),
});

export type FlightOption = z.infer<typeof flightSchema>;

export const flightSearchTool = createTool({
  id: 'flightSearchTool',
  description:
    'Search LIVE flight prices and schedules (Google Flights). Call this for any question about flights, fares, airlines or flight times. ' +
    'Pass 3-letter IATA airport codes when you know them (Tokyo Haneda = HND, Narita = NRT, London Heathrow = LHR). ' +
    'Returns real flights with prices, or a status explaining what is missing.',
  inputSchema: z.object({
    origin: z.string().min(1).describe('Origin IATA airport code (preferred, e.g. "HND") or city name'),
    destination: z.string().min(1).describe('Destination IATA airport code (preferred, e.g. "LHR") or city name'),
    departureDate: z.string().optional().describe('Departure date YYYY-MM-DD. If omitted, searches 14 days from today and says so.'),
    returnDate: z.string().optional().describe('Return date YYYY-MM-DD for a round trip. Omit for one-way.'),
    passengers: z.number().int().optional().describe('Number of adult passengers, 1-9 (default 1)'),
    class: z.enum(['economy', 'premium', 'business', 'first']).optional().describe('Cabin class (default economy)'),
    maxStops: z.number().int().min(0).max(2).optional().describe('0 = nonstop only, 1 = up to one stop, 2 = up to two stops'),
    currency: z.string().length(3).optional().describe('ISO currency code for prices, e.g. JPY, USD (default USD)'),
  }),
  outputSchema: z.object({
    status: z.enum(['ok', 'no_results', 'needs_input', 'error', 'rate_limited']),
    message: z.string().optional(),
    search: z.object({
      origin: z.string(),
      destination: z.string(),
      departureDate: z.string(),
      returnDate: z.string().optional(),
      tripType: z.enum(['one_way', 'round_trip']),
      passengers: z.number(),
      cabin: z.string(),
      currency: z.string(),
      departureDateAssumed: z.boolean(),
    }).optional(),
    flights: z.array(flightSchema),
    cheapestPrice: z.number().optional(),
    priceInsights: z.object({
      lowestPrice: z.number().optional(),
      priceLevel: z.string().optional(),
      typicalRange: z.array(z.number()).optional(),
    }).optional(),
    priceNote: z.string().optional(),
    googleFlightsUrl: z.string().optional(),
    source: z.string(),
  }),
  execute: async ({ context }) => {
    const source = 'Google Flights via SerpApi';
    const empty = { flights: [] as FlightOption[], source };

    const passengers = context.passengers ?? 1;
    const cabin = context.class ?? 'economy';
    const currency = (context.currency ?? 'USD').toUpperCase();

    // ---- Validate before spending a paid search ----
    const originCode = getIATACode(context.origin);
    const destCode = getIATACode(context.destination);
    if (!originCode || !destCode) {
      const unknown = [!originCode && context.origin, !destCode && context.destination].filter(Boolean).join(' and ');
      return { ...empty, status: 'needs_input' as const, message: `Could not find an airport for ${unknown}. Ask the user for the city's airport or pass its 3-letter IATA code.` };
    }
    if (originCode === destCode) {
      return { ...empty, status: 'needs_input' as const, message: 'Origin and destination are the same airport.' };
    }
    if (passengers < 1 || passengers > MAX_PASSENGERS) {
      return { ...empty, status: 'needs_input' as const, message: `Passengers must be between 1 and ${MAX_PASSENGERS}.` };
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      return { ...empty, status: 'needs_input' as const, message: `"${currency}" is not a currency code.` };
    }

    const today = todayIso();
    const departureDateAssumed = !context.departureDate;
    const departureDate = context.departureDate ?? addDaysIso(today, 14);
    if (!isValidIsoDate(departureDate)) {
      return { ...empty, status: 'needs_input' as const, message: `Departure date "${departureDate}" is not a valid YYYY-MM-DD date.` };
    }
    if (daysBetween(today, departureDate) < 0) {
      return { ...empty, status: 'needs_input' as const, message: `Departure date ${departureDate} is in the past (today is ${today}).` };
    }
    if (daysBetween(today, departureDate) > 330) {
      return { ...empty, status: 'needs_input' as const, message: 'Airlines publish fares about 11 months ahead; pick an earlier departure date.' };
    }
    const returnDate = context.returnDate;
    if (returnDate) {
      if (!isValidIsoDate(returnDate)) {
        return { ...empty, status: 'needs_input' as const, message: `Return date "${returnDate}" is not a valid YYYY-MM-DD date.` };
      }
      if (daysBetween(departureDate, returnDate) < 0) {
        return { ...empty, status: 'needs_input' as const, message: `Return date ${returnDate} is before the departure date ${departureDate}.` };
      }
    }

    const tripType = returnDate ? 'round_trip' : 'one_way';
    const search = { origin: originCode, destination: destCode, departureDate, returnDate, tripType, passengers, cabin, currency, departureDateAssumed } as const;

    const rate = checkToolRateLimit('global', 'flight');
    if (!rate.allowed) {
      return { ...empty, status: 'rate_limited' as const, message: rate.message, search };
    }

    let data: any;
    try {
      data = await serpApiSearch(
        {
          engine: 'google_flights',
          departure_id: originCode,
          arrival_id: destCode,
          outbound_date: departureDate,
          return_date: returnDate,
          type: returnDate ? 1 : 2, // 1 = round trip, 2 = one way
          travel_class: CABIN_TO_SERPAPI[cabin],
          adults: passengers,
          stops: context.maxStops !== undefined ? MAX_STOPS_TO_SERPAPI[context.maxStops] : undefined,
          currency,
          hl: 'en',
        },
        1800, // fares move; 30 minutes
      );
    } catch (error) {
      console.error('[flightSearchTool]', error instanceof SerpApiError ? `${error.code}: ${error.message}` : error);
      const noResults = error instanceof SerpApiError && error.code === 'no_results';
      return { ...empty, status: noResults ? ('no_results' as const) : ('error' as const), message: describeSerpApiError(error), search };
    }

    const flights = parseFlights(data);
    const googleFlightsUrl = typeof data?.search_metadata?.google_flights_url === 'string' ? data.search_metadata.google_flights_url : undefined;

    if (flights.length === 0) {
      return { ...empty, status: 'no_results' as const, message: `No flights found from ${originCode} to ${destCode} on ${departureDate}.`, search, googleFlightsUrl };
    }

    const prices = flights.map((f) => f.price).filter((p): p is number => typeof p === 'number');
    const insights = data?.price_insights;

    return {
      status: 'ok' as const,
      search,
      flights,
      cheapestPrice: prices.length ? Math.min(...prices) : undefined,
      priceInsights: insights
        ? {
            lowestPrice: typeof insights.lowest_price === 'number' ? insights.lowest_price : undefined,
            priceLevel: typeof insights.price_level === 'string' ? insights.price_level : undefined,
            typicalRange: Array.isArray(insights.typical_price_range) ? insights.typical_price_range.filter((n: unknown) => typeof n === 'number') : undefined,
          }
        : undefined,
      priceNote:
        `Prices in ${currency} as listed on Google Flights for ${passengers} adult${passengers > 1 ? 's' : ''}` +
        (returnDate ? ', round trip. Times shown are the outbound leg.' : ', one way.'),
      googleFlightsUrl,
      source,
    };
  },
});

/** Turn SerpApi best_flights + other_flights into a compact list, cheapest first, max 6. */
export function parseFlights(data: any): FlightOption[] {
  const options: FlightOption[] = [];
  const groups: Array<[unknown, boolean]> = [[data?.best_flights, true], [data?.other_flights, false]];
  for (const [list, isBest] of groups) {
    if (!Array.isArray(list)) continue;
    for (const option of list) {
      const segments: any[] = Array.isArray(option?.flights) ? option.flights : [];
      if (segments.length === 0) continue;
      const first = segments[0];
      const last = segments[segments.length - 1];
      const airlines = [...new Set(segments.map((s) => s?.airline).filter((a): a is string => typeof a === 'string'))];
      options.push({
        airlines: airlines.join(', ') || 'Unknown airline',
        flightNumbers: segments.map((s) => s?.flight_number).filter((n): n is string => typeof n === 'string'),
        departure: {
          airport: String(first?.departure_airport?.name ?? ''),
          code: String(first?.departure_airport?.id ?? ''),
          time: String(first?.departure_airport?.time ?? ''),
        },
        arrival: {
          airport: String(last?.arrival_airport?.name ?? ''),
          code: String(last?.arrival_airport?.id ?? ''),
          time: String(last?.arrival_airport?.time ?? ''),
        },
        durationMinutes: typeof option?.total_duration === 'number' ? option.total_duration : undefined,
        duration: formatMinutes(option?.total_duration),
        stops: segments.length - 1,
        layovers: (Array.isArray(option?.layovers) ? option.layovers : []).map((l: any) => ({
          airport: String(l?.name ?? l?.id ?? ''),
          duration: formatMinutes(l?.duration),
          overnight: l?.overnight === true ? true : undefined,
        })),
        price: typeof option?.price === 'number' && option.price > 0 ? option.price : undefined,
        isBestOption: isBest,
      });
    }
  }
  // Priced options first, cheapest first; unpriced (sold out / unknown) last.
  options.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  return options.slice(0, 6);
}
