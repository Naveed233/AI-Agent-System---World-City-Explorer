import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { serpApiSearch, describeSerpApiError, SerpApiError } from './helpers/serpapi-client';
import { checkToolRateLimit } from '../../middleware/rate-limiter';

/**
 * Web Search Tool
 * Google results through SerpApi.
 *
 * The previous version used DuckDuckGo's Instant Answer API, which returns nothing
 * for most travel questions, and then filled the gap with hard-coded "curated"
 * text that the bot presented as live results. Now an empty search says it is empty.
 */
export const webSearchTool = createTool({
  id: 'webSearchTool',
  description:
    'Search Google for current information that no other tool covers: opening hours, events, restaurant names, entry fees, news. ' +
    'Do NOT use for flights (flightSearchTool) or hotels (hotelBookingTool). Each call uses paid quota, so search once with a precise query.',
  inputSchema: z.object({
    query: z.string().min(2).describe('Precise search query, e.g. "teamLab Planets Tokyo ticket price 2026"'),
    maxResults: z.number().int().min(1).max(8).optional().describe('Results to return (default 5)'),
  }),
  outputSchema: z.object({
    status: z.enum(['ok', 'no_results', 'error', 'rate_limited']),
    message: z.string().optional(),
    answer: z.string().optional(),
    results: z.array(z.object({ title: z.string(), snippet: z.string(), url: z.string() })),
    query: z.string(),
    source: z.string(),
  }),
  execute: async ({ context }) => {
    const query = context.query.trim();
    const maxResults = context.maxResults ?? 5;
    const source = 'Google Search via SerpApi';

    const rate = checkToolRateLimit('global', 'search');
    if (!rate.allowed) return { status: 'rate_limited' as const, message: rate.message, results: [], query, source };

    let data: any;
    try {
      data = await serpApiSearch({ engine: 'google', q: query, num: maxResults, hl: 'en' }, 6 * 3600);
    } catch (error) {
      console.error('[webSearchTool]', error instanceof SerpApiError ? `${error.code}: ${error.message}` : error);
      const noResults = error instanceof SerpApiError && error.code === 'no_results';
      return { status: noResults ? ('no_results' as const) : ('error' as const), message: describeSerpApiError(error), results: [], query, source };
    }

    return { ...parseSearch(data, maxResults), query, source };
  },
});

export function parseSearch(data: any, maxResults: number) {
  const results = (Array.isArray(data?.organic_results) ? data.organic_results : [])
    .filter((r: any) => typeof r?.title === 'string' && typeof r?.link === 'string')
    .slice(0, maxResults)
    .map((r: any) => ({ title: r.title, snippet: typeof r.snippet === 'string' ? r.snippet : '', url: r.link }));

  const box = data?.answer_box;
  const answer =
    typeof box?.answer === 'string' ? box.answer : typeof box?.snippet === 'string' ? box.snippet : undefined;

  if (!results.length && !answer) {
    return { status: 'no_results' as const, message: 'The search returned no results.', results: [] as { title: string; snippet: string; url: string }[] };
  }
  return { status: 'ok' as const, answer, results: results as { title: string; snippet: string; url: string }[] };
}
