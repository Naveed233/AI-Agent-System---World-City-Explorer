import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { checkToolRateLimit } from '../../middleware/rate-limiter';
import { getOrSet } from '../../middleware/cache-manager';

/**
 * Currency Conversion Tool
 * Converts between currencies with real-time rates from ExchangeRate-API
 */
export const currencyConversionTool = createTool({
  id: 'currencyConversionTool',
  description: 'Convert currency amounts between different currencies with live exchange rates from ExchangeRate-API. Provides real-time rate information and money-saving tips.',
  inputSchema: z.object({
    amount: z.number().describe('Amount to convert'),
    from: z.string().describe('Source currency code (e.g., USD, EUR, GBP)'),
    to: z.string().describe('Target currency code'),
  }),
  outputSchema: z.object({
    amount: z.number(),
    from: z.string(),
    to: z.string(),
    converted: z.number(),
    rate: z.number(),
    lastUpdated: z.string(),
    tips: z.array(z.string()),
    status: z.enum(['live', 'estimated', 'unavailable']).optional(),
  }),
  execute: async ({ context }) => {
    const { amount, from, to } = context;

    if (!/^[A-Za-z]{3}$/.test(from) || !/^[A-Za-z]{3}$/.test(to) || !Number.isFinite(amount)) {
      return {
        amount, from: from.toUpperCase(), to: to.toUpperCase(), converted: 0, rate: 0,
        lastUpdated: '', status: 'unavailable' as const,
        tips: ['Use 3-letter ISO currency codes such as JPY, USD, EUR.'],
      };
    }

    // Rate limiting check (50 currency conversions per hour per user)
    const identifier = 'demo-user'; // TODO: Get from runtimeContext/auth
    const rateLimitResult = checkToolRateLimit(identifier, 'currency');
    
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 [Currency Conversion] Rate limit exceeded for ${identifier}`);
      return {
        amount,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        converted: 0,
        rate: 0,
        lastUpdated: new Date().toLocaleDateString(),
        tips: [
          `⚠️ ${rateLimitResult.message}`,
          `💡 You can convert again after the limit resets`,
          `📊 Remaining conversions: ${rateLimitResult.remaining}/50 per hour`,
        ],
      };
    }

    console.log(`💱 [Currency Conversion] Converting ${amount} ${from} to ${to} (Live API) [${rateLimitResult.remaining} remaining]`);

    // No hardcoded fallback key: a key in source code is public and gets revoked or abused.
    const API_KEY = process.env.EXCHANGERATE_API_KEY;
    const fromUpper = from.toUpperCase();
    
    try {
      if (!API_KEY) throw new Error('EXCHANGERATE_API_KEY is not set');
      // Fetch live exchange rates with caching (cached for 1 hour since rates don't change often)
      const data = await getOrSet(
        `exchange:${fromUpper}`,
        async () => {
          const response = await fetch(
            `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${fromUpper}`
          );

          if (!response.ok) {
            throw new Error(`ExchangeRate API error: ${response.status}`);
          }

          const body = await response.json();
          // Check inside the fetcher so an error body is never cached for an hour.
          if (body.result !== 'success') {
            throw new Error(`API returned error: ${body['error-type']}`);
          }
          return body;
        },
        3600 // Cache for 1 hour
      );

      const rates = data.conversion_rates;
      const toUpper = to.toUpperCase();

      if (!rates[toUpper]) {
        throw new Error(`Currency ${to} not supported`);
      }

      const rate = rates[toUpper];
      const converted = parseFloat((amount * rate).toFixed(2));
      const lastUpdated = new Date(data.time_last_update_unix * 1000).toLocaleDateString();

      console.log(`✅ [Currency Conversion] ${amount} ${from} = ${converted} ${to} (rate: ${rate})`);

      const tips = [
        `💰 Current rate: 1 ${from} = ${rate.toFixed(4)} ${to}`,
        `📅 Last updated: ${lastUpdated}`,
        `🏦 Best exchange: Use ATMs in destination country`,
        `❌ Avoid: Airport currency exchanges (worst rates)`,
        `💳 Credit cards often offer competitive rates`,
        `🔄 Rates updated daily - check before large transfers`,
      ];

      return {
        amount,
        from: from.toUpperCase(),
        to: toUpper,
        converted,
        rate,
        lastUpdated,
        tips,
        status: 'live' as const,
      };

    } catch (error) {
      console.error(`❌ [Currency Conversion] API error:`, error);
      console.log(`⚠️ [Currency Conversion] Falling back to approximate rates`);
      
      // Fallback: Use approximate rates as backup
      const fallbackRates: Record<string, Record<string, number>> = {
        USD: { EUR: 0.92, GBP: 0.79, JPY: 149.50, AUD: 1.52, CAD: 1.36, CHF: 0.88, CNY: 7.24, INR: 83.12, MXN: 17.05, SGD: 1.34 },
        EUR: { USD: 1.09, GBP: 0.86, JPY: 162.30, AUD: 1.65, CAD: 1.48 },
        GBP: { USD: 1.27, EUR: 1.16, JPY: 189.20 },
      };

      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();

      // Approximate rate only for pairs we actually have. The old code defaulted unknown
      // pairs to 1.0, so "10000 KRW to THB" silently became 10000 THB.
      let rate: number | null = null;
      const viaUsd = (c: string) => (c === 'USD' ? 1 : fallbackRates.USD[c]);
      if (fromUpper === toUpper) {
        rate = 1.0;
      } else if (fallbackRates[fromUpper]?.[toUpper]) {
        rate = fallbackRates[fromUpper][toUpper];
      } else if (fallbackRates[toUpper]?.[fromUpper]) {
        rate = 1 / fallbackRates[toUpper][fromUpper];
      } else if (viaUsd(fromUpper) && viaUsd(toUpper)) {
        rate = viaUsd(toUpper) / viaUsd(fromUpper);
      }

      if (rate === null) {
        return {
          amount, from: fromUpper, to: toUpper, converted: 0, rate: 0,
          lastUpdated: '', status: 'unavailable' as const,
          tips: [`Live rates are unavailable and there is no stored estimate for ${fromUpper} to ${toUpper}. Do not guess a rate.`],
        };
      }

      const converted = parseFloat((amount * rate).toFixed(2));

      const tips = [
        `⚠️ Using approximate rates (API temporarily unavailable)`,
        `💳 Credit cards often offer better exchange rates`,
        `🏦 ATMs typically provide rates within 1-2% of mid-market rate`,
        `❌ Avoid airport currency exchanges (3-7% worse rates)`,
        `📱 Use apps like Wise or Revolut for real-time rates`,
        `🔍 Always decline dynamic currency conversion at terminals`,
      ];

      console.log(`✅ [Currency Conversion] ${amount} ${fromUpper} = ${converted} ${toUpper} (fallback rate: ${rate})`);

      return {
        amount,
        from: fromUpper,
        to: toUpper,
        converted,
        rate: parseFloat(rate.toFixed(4)),
        lastUpdated: new Date().toLocaleDateString() + ' (estimated)',
        tips,
        status: 'estimated' as const,
      };
    }
  },
});

