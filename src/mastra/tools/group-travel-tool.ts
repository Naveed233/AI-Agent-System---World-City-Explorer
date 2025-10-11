import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Group Travel Tool
 * Manages group travel planning and budget splitting
 */
export const groupTravelTool = createTool({
  id: 'groupTravelTool',
  description: 'Plan group travel with automatic budget splitting, shared cost calculations, and group accommodation recommendations.',
  inputSchema: z.object({
    destination: z.string().describe('Travel destination'),
    travelers: z.number().describe('Number of travelers in the group'),
    totalBudget: z.number().describe('Total group budget in USD'),
    duration: z.number().describe('Trip duration in days'),
    sharedCosts: z.array(z.string()).optional().describe('Items to split (accommodation, transportation, activities)'),
  }),
  outputSchema: z.object({
    destination: z.string(),
    travelers: z.number(),
    totalBudget: z.number(),
    perPersonBudget: z.number(),
    budgetBreakdown: z.object({
      sharedCosts: z.object({
        accommodation: z.number(),
        transportation: z.number(),
        groupActivities: z.number(),
        total: z.number(),
      }),
      individualCosts: z.object({
        meals: z.number(),
        personalActivities: z.number(),
        shopping: z.number(),
        total: z.number(),
      }),
    }),
    perPersonShare: z.object({
      shared: z.number(),
      individual: z.number(),
      total: z.number(),
    }),
    groupRecommendations: z.array(z.object({
      category: z.string(),
      recommendation: z.string(),
      savings: z.string(),
    })),
    splitPaymentOptions: z.array(z.string()),
    tips: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { 
      destination, 
      travelers, 
      totalBudget, 
      duration,
      sharedCosts = ['accommodation', 'transportation', 'activities']
    } = context;

    console.log(`👥 [Group Travel] Planning for ${travelers} travelers to ${destination}`);

    const perPersonBudget = Math.round(totalBudget / travelers);

    // Budget allocation
    const accommodationPercent = 0.35;
    const transportationPercent = 0.15;
    const activitiesPercent = 0.25;
    const mealsPercent = 0.20;
    const contingencyPercent = 0.05;

    // Shared costs (split among group)
    const sharedAccommodation = Math.round(totalBudget * accommodationPercent);
    const sharedTransportation = Math.round(totalBudget * transportationPercent);
    const sharedActivities = Math.round(totalBudget * (activitiesPercent * 0.6)); // 60% of activities are group
    const totalShared = sharedAccommodation + sharedTransportation + sharedActivities;

    // Individual costs (per person)
    const individualMeals = Math.round((totalBudget * mealsPercent) / travelers);
    const individualActivities = Math.round((totalBudget * (activitiesPercent * 0.4)) / travelers);
    const individualShopping = Math.round((totalBudget * contingencyPercent) / travelers);
    const totalIndividual = individualMeals + individualActivities + individualShopping;

    // Per person breakdown
    const perPersonShared = Math.round(totalShared / travelers);
    const perPersonTotal = perPersonShared + totalIndividual;

    // Group savings recommendations
    const groupRecommendations = [
      {
        category: 'Accommodation',
        recommendation: `Rent ${Math.ceil(travelers / 4)} apartments/villas instead of hotel rooms`,
        savings: '30-50% compared to individual rooms',
      },
      {
        category: 'Transportation',
        recommendation: travelers >= 7 ? 'Rent a van or minibus' : 'Share taxis and use ride-sharing apps',
        savings: travelers >= 7 ? '40-60% per person' : '20-30% per person',
      },
      {
        category: 'Food',
        recommendation: 'Cook some meals together in shared accommodation',
        savings: '50% on those meals',
      },
      {
        category: 'Activities',
        recommendation: 'Book group tours and activities (usually 10-15% discount for groups of 6+)',
        savings: travelers >= 6 ? '10-15% group discount' : '5-10% with advance booking',
      },
      {
        category: 'Groceries',
        recommendation: 'Buy groceries and snacks in bulk',
        savings: '20-30% vs individual purchases',
      },
    ];

    const splitPaymentOptions = [
      '💳 **Splitwise App**: Track expenses and settle up at the end',
      '💰 **Group Fund**: Everyone contributes upfront, treasurer manages',
      '🔄 **Rotation System**: Different person pays each day, settle later',
      '📱 **Venmo/PayPal**: Instant reimbursements after shared expenses',
      '🏦 **Joint Account**: Open temporary account for trip expenses',
      '📊 **Google Sheets**: Manual tracking, settle weekly',
    ];

    const tips = [
      `👥 Assign roles: treasurer, planner, navigator, photographer`,
      `📝 Create shared expense spreadsheet before trip`,
      `🤝 Agree on budget and spending limits upfront`,
      `💰 Each person should bring $${Math.round(perPersonTotal * 1.1)} (10% buffer)`,
      `🍽️ Split group meals evenly, but track individual splurges separately`,
      `📸 Share photos in group album (Google Photos, iCloud)`,
      `🗳️ Use polls for group decisions (WhatsApp, Telegram)`,
      `⏰ Plan meeting times and check-ins (everyone has different pace)`,
      `🆓 Free walking tours save money and are great for groups`,
      `🎉 Group activities create best memories - prioritize them!`,
    ];

    // Add specific group size recommendations
    if (travelers >= 10) {
      tips.push(`👫 Large group (${travelers}): Consider splitting into smaller sub-groups for some activities`);
      tips.push(`🚌 Charter a private bus for significant savings on transportation`);
    } else if (travelers <= 3) {
      tips.push(`🤏 Small group (${travelers}): Easier to find deals, more flexibility`);
    }

    console.log(`✅ [Group Travel] Plan created: $${perPersonTotal}/person total`);

    return {
      destination,
      travelers,
      totalBudget,
      perPersonBudget,
      budgetBreakdown: {
        sharedCosts: {
          accommodation: sharedAccommodation,
          transportation: sharedTransportation,
          groupActivities: sharedActivities,
          total: totalShared,
        },
        individualCosts: {
          meals: individualMeals,
          personalActivities: individualActivities,
          shopping: individualShopping,
          total: totalIndividual,
        },
      },
      perPersonShare: {
        shared: perPersonShared,
        individual: totalIndividual,
        total: perPersonTotal,
      },
      groupRecommendations,
      splitPaymentOptions,
      tips,
    };
  },
});

