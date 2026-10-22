import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * WeatherTool - Fetches current weather information for a city
 * Uses OpenWeatherMap API
 */
export const weatherTool = createTool({
  id: 'weather-tool',
  description: 'Get current weather information for a city including temperature, conditions, humidity, and wind speed.',
  inputSchema: z.object({
    city: z.string().describe('The name of the city to get weather for'),
    country: z.string().optional().describe('Optional country code (e.g., US, FR, JP) for more accurate results'),
  }),
  outputSchema: z.object({
    city: z.string(),
    country: z.string(),
    temperature: z.number(),
    feelsLike: z.number(),
    condition: z.string(),
    description: z.string(),
    humidity: z.number(),
    windSpeed: z.number(),
    timestamp: z.string(),
  }),
  execute: async ({ context: { city, country } }) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    // No mock data: a made-up "23.5°C, clear sky" would be presented to users as live weather.
    if (!apiKey || apiKey === 'your_openweather_api_key_here') {
      throw new Error('Live weather is not configured on the server (OPENWEATHER_API_KEY is missing).');
    }

    try {
      const query = country ? `${city},${country}` : city;
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=metric`;
      
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

      if (response.status === 404) {
        throw new Error(`No weather data found for "${query}". Try adding the country code, e.g. "${city}, JP".`);
      }
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp * 10) / 10,
        feelsLike: Math.round(data.main.feels_like * 10) / 10,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 10) / 10,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ WeatherTool error:', error);
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
