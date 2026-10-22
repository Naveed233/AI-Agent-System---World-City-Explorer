import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { webSearchTool } from './web-search-tool';

/**
 * Travel Insurance Tool
 * Uses live web search to find real travel insurance options
 */
export const travelInsuranceTool = createTool({
  id: 'travelInsuranceTool',
  description: 'Get travel insurance recommendations using live web search. Provides current coverage options, cost estimates, and provider information based on trip details.',
  inputSchema: z.object({
    destination: z.string().describe('Trip destination'),
    duration: z.number().describe('Trip duration in days'),
    travelers: z.number().optional().describe('Number of travelers'),
    age: z.number().optional().describe('Average age of travelers'),
    activities: z.array(z.string()).optional().describe('Planned activities (hiking, diving, skiing, etc.)'),
    preExisting: z.boolean().optional().describe('Pre-existing medical conditions'),
  }),
  outputSchema: z.object({
    destination: z.string(),
    duration: z.number(),
    searchResults: z.string(),
    summary: z.string(),
    sources: z.array(z.string()),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { 
      destination, 
      duration, 
      travelers = 1, 
      age = 30,
      activities = [],
      preExisting = false 
    } = context;

    console.log(`🛡️ [Travel Insurance] Searching coverage for ${destination}, ${duration} days`);

    // Build search query with specific details
    const activityText = activities.length > 0 ? `${activities.join(' ')} activities` : '';
    const preExistingText = preExisting ? 'pre-existing conditions' : '';
    const ageText = age > 65 ? 'seniors' : age > 50 ? 'over 50' : '';
    
    const searchQuery = `best travel insurance ${destination} ${duration} days ${activityText} ${preExistingText} ${ageText} ${travelers} travelers cost coverage ${new Date().getFullYear()}`.trim();
    
    // Perform live web search
    const searchResult = await webSearchTool.execute({
      context: { query: searchQuery },
      runtimeContext: runtimeContext || ({} as any),
    });

    // Create comprehensive summary with web results
    // Say plainly when live search failed instead of returning an empty list as if it were an answer.
    const webResults = searchResult.results.length
      ? searchResult.results.slice(0, 3).map((r: any) => `• ${r.title}: ${r.snippet}`).join('\n')
      : `Live search returned nothing (${searchResult.message ?? searchResult.status}). Do not guess; tell the user to check the official sources below.`;
    
    const summary = `🛡️ Travel Insurance Options for ${destination} (${duration} days, ${travelers} ${travelers === 1 ? 'traveler' : 'travelers'}):

**Current Insurance Options:**
${webResults}

**Important Considerations:**
${activities.length > 0 ? `🏂 Adventure Activities: ${activities.join(', ')} - Ensure your policy covers these` : '✅ Standard travel activities typically covered'}
${preExisting ? '💊 Pre-existing Conditions: Look for policies with medical condition coverage' : ''}
${age > 65 ? '👴 Senior Travel: Age may affect pricing and coverage options' : ''}

**Essential Coverage to Look For:**
🏥 Medical emergencies ($50,000-250,000)
🚑 Emergency evacuation ($100,000-500,000)
✈️ Trip cancellation/interruption
🧳 Baggage loss/delay
⏰ Flight delays

**Tips:**
💰 Buy within 14-21 days of booking for best coverage
📋 Compare providers: World Nomads, Allianz, Travel Guard, SafetyWing
💳 Check if your credit card includes travel insurance
📱 Download provider's app for easy claims

⚠️ **Disclaimer**: This is informational guidance. Always read policy details and verify coverage with insurance providers.`;

    console.log(`✅ [Travel Insurance] Found current options for ${destination}`);

    return {
      destination,
      duration,
      searchResults: webResults,
      summary,
      sources: searchResult.results.map((r: any) => r.url),
    };
  },
});

