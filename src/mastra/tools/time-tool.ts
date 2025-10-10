import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * TimeTool - Fetches current local time for a city
 * Uses World Time API
 */
export const timeTool = createTool({
  id: 'time-tool',
  description: 'Get the current local time and timezone information for a city.',
  inputSchema: z.object({
    city: z.string().describe('The name of the city to get time for'),
    country: z.string().optional().describe('Optional country code for more accurate timezone lookup'),
  }),
  outputSchema: z.object({
    city: z.string(),
    timezone: z.string(),
    datetime: z.string(),
    date: z.string(),
    time: z.string(),
    dayOfWeek: z.string(),
    utcOffset: z.string(),
  }),
  execute: async ({ context: { city, country } }) => {
    // City to timezone mapping for common cities
    const cityTimezoneMap: Record<string, string> = {
      'london': 'Europe/London',
      'paris': 'Europe/Paris',
      'berlin': 'Europe/Berlin',
      'tokyo': 'Asia/Tokyo',
      'new york': 'America/New_York',
      'los angeles': 'America/Los_Angeles',
      'chicago': 'America/Chicago',
      'sydney': 'Australia/Sydney',
      'melbourne': 'Australia/Melbourne',
      'singapore': 'Asia/Singapore',
      'hong kong': 'Asia/Hong_Kong',
      'dubai': 'Asia/Dubai',
      'mumbai': 'Asia/Kolkata',
      'delhi': 'Asia/Kolkata',
      'shanghai': 'Asia/Shanghai',
      'beijing': 'Asia/Shanghai',
      'moscow': 'Europe/Moscow',
      'istanbul': 'Europe/Istanbul',
      'toronto': 'America/Toronto',
      'vancouver': 'America/Vancouver',
      'seoul': 'Asia/Seoul',
      'bangkok': 'Asia/Bangkok',
      'amsterdam': 'Europe/Amsterdam',
      'rome': 'Europe/Rome',
      'madrid': 'Europe/Madrid',
      'barcelona': 'Europe/Madrid',
      'lisbon': 'Europe/Lisbon',
      'athens': 'Europe/Athens',
      'stockholm': 'Europe/Stockholm',
      'oslo': 'Europe/Oslo',
      'copenhagen': 'Europe/Copenhagen',
      'helsinki': 'Europe/Helsinki',
      'vienna': 'Europe/Vienna',
      'prague': 'Europe/Prague',
      'warsaw': 'Europe/Warsaw',
      'budapest': 'Europe/Budapest',
      'zurich': 'Europe/Zurich',
      'brussels': 'Europe/Brussels',
      'dublin': 'Europe/Dublin',
      'san francisco': 'America/Los_Angeles',
      'boston': 'America/New_York',
      'miami': 'America/New_York',
      'washington': 'America/New_York',
      'seattle': 'America/Los_Angeles',
      'denver': 'America/Denver',
      'austin': 'America/Chicago',
      'houston': 'America/Chicago',
      'philadelphia': 'America/New_York',
      'phoenix': 'America/Phoenix',
      'buenos aires': 'America/Argentina/Buenos_Aires',
      'sao paulo': 'America/Sao_Paulo',
      'rio de janeiro': 'America/Sao_Paulo',
      'mexico city': 'America/Mexico_City',
      'bogota': 'America/Bogota',
      'lima': 'America/Lima',
      'santiago': 'America/Santiago',
      'auckland': 'Pacific/Auckland',
      'wellington': 'Pacific/Auckland',
      'perth': 'Australia/Perth',
      'brisbane': 'Australia/Brisbane',
      'cairo': 'Africa/Cairo',
      'johannesburg': 'Africa/Johannesburg',
      'cape town': 'Africa/Johannesburg',
      'nairobi': 'Africa/Nairobi',
      'lagos': 'Africa/Lagos',
      'karachi': 'Asia/Karachi',
      'jakarta': 'Asia/Jakarta',
      'manila': 'Asia/Manila',
      'kuala lumpur': 'Asia/Kuala_Lumpur',
      'hanoi': 'Asia/Ho_Chi_Minh',
      'ho chi minh': 'Asia/Ho_Chi_Minh',
    };

    const cityLower = city.toLowerCase();
    const timezone = cityTimezoneMap[cityLower] || 'UTC';

    try {
      const url = `https://worldtimeapi.org/api/timezone/${timezone}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // Fallback to mock data if API fails
        console.warn(`⚠️ World Time API failed for ${timezone}, using fallback`);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        const dateStr = now.toLocaleDateString('en-US', { 
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const dayOfWeek = now.toLocaleDateString('en-US', { 
          timeZone: timezone,
          weekday: 'long',
        });

        return {
          city,
          timezone,
          datetime: now.toISOString(),
          date: dateStr,
          time: timeStr,
          dayOfWeek,
          utcOffset: '+00:00',
        };
      }
      
      const data = await response.json();
      const datetime = new Date(data.datetime);
      
      return {
        city,
        timezone: data.timezone,
        datetime: data.datetime,
        date: datetime.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: datetime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
        dayOfWeek: datetime.toLocaleDateString('en-US', { weekday: 'long' }),
        utcOffset: data.utc_offset,
      };
    } catch (error) {
      console.error('❌ TimeTool error:', error);
      
      // Fallback to local calculation
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { 
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const dateStr = now.toLocaleDateString('en-US', { 
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const dayOfWeek = now.toLocaleDateString('en-US', { 
        timeZone: timezone,
        weekday: 'long',
      });

      return {
        city,
        timezone,
        datetime: now.toISOString(),
        date: dateStr,
        time: timeStr,
        dayOfWeek,
        utcOffset: 'N/A',
      };
    }
  },
});

