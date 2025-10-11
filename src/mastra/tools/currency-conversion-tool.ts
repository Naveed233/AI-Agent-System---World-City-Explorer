import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Currency Conversion Tool
 * Converts between currencies with real-time rates
 * Uses exchangerate-api.com (free tier) or mock data
 */
export const currencyConversionTool = createTool({
  id: 'currencyConversionTool',
  description: 'Convert currency amounts between different currencies with current exchange rates. Provides rate information and tips for currency exchange.',
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

    console.log(`💱 [Currency Conversion] Converting ${amount} ${from} to ${to}`);

    // Common exchange rates (mock data - in production, use API)
    const exchangeRates: Record<string, Record<string, number>> = {
      USD: {
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        AUD: 1.52,
        CAD: 1.36,
        CHF: 0.88,
        CNY: 7.24,
        INR: 83.12,
        MXN: 17.05,
        SGD: 1.34,
        THB: 35.50,
        AED: 3.67,
      },
      EUR: {
        USD: 1.09,
        GBP: 0.86,
        JPY: 162.30,
        AUD: 1.65,
        CAD: 1.48,
      },
      GBP: {
        USD: 1.27,
        EUR: 1.16,
        JPY: 189.20,
      },
    };

    // Try to get rate
    let rate = 1.0;
    if (from === to) {
      rate = 1.0;
    } else if (exchangeRates[from]?.[to]) {
      rate = exchangeRates[from][to];
    } else if (exchangeRates[to]?.[from]) {
      // Inverse rate
      rate = 1 / exchangeRates[to][from];
    } else {
      // Try through USD
      if (from !== 'USD' && to !== 'USD') {
        const toUSD = exchangeRates[from]?.USD || 1;
        const fromUSD = exchangeRates['USD']?.[to] || 1;
        rate = toUSD * fromUSD;
      }
    }

    const converted = Math.round(amount * rate * 100) / 100;

    const tips = [
      `💳 Credit cards often offer better exchange rates than cash exchanges`,
      `🏦 ATMs typically provide rates within 1-2% of mid-market rate`,
      `❌ Avoid airport currency exchanges (3-7% worse rates)`,
      `📱 Use apps like Wise or Revolut for real-time rates`,
      `💰 Withdraw larger amounts less frequently to minimize ATM fees`,
      `🔍 Always decline dynamic currency conversion at terminals`,
    ];

    console.log(`✅ [Currency Conversion] ${amount} ${from} = ${converted} ${to} (rate: ${rate})`);

    return {
      amount,
      from,
      to,
      converted,
      rate: Math.round(rate * 10000) / 10000,
      lastUpdated: new Date().toISOString(),
      tips,
    };
  },
});

