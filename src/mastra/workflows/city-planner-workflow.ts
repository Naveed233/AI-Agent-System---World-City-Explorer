import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { cityFactsTool } from '../tools/city-facts-tool';
import { weatherTool } from '../tools/weather-tool';
import { timeTool } from '../tools/time-tool';
import { itineraryPlannerTool } from '../tools/itinerary-planner-tool';
import { tripRecommendationTool } from '../tools/trip-recommendation-tool';
import { webSearchTool } from '../tools/web-search-tool';

/**
 * City Planner Workflow
 * 
 * Comprehensive workflow that orchestrates multiple tools to provide
 * complete city information and trip planning capabilities.
 * 
 * Features:
 * - Gathers city facts, weather, and local time in parallel
 * - Creates detailed itineraries for multi-day trips
 * - Provides smart recommendations based on conditions
 * - Handles both quick queries and full trip planning
 */

// Step 1: Gather comprehensive city data
const gatherCityData = createStep({
  id: 'gather-city-data',
  description: 'Fetches comprehensive information about a city including facts, weather, and local time',
  inputSchema: z.object({
    city: z.string().describe('The city name'),
    country: z.string().optional().describe('Optional country for disambiguation'),
  }),
  outputSchema: z.object({
    city: z.string(),
    country: z.string(),
    facts: z.object({
      population: z.number().optional(),
      description: z.string(),
      notableFor: z.array(z.string()),
      region: z.string().optional(),
      currency: z.string().optional(),
    }),
    weather: z.object({
      temperature: z.number(),
      feelsLike: z.number(),
      condition: z.string(),
      description: z.string(),
      humidity: z.number(),
      windSpeed: z.number(),
    }),
    time: z.object({
      timezone: z.string(),
      datetime: z.string(),
      date: z.string(),
      time: z.string(),
      dayOfWeek: z.string(),
      utcOffset: z.string(),
    }),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { city, country } = inputData;

    console.log(`📊 [Gather City Data] Collecting information for ${city}...`);

    // Fetch all data in parallel for better performance
    const [cityFacts, weatherInfo, timeInfo] = await Promise.all([
      cityFactsTool.execute({ context: { city } }),
      weatherTool.execute({ context: { city, country } }),
      timeTool.execute({ context: { city, country } }),
    ]);

    console.log(`✅ [Gather City Data] Successfully collected data for ${city}`);

    return {
      city: cityFacts.city,
      country: cityFacts.country,
      facts: {
        population: cityFacts.population,
        description: cityFacts.description,
        notableFor: cityFacts.notableFor,
        region: cityFacts.region,
        currency: cityFacts.currency,
      },
      weather: {
        temperature: weatherInfo.temperature,
        feelsLike: weatherInfo.feelsLike,
        condition: weatherInfo.condition,
        description: weatherInfo.description,
        humidity: weatherInfo.humidity,
        windSpeed: weatherInfo.windSpeed,
      },
      time: {
        timezone: timeInfo.timezone,
        datetime: timeInfo.datetime,
        date: timeInfo.date,
        time: timeInfo.time,
        dayOfWeek: timeInfo.dayOfWeek,
        utcOffset: timeInfo.utcOffset,
      },
    };
  },
});

// Step 2: Determine planning type
const determinePlanningType = createStep({
  id: 'determine-planning-type',
  description: 'Determines whether to create a full itinerary or quick recommendations',
  inputSchema: z.object({
    cityData: z.any(),
    duration: z.number().optional(),
    budget: z.number().optional(),
    interests: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    planningType: z.enum(['full-itinerary', 'quick-recommendations']),
    cityData: z.any(),
    duration: z.number().optional(),
    budget: z.number().optional(),
    interests: z.array(z.string()).optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { cityData, duration, budget, interests } = inputData;

    // If user provides duration AND budget, create full itinerary
    const planningType = duration && budget ? 'full-itinerary' : 'quick-recommendations';

    console.log(`🎯 [Planning Type] Selected: ${planningType}`);

    return {
      planningType,
      cityData,
      duration,
      budget,
      interests,
    };
  },
});

// Step 3: Create full itinerary (conditional)
const createFullItinerary = createStep({
  id: 'create-full-itinerary',
  description: 'Creates a detailed multi-day itinerary with budget breakdown',
  inputSchema: z.object({
    city: z.string(),
    country: z.string().optional(),
    duration: z.number(),
    budget: z.number(),
    interests: z.array(z.string()),
    travelStyle: z.string().optional(),
  }),
  outputSchema: z.object({
    itinerary: z.any(),
    summary: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { city, country, duration, budget, interests, travelStyle } = inputData;

    console.log(`📋 [Full Itinerary] Creating ${duration}-day plan for ${city}...`);

    const itinerary = await itineraryPlannerTool.execute({
      context: {
        city,
        country,
        duration,
        budget,
        interests,
        travelStyle: travelStyle || 'mid-range',
      },
    });

    const summary = `
🎉 **Your ${duration}-Day ${city} Adventure**

💰 **Budget Summary:**
- Total Budget: $${itinerary.totalBudget}
- Accommodation: $${itinerary.budgetBreakdown.accommodation}
- Food: $${itinerary.budgetBreakdown.food}
- Activities: $${itinerary.budgetBreakdown.activities}
- Transportation: $${itinerary.budgetBreakdown.transportation}
- Contingency: $${itinerary.budgetBreakdown.contingency}

📅 **Daily Plans:**
${itinerary.dailyItinerary.map((day: any) => 
  `Day ${day.day} (${day.date}): ${day.activities.length} activities planned - $${day.totalDayCost}`
).join('\n')}

🏨 **Accommodation Options:**
${itinerary.accommodationSuggestions.map((acc: string) => `- ${acc}`).join('\n')}

💡 **Pro Tips:**
${itinerary.moneyTips.slice(0, 3).map((tip: string) => `- ${tip}`).join('\n')}
    `.trim();

    console.log(`✅ [Full Itinerary] Created detailed ${duration}-day plan`);

    return {
      itinerary,
      summary,
    };
  },
});

// Step 4: Generate quick recommendations (conditional)
const generateQuickRecommendations = createStep({
  id: 'generate-quick-recommendations',
  description: 'Generates activity recommendations based on current conditions',
  inputSchema: z.object({
    city: z.string(),
    country: z.string().optional(),
    interests: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    recommendations: z.any(),
    summary: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { city, country, interests } = inputData;

    console.log(`💡 [Quick Recommendations] Generating suggestions for ${city}...`);

    // Convert interests to preferences format
    const preferences: any[] = [];
    if (interests) {
      interests.forEach((interest: string) => {
        if (interest.toLowerCase().includes('food')) preferences.push('food');
        if (interest.toLowerCase().includes('outdoor') || interest.toLowerCase().includes('nature')) preferences.push('outdoor');
        if (interest.toLowerCase().includes('museum') || interest.toLowerCase().includes('culture')) preferences.push('cultural');
        if (interest.toLowerCase().includes('adventure')) preferences.push('adventure');
        if (interest.toLowerCase().includes('shop')) preferences.push('shopping');
        if (interest.toLowerCase().includes('night')) preferences.push('nightlife');
      });
    }

    const recommendations = await tripRecommendationTool.execute({
      context: {
        city,
        country,
        preferences: preferences.length > 0 ? preferences : undefined,
      },
    });

    const topRecommendations = recommendations.recommendations
      .filter((r: any) => r.priority === 'high')
      .slice(0, 3);

    const summary = `
🌟 **Top Recommendations for ${city}**

${recommendations.overallSuggestion}

🎯 **Priority Activities:**
${topRecommendations.map((rec: any) => 
  `- **${rec.activity}** (${rec.category})\n  ${rec.reason}\n  Best time: ${rec.bestTime}`
).join('\n\n')}

${recommendations.weatherAdvice}

${recommendations.timingAdvice}
    `.trim();

    console.log(`✅ [Quick Recommendations] Generated ${recommendations.recommendations.length} suggestions`);

    return {
      recommendations,
      summary,
    };
  },
});

// Step 5: Format final output
const formatFinalOutput = createStep({
  id: 'format-final-output',
  description: 'Formats the final response with all gathered information',
  inputSchema: z.object({
    cityData: z.any(),
    planningType: z.enum(['full-itinerary', 'quick-recommendations']),
    itinerary: z.any().optional(),
    itinerarySummary: z.string().optional(),
    recommendations: z.any().optional(),
    recommendationsSummary: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    city: z.string(),
    planningType: z.string(),
    cityOverview: z.string(),
    details: z.any(),
    formattedResponse: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { cityData, planningType, itinerary, itinerarySummary, recommendations, recommendationsSummary } = inputData;

    console.log(`📄 [Format Output] Creating final response for ${cityData.city}...`);

    const cityOverview = `
# ${cityData.city}, ${cityData.country}

## 📍 City Overview
${cityData.facts.description}

**Notable For:** ${cityData.facts.notableFor.join(', ')}
${cityData.facts.population ? `**Population:** ${cityData.facts.population.toLocaleString()}` : ''}
${cityData.facts.region ? `**Region:** ${cityData.facts.region}` : ''}
${cityData.facts.currency ? `**Currency:** ${cityData.facts.currency}` : ''}

## 🌤️ Current Weather
- **Temperature:** ${cityData.weather.temperature}°C (feels like ${cityData.weather.feelsLike}°C)
- **Conditions:** ${cityData.weather.condition} - ${cityData.weather.description}
- **Humidity:** ${cityData.weather.humidity}%
- **Wind Speed:** ${cityData.weather.windSpeed} m/s

## 🕐 Local Time
- **Current Time:** ${cityData.time.time}
- **Date:** ${cityData.time.date} (${cityData.time.dayOfWeek})
- **Timezone:** ${cityData.time.timezone} (UTC${cityData.time.utcOffset})
    `.trim();

    const formattedResponse = `
${cityOverview}

---

${planningType === 'full-itinerary' ? itinerarySummary : recommendationsSummary}
    `.trim();

    console.log(`✅ [Format Output] Final response ready for ${cityData.city}`);

    return {
      success: true,
      city: cityData.city,
      planningType,
      cityOverview,
      details: planningType === 'full-itinerary' ? itinerary : recommendations,
      formattedResponse,
    };
  },
});

// Main workflow
const cityPlannerWorkflow = createWorkflow({
  id: 'city-planner-workflow',
  inputSchema: z.object({
    city: z.string().describe('The city to plan for'),
    country: z.string().optional().describe('Optional country for disambiguation'),
    duration: z.number().optional().describe('Number of days for the trip (optional)'),
    budget: z.number().optional().describe('Total budget in USD (optional)'),
    interests: z.array(z.string()).optional().describe('User interests like "historical sites", "local food", etc.'),
    travelStyle: z.string().optional().describe('Travel style: budget, mid-range, or luxury'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    city: z.string(),
    planningType: z.string(),
    cityOverview: z.string(),
    details: z.any(),
    formattedResponse: z.string(),
  }),
})
  // Step 1: Gather all city data
  .then(gatherCityData, {
    variables: {
      city: { step: { ref: { stepId: 'trigger' } }, path: 'city' },
      country: { step: { ref: { stepId: 'trigger' } }, path: 'country' },
    },
  })
  // Step 2: Determine what type of planning to do
  .then(determinePlanningType, {
    variables: {
      cityData: { step: { ref: { stepId: 'gather-city-data' } } },
      duration: { step: { ref: { stepId: 'trigger' } }, path: 'duration' },
      budget: { step: { ref: { stepId: 'trigger' } }, path: 'budget' },
      interests: { step: { ref: { stepId: 'trigger' } }, path: 'interests' },
    },
  })
  // Step 3a: Create full itinerary (if applicable)
  .then(createFullItinerary, {
    when: {
      ref: {
        stepId: 'determine-planning-type',
        path: 'planningType',
      },
      query: {
        operator: 'EQUAL',
        value: 'full-itinerary',
      },
    },
    variables: {
      city: { step: { ref: { stepId: 'gather-city-data' } }, path: 'city' },
      country: { step: { ref: { stepId: 'gather-city-data' } }, path: 'country' },
      duration: { step: { ref: { stepId: 'determine-planning-type' } }, path: 'duration' },
      budget: { step: { ref: { stepId: 'determine-planning-type' } }, path: 'budget' },
      interests: { step: { ref: { stepId: 'determine-planning-type' } }, path: 'interests' },
      travelStyle: { step: { ref: { stepId: 'trigger' } }, path: 'travelStyle' },
    },
  })
  // Step 3b: Generate quick recommendations (if applicable)
  .then(generateQuickRecommendations, {
    when: {
      ref: {
        stepId: 'determine-planning-type',
        path: 'planningType',
      },
      query: {
        operator: 'EQUAL',
        value: 'quick-recommendations',
      },
    },
    variables: {
      city: { step: { ref: { stepId: 'gather-city-data' } }, path: 'city' },
      country: { step: { ref: { stepId: 'gather-city-data' } }, path: 'country' },
      interests: { step: { ref: { stepId: 'determine-planning-type' } }, path: 'interests' },
    },
  })
  // Step 4: Format final output
  .then(formatFinalOutput, {
    variables: {
      cityData: { step: { ref: { stepId: 'gather-city-data' } } },
      planningType: { step: { ref: { stepId: 'determine-planning-type' } }, path: 'planningType' },
      itinerary: { step: { ref: { stepId: 'create-full-itinerary' } }, path: 'itinerary' },
      itinerarySummary: { step: { ref: { stepId: 'create-full-itinerary' } }, path: 'summary' },
      recommendations: { step: { ref: { stepId: 'generate-quick-recommendations' } }, path: 'recommendations' },
      recommendationsSummary: { step: { ref: { stepId: 'generate-quick-recommendations' } }, path: 'summary' },
    },
  });

cityPlannerWorkflow.commit();

export { cityPlannerWorkflow };

