# City Planner Workflow - Quick Start

## 🚀 Get Started in 30 Seconds

### Quick Recommendations (No Planning)
```bash
npm run workflow -- --city "Tokyo" --interests "food,culture"
# OR
npx tsx run-workflow.mjs --city "Tokyo" --interests "food,culture"
```

### Full Trip Planning
```bash
npm run workflow -- --city "Paris" --duration 5 --budget 2000 --interests "historical sites,food"
# OR
npx tsx run-workflow.mjs --city "Paris" --duration 5 --budget 2000 --interests "historical sites,food"
```

## 📋 Common Use Cases

### Weekend Getaway
```bash
npm run workflow -- --city "Barcelona" --duration 3 --budget 800 --interests "beaches,food,nightlife"
```

### Week-Long Adventure
```bash
npm run workflow -- --city "Tokyo" --duration 7 --budget 2500 --interests "food,culture,shopping" --style "mid-range"
```

### Budget Backpacking
```bash
npm run workflow -- --city "Bangkok" --duration 10 --budget 600 --interests "street food,temples" --style "budget"
```

### Luxury Escape
```bash
npm run workflow -- --city "Dubai" --duration 4 --budget 5000 --interests "shopping,beaches,luxury" --style "luxury"
```

## 🎯 Common Interests

Copy/paste these into your command:

- **Culture:** `historical sites,museums,art,architecture`
- **Food Lover:** `local food,street food,restaurants,markets`
- **Outdoors:** `nature,beaches,hiking,outdoor,parks`
- **Urban Explorer:** `shopping,nightlife,entertainment,modern architecture`
- **Adventure:** `adventure,sports,water activities,hiking`

## 💡 Pro Tips

1. **Always provide country for accuracy:**
   ```bash
   --city "Paris" --country "France"
   ```

2. **Mix interests for balanced itinerary:**
   ```bash
   --interests "food,history,outdoor"
   ```

3. **Budget includes everything except flights:**
   - Accommodation
   - Food
   - Activities
   - Local transportation

4. **Travel styles affect budget split:**
   - `budget`: More for activities, less for accommodation
   - `mid-range`: Balanced (default)
   - `luxury`: Premium accommodation focus

## 🔧 Programmatic Usage

### JavaScript/TypeScript
```javascript
import { mastra } from './src/mastra/index.ts';

const result = await mastra.workflows.cityPlannerWorkflow.execute({
  input: {
    city: 'Paris',
    duration: 5,
    budget: 2000,
    interests: ['historical sites', 'food'],
    travelStyle: 'mid-range',
  },
});

console.log(result.formattedResponse);
```

### Express.js API
```javascript
app.post('/api/plan-trip', async (req, res) => {
  const result = await mastra.workflows.cityPlannerWorkflow.execute({
    input: req.body,
  });
  res.json(result);
});
```

## 📊 What You Get

### Quick Recommendations:
- ✅ City overview with facts
- ✅ Current weather and time
- ✅ Top 3 priority activities
- ✅ Weather-based advice
- ✅ Time-of-day suggestions

### Full Itinerary:
- ✅ Everything above, plus:
- ✅ Budget breakdown by category
- ✅ Day-by-day schedule with times
- ✅ Activity descriptions and costs
- ✅ Meal suggestions (breakfast, lunch, dinner)
- ✅ Accommodation recommendations
- ✅ Packing tips
- ✅ Money-saving tips

## 🧪 Test It Out

Run the comprehensive test suite:
```bash
npm run workflow:test
# OR
npx tsx test-city-planner-workflow.mjs
```

This tests:
1. Quick recommendations (Tokyo)
2. Full itinerary (Paris, 5 days, $2000)
3. Budget trip (Bangkok, 7 days, $800)

## 📚 More Information

- Full documentation: [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md)
- Project overview: [README.md](./README.md)
- Main project features: [FEATURES_UPDATE.md](./FEATURES_UPDATE.md)

## ❓ Troubleshooting

**Problem:** `Error: Workflow 'cityPlannerWorkflow' not found`  
**Solution:** Check that the workflow is imported in `src/mastra/index.ts`

**Problem:** `OpenWeatherMap API error: 401`  
**Solution:** Set `OPENWEATHER_API_KEY` in your `.env` file

**Problem:** No results or slow execution  
**Solution:** Check internet connection, APIs may be rate-limited

## 🎉 Examples in Action

### Example 1: "I want to visit London for a weekend"
```bash
npm run workflow -- --city "London" --country "UK" --duration 3 --budget 1000 --interests "history,food,museums"
```

### Example 2: "What should I do in Singapore today?"
```bash
npm run workflow -- --city "Singapore" --interests "food,shopping"
```

### Example 3: "Plan a 2-week Southeast Asia trip"
```bash
# For Bangkok leg:
npm run workflow -- --city "Bangkok" --duration 7 --budget 800 --interests "temples,food" --style "budget"

# For Singapore leg:
npm run workflow -- --city "Singapore" --duration 7 --budget 1200 --interests "food,shopping,modern" --style "mid-range"
```

## 💻 Alternative: Direct Command

You can also run the workflow directly with:
```bash
npx tsx run-workflow.mjs --city "Your City" --duration X --budget Y
```

---

**Ready to explore the world? Start planning your next adventure! 🌍✈️**

