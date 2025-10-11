import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { cityAssistantAgent } from './agents/city-assistant-agent';
import { weatherTool } from './tools/weather-tool';
import { timeTool } from './tools/time-tool';
import { cityFactsTool } from './tools/city-facts-tool';
import { planMyCityVisitTool } from './tools/plan-city-visit-tool';
import { tripRecommendationTool } from './tools/trip-recommendation-tool';
import { webSearchTool } from './tools/web-search-tool';
import { itineraryPlannerTool } from './tools/itinerary-planner-tool';

/**
 * City Information Assistant - Mastra Core Configuration
 * 
 * Production-ready AI application with:
 * - Comprehensive city information tools
 * - Multi-turn conversation support
 * - Memory and context management
 * - Full observability and logging
 * - Streaming support
 */
export const mastra = new Mastra({
  workflows: { 
    weatherWorkflow,
  },
  agents: { 
    weatherAgent,
    cityAssistantAgent,
  },
  tools: {
    weatherTool,
    timeTool,
    cityFactsTool,
    planMyCityVisitTool,
    tripRecommendationTool,
    webSearchTool,
    itineraryPlannerTool,
  },
  storage: new LibSQLStore({
    // Persistent storage for production use
    url: "file:./mastra.db",
  }),
  logger: new PinoLogger({
    name: 'CityInformationAssistant',
    level: 'info',
  }),
  telemetry: {
    enabled: false, 
  },
  observability: {
    // Enables full AI tracing for debugging and monitoring
    default: { enabled: true }, 
  },
});
