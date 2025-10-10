# 🏙️ City Information Assistant

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Mastra](https://img.shields.io/badge/Mastra-0.20-green.svg)](https://mastra.ai)
[![AI SDK](https://img.shields.io/badge/AI%20SDK-v5-orange.svg)](https://sdk.vercel.ai)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

A production-ready AI Agent application built with **Mastra** and **AI SDK v5** that helps users gather comprehensive information about cities worldwide and plan their visits effectively.

> **🎯 Assignment Demonstration**: This project showcases advanced agentic AI capabilities including tool orchestration, multi-turn conversations, streaming responses, and production-ready architecture.

## 📋 Overview

This intelligent assistant demonstrates real-world AI agent capabilities including:

- **🔧 Tool Orchestration** - Multiple tools working together seamlessly
- **💬 Multi-turn Conversations** - Context-aware dialogue with memory
- **🌊 Streaming Responses** - Real-time AI responses with reasoning transparency
- **📊 Full Observability** - Production-ready logging and monitoring
- **🎯 Intelligent Recommendations** - Context-aware trip planning

## ✨ Features

### Core Tools

1. **Weather Tool** 🌤️
   - Real-time weather data via OpenWeatherMap API
   - Temperature, conditions, humidity, wind speed
   - Fallback to mock data for development

2. **Time Tool** 🕐
   - Current local time for any city
   - Timezone information and UTC offset
   - Supports 60+ major cities worldwide

3. **City Facts Tool** 📍
   - Population and regional information
   - Notable features and cultural insights
   - Integration with Wikipedia API

4. **Plan My City Visit Tool** (Composite) ✈️
   - Orchestrates all three core tools
   - Provides comprehensive visit overview
   - Shows reasoning and function call transparency

5. **Trip Recommendation Tool** 🎯 (Future Enhancement)
   - Personalized activity suggestions
   - Weather and time-aware recommendations
   - Category-based filtering (outdoor, cultural, food, etc.)

### Agent Capabilities

- **Context Awareness**: Remembers conversation history
- **Natural Follow-ups**: Handles "What about Paris?" after discussing London
- **Reasoning Transparency**: Explains what it's doing and why
- **Error Handling**: Graceful degradation when APIs fail
- **Streaming Support**: Real-time responses for better UX

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.9.0
- npm or pnpm

### Installation

```bash
cd City-Information-Assistant
npm install
```

### Environment Setup

Create or update your `.env` file:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional (for enhanced functionality)
OPENWEATHER_API_KEY=your_openweather_api_key
RAPIDAPI_KEY=your_rapidapi_key
```

> **Note**: The application will use fallback/mock data if external API keys are not provided, allowing you to test functionality immediately.

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

The Mastra playground will be available at the URL shown in the terminal (typically http://localhost:3456).

## 🎮 Usage Examples

### Example 1: Plan a City Visit

```
User: "I want to visit Tokyo next week. What should I know?"

Agent: "I'll gather comprehensive information about Tokyo for you..."
[Uses PlanMyCityVisitTool]

Response:
📍 Location: Tokyo, Japan
🌤️ Weather: 18°C, Clear skies
🕐 Local Time: 3:45 PM (JST)
✨ Notable for: Technology, Anime, Cuisine, Temples, Shopping
```

### Example 2: Follow-up Questions

```
User: "What about Paris?"

Agent: "Let me get you the same information for Paris..."
[Remembers context from previous conversation]
```

### Example 3: Activity Recommendations

```
User: "What activities would you recommend for Paris right now?"

Agent: [Uses TripRecommendationTool]
- Considers current weather
- Factors in time of day
- Provides personalized suggestions
```

## 🏗️ Architecture

### Project Structure

```
City-Information-Assistant/
├── src/
│   └── mastra/
│       ├── agents/
│       │   ├── city-assistant-agent.ts    # Main AI agent
│       │   └── weather-agent.ts            # Weather-specific agent
│       ├── tools/
│       │   ├── weather-tool.ts             # Weather API integration
│       │   ├── time-tool.ts                # Time/timezone tool
│       │   ├── city-facts-tool.ts          # City information
│       │   ├── plan-city-visit-tool.ts     # Composite tool
│       │   └── trip-recommendation-tool.ts # Smart recommendations
│       ├── workflows/
│       │   └── weather-workflow.ts         # Weather workflow
│       └── index.ts                        # Mastra core configuration
├── .env                                     # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

### Production-Ready Features

#### 1. **Observability & Logging** 📊
- Pino logger with structured logging
- Full AI tracing enabled
- Request/response tracking
- Error logging with context

#### 2. **Memory & Context** 🧠
- Persistent storage with LibSQL
- Conversation history tracking
- Thread-based memory management
- Multi-user support

#### 3. **Error Handling** ⚠️
- Graceful API failure handling
- Fallback data for development
- User-friendly error messages
- Automatic retry logic where appropriate

#### 4. **Scalability** 📈
- Stateless agent design
- Database-backed memory
- Tool-based architecture
- Easy to add new capabilities

#### 5. **Developer Experience** 👨‍💻
- TypeScript with full type safety
- Zod schema validation
- Clear code documentation
- Hot reload in development

## 🔧 API Integration

### Weather Tool
- **API**: OpenWeatherMap
- **Endpoint**: `/data/2.5/weather`
- **Features**: Current weather, temperature, humidity, wind
- **Fallback**: Mock data if API key not set

### Time Tool
- **API**: World Time API
- **Endpoint**: `/api/timezone/{timezone}`
- **Features**: Local time, timezone, UTC offset
- **Fallback**: Local calculation using timezone database

### City Facts Tool
- **API**: Wikipedia REST API
- **Endpoint**: `/page/summary/{city}`
- **Features**: City description, population, notable features
- **Fallback**: Predefined database of major cities

## 🎯 Production Readiness

### What Makes This Production-Ready?

1. **Error Resilience**
   - All tools handle API failures gracefully
   - Fallback data ensures functionality
   - Clear error messages for debugging

2. **Multi-User Support**
   - Thread-based memory isolation
   - Persistent database storage
   - Concurrent request handling

3. **Monitoring & Debugging**
   - Structured logging with Pino
   - Full observability enabled
   - Request tracing through tools
   - Error stack preservation

4. **Security**
   - Environment variable management
   - No hardcoded credentials
   - API key validation

5. **Performance**
   - Streaming responses for better UX
   - Efficient memory management
   - Database connection pooling
   - Async/await patterns

## 🚀 Deployment

### Mastra Playground (Included)

```bash
npm run dev
```

The built-in Mastra playground provides:
- Interactive chat interface
- Real-time streaming responses
- Tool execution visualization
- Memory inspection
- Debug logs

Access at: http://localhost:3456

### Future Deployment Options

- **Mastra Cloud**: Deploy with `mastra deploy`
- **Vercel/Netlify**: Serverless deployment
- **Docker**: Container-based deployment
- **AWS/GCP/Azure**: Cloud platform deployment

## 🔮 Future Enhancements

The Trip Recommendation Tool showcases extensibility:

- **Preference Learning**: Remember user preferences across sessions
- **Budget Planning**: Integrate cost estimation tools
- **Booking Integration**: Connect with hotel/flight APIs
- **Itinerary Generator**: Multi-day trip planning
- **Real-time Events**: Integrate event calendars
- **Transportation**: Add public transit information
- **Restaurant Recommendations**: Food preference matching
- **Language Translation**: Multi-language support

## 📝 Development Notes

### Adding New Tools

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const myNewTool = createTool({
  id: 'my-new-tool',
  description: 'Description of what this tool does',
  inputSchema: z.object({
    param: z.string(),
  }),
  outputSchema: z.object({
    result: z.string(),
  }),
  execute: async ({ context, mastra }) => {
    // Tool logic here
    return { result: 'success' };
  },
});
```

Then add to `src/mastra/index.ts`:

```typescript
import { myNewTool } from './tools/my-new-tool';

export const mastra = new Mastra({
  tools: {
    // ... existing tools
    myNewTool,
  },
  // ... rest of config
});
```

### Testing

```bash
# Start dev server
npm run dev

# Open playground
# Navigate to http://localhost:3456

# Test in chat:
# - "Tell me about London"
# - "What's the weather like?"
# - "Recommend activities for Paris"
```

## 📚 Technology Stack

- **Framework**: Mastra (AI Agent Framework)
- **AI SDK**: Vercel AI SDK v5
- **LLM**: OpenAI GPT-4o
- **Language**: TypeScript
- **Runtime**: Node.js 20+
- **Database**: LibSQL (SQLite-compatible)
- **Logging**: Pino
- **Validation**: Zod

## 🤝 Contributing

This project demonstrates:
- Clean code architecture
- Production-ready patterns
- Comprehensive error handling
- Full observability
- Extensible design

## 📄 License

ISC

## 👨‍💻 Author

Built as a demonstration of production-ready AI agent development with Mastra.

---

**Ready to explore cities worldwide? Start the app and ask about your favorite destination!** 🌍✈️
