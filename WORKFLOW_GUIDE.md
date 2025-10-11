# City Planner Workflow Guide

## Overview

The **City Planner Workflow** is a comprehensive, intelligent workflow that orchestrates multiple tools to provide complete city information and trip planning capabilities. It automatically adapts to user needs, providing either quick recommendations or detailed multi-day itineraries.

## Architecture

The workflow consists of 5 main steps executed in sequence:

```
1. Gather City Data (parallel execution)
   ↓
2. Determine Planning Type (conditional branching)
   ↓
3a. Create Full Itinerary OR 3b. Generate Quick Recommendations
   ↓
4. Format Final Output
```

## Workflow Steps

### Step 1: Gather City Data
**Purpose:** Fetch comprehensive city information in parallel

**Execution:** Parallel API calls for optimal performance
- Fetches city facts (population, description, notable features)
- Gets current weather conditions
- Retrieves local time and timezone information

**Benefits:**
- 3x faster than sequential execution
- Complete context for planning decisions

### Step 2: Determine Planning Type
**Purpose:** Intelligent decision routing

**Logic:**
- If `duration` AND `budget` are provided → Full Itinerary
- Otherwise → Quick Recommendations

**Benefits:**
- Automatic adaptation to user needs
- No manual configuration required

### Step 3a: Create Full Itinerary (Conditional)
**Purpose:** Generate detailed multi-day trip plans

**Execution when:**
- User provides both duration (days) and budget (USD)

**Features:**
- Budget breakdown (accommodation, food, activities, transportation)
- Day-by-day itinerary with timed activities
- Meal suggestions for breakfast, lunch, and dinner
- Accommodation recommendations
- Packing tips based on weather
- Money-saving tips

**Output includes:**
- Daily activity schedule with estimated costs
- Budget allocation per category
- Hotel/Airbnb suggestions
- Interest-based activity planning

### Step 3b: Generate Quick Recommendations (Conditional)
**Purpose:** Provide immediate activity suggestions

**Execution when:**
- Duration or budget is not provided

**Features:**
- Weather-aware recommendations
- Time-of-day optimized suggestions
- Priority-ranked activities
- Interest-based filtering

**Output includes:**
- Top 3 priority activities
- Weather and timing advice
- Best times to visit attractions

### Step 4: Format Final Output
**Purpose:** Create user-friendly formatted response

**Features:**
- Markdown-formatted city overview
- Current weather and time information
- Integrated planning details
- Clean, readable structure

## Input Schema

```typescript
{
  city: string;              // Required: City name
  country?: string;          // Optional: Country for disambiguation
  duration?: number;         // Optional: Trip duration in days
  budget?: number;           // Optional: Total budget in USD
  interests?: string[];      // Optional: User interests
  travelStyle?: string;      // Optional: 'budget', 'mid-range', 'luxury'
}
```

## Output Schema

```typescript
{
  success: boolean;
  city: string;
  planningType: 'full-itinerary' | 'quick-recommendations';
  cityOverview: string;      // Formatted markdown overview
  details: {
    // Full itinerary OR recommendations object
  };
  formattedResponse: string; // Complete formatted response
}
```

## Usage Examples

### Example 1: Quick Recommendations

```javascript
import { mastra } from './src/mastra/index.ts';

const result = await mastra.workflows.cityPlannerWorkflow.execute({
  input: {
    city: 'Tokyo',
    interests: ['food', 'culture', 'technology'],
  },
});

console.log(result.formattedResponse);
```

**Output:** Quick recommendations based on current weather and time

### Example 2: Full 5-Day Itinerary

```javascript
const result = await mastra.workflows.cityPlannerWorkflow.execute({
  input: {
    city: 'Paris',
    country: 'France',
    duration: 5,
    budget: 2000,
    interests: ['historical sites', 'local food', 'museums'],
    travelStyle: 'mid-range',
  },
});

// Access detailed itinerary
console.log(result.details.dailyItinerary);
console.log(result.details.budgetBreakdown);
```

**Output:** Complete 5-day itinerary with budget breakdown

### Example 3: Budget Trip

```javascript
const result = await mastra.workflows.cityPlannerWorkflow.execute({
  input: {
    city: 'Bangkok',
    duration: 7,
    budget: 800,
    interests: ['street food', 'temples', 'markets'],
    travelStyle: 'budget',
  },
});
```

**Output:** Budget-optimized 7-day plan with accommodation split 25% (vs 35% mid-range)

## Key Features

### 1. Intelligent Routing
- Automatic detection of planning mode
- No manual workflow selection needed

### 2. Parallel Execution
- City facts, weather, and time fetched simultaneously
- 3x performance improvement

### 3. Conditional Branching
- Different execution paths based on input
- Efficient resource utilization

### 4. Comprehensive Planning
- Budget breakdown by category
- Day-by-day scheduling
- Weather-aware recommendations
- Interest-based customization

### 5. Travel Style Adaptation
- **Budget:** 25% accommodation, 30% activities
- **Mid-range:** 35% accommodation, 25% activities
- **Luxury:** 45% accommodation, 20% activities

## Tool Integration

The workflow orchestrates these tools:

1. **cityFactsTool** - City information and demographics
2. **weatherTool** - Current weather conditions
3. **timeTool** - Local time and timezone
4. **itineraryPlannerTool** - Detailed itinerary creation
5. **tripRecommendationTool** - Activity recommendations
6. **webSearchTool** - Real-time hotel/restaurant info

## Error Handling

The workflow includes comprehensive error handling:

- Tool execution failures are caught and logged
- Fallback data provided when APIs are unavailable
- Clear error messages for debugging
- Workflow continues where possible

## Performance

**Typical execution times:**
- Quick Recommendations: 3-5 seconds
- Full Itinerary (5 days): 8-12 seconds

**Optimizations:**
- Parallel API calls in Step 1
- Conditional execution (only run needed branch)
- Efficient data passing between steps

## Best Practices

### For Quick Recommendations:
```javascript
{
  city: 'Sydney',
  interests: ['beaches', 'outdoor', 'food'],
}
```

### For Full Planning:
```javascript
{
  city: 'Rome',
  country: 'Italy',  // Add country for accuracy
  duration: 4,       // Both duration AND budget required
  budget: 1500,
  interests: ['historical sites', 'art', 'food'],
  travelStyle: 'mid-range',
}
```

### Interest Keywords:
- Historical sites, museums, cultural
- Local food, street food, restaurants
- Outdoor, nature, beaches
- Shopping, markets
- Nightlife, entertainment
- Adventure, sports
- Technology, modern architecture

## Testing

Run the comprehensive test suite:

```bash
node test-city-planner-workflow.mjs
```

Tests include:
1. Quick recommendations for Tokyo
2. Full itinerary for Paris (5 days, $2000)
3. Budget trip to Bangkok (7 days, $800)

## Workflow vs Agent

### Use the Workflow when:
- You need structured, predictable outputs
- Executing a specific multi-step process
- Performance is critical
- Budget calculations are required

### Use the Agent when:
- User interaction is conversational
- Requirements are open-ended
- Follow-up questions are expected
- Flexibility is more important than structure

## Integration Examples

### With Express.js API:
```javascript
app.post('/api/plan-trip', async (req, res) => {
  const result = await mastra.workflows.cityPlannerWorkflow.execute({
    input: req.body,
  });
  
  res.json(result);
});
```

### With Next.js API Route:
```javascript
export async function POST(request) {
  const body = await request.json();
  
  const result = await mastra.workflows.cityPlannerWorkflow.execute({
    input: body,
  });
  
  return Response.json(result);
}
```

### With Streamlit (Python):
```python
import subprocess
import json

# Call workflow via Node.js
result = subprocess.run(
    ['node', 'run-workflow.mjs', json.dumps(input_data)],
    capture_output=True,
    text=True
)

data = json.loads(result.stdout)
```

## Future Enhancements

Potential improvements:
1. **Flight integration** - Add flight search and booking suggestions
2. **Hotel booking** - Direct integration with booking APIs
3. **Multi-city trips** - Support for multiple cities in one itinerary
4. **Group travel** - Budget splitting for group trips
5. **Season optimization** - Best time to visit recommendations
6. **Visa requirements** - Automatic visa checking
7. **Travel insurance** - Insurance recommendations
8. **Currency conversion** - Real-time exchange rates

## Troubleshooting

### Common Issues:

**1. Workflow not found**
```bash
Error: Workflow 'cityPlannerWorkflow' not found
```
Solution: Ensure you've imported the workflow in `src/mastra/index.ts`

**2. API key errors**
```bash
OpenWeatherMap API error: 401
```
Solution: Set `OPENWEATHER_API_KEY` in your `.env` file

**3. Tool execution timeout**
Solution: Check network connectivity, APIs may be slow

**4. Invalid input**
```bash
Error: Input validation failed
```
Solution: Ensure `city` is a string and `duration`/`budget` are numbers

## Contributing

To add new features to the workflow:

1. Create new tool in `src/mastra/tools/`
2. Add new step to workflow
3. Update input/output schemas
4. Add test case in `test-city-planner-workflow.mjs`
5. Update this documentation

## License

Part of the City Information Assistant project.

## Support

For issues or questions:
1. Check this documentation
2. Review test examples
3. Check workflow logs
4. Review tool documentation

