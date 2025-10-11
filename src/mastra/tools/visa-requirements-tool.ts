import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Visa Requirements Tool
 * Checks visa requirements based on passport and destination
 */
export const visaRequirementsTool = createTool({
  id: 'visaRequirementsTool',
  description: 'Check visa requirements for travel between countries. Provides information on visa types, application process, and entry requirements.',
  inputSchema: z.object({
    passportCountry: z.string().describe('Country of passport (e.g., "United States", "India")'),
    destinationCountry: z.string().describe('Destination country'),
    stayDuration: z.number().optional().describe('Planned stay duration in days'),
  }),
  outputSchema: z.object({
    passportCountry: z.string(),
    destinationCountry: z.string(),
    visaRequired: z.boolean(),
    visaType: z.string(),
    maxStayWithoutVisa: z.number().optional(),
    processingTime: z.string().optional(),
    cost: z.string().optional(),
    requirements: z.array(z.string()),
    applicationProcess: z.array(z.string()),
    additionalInfo: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { passportCountry, destinationCountry, stayDuration = 7 } = context;

    console.log(`🛂 [Visa Requirements] Checking: ${passportCountry} → ${destinationCountry}`);

    // Visa-free countries for major passport holders (simplified)
    const visaFreeDestinations: Record<string, string[]> = {
      'united states': ['canada', 'mexico', 'uk', 'france', 'germany', 'italy', 'spain', 'japan', 'south korea', 'singapore', 'australia'],
      'uk': ['usa', 'canada', 'eu countries', 'japan', 'singapore', 'australia', 'new zealand'],
      'india': ['nepal', 'bhutan', 'maldives', 'mauritius', 'fiji'],
      'australia': ['new zealand', 'singapore', 'uk', 'most eu countries', 'japan', 'south korea'],
    };

    const passportLower = passportCountry.toLowerCase();
    const destLower = destinationCountry.toLowerCase();

    // Check if visa-free
    const isVisaFree = visaFreeDestinations[passportLower]?.some(country => 
      destLower.includes(country) || country.includes(destLower)
    ) || false;

    // Visa on arrival countries
    const visaOnArrival = ['thailand', 'indonesia', 'vietnam', 'turkey', 'egypt', 'jordan'];
    const hasVisaOnArrival = visaOnArrival.some(country => destLower.includes(country));

    let visaRequired = true;
    let visaType = 'Tourist Visa (Embassy Application)';
    let maxStayWithoutVisa: number | undefined = undefined;
    let processingTime = '2-4 weeks';
    let cost = '$50-$200';

    if (isVisaFree) {
      visaRequired = false;
      visaType = 'Visa-Free Entry';
      maxStayWithoutVisa = 90; // Common for visa-free
      processingTime = undefined;
      cost = 'Free';
    } else if (hasVisaOnArrival) {
      visaRequired = true;
      visaType = 'Visa on Arrival';
      maxStayWithoutVisa = 30;
      processingTime = 'On arrival';
      cost = '$25-$50';
    }

    const requirements = visaRequired
      ? [
          'Valid passport (6+ months validity)',
          'Passport-size photographs (2)',
          'Proof of accommodation',
          'Return flight ticket',
          'Bank statements (last 3 months)',
          'Travel insurance',
          'Visa application form',
        ]
      : [
          'Valid passport (6+ months validity)',
          'Return flight ticket',
          'Proof of accommodation',
          'Sufficient funds for stay',
        ];

    const applicationProcess = visaRequired
      ? hasVisaOnArrival
        ? [
            '1. Prepare required documents',
            '2. Arrive at destination airport',
            '3. Proceed to Visa on Arrival counter',
            '4. Submit documents and pay fee',
            '5. Receive visa stamp (15-30 mins)',
          ]
        : [
            '1. Gather required documents',
            '2. Complete online application form',
            '3. Schedule embassy appointment',
            '4. Attend visa interview',
            '5. Submit biometrics and documents',
            '6. Pay visa fee',
            '7. Wait for processing (2-4 weeks)',
            '8. Collect passport with visa',
          ]
      : [
          '1. Ensure passport is valid (6+ months)',
          '2. Book accommodation and flights',
          '3. Arrive at destination',
          '4. Present passport at immigration',
          '5. Receive entry stamp',
        ];

    const additionalInfo = [
      `📅 Check your passport expiry: needs ${visaRequired ? '6' : '6'} months validity`,
      visaRequired
        ? `⏰ Apply at least ${hasVisaOnArrival ? '0' : '4-6'} weeks before travel`
        : `⏱️ Immigration process: 15-30 minutes`,
      `🏥 Travel insurance recommended (sometimes required)`,
      `💳 Proof of funds: $50-100 per day of stay`,
      `📧 Keep digital copies of all documents`,
      `🌐 Check latest requirements on official government website`,
    ];

    if (!isVisaFree && stayDuration > 30) {
      additionalInfo.push(`⚠️ Long-term visa may be required for stays over 30 days`);
    }

    console.log(`✅ [Visa Requirements] ${visaRequired ? 'Visa required' : 'Visa-free'} for ${destinationCountry}`);

    return {
      passportCountry,
      destinationCountry,
      visaRequired,
      visaType,
      maxStayWithoutVisa,
      processingTime,
      cost,
      requirements,
      applicationProcess,
      additionalInfo,
    };
  },
});

