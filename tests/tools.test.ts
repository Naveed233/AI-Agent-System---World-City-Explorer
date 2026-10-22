/**
 * Offline tests for the live-data tools.
 * fetch is replaced with a stub, so these prove request building, parsing,
 * validation and error handling. They do NOT prove the real APIs respond this way:
 * that needs a live run with keys (see README "Testing").
 *
 * Run: npm run test:tools
 */
import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RuntimeContext } from '@mastra/core/runtime-context';

import { flightSearchTool } from '../src/mastra/tools/flight-search-tool';
import { hotelBookingTool } from '../src/mastra/tools/hotel-booking-tool';
import { webSearchTool } from '../src/mastra/tools/web-search-tool';
import { currencyConversionTool } from '../src/mastra/tools/currency-conversion-tool';
import { weatherTool } from '../src/mastra/tools/weather-tool';
import { imageSearchTool } from '../src/mastra/tools/image-search-tool';
import { visaRequirementsTool } from '../src/mastra/tools/visa-requirements-tool';
import { getIATACode } from '../src/mastra/tools/helpers/city-iata-mapper';
import { isValidIsoDate, addDaysIso, todayIso } from '../src/mastra/tools/helpers/trip-dates';
import { clearCache } from '../src/middleware/cache-manager';
import { resetRateLimit } from '../src/middleware/rate-limiter';
import { cityAssistantAgent } from '../src/mastra/agents/city-assistant-agent';
import * as fx from './fixtures/serpapi';

// ---------- fetch stub ----------
type Reply = { status?: number; body?: unknown; throws?: Error };
let calls: URL[] = [];
let replies: Reply[] = [];
const realFetch = globalThis.fetch;

function reply(...r: Reply[]) {
  replies = r;
}

beforeEach(async () => {
  calls = [];
  replies = [];
  await clearCache();
  resetRateLimit('global');
  process.env.SERPAPI_API_KEY = 'test-key';
  delete process.env.SERAPI_API_KEY;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    calls.push(url);
    const next = replies.shift() ?? { status: 500, body: { error: 'no stub' } };
    if (next.throws) throw next.throws;
    return new Response(JSON.stringify(next.body ?? {}), { status: next.status ?? 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const run = (tool: any, context: Record<string, unknown>) => tool.execute({ context, runtimeContext: new RuntimeContext() });
const inDays = (n: number) => addDaysIso(todayIso(), n);

// ---------- flights ----------
describe('flightSearchTool', () => {
  test('returns real parsed flights, cheapest first, and builds a one-way request', async () => {
    reply({ body: fx.flightsResponse });
    const r = await run(flightSearchTool, { origin: 'HND', destination: 'LHR', departureDate: inDays(20), currency: 'jpy' });

    assert.equal(r.status, 'ok');
    assert.equal(calls.length, 1);
    const q = calls[0].searchParams;
    assert.equal(calls[0].hostname, 'serpapi.com');
    assert.equal(q.get('engine'), 'google_flights');
    assert.equal(q.get('departure_id'), 'HND');
    assert.equal(q.get('arrival_id'), 'LHR');
    assert.equal(q.get('type'), '2'); // one way
    assert.equal(q.get('travel_class'), '1'); // economy
    assert.equal(q.get('currency'), 'JPY');
    assert.equal(q.get('api_key'), 'test-key');
    assert.equal(q.get('return_date'), null);

    assert.equal(r.flights.length, 3, 'malformed entry skipped');
    assert.deepEqual(r.flights.map((f: any) => f.price), [980, 1240, undefined]);
    const emirates = r.flights[0];
    assert.equal(emirates.airlines, 'Emirates');
    assert.equal(emirates.stops, 1);
    assert.deepEqual(emirates.flightNumbers, ['EK 313', 'EK 1']);
    assert.equal(emirates.departure.code, 'HND');
    assert.equal(emirates.arrival.code, 'LHR');
    assert.equal(emirates.duration, '22h 40m');
    assert.equal(emirates.layovers[0].duration, '3h 15m');
    assert.equal(r.flights[1].isBestOption, true);
    assert.equal(r.cheapestPrice, 980);
    assert.equal(r.priceInsights.priceLevel, 'typical');
    assert.match(r.googleFlightsUrl, /^https:\/\/www\.google\.com\/travel\/flights/);
    assert.equal(r.search.departureDateAssumed, false);
    assert.match(r.priceNote, /JPY/);
  });

  test('round trip sends type=1 and the return date', async () => {
    reply({ body: fx.flightsResponse });
    const r = await run(flightSearchTool, { origin: 'HND', destination: 'LHR', departureDate: inDays(20), returnDate: inDays(27), class: 'business', passengers: 2, maxStops: 0 });
    const q = calls[0].searchParams;
    assert.equal(r.status, 'ok');
    assert.equal(q.get('type'), '1');
    assert.equal(q.get('return_date'), inDays(27));
    assert.equal(q.get('travel_class'), '3');
    assert.equal(q.get('adults'), '2');
    assert.equal(q.get('stops'), '1'); // nonstop only
    assert.match(r.priceNote, /round trip/);
  });

  test('no date given: searches 14 days out and flags it', async () => {
    reply({ body: fx.flightsResponse });
    const r = await run(flightSearchTool, { origin: 'Tokyo', destination: 'London' });
    assert.equal(r.search.departureDate, inDays(14));
    assert.equal(r.search.departureDateAssumed, true);
    assert.equal(calls[0].searchParams.get('departure_id'), 'NRT');
    assert.equal(calls[0].searchParams.get('arrival_id'), 'LHR');
  });

  test('Japanese city names resolve to airports', async () => {
    reply({ body: fx.flightsResponse });
    const r = await run(flightSearchTool, { origin: '東京', destination: 'ソウル', departureDate: inDays(10) });
    assert.equal(r.status, 'ok');
    assert.equal(calls[0].searchParams.get('departure_id'), 'NRT');
    assert.equal(calls[0].searchParams.get('arrival_id'), 'ICN');
  });

  const invalid: Array<[string, Record<string, unknown>, RegExp]> = [
    ['unknown city', { origin: 'Atlantis', destination: 'LHR' }, /Could not find an airport for Atlantis/],
    ['same airport', { origin: 'HND', destination: 'hnd' }, /same airport/],
    ['past date', { origin: 'HND', destination: 'LHR', departureDate: '2020-01-01' }, /in the past/],
    ['impossible date', { origin: 'HND', destination: 'LHR', departureDate: '2027-02-30' }, /not a valid/],
    ['wrong format', { origin: 'HND', destination: 'LHR', departureDate: '05/11/2026' }, /not a valid/],
    ['return before departure', { origin: 'HND', destination: 'LHR', departureDate: inDays(20), returnDate: inDays(10) }, /before the departure/],
    ['too far ahead', { origin: 'HND', destination: 'LHR', departureDate: inDays(400) }, /11 months/],
    ['zero passengers', { origin: 'HND', destination: 'LHR', passengers: 0 }, /between 1 and 9/],
    ['ten passengers', { origin: 'HND', destination: 'LHR', passengers: 10 }, /between 1 and 9/],
  ];
  for (const [name, ctx, msg] of invalid) {
    test(`needs_input without a paid search: ${name}`, async () => {
      const r = await run(flightSearchTool, ctx);
      assert.equal(r.status, 'needs_input');
      assert.match(r.message, msg);
      assert.equal(r.flights.length, 0);
      assert.equal(calls.length, 0, 'must not spend SerpApi quota on invalid input');
    });
  }

  test('missing key: honest error, no request', async () => {
    delete process.env.SERPAPI_API_KEY;
    const r = await run(flightSearchTool, { origin: 'HND', destination: 'LHR', departureDate: inDays(20) });
    assert.equal(r.status, 'error');
    assert.match(r.message, /SERPAPI_API_KEY/);
    assert.equal(calls.length, 0);
  });

  test('accepts the misspelled SERAPI_API_KEY already saved on Render', async () => {
    delete process.env.SERPAPI_API_KEY;
    process.env.SERAPI_API_KEY = 'typo-key';
    reply({ body: fx.flightsResponse });
    const r = await run(flightSearchTool, { origin: 'HND', destination: 'LHR', departureDate: inDays(20) });
    assert.equal(r.status, 'ok');
    assert.equal(calls[0].searchParams.get('api_key'), 'typo-key');
  });

  const failures: Array<[string, Reply, string, RegExp]> = [
    ['no results', { body: fx.noResultsError }, 'no_results', /hasn't returned any results/],
    ['invalid key', { status: 401, body: fx.invalidKeyError }, 'error', /key was rejected/],
    ['quota used up', { status: 429, body: fx.quotaError }, 'error', /quota is used up/],
    ['quota message with 200', { body: fx.quotaError }, 'error', /quota is used up/],
    ['server error', { status: 503, body: {} }, 'error', /unavailable/],
    ['network down', { throws: new TypeError('fetch failed') }, 'error', /unavailable/],
    ['timeout', { throws: Object.assign(new Error('timed out'), { name: 'TimeoutError' }) }, 'error', /too long/],
    ['empty lists', { body: { best_flights: [], other_flights: [] } }, 'no_results', /No flights found/],
  ];
  for (const [name, r1, status, msg] of failures) {
    test(`upstream failure is reported, never faked: ${name}`, async () => {
      reply(r1);
      const r = await run(flightSearchTool, { origin: 'HND', destination: 'LHR', departureDate: inDays(20) });
      assert.equal(r.status, status);
      assert.match(r.message, msg);
      assert.equal(r.flights.length, 0);
      assert.equal(r.cheapestPrice, undefined, 'no price 0 placeholders');
    });
  }

  test('identical searches hit the cache, so quota is spent once', async () => {
    reply({ body: fx.flightsResponse });
    const ctx = { origin: 'HND', destination: 'LHR', departureDate: inDays(20) };
    await run(flightSearchTool, ctx);
    const second = await run(flightSearchTool, ctx);
    assert.equal(second.status, 'ok');
    assert.equal(calls.length, 1);
  });

  test('a failed search is not cached', async () => {
    reply({ status: 503, body: {} }, { body: fx.flightsResponse });
    const ctx = { origin: 'HND', destination: 'LHR', departureDate: inDays(21) };
    assert.equal((await run(flightSearchTool, ctx)).status, 'error');
    assert.equal((await run(flightSearchTool, ctx)).status, 'ok');
    assert.equal(calls.length, 2);
  });

  test('rate limit stops paid searches after 20 an hour', async () => {
    for (let i = 0; i < 20; i++) replies.push({ body: fx.flightsResponse });
    for (let i = 0; i < 20; i++) await run(flightSearchTool, { origin: 'HND', destination: 'LHR', departureDate: inDays(30 + i) });
    const r = await run(flightSearchTool, { origin: 'HND', destination: 'LHR', departureDate: inDays(60) });
    assert.equal(r.status, 'rate_limited');
    assert.equal(calls.length, 20);
  });
});

// ---------- hotels ----------
describe('hotelBookingTool', () => {
  test('parses properties, skips ads and unsafe links', async () => {
    reply({ body: fx.hotelsResponse });
    const r = await run(hotelBookingTool, { city: 'Shinjuku, Tokyo', checkIn: inDays(20), checkOut: inDays(23), currency: 'JPY' });
    assert.equal(r.status, 'ok');
    const q = calls[0].searchParams;
    assert.equal(q.get('engine'), 'google_hotels');
    assert.equal(q.get('q'), 'Shinjuku, Tokyo');
    assert.equal(q.get('check_in_date'), inDays(20));
    assert.equal(q.get('check_out_date'), inDays(23));
    assert.equal(q.get('adults'), '2');
    assert.equal(r.search.nights, 3);
    assert.equal(r.hotels.length, 2);
    assert.ok(!r.hotels.some((h: any) => h.name === 'Sponsored Hotel'));
    const [a, b] = r.hotels;
    assert.equal(a.pricePerNight, 180);
    assert.equal(a.totalPrice, 360);
    assert.equal(a.stars, 4);
    assert.equal(a.amenities.length, 6);
    assert.equal(a.imageUrl, 'https://example.com/thumb.jpg');
    assert.equal(b.name, 'Fixture Apartment');
    assert.equal(b.link, undefined, 'javascript: link dropped');
    assert.equal(b.pricePerNight, undefined, 'no invented price');
  });

  test('price range maps to filters', async () => {
    reply({ body: fx.hotelsResponse }, { body: fx.hotelsResponse });
    await run(hotelBookingTool, { city: 'Osaka', priceRange: 'budget' });
    await run(hotelBookingTool, { city: 'Kyoto', priceRange: 'luxury' });
    assert.equal(calls[0].searchParams.get('sort_by'), '3');
    assert.equal(calls[1].searchParams.get('hotel_class'), '5');
  });

  test('default dates: 14 days out, 2 nights, flagged', async () => {
    reply({ body: fx.hotelsResponse });
    const r = await run(hotelBookingTool, { city: 'Osaka' });
    assert.equal(r.search.checkIn, inDays(14));
    assert.equal(r.search.checkOut, inDays(16));
    assert.equal(r.search.datesAssumed, true);
  });

  const invalid: Array<[string, Record<string, unknown>, RegExp]> = [
    ['check-out before check-in', { city: 'Osaka', checkIn: inDays(10), checkOut: inDays(9) }, /at least one night/],
    ['same-day check-out', { city: 'Osaka', checkIn: inDays(10), checkOut: inDays(10) }, /at least one night/],
    ['past check-in', { city: 'Osaka', checkIn: '2020-05-01' }, /in the past/],
    ['too long', { city: 'Osaka', checkIn: inDays(10), checkOut: inDays(50) }, /30 nights/],
    ['blank city', { city: '   ' }, /Which city/],
    ['too many guests', { city: 'Osaka', guests: 11 }, /between 1 and 10/],
  ];
  for (const [name, ctx, msg] of invalid) {
    test(`needs_input without a paid search: ${name}`, async () => {
      const r = await run(hotelBookingTool, ctx);
      assert.equal(r.status, 'needs_input');
      assert.match(r.message, msg);
      assert.equal(calls.length, 0);
    });
  }

  test('no properties: no_results, not generic booking links', async () => {
    reply({ body: { properties: [] } });
    const r = await run(hotelBookingTool, { city: 'Nowhere' });
    assert.equal(r.status, 'no_results');
    assert.equal(r.hotels.length, 0);
  });
});

// ---------- web search ----------
describe('webSearchTool', () => {
  test('returns Google organic results and answer box', async () => {
    reply({ body: fx.searchResponse });
    const r = await run(webSearchTool, { query: 'Fixture Museum ticket price' });
    assert.equal(r.status, 'ok');
    assert.equal(calls[0].searchParams.get('engine'), 'google');
    assert.equal(r.answer, '3,800 yen');
    assert.equal(r.results.length, 2, 'entry without title/link skipped');
    assert.equal(r.results[1].snippet, '');
  });

  test('empty search is reported as empty, not filled with canned text', async () => {
    reply({ body: { organic_results: [] } });
    const r = await run(webSearchTool, { query: 'zzzz qqqq' });
    assert.equal(r.status, 'no_results');
    assert.equal(r.results.length, 0);
  });

  test('failure returns no results and a reason', async () => {
    reply({ status: 401, body: fx.invalidKeyError });
    const r = await run(webSearchTool, { query: 'Tokyo events' });
    assert.equal(r.status, 'error');
    assert.equal(r.results.length, 0);
  });

  test('visa tool says when live search failed instead of returning a blank answer', async () => {
    reply({ status: 503, body: {} });
    const r = await run(visaRequirementsTool, { passportCountry: 'India', destinationCountry: 'Japan' });
    assert.match(r.searchResults, /Live search returned nothing/);
    assert.deepEqual(r.sources, []);
  });
});

// ---------- currency ----------
describe('currencyConversionTool', () => {
  beforeEach(() => {
    delete process.env.EXCHANGERATE_API_KEY;
  });

  test('live rate when the API answers', async () => {
    process.env.EXCHANGERATE_API_KEY = 'x';
    reply({ body: { result: 'success', conversion_rates: { JPY: 150 }, time_last_update_unix: 1_790_000_000 } });
    const r = await run(currencyConversionTool, { amount: 10, from: 'usd', to: 'jpy' });
    assert.equal(r.status, 'live');
    assert.equal(r.converted, 1500);
    assert.match(calls[0].pathname, /\/latest\/USD$/);
  });

  test('no key: no request, estimated rate clearly flagged', async () => {
    const r = await run(currencyConversionTool, { amount: 100, from: 'USD', to: 'JPY' });
    assert.equal(calls.length, 0);
    assert.equal(r.status, 'estimated');
    assert.ok(r.converted > 0);
  });

  test('unknown pair offline is "unavailable", not a 1:1 rate', async () => {
    const r = await run(currencyConversionTool, { amount: 10000, from: 'KRW', to: 'THB' });
    assert.equal(r.status, 'unavailable');
    assert.equal(r.converted, 0);
  });

  test('cross rate via USD is computed correctly offline', async () => {
    const r = await run(currencyConversionTool, { amount: 100, from: 'JPY', to: 'INR' });
    assert.equal(r.status, 'estimated');
    // 100 JPY / 149.50 * 83.12
    assert.equal(r.converted, 55.6);
  });

  test('API error body is not cached', async () => {
    process.env.EXCHANGERATE_API_KEY = 'x';
    reply({ body: { result: 'error', 'error-type': 'quota-reached' } }, { body: { result: 'success', conversion_rates: { EUR: 0.9 }, time_last_update_unix: 1 } });
    assert.equal((await run(currencyConversionTool, { amount: 1, from: 'USD', to: 'EUR' })).status, 'estimated');
    assert.equal((await run(currencyConversionTool, { amount: 1, from: 'USD', to: 'EUR' })).status, 'live');
  });
});

// ---------- weather and images ----------
describe('weather and images', () => {
  test('weather without a key throws instead of inventing 23.5°C', async () => {
    delete process.env.OPENWEATHER_API_KEY;
    const r = await run(weatherTool, { city: 'Tokyo' }).catch((e: Error) => e);
    assert.ok(r instanceof Error);
    assert.match(r.message, /OPENWEATHER_API_KEY/);
  });

  test('weather 404 explains the city was not found', async () => {
    process.env.OPENWEATHER_API_KEY = 'x';
    reply({ status: 404, body: { message: 'city not found' } });
    const r = await run(weatherTool, { city: 'Nowheresville' }).catch((e: Error) => e);
    assert.match(r.message, /No weather data found/);
  });

  test('image search returns no image rather than a random stock photo', async () => {
    delete process.env.UNSPLASH_ACCESS_KEY;
    reply({ status: 404, body: {} }, { status: 404, body: {} }, { status: 404, body: {} });
    const r = await run(imageSearchTool, { query: 'Some Tiny Local Cafe Kyoto' });
    assert.equal(r.source, 'none');
    assert.equal(r.image_url, '');
    assert.ok(calls.every((u) => !u.hostname.includes('picsum')));
  });
});

// ---------- helpers and agent config ----------
describe('helpers and agent', () => {
  test('IATA lookup is strict', () => {
    assert.equal(getIATACode('Milan'), 'MXP', 'used to match "LA" inside MILAN and return LAX');
    assert.equal(getIATACode('Kyoto'), 'KIX');
    assert.equal(getIATACode('New York, NY'), 'JFK');
    assert.equal(getIATACode('Tokyo (HND)'), 'HND');
    assert.equal(getIATACode('lhr'), 'LHR');
    assert.equal(getIATACode('Atlantis'), null, 'used to return "ATL" (Atlanta)');
    assert.equal(getIATACode(''), null);
  });

  test('date validation rejects impossible dates', () => {
    assert.equal(isValidIsoDate('2028-02-29'), true);
    assert.equal(isValidIsoDate('2027-02-29'), false);
    assert.equal(isValidIsoDate('2026-13-01'), false);
    assert.equal(isValidIsoDate('2026-1-01'), false);
  });

  test('agent: today injected, 10 steps, all 15 tools', async () => {
    const instructions = await cityAssistantAgent.getInstructions({ runtimeContext: new RuntimeContext() });
    const text = typeof instructions === 'string' ? instructions : JSON.stringify(instructions);
    assert.match(text, new RegExp(`Today is \\w+, ${todayIso()}`));
    assert.match(text, /must come from a tool result/);
    const opts = await cityAssistantAgent.getDefaultVNextStreamOptions();
    assert.equal(opts.maxSteps, 10);
    const tools = await cityAssistantAgent.getTools({ runtimeContext: new RuntimeContext() });
    assert.equal(Object.keys(tools).length, 15);
  });
});
