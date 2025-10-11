import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { weatherTool } from './weather-tool';
import { cityFactsTool } from './city-facts-tool';
import { webSearchTool } from './web-search-tool';

/**
 * Advanced Itinerary Planner Tool
 * Creates detailed multi-day itineraries with budget breakdown
 */
export const itineraryPlannerTool = createTool({
  id: 'itineraryPlannerTool',
  description: 'Create a detailed multi-day travel itinerary with budget breakdown, accommodation suggestions, daily activities, and food recommendations. Perfect for comprehensive trip planning.',
  inputSchema: z.object({
    city: z.string().describe('The city to plan the itinerary for'),
    country: z.string().optional().describe('The country (helps with disambiguation)'),
    duration: z.number().describe('Number of days for the trip'),
    budget: z.number().describe('Total budget in USD'),
    interests: z.array(z.string()).describe('User interests (e.g., ["historical sites", "local food", "museums", "nightlife"])'),
    travelStyle: z.string().optional().describe('Travel style: budget, mid-range, or luxury (default: mid-range)'),
  }),
  outputSchema: z.object({
    city: z.string(),
    duration: z.number(),
    totalBudget: z.number(),
    budgetBreakdown: z.object({
      accommodation: z.number(),
      food: z.number(),
      activities: z.number(),
      transportation: z.number(),
      contingency: z.number(),
    }),
    accommodationSuggestions: z.array(z.string()),
    dailyItinerary: z.array(z.object({
      day: z.number(),
      date: z.string(),
      activities: z.array(z.object({
        time: z.string(),
        activity: z.string(),
        description: z.string(),
        estimatedCost: z.number(),
      })),
      meals: z.object({
        breakfast: z.string(),
        lunch: z.string(),
        dinner: z.string(),
      }),
      totalDayCost: z.number(),
    })),
    packingTips: z.array(z.string()),
    moneyTips: z.array(z.string()),
    thinking: z.string(),
  }),
  execute: async ({ context, mastra }) => {
    const { city, country, duration, budget, interests, travelStyle = 'mid-range' } = context;
    
    let thinking = `🤔 Planning your ${duration}-day trip to ${city}...\n\n`;
    thinking += `💰 Budget: $${budget}\n`;
    thinking += `🎯 Interests: ${interests.join(', ')}\n`;
    thinking += `🏨 Travel Style: ${travelStyle}\n\n`;
    
    console.log(`📋 [Itinerary Planner] Creating ${duration}-day itinerary for ${city} with $${budget} budget`);
    
    try {
      // Step 1: Get city facts and weather
      thinking += '📍 Step 1: Gathering city information and weather forecast...\n';
      
      const [cityInfo, weatherInfo] = await Promise.all([
        cityFactsTool.execute({ context: { city }, runtimeContext: {} as any }),
        weatherTool.execute({ context: { city, country }, runtimeContext: {} as any }),
      ]);
      
      thinking += `✅ Got info: ${cityInfo.description}\n`;
      thinking += `🌤️ Weather: ${weatherInfo.temperature}°C, ${weatherInfo.condition}\n\n`;
      
      // Step 2: Calculate budget breakdown
      thinking += '💵 Step 2: Breaking down your budget...\n';
      
      let accommodationPercentage = 0.35; // 35% for accommodation
      let foodPercentage = 0.30; // 30% for food
      let activitiesPercentage = 0.25; // 25% for activities
      let transportationPercentage = 0.05; // 5% for local transportation
      let contingencyPercentage = 0.05; // 5% contingency
      
      // Adjust based on travel style
      if (travelStyle === 'budget') {
        accommodationPercentage = 0.25;
        foodPercentage = 0.30;
        activitiesPercentage = 0.30;
        transportationPercentage = 0.10;
        contingencyPercentage = 0.05;
      } else if (travelStyle === 'luxury') {
        accommodationPercentage = 0.45;
        foodPercentage = 0.30;
        activitiesPercentage = 0.20;
        transportationPercentage = 0.03;
        contingencyPercentage = 0.02;
      }
      
      const budgetBreakdown = {
        accommodation: Math.floor(budget * accommodationPercentage),
        food: Math.floor(budget * foodPercentage),
        activities: Math.floor(budget * activitiesPercentage),
        transportation: Math.floor(budget * transportationPercentage),
        contingency: Math.floor(budget * contingencyPercentage),
      };
      
      const perNightBudget = Math.floor(budgetBreakdown.accommodation / duration);
      const perDayFoodBudget = Math.floor(budgetBreakdown.food / duration);
      const perDayActivitiesBudget = Math.floor(budgetBreakdown.activities / duration);
      
      thinking += `🏨 Accommodation: $${budgetBreakdown.accommodation} ($${perNightBudget}/night)\n`;
      thinking += `🍽️ Food: $${budgetBreakdown.food} ($${perDayFoodBudget}/day)\n`;
      thinking += `🎭 Activities: $${budgetBreakdown.activities} ($${perDayActivitiesBudget}/day)\n`;
      thinking += `🚇 Transportation: $${budgetBreakdown.transportation}\n`;
      thinking += `💼 Contingency: $${budgetBreakdown.contingency}\n\n`;
      
      // Step 3: Get accommodation suggestions
      thinking += '🏨 Step 3: Finding accommodation options...\n';
      
      const hotelSearch = await webSearchTool.execute({
        context: {
          query: `budget hotels in ${city} under $${perNightBudget} per night`,
          maxResults: 3,
        },
        runtimeContext: {} as any,
      });
      
      const accommodationSuggestions = [
        `Budget Hotels ($${Math.floor(perNightBudget * 0.6)}-${perNightBudget}/night): Check Booking.com, Hotels.com for central locations`,
        `Airbnb Apartments ($${Math.floor(perNightBudget * 0.7)}-${Math.floor(perNightBudget * 1.2)}/night): Great for longer stays with kitchen`,
        `Hostels with private rooms ($${Math.floor(perNightBudget * 0.4)}-${Math.floor(perNightBudget * 0.7)}/night): Social atmosphere, budget-friendly`,
      ];
      
      if (hotelSearch.results.length > 0) {
        accommodationSuggestions.push(`💡 Tip: ${hotelSearch.results[0].snippet}`);
      }
      
      thinking += `✅ Found accommodation options in your budget range\n\n`;
      
      // Step 4: Search for activities based on interests
      thinking += '🎯 Step 4: Planning activities based on your interests...\n';
      
      const activitySearches = await Promise.all(
        interests.map(interest =>
          webSearchTool.execute({
            context: {
              query: `${interest} in ${city} ${country || ''} recommendations`,
              maxResults: 2,
            },
            runtimeContext: {} as any,
          })
        )
      );
      
      thinking += `✅ Researched ${interests.length} interest categories\n\n`;
      
      // Step 5: Create daily itinerary
      thinking += '📅 Step 5: Building your day-by-day itinerary...\n\n';
      
      const dailyItinerary = [];
      const today = new Date();
      
      for (let day = 1; day <= duration; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);
        const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        let activities = [];
        let totalDayCost = 0;
        
        // Distribute interests across days
        const interestIndex = (day - 1) % interests.length;
        const primaryInterest = interests[interestIndex];
        const secondaryInterest = interests[(day) % interests.length];
        
        // Morning activity
        const morningCost = Math.floor(perDayActivitiesBudget * 0.4);
        activities.push({
          time: '09:00 AM',
          activity: `${primaryInterest === 'historical sites' ? 'Visit Historical Site' : primaryInterest === 'museums' ? 'Museum Tour' : 'Morning Exploration'}`,
          description: `Explore ${primaryInterest} - ${cityInfo.notableFor ? cityInfo.notableFor[0] : 'popular attraction'}. Book tickets online in advance for discounts.`,
          estimatedCost: morningCost,
        });
        totalDayCost += morningCost;
        
        // Afternoon activity
        const afternoonCost = Math.floor(perDayActivitiesBudget * 0.35);
        activities.push({
          time: '02:00 PM',
          activity: secondaryInterest === 'local food' ? 'Food Tour' : secondaryInterest === 'shopping' ? 'Local Market Visit' : 'Afternoon Activity',
          description: `Experience ${secondaryInterest}. ${secondaryInterest === 'local food' ? 'Try traditional dishes and street food' : 'Explore local neighborhoods and culture'}.`,
          estimatedCost: afternoonCost,
        });
        totalDayCost += afternoonCost;
        
        // Evening activity
        const eveningCost = Math.floor(perDayActivitiesBudget * 0.25);
        activities.push({
          time: '06:00 PM',
          activity: day === duration ? 'Farewell Dinner & Reflection' : 'Evening Leisure',
          description: day === duration ? 'Enjoy a special dinner at a recommended local restaurant and reflect on your trip' : 'Relax, explore nightlife, or enjoy a sunset view',
          estimatedCost: eveningCost,
        });
        totalDayCost += eveningCost;
        
        // Meals
        const breakfastCost = Math.floor(perDayFoodBudget * 0.2);
        const lunchCost = Math.floor(perDayFoodBudget * 0.35);
        const dinnerCost = Math.floor(perDayFoodBudget * 0.45);
        
        totalDayCost += breakfastCost + lunchCost + dinnerCost;
        
        dailyItinerary.push({
          day,
          date: dateStr,
          activities,
          meals: {
            breakfast: `Local café or hotel breakfast ($${breakfastCost}) - Try traditional breakfast items`,
            lunch: `Mid-range restaurant ($${lunchCost}) - Sample regional cuisine`,
            dinner: `${day === duration ? 'Special' : 'Local'} restaurant ($${dinnerCost}) - ${interests.includes('local food') ? 'Focus on authentic local dishes' : 'Enjoy recommended local spots'}`,
          },
          totalDayCost,
        });
        
        thinking += `Day ${day}: $${totalDayCost} planned\n`;
      }
      
      thinking += `\n✅ Itinerary complete! Total planned spending: $${dailyItinerary.reduce((sum, day) => sum + day.totalDayCost, 0) + budgetBreakdown.accommodation + budgetBreakdown.transportation}\n`;
      
      // Packing tips based on weather
      const packingTips = [
        weatherInfo.temperature < 15 ? '🧥 Pack warm layers and jacket' : weatherInfo.temperature > 25 ? '🌞 Pack light, breathable clothing and sunscreen' : '👕 Pack comfortable layers for variable weather',
        '👟 Comfortable walking shoes (you\'ll walk a lot!)',
        '🔌 Power adapter and portable charger',
        interests.includes('historical sites') ? '📸 Camera for historical sites' : '📱 Phone with good camera',
        '💳 Credit card + some local cash',
        '🎒 Day pack for carrying essentials',
      ];
      
      const moneyTips = [
        `💰 Daily budget: ~$${Math.floor(budget / duration)} per day`,
        '🏦 Use ATMs for better exchange rates than currency exchange offices',
        '💳 Inform your bank about travel dates to avoid card blocks',
        '📱 Download offline maps and translation apps',
        `🎫 Consider a city pass if visiting multiple attractions (usually saves 20-30%)`,
        '🍽️ Lunch is often cheaper than dinner at the same restaurant',
      ];
      
      console.log(`✅ [Itinerary Planner] Created ${duration}-day itinerary with ${dailyItinerary.length} days planned`);
      
      return {
        city,
        duration,
        totalBudget: budget,
        budgetBreakdown,
        accommodationSuggestions,
        dailyItinerary,
        packingTips,
        moneyTips,
        thinking,
      };
      
    } catch (error) {
      console.error('❌ [Itinerary Planner] Error:', error);
      throw new Error(`Failed to create itinerary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

