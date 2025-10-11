import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { weatherTool } from './weather-tool';
import { timeTool } from './time-tool';

/**
 * TripRecommendationTool - Provides personalized trip recommendations
 * based on current weather and time conditions
 * This is a future enhancement showcasing intelligent recommendations
 */
export const tripRecommendationTool = createTool({
  id: 'trip-recommendation-tool',
  description: 'Get personalized activity and trip recommendations for a city based on current weather, time, and your preferences.',
  inputSchema: z.object({
    city: z.string().describe('The city to get recommendations for'),
    preferences: z.array(z.enum(['outdoor', 'indoor', 'cultural', 'food', 'shopping', 'nightlife', 'nature', 'adventure']))
      .optional()
      .describe('Your activity preferences'),
    country: z.string().optional(),
  }),
  outputSchema: z.object({
    city: z.string(),
    recommendations: z.array(z.object({
      category: z.string(),
      activity: z.string(),
      reason: z.string(),
      bestTime: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
    })),
    weatherAdvice: z.string(),
    timingAdvice: z.string(),
    overallSuggestion: z.string(),
  }),
  execute: async ({ context: { city, preferences, country }, mastra }) => {
    // Fetch weather and time data
    let weatherData: any = null;
    let timeData: any = null;

    try {
      weatherData = await weatherTool.execute({
        context: { city, country },
        runtimeContext: {} as any,
      });
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    }

    try {
      timeData = await timeTool.execute({
        context: { city, country },
        runtimeContext: {} as any,
      });
    } catch (error) {
      console.error('Failed to fetch time:', error);
    }

    // Generate recommendations based on conditions
    const recommendations: any[] = [];
    const currentHour = timeData ? parseInt(timeData.time.split(':')[0]) : 12;
    const isEvening = currentHour >= 18 || currentHour < 6;
    const isMorning = currentHour >= 6 && currentHour < 12;
    const isAfternoon = currentHour >= 12 && currentHour < 18;

    const temp = weatherData?.temperature || 20;
    const condition = weatherData?.condition?.toLowerCase() || 'clear';
    const isGoodWeather = temp >= 15 && temp <= 28 && !condition.includes('rain') && !condition.includes('storm');
    const isCold = temp < 10;
    const isHot = temp > 30;
    const isRainy = condition.includes('rain') || condition.includes('storm');

    // Weather-based recommendations
    if (isGoodWeather && !isEvening) {
      recommendations.push({
        category: 'Outdoor',
        activity: 'City Walking Tour',
        reason: `Perfect weather at ${temp}°C with ${condition} conditions`,
        bestTime: 'Now - next 3 hours',
        priority: 'high' as const,
      });

      recommendations.push({
        category: 'Nature',
        activity: 'Visit Parks and Gardens',
        reason: 'Ideal weather for outdoor exploration',
        bestTime: 'Daytime',
        priority: 'high' as const,
      });
    }

    if (isRainy || isCold) {
      recommendations.push({
        category: 'Cultural',
        activity: 'Museum Visit',
        reason: isRainy ? 'Indoor activities recommended due to rain' : 'Indoor activities recommended due to cold weather',
        bestTime: 'Anytime',
        priority: 'high' as const,
      });

      recommendations.push({
        category: 'Food',
        activity: 'Try Local Cuisine in Cozy Restaurants',
        reason: 'Perfect weather for indoor dining experiences',
        bestTime: 'Lunch or Dinner',
        priority: 'high' as const,
      });
    }

    if (isHot) {
      recommendations.push({
        category: 'Indoor',
        activity: 'Shopping Malls and Air-Conditioned Venues',
        reason: `Very hot weather (${temp}°C), stay cool indoors`,
        bestTime: 'Midday',
        priority: 'high' as const,
      });
    }

    // Time-based recommendations
    if (isMorning) {
      recommendations.push({
        category: 'Food',
        activity: 'Local Breakfast Spots',
        reason: 'Start your day with authentic local breakfast',
        bestTime: 'Morning',
        priority: 'medium' as const,
      });

      recommendations.push({
        category: 'Cultural',
        activity: 'Morning Market Visit',
        reason: 'Markets are most vibrant in the morning',
        bestTime: 'Early morning',
        priority: 'medium' as const,
      });
    }

    if (isEvening) {
      recommendations.push({
        category: 'Nightlife',
        activity: 'Evening Entertainment District',
        reason: 'Experience the city\'s nightlife scene',
        bestTime: 'Evening/Night',
        priority: 'high' as const,
      });

      recommendations.push({
        category: 'Food',
        activity: 'Dinner at Rooftop Restaurant',
        reason: 'Enjoy city views during sunset and evening',
        bestTime: 'Sunset/Evening',
        priority: 'medium' as const,
      });
    }

    if (isAfternoon && isGoodWeather) {
      recommendations.push({
        category: 'Cultural',
        activity: 'Historic Sites Tour',
        reason: 'Afternoon is great for sightseeing with good lighting',
        bestTime: 'Afternoon',
        priority: 'medium' as const,
      });
    }

    // Preference-based recommendations
    if (preferences?.includes('food')) {
      recommendations.push({
        category: 'Food',
        activity: 'Food Tour or Cooking Class',
        reason: 'Based on your interest in local cuisine',
        bestTime: 'Flexible',
        priority: 'high' as const,
      });
    }

    if (preferences?.includes('adventure')) {
      recommendations.push({
        category: 'Adventure',
        activity: 'Adventure Activities and Sports',
        reason: 'Based on your preference for adventure',
        bestTime: isGoodWeather ? 'Daytime' : 'Indoor adventure activities',
        priority: 'medium' as const,
      });
    }

    // Always add these general recommendations
    recommendations.push({
      category: 'Shopping',
      activity: 'Local Markets and Boutiques',
      reason: 'Discover unique local products and souvenirs',
      bestTime: 'Daytime',
      priority: 'low' as const,
    });

    // Generate advice
    let weatherAdvice = '';
    if (isRainy) {
      weatherAdvice = '🌧️ It\'s rainy - bring an umbrella and focus on indoor activities. Cozy cafes and museums are perfect choices.';
    } else if (isCold) {
      weatherAdvice = '🧥 It\'s quite cold - dress warmly and consider indoor attractions or brief outdoor visits.';
    } else if (isHot) {
      weatherAdvice = '☀️ Very hot weather - stay hydrated, use sunscreen, and take breaks in air-conditioned spaces.';
    } else {
      weatherAdvice = `✨ Perfect weather conditions (${temp}°C, ${condition}) - great time to explore both indoor and outdoor attractions!`;
    }

    const timingAdvice = isEvening 
      ? '🌙 It\'s evening - perfect time for dinner, nightlife, and illuminated landmarks.'
      : isMorning
      ? '🌅 It\'s morning - great time to start with breakfast and visit popular sites before crowds arrive.'
      : '☀️ It\'s afternoon - ideal for lunch and main sightseeing activities.';

    const overallSuggestion = `Based on the current conditions in ${city} (${temp}°C, ${condition}, ${timeData?.time || 'local time'}), ` +
      `I recommend ${recommendations[0]?.activity.toLowerCase()} as your top priority. ` +
      `${isGoodWeather && !isEvening ? 'Make the most of the great weather!' : 'Choose comfortable indoor activities and enjoy the local culture!'}`;

    return {
      city,
      recommendations,
      weatherAdvice,
      timingAdvice,
      overallSuggestion,
    };
  },
});

