import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { weatherTool } from './weather-tool';
import { timeTool } from './time-tool';
import { cityFactsTool } from './city-facts-tool';

/**
 * PlanMyCityVisitTool - Composite tool that orchestrates multiple tools
 * Returns comprehensive city information with reasoning output
 */
export const planMyCityVisitTool = createTool({
  id: 'plan-city-visit-tool',
  description: 'Get comprehensive information about a city to plan your visit, including facts, weather, and local time. Shows reasoning about what the tool is doing.',
  inputSchema: z.object({
    city: z.string().describe('The name of the city you want to visit'),
    country: z.string().optional().describe('Optional country code for more accurate results'),
  }),
  outputSchema: z.object({
    thinking: z.string().describe('Explanation of what the tool is doing and why'),
    function_calls: z.array(z.object({
      tool: z.string(),
      parameters: z.record(z.any()),
      status: z.enum(['pending', 'executing', 'completed', 'failed']),
      result: z.any().optional(),
      error: z.string().optional(),
    })),
    response: z.string().describe('Human-readable summary of the city visit information'),
    data: z.object({
      facts: z.any().optional(),
      weather: z.any().optional(),
      time: z.any().optional(),
    }),
  }),
  execute: async ({ context: { city, country }, mastra }) => {
    // Initialize thinking and function calls tracking
    const thinking = `To help you plan your visit to ${city}, I'll gather comprehensive information by: 
1. First, fetching basic facts about the city (population, notable features, country)
2. Then, checking the current weather conditions
3. Finally, getting the local time to help you understand the timezone
This will give you a complete picture to plan your visit effectively.`;

    const functionCalls: any[] = [
      { tool: 'CityFactsTool', parameters: { city }, status: 'pending' },
      { tool: 'WeatherTool', parameters: { city, country }, status: 'pending' },
      { tool: 'TimeTool', parameters: { city, country }, status: 'pending' },
    ];

    const results: any = {
      facts: null,
      weather: null,
      time: null,
    };

    // Execute CityFactsTool
    try {
      functionCalls[0].status = 'executing';
      const factsResult = await cityFactsTool.execute({
        context: { city },
        mastra,
        runId: '',
        machineId: '',
      });
      results.facts = factsResult;
      functionCalls[0].status = 'completed';
      functionCalls[0].result = factsResult;
    } catch (error) {
      functionCalls[0].status = 'failed';
      functionCalls[0].error = error instanceof Error ? error.message : 'Unknown error';
      console.error('CityFactsTool failed:', error);
    }

    // Execute WeatherTool
    try {
      functionCalls[1].status = 'executing';
      const weatherResult = await weatherTool.execute({
        context: { city, country },
        mastra,
        runId: '',
        machineId: '',
      });
      results.weather = weatherResult;
      functionCalls[1].status = 'completed';
      functionCalls[1].result = weatherResult;
    } catch (error) {
      functionCalls[1].status = 'failed';
      functionCalls[1].error = error instanceof Error ? error.message : 'Unknown error';
      console.error('WeatherTool failed:', error);
    }

    // Execute TimeTool
    try {
      functionCalls[2].status = 'executing';
      const timeResult = await timeTool.execute({
        context: { city, country },
        mastra,
        runId: '',
        machineId: '',
      });
      results.time = timeResult;
      functionCalls[2].status = 'completed';
      functionCalls[2].result = timeResult;
    } catch (error) {
      functionCalls[2].status = 'failed';
      functionCalls[2].error = error instanceof Error ? error.message : 'Unknown error';
      console.error('TimeTool failed:', error);
    }

    // Build comprehensive response
    let response = `## ${city} Visit Overview\n\n`;

    if (results.facts) {
      const facts = results.facts;
      response += `📍 **Location:** ${facts.city}, ${facts.country}\n`;
      if (facts.region) response += `**Region:** ${facts.region}\n`;
      if (facts.population) response += `**Population:** ${facts.population.toLocaleString()}\n`;
      if (facts.currency) response += `**Currency:** ${facts.currency}\n\n`;
      response += `**About:** ${facts.description}\n\n`;
      if (facts.notableFor && facts.notableFor.length > 0) {
        response += `**Notable For:** ${facts.notableFor.join(', ')}\n\n`;
      }
    }

    if (results.weather) {
      const weather = results.weather;
      response += `🌤️ **Current Weather:**\n`;
      response += `- Temperature: ${weather.temperature}°C (feels like ${weather.feelsLike}°C)\n`;
      response += `- Conditions: ${weather.condition} - ${weather.description}\n`;
      response += `- Humidity: ${weather.humidity}%\n`;
      response += `- Wind Speed: ${weather.windSpeed} m/s\n\n`;
    }

    if (results.time) {
      const time = results.time;
      response += `🕐 **Local Time:**\n`;
      response += `- Current: ${time.time} (${time.dayOfWeek})\n`;
      response += `- Date: ${time.date}\n`;
      response += `- Timezone: ${time.timezone} (UTC${time.utcOffset})\n\n`;
    }

    response += `---\n`;
    response += `What would you like to know more about ${city}? I can help you plan activities, find restaurants, or provide more specific information!`;

    return {
      thinking,
      function_calls: functionCalls,
      response,
      data: results,
    };
  },
});

