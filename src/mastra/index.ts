import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { cityPlannerWorkflow } from './workflows/city-planner-workflow';
import { enhancedCityPlannerWorkflow } from './workflows/enhanced-city-planner-workflow';
import { cityAssistantAgent } from './agents/city-assistant-agent';
import { weatherTool } from './tools/weather-tool';
import { timeTool } from './tools/time-tool';
import { cityFactsTool } from './tools/city-facts-tool';
import { planMyCityVisitTool } from './tools/plan-city-visit-tool';
import { tripRecommendationTool } from './tools/trip-recommendation-tool';
import { webSearchTool } from './tools/web-search-tool';
import { itineraryPlannerTool } from './tools/itinerary-planner-tool';
import { flightSearchTool } from './tools/flight-search-tool';
import { hotelBookingTool } from './tools/hotel-booking-tool';
import { currencyConversionTool } from './tools/currency-conversion-tool';
import { visaRequirementsTool } from './tools/visa-requirements-tool';
import { travelInsuranceTool } from './tools/travel-insurance-tool';
import { seasonOptimizerTool } from './tools/season-optimizer-tool';
import { groupTravelTool } from './tools/group-travel-tool';
import { imageSearchTool } from './tools/image-search-tool';

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
    cityPlannerWorkflow,
    enhancedCityPlannerWorkflow,
  },
  agents: { 
    cityAssistantAgent,
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
