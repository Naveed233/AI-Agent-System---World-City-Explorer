import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Season Optimizer Tool
 * Recommends best time to visit destinations based on weather, crowds, and prices
 */
export const seasonOptimizerTool = createTool({
  id: 'seasonOptimizerTool',
  description: 'Get recommendations for the best time to visit a destination based on weather patterns, tourist seasons, prices, and special events.',
  inputSchema: z.object({
    destination: z.string().describe('Destination city or country'),
    preferences: z.array(z.string()).optional().describe('Preferences: good-weather, fewer-crowds, budget, festivals, etc.'),
  }),
  outputSchema: z.object({
    destination: z.string(),
    bestMonths: z.array(z.string()),
    seasonalBreakdown: z.array(z.object({
      season: z.string(),
      months: z.string(),
      weather: z.string(),
      crowds: z.string(),
      prices: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    })),
    specialEvents: z.array(z.object({
      name: z.string(),
      month: z.string(),
      description: z.string(),
    })),
    recommendations: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { destination, preferences = [] } = context;

    console.log(`🗓️ [Season Optimizer] Analyzing best time to visit ${destination}`);

    // Destination patterns (simplified - in production, use weather APIs)
    const destinationPatterns: Record<string, any> = {
      'europe': {
        peak: { months: 'Jun-Aug', weather: 'Warm & sunny', crowds: 'Very high', prices: 'High' },
        shoulder: { months: 'Apr-May, Sep-Oct', weather: 'Mild & pleasant', crowds: 'Moderate', prices: 'Medium' },
        low: { months: 'Nov-Mar', weather: 'Cold & rainy', crowds: 'Low', prices: 'Low' },
        bestMonths: ['May', 'September', 'October'],
      },
      'asia': {
        peak: { months: 'Dec-Feb', weather: 'Cool & dry', crowds: 'High', prices: 'High' },
        shoulder: { months: 'Nov, Mar-Apr', weather: 'Warm', crowds: 'Moderate', prices: 'Medium' },
        low: { months: 'May-Oct', weather: 'Hot & humid/monsoon', crowds: 'Low', prices: 'Low' },
        bestMonths: ['November', 'February', 'March'],
      },
      'tropical': {
        peak: { months: 'Dec-Apr', weather: 'Dry season', crowds: 'High', prices: 'High' },
        shoulder: { months: 'May, Nov', weather: 'Transition', crowds: 'Moderate', prices: 'Medium' },
        low: { months: 'Jun-Oct', weather: 'Rainy season', crowds: 'Low', prices: 'Low' },
        bestMonths: ['January', 'February', 'March'],
      },
    };

    // Determine pattern (simplified)
    const destLower = destination.toLowerCase();
    let pattern = destinationPatterns['europe']; // default
    
    if (['thailand', 'bali', 'vietnam', 'singapore'].some(d => destLower.includes(d))) {
      pattern = destinationPatterns['asia'];
    } else if (['caribbean', 'maldives', 'hawaii', 'fiji'].some(d => destLower.includes(d))) {
      pattern = destinationPatterns['tropical'];
    }

    const seasonalBreakdown = [
      {
        season: 'Peak Season',
        months: pattern.peak.months,
        weather: pattern.peak.weather,
        crowds: pattern.peak.crowds,
        prices: pattern.peak.prices,
        pros: [
          'Best weather conditions',
          'All attractions open',
          'Vibrant atmosphere',
          'Easier to meet other travelers',
        ],
        cons: [
          'Highest prices (30-50% more)',
          'Large crowds at popular sites',
          'Need to book far in advance',
          'Less authentic experience',
        ],
      },
      {
        season: 'Shoulder Season',
        months: pattern.shoulder.months,
        weather: pattern.shoulder.weather,
        crowds: pattern.shoulder.crowds,
        prices: pattern.shoulder.prices,
        pros: [
          'Pleasant weather',
          'Moderate crowds',
          'Better prices (20-30% savings)',
          'More authentic experience',
          'Easier to get reservations',
        ],
        cons: [
          'Some attractions may have reduced hours',
          'Weather can be unpredictable',
        ],
      },
      {
        season: 'Low Season',
        months: pattern.low.months,
        weather: pattern.low.weather,
        crowds: pattern.low.crowds,
        prices: pattern.low.prices,
        pros: [
          'Lowest prices (40-60% savings)',
          'No crowds',
          'Authentic local experience',
          'Easy to book anything',
        ],
        cons: [
          'Poor weather conditions',
          'Some attractions closed',
          'Limited hours',
          'Fewer tour options',
        ],
      },
    ];

    // Special events (examples)
    const specialEvents = [
      {
        name: 'Local Festival Season',
        month: pattern.bestMonths[0],
        description: 'Experience cultural festivals and celebrations',
      },
      {
        name: 'Food & Wine Events',
        month: pattern.bestMonths[1],
        description: 'Local culinary festivals and food tours',
      },
    ];

    // Recommendations based on preferences
    const recommendations = [];
    
    if (preferences.includes('good-weather')) {
      recommendations.push(`☀️ Best weather: ${pattern.peak.months} - ${pattern.peak.weather.toLowerCase()}`);
    }
    
    if (preferences.includes('fewer-crowds') || preferences.includes('budget')) {
      recommendations.push(`🎯 Sweet spot: ${pattern.shoulder.months} - Good weather, fewer crowds, better prices`);
    }
    
    if (preferences.includes('budget')) {
      recommendations.push(`💰 Cheapest: ${pattern.low.months} - Save 40-60% on accommodation and flights`);
    }

    recommendations.push(
      `📅 Book flights ${['budget'].some(p => preferences.includes(p)) ? '3-4 months' : '2-3 months'} in advance`,
      `🏨 Accommodation prices vary 30-60% between seasons`,
      `✈️ Consider midweek travel for 15-20% savings`,
      `📱 Set price alerts for your preferred dates`,
    );

    console.log(`✅ [Season Optimizer] Best months for ${destination}: ${pattern.bestMonths.join(', ')}`);

    return {
      destination,
      bestMonths: pattern.bestMonths,
      seasonalBreakdown,
      specialEvents,
      recommendations,
    };
  },
});

