/**
 * SerpApi client
 * One place for the key, timeouts, caching and error mapping, so every tool
 * that uses SerpApi (flights, hotels, web search) fails the same honest way.
 *
 * Free plan is 250 searches a month, so every call is cached.
 */

import { getOrSet, generateCacheKey } from '../../../middleware/cache-manager';

const SERPAPI_URL = 'https://serpapi.com/search.json';
const TIMEOUT_MS = 20_000;

export type SerpApiErrorCode = 'missing_key' | 'auth' | 'quota' | 'no_results' | 'bad_request' | 'timeout' | 'network' | 'upstream';

export class SerpApiError extends Error {
  constructor(public code: SerpApiErrorCode, message: string) {
    super(message);
    this.name = 'SerpApiError';
  }
}

/**
 * SERPAPI_API_KEY is the documented name. SERAPI_API_KEY (missing "P") is accepted
 * because that is how the key was first saved on Render; rename it when convenient.
 */
export function getSerpApiKey(): string | undefined {
  return process.env.SERPAPI_API_KEY || process.env.SERAPI_API_KEY || undefined;
}

/** Human-readable reason for the agent to relay to the user. Never includes the key. */
export function describeSerpApiError(error: unknown): string {
  if (!(error instanceof SerpApiError)) return 'The live search service failed unexpectedly.';
  switch (error.code) {
    case 'missing_key': return 'Live search is not configured on the server (SERPAPI_API_KEY is missing).';
    case 'auth': return 'The live search API key was rejected.';
    case 'quota': return 'The live search monthly quota is used up.';
    case 'no_results': return error.message;
    case 'bad_request': return `The search request was invalid: ${error.message}`;
    case 'timeout': return 'The live search took too long to respond.';
    default: return 'The live search service is unavailable right now.';
  }
}

export async function serpApiSearch(
  params: Record<string, string | number | undefined>,
  ttlSeconds: number,
): Promise<any> {
  const apiKey = getSerpApiKey();
  if (!apiKey) throw new SerpApiError('missing_key', 'SERPAPI_API_KEY is not set');

  // Drop empty values so they never reach the query string or the cache key.
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = String(v);
  }

  // The key stays out of the cache key on purpose.
  const cacheKey = generateCacheKey('serpapi', clean);

  return getOrSet(
    cacheKey,
    async () => {
      const url = `${SERPAPI_URL}?${new URLSearchParams({ ...clean, api_key: apiKey })}`;
      let response: Response;
      try {
        response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      } catch (err) {
        if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
          throw new SerpApiError('timeout', 'SerpApi timed out');
        }
        throw new SerpApiError('network', 'Could not reach SerpApi');
      }

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        // Non-JSON body; fall through to status handling.
      }
      const apiMessage: string = typeof data?.error === 'string' ? data.error : '';

      if (response.status === 401 || /invalid api key/i.test(apiMessage)) throw new SerpApiError('auth', apiMessage || 'Unauthorized');
      if (response.status === 429 || /run out of searches|plan.*limit|rate limit/i.test(apiMessage)) throw new SerpApiError('quota', apiMessage || 'Quota exceeded');
      // SerpApi reports "no results" as an error string with a 200 status.
      if (/hasn't returned any results|no results/i.test(apiMessage)) throw new SerpApiError('no_results', apiMessage);
      if (response.status === 400 || apiMessage) throw new SerpApiError('bad_request', apiMessage || `HTTP ${response.status}`);
      if (!response.ok || !data) throw new SerpApiError('upstream', `HTTP ${response.status}`);

      return data;
    },
    ttlSeconds,
  );
}
