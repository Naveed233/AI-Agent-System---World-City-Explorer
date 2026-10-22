import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { serpApiSearch, describeSerpApiError, SerpApiError } from './helpers/serpapi-client';
import { isValidIsoDate, todayIso, addDaysIso, daysBetween } from './helpers/trip-dates';
import { checkToolRateLimit } from '../../middleware/rate-limiter';

/**
 * Hotel Search Tool
 * Live hotel prices from Google Hotels through SerpApi.
 * Replaces the Amadeus integration, whose fallback returned generic booking-site links.
 */

// SerpApi google_hotels: sort_by 3 = lowest price, 8 = highest rating; hotel_class accepts a comma list of stars.
const RANGE_FILTERS: Record<string, { sort_by?: number; hotel_class?: string }> = {
  budget: { sort_by: 3 },
  'mid-range': { hotel_class: '3,4' },
  luxury: { hotel_class: '5', sort_by: 8 },
};

const hotelSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  pricePerNight: z.number().optional(),
  totalPrice: z.number().optional(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  stars: z.number().optional(),
  amenities: z.array(z.string()),
  checkInTime: z.string().optional(),
  link: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type HotelOption = z.infer<typeof hotelSchema>;

export const hotelBookingTool = createTool({
  id: 'hotelBookingTool',
  description:
    'Search LIVE hotel prices and ratings (Google Hotels) for a city or area. Call this for any question about hotels, ' +
    'places to stay or accommodation prices. Returns real hotels with nightly prices, or a status explaining what is missing.',
  inputSchema: z.object({
    city: z.string().min(1).describe('City or area, e.g. "Shinjuku, Tokyo" or "Paris"'),
    checkIn: z.string().optional().describe('Check-in date YYYY-MM-DD. If omitted, searches 14 days from today and says so.'),
    checkOut: z.string().optional().describe('Check-out date YYYY-MM-DD. Defaults to 2 nights after check-in.'),
    guests: z.number().int().optional().describe('Number of adults, 1-10 (default 2)'),
    priceRange: z.enum(['budget', 'mid-range', 'luxury']).optional().describe('budget sorts by lowest price; mid-range = 3-4 stars; luxury = 5 stars'),
    currency: z.string().length(3).optional().describe('ISO currency code, e.g. JPY, USD (default USD)'),
  }),
  outputSchema: z.object({
    status: z.enum(['ok', 'no_results', 'needs_input', 'error', 'rate_limited']),
    message: z.string().optional(),
    search: z.object({
      city: z.string(),
      checkIn: z.string(),
      checkOut: z.string(),
      nights: z.number(),
      guests: z.number(),
      currency: z.string(),
      datesAssumed: z.boolean(),
    }).optional(),
    hotels: z.array(hotelSchema),
    googleHotelsUrl: z.string().optional(),
    source: z.string(),
  }),
  execute: async ({ context }) => {
    const source = 'Google Hotels via SerpApi';
    const empty = { hotels: [] as HotelOption[], source };

    const city = context.city.trim();
    const guests = context.guests ?? 2;
    const currency = (context.currency ?? 'USD').toUpperCase();
    if (!city) return { ...empty, status: 'needs_input' as const, message: 'Which city or area should I search?' };
    if (guests < 1 || guests > 10) return { ...empty, status: 'needs_input' as const, message: 'Guests must be between 1 and 10.' };
    if (!/^[A-Z]{3}$/.test(currency)) return { ...empty, status: 'needs_input' as const, message: `"${currency}" is not a currency code.` };

    const today = todayIso();
    const datesAssumed = !context.checkIn;
    const checkIn = context.checkIn ?? addDaysIso(today, 14);
    if (!isValidIsoDate(checkIn)) return { ...empty, status: 'needs_input' as const, message: `Check-in "${checkIn}" is not a valid YYYY-MM-DD date.` };
    if (daysBetween(today, checkIn) < 0) return { ...empty, status: 'needs_input' as const, message: `Check-in ${checkIn} is in the past (today is ${today}).` };
    const checkOut = context.checkOut ?? addDaysIso(checkIn, 2);
    if (!isValidIsoDate(checkOut)) return { ...empty, status: 'needs_input' as const, message: `Check-out "${checkOut}" is not a valid YYYY-MM-DD date.` };
    const nights = daysBetween(checkIn, checkOut);
    if (nights < 1) return { ...empty, status: 'needs_input' as const, message: 'Check-out must be at least one night after check-in.' };
    if (nights > 30) return { ...empty, status: 'needs_input' as const, message: 'Stays longer than 30 nights are not supported by this search.' };

    const search = { city, checkIn, checkOut, nights, guests, currency, datesAssumed };

    const rate = checkToolRateLimit('global', 'hotel');
    if (!rate.allowed) return { ...empty, status: 'rate_limited' as const, message: rate.message, search };

    let data: any;
    try {
      data = await serpApiSearch(
        {
          engine: 'google_hotels',
          q: city,
          check_in_date: checkIn,
          check_out_date: checkOut,
          adults: guests,
          currency,
          hl: 'en',
          ...(context.priceRange ? RANGE_FILTERS[context.priceRange] : {}),
        },
        6 * 3600, // hotel rates change slower than fares; 6 hours
      );
    } catch (error) {
      console.error('[hotelBookingTool]', error instanceof SerpApiError ? `${error.code}: ${error.message}` : error);
      const noResults = error instanceof SerpApiError && error.code === 'no_results';
      return { ...empty, status: noResults ? ('no_results' as const) : ('error' as const), message: describeSerpApiError(error), search };
    }

    const hotels = parseHotels(data);
    const googleHotelsUrl = typeof data?.search_metadata?.google_hotels_url === 'string' ? data.search_metadata.google_hotels_url : undefined;
    if (hotels.length === 0) {
      return { ...empty, status: 'no_results' as const, message: `No hotels found for "${city}" on those dates.`, search, googleHotelsUrl };
    }
    return { status: 'ok' as const, search, hotels, googleHotelsUrl, source };
  },
});

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/** Compact list of up to 6 properties. Ads are skipped: they are paid placements, not search results. */
export function parseHotels(data: any): HotelOption[] {
  const list: any[] = Array.isArray(data?.properties) ? data.properties : [];
  return list
    .filter((p) => typeof p?.name === 'string' && p.name.trim())
    .slice(0, 6)
    .map((p) => ({
      name: p.name.trim(),
      type: typeof p.type === 'string' ? p.type : undefined,
      pricePerNight: num(p.rate_per_night?.extracted_lowest),
      totalPrice: num(p.total_rate?.extracted_lowest),
      rating: num(p.overall_rating),
      reviews: num(p.reviews),
      stars: num(p.extracted_hotel_class),
      amenities: (Array.isArray(p.amenities) ? p.amenities : []).filter((a: unknown) => typeof a === 'string').slice(0, 6),
      checkInTime: typeof p.check_in_time === 'string' ? p.check_in_time : undefined,
      link: typeof p.link === 'string' && /^https?:\/\//.test(p.link) ? p.link : undefined,
      imageUrl: typeof p.images?.[0]?.thumbnail === 'string' ? p.images[0].thumbnail : undefined,
    }));
}
