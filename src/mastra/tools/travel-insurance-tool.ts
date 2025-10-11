import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Travel Insurance Tool
 * Recommends travel insurance based on trip details
 */
export const travelInsuranceTool = createTool({
  id: 'travelInsuranceTool',
  description: 'Get travel insurance recommendations based on trip details, destination, activities, and traveler profile. Provides coverage options and cost estimates.',
  inputSchema: z.object({
    destination: z.string().describe('Trip destination'),
    duration: z.number().describe('Trip duration in days'),
    travelers: z.number().optional().describe('Number of travelers'),
    age: z.number().optional().describe('Average age of travelers'),
    activities: z.array(z.string()).optional().describe('Planned activities (hiking, diving, skiing, etc.)'),
    preExisting: z.boolean().optional().describe('Pre-existing medical conditions'),
  }),
  outputSchema: z.object({
    recommendations: z.array(z.object({
      planName: z.string(),
      coverage: z.string(),
      estimatedCost: z.number(),
      includes: z.array(z.string()),
      bestFor: z.string(),
    })),
    mustHaveCoverage: z.array(z.string()),
    tips: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { 
      destination, 
      duration, 
      travelers = 1, 
      age = 30,
      activities = [],
      preExisting = false 
    } = context;

    console.log(`🛡️ [Travel Insurance] Finding coverage for ${destination}, ${duration} days`);

    // Risk assessment
    const isHighRisk = activities.some(a => 
      ['skiing', 'diving', 'climbing', 'extreme'].some(risk => a.toLowerCase().includes(risk))
    );
    
    const isInternational = !['usa', 'canada', 'domestic'].some(local => 
      destination.toLowerCase().includes(local)
    );

    // Base cost calculation
    const baseCostPerDay = isInternational ? 5 : 3;
    const ageMultiplier = age > 65 ? 1.8 : age > 50 ? 1.4 : 1.0;
    const riskMultiplier = isHighRisk ? 1.5 : 1.0;
    const preExistingMultiplier = preExisting ? 1.3 : 1.0;

    const basicCost = Math.round(
      baseCostPerDay * duration * travelers * ageMultiplier * 0.7
    );
    
    const comprehensiveCost = Math.round(
      baseCostPerDay * duration * travelers * ageMultiplier * riskMultiplier * preExistingMultiplier
    );

    const premiumCost = Math.round(comprehensiveCost * 1.5);

    const recommendations = [
      {
        planName: 'Basic Travel Insurance',
        coverage: 'Essential',
        estimatedCost: basicCost,
        includes: [
          'Medical emergencies ($50,000)',
          'Emergency evacuation ($100,000)',
          'Trip cancellation (up to $5,000)',
          '24/7 travel assistance',
        ],
        bestFor: 'Short trips, low-risk activities',
      },
      {
        planName: 'Comprehensive Travel Insurance',
        coverage: 'Standard',
        estimatedCost: comprehensiveCost,
        includes: [
          'Medical emergencies ($100,000)',
          'Emergency evacuation ($250,000)',
          'Trip cancellation/interruption ($10,000)',
          'Baggage loss/delay',
          'Flight delays',
          '24/7 travel assistance',
          preExisting ? 'Pre-existing conditions covered' : 'Adventure activities covered',
        ],
        bestFor: 'Most international trips',
      },
      {
        planName: 'Premium Travel Insurance',
        coverage: 'Premium',
        estimatedCost: premiumCost,
        includes: [
          'Medical emergencies ($250,000+)',
          'Emergency evacuation ($500,000)',
          'Trip cancellation/interruption ($25,000)',
          'Baggage loss (full coverage)',
          'Rental car coverage',
          'Adventure sports coverage',
          'Pre-existing conditions covered',
          'Cancel for any reason (CFAR)',
          'Concierge services',
        ],
        bestFor: 'Long trips, high-value trips, adventure activities',
      },
    ];

    const mustHaveCoverage = [
      '🏥 Medical emergencies and hospitalization',
      '🚑 Emergency medical evacuation',
      '✈️ Trip cancellation/interruption',
      '🧳 Lost or delayed baggage',
      '⏰ Flight delays and missed connections',
    ];

    if (isHighRisk) {
      mustHaveCoverage.push('🏂 Adventure sports and activities coverage');
    }

    if (preExisting) {
      mustHaveCoverage.push('💊 Pre-existing conditions coverage');
    }

    const tips = [
      `💰 Average cost: $${Math.round(comprehensiveCost / travelers)} per person for ${duration} days`,
      `📅 Buy insurance within 14-21 days of booking for best coverage`,
      `📋 Read policy exclusions carefully`,
      `🏥 Check if your health insurance covers international travel`,
      `💳 Some credit cards include basic travel insurance`,
      `📱 Download insurance company's app for easy claims`,
      `📞 Save emergency contact numbers before departure`,
      isHighRisk ? `⚠️ Adventure activities require specific coverage` : `✅ Standard activities covered by most policies`,
    ];

    console.log(`✅ [Travel Insurance] Recommended ${recommendations.length} plans, from $${basicCost}`);

    return {
      recommendations,
      mustHaveCoverage,
      tips,
    };
  },
});

