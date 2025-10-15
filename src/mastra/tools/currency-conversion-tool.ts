import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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
  }),
  execute: async ({ context }) => {
    const { amount, from, to } = context;

    console.log(`💱 [Currency Conversion] Converting ${amount} ${from} to ${to} (Live API)`);

    const API_KEY = process.env.EXCHANGERATE_API_KEY || '80352c8e56592c730903bca6';
    
    try {
      // Fetch live exchange rates
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${from.toUpperCase()}`
      );

      if (!response.ok) {
        throw new Error(`ExchangeRate API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.result !== 'success') {
        throw new Error(`API returned error: ${data['error-type']}`);
      }

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

      // Try to get rate
      let rate = 1.0;
      if (fromUpper === toUpper) {
        rate = 1.0;
      } else if (fallbackRates[fromUpper]?.[toUpper]) {
        rate = fallbackRates[fromUpper][toUpper];
      } else if (fallbackRates[toUpper]?.[fromUpper]) {
        // Inverse rate
        rate = 1 / fallbackRates[toUpper][fromUpper];
      } else {
        // Try through USD
        if (fromUpper !== 'USD' && toUpper !== 'USD') {
          const toUSD = fallbackRates[fromUpper]?.USD || 1;
          const fromUSD = fallbackRates['USD']?.[toUpper] || 1;
          rate = toUSD * fromUSD;
        }
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
      };
    }
  },
});

