#!/usr/bin/env node

/**
 * City Planner Workflow CLI Runner
 * 
 * Usage:
 *   Quick recommendations:
 *     node run-workflow.mjs --city "Tokyo" --interests "food,culture"
 * 
 *   Full itinerary:
 *     node run-workflow.mjs --city "Paris" --duration 5 --budget 2000 --interests "historical sites,food"
 * 
 *   With all options:
 *     node run-workflow.mjs --city "Rome" --country "Italy" --duration 4 --budget 1500 --interests "history,food" --style "mid-range"
 */

import { mastra } from './src/mastra/index.ts';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];

    if (key === 'interests') {
      params[key] = value.split(',').map(s => s.trim());
    } else if (key === 'duration' || key === 'budget') {
      params[key] = parseInt(value);
    } else {
      params[key] = value;
    }
  }

  return params;
}

function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         City Planner Workflow - CLI Runner                     ║
╚════════════════════════════════════════════════════════════════╝

USAGE:
  node run-workflow.mjs [OPTIONS]

OPTIONS:
  --city <name>           City name (required)
  --country <name>        Country name (optional, for disambiguation)
  --duration <days>       Trip duration in days (optional)
  --budget <amount>       Budget in USD (optional)
  --interests <list>      Comma-separated interests (optional)
  --style <type>          Travel style: budget, mid-range, luxury (optional)

EXAMPLES:

  1. Quick recommendations:
     node run-workflow.mjs --city "Tokyo" --interests "food,culture,tech"

  2. Weekend trip:
     node run-workflow.mjs --city "Barcelona" --duration 3 --budget 800 --interests "beaches,food"

  3. Full week itinerary:
     node run-workflow.mjs --city "Paris" --country "France" --duration 7 --budget 2500 --interests "historical sites,art,food" --style "mid-range"

  4. Budget backpacking:
     node run-workflow.mjs --city "Bangkok" --duration 10 --budget 600 --interests "street food,temples,markets" --style "budget"

INTERESTS:
  - historical sites, museums, cultural, art
  - local food, street food, restaurants
  - outdoor, nature, beaches, hiking
  - shopping, markets
  - nightlife, entertainment, bars
  - adventure, sports
  - technology, modern architecture

TRAVEL STYLES:
  - budget:     Focus on hostels, street food, free activities
  - mid-range:  Balance of comfort and value (default)
  - luxury:     Premium accommodation, fine dining

NOTE:
  - If both --duration and --budget are provided: Creates full itinerary
  - If either is missing: Provides quick recommendations
  `);
}

async function runWorkflow() {
  const params = parseArgs();

  // Show help if no city provided
  if (!params.city) {
    showHelp();
    return;
  }

  console.log('🚀 Starting City Planner Workflow...\n');
  console.log('📋 Input Parameters:');
  console.log('  City:', params.city);
  if (params.country) console.log('  Country:', params.country);
  if (params.duration) console.log('  Duration:', params.duration, 'days');
  if (params.budget) console.log('  Budget: $' + params.budget);
  if (params.interests) console.log('  Interests:', params.interests.join(', '));
  if (params.style) console.log('  Travel Style:', params.style);
  console.log('\n' + '='.repeat(70) + '\n');

  const startTime = Date.now();

  try {
    const result = await mastra.workflows.cityPlannerWorkflow.execute({
      input: {
        city: params.city,
        country: params.country,
        duration: params.duration,
        budget: params.budget,
        interests: params.interests,
        travelStyle: params.style,
      },
    });

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Workflow completed successfully!');
    console.log(`⏱️  Execution time: ${executionTime}s\n`);
    console.log('='.repeat(70));
    console.log(result.formattedResponse);
    console.log('='.repeat(70));

    // If full itinerary, show additional details
    if (result.planningType === 'full-itinerary') {
      console.log('\n📅 DAILY BREAKDOWN\n');
      
      result.details.dailyItinerary.forEach(day => {
        console.log(`Day ${day.day} (${day.date}) - $${day.totalDayCost}`);
        day.activities.forEach(activity => {
          console.log(`  ${activity.time}: ${activity.activity} ($${activity.estimatedCost})`);
        });
        console.log('');
      });

      console.log('🎒 PACKING TIPS');
      result.details.packingTips.forEach(tip => console.log(`  ${tip}`));
      
      console.log('\n💡 MONEY-SAVING TIPS');
      result.details.moneyTips.forEach(tip => console.log(`  ${tip}`));
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ Planning complete! Have a great trip! ✨');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Workflow execution failed:');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the workflow
runWorkflow().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

