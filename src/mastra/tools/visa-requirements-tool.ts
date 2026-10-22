import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { webSearchTool } from './web-search-tool';

/**
 * Visa Requirements Tool
 * Uses live web search to check real visa requirements
 */
export const visaRequirementsTool = createTool({
  id: 'visaRequirementsTool',
  description: 'Check visa requirements for travel between countries using live web search. Provides current information on visa types, application process, and entry requirements.',
  inputSchema: z.object({
    passportCountry: z.string().describe('Country of passport (e.g., "United States", "India")'),
    destinationCountry: z.string().describe('Destination country'),
    stayDuration: z.number().optional().describe('Planned stay duration in days'),
  }),
  outputSchema: z.object({
    passportCountry: z.string(),
    destinationCountry: z.string(),
    searchResults: z.string(),
    summary: z.string(),
    sources: z.array(z.string()),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { passportCountry, destinationCountry, stayDuration = 7 } = context;

    console.log(`🛂 [Visa Requirements] Searching: ${passportCountry} → ${destinationCountry}`);

    // Perform live web search for visa requirements
    const searchQuery = `visa requirements ${passportCountry} citizens traveling to ${destinationCountry} ${new Date().getFullYear()}`;
    
    const searchResult = await webSearchTool.execute({
      context: { query: searchQuery },
      runtimeContext: runtimeContext || ({} as any),
    });

    // Extract key information from search results
    // Say plainly when live search failed instead of returning an empty list as if it were an answer.
    const webResults = searchResult.results.length
      ? searchResult.results.slice(0, 3).map((r: any) => `• ${r.title}: ${r.snippet}`).join('\n')
      : `Live search returned nothing (${searchResult.message ?? searchResult.status}). Do not guess; tell the user to check the official sources below.`;
    
    const summary = `📍 Visa information for ${passportCountry} passport holders traveling to ${destinationCountry}:\n\n${webResults}\n\n⚠️ **Important**: Visa requirements can change. Always verify with:\n- Official ${destinationCountry} embassy/consulate website\n- Your country's foreign affairs department\n- IATA Travel Centre (iatatravelcentre.com)`;

    console.log(`✅ [Visa Requirements] Found current information for ${destinationCountry}`);

    return {
      passportCountry,
      destinationCountry,
      searchResults: webResults,
      summary,
      sources: searchResult.results.map((r: any) => r.url),
    };
  },
});

