#!/usr/bin/env node

/**
 * Test script for City Planner Workflow
 * 
 * Demonstrates two scenarios:
 * 1. Quick recommendations (no duration/budget)
 * 2. Full itinerary planning (with duration/budget)
 */

import { mastra } from './src/mastra/index.ts';

console.log('🚀 City Planner Workflow Test\n');
console.log('='.repeat(60));

async function testQuickRecommendations() {
  console.log('\n📍 Test 1: Quick Recommendations for Tokyo\n');
  console.log('Input: City only, no duration or budget');
  console.log('-'.repeat(60));
  
  try {
    const result = await mastra.workflows.cityPlannerWorkflow.execute({
      input: {
        city: 'Tokyo',
        interests: ['food', 'culture', 'technology'],
      },
    });

    console.log('\n✅ Workflow completed successfully!\n');
    console.log('Planning Type:', result.planningType);
    console.log('\n' + result.formattedResponse);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testFullItinerary() {
  console.log('\n\n' + '='.repeat(60));
  console.log('\n📍 Test 2: Full Itinerary for Paris\n');
  console.log('Input: 5 days, $2000 budget, interested in historical sites and local food');
  console.log('-'.repeat(60));
  
  try {
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

    console.log('\n✅ Workflow completed successfully!\n');
    console.log('Planning Type:', result.planningType);
    console.log('\n' + result.formattedResponse);
    
    // Show detailed itinerary
    if (result.details.dailyItinerary) {
      console.log('\n\n' + '='.repeat(60));
      console.log('📅 DETAILED DAILY ITINERARY');
      console.log('='.repeat(60));
      
      result.details.dailyItinerary.forEach(day => {
        console.log(`\n🗓️  Day ${day.day} - ${day.date}`);
        console.log('-'.repeat(40));
        
        console.log('\n🎯 Activities:');
        day.activities.forEach(activity => {
          console.log(`  ${activity.time} - ${activity.activity}`);
          console.log(`     ${activity.description}`);
          console.log(`     Cost: $${activity.estimatedCost}`);
        });
        
        console.log('\n🍽️  Meals:');
        console.log(`  Breakfast: ${day.meals.breakfast}`);
        console.log(`  Lunch: ${day.meals.lunch}`);
        console.log(`  Dinner: ${day.meals.dinner}`);
        
        console.log(`\n💰 Total Day Cost: $${day.totalDayCost}`);
      });
      
      console.log('\n\n' + '='.repeat(60));
      console.log('💼 PACKING TIPS');
      console.log('='.repeat(60));
      result.details.packingTips.forEach(tip => console.log(`  ${tip}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

async function testBudgetTrip() {
  console.log('\n\n' + '='.repeat(60));
  console.log('\n📍 Test 3: Budget Trip to Bangkok\n');
  console.log('Input: 7 days, $800 budget, budget style');
  console.log('-'.repeat(60));
  
  try {
    const result = await mastra.workflows.cityPlannerWorkflow.execute({
      input: {
        city: 'Bangkok',
        country: 'Thailand',
        duration: 7,
        budget: 800,
        interests: ['street food', 'temples', 'markets'],
        travelStyle: 'budget',
      },
    });

    console.log('\n✅ Workflow completed successfully!\n');
    console.log('Planning Type:', result.planningType);
    console.log('\nBudget Breakdown:');
    console.log(`  Accommodation: $${result.details.budgetBreakdown.accommodation}`);
    console.log(`  Food: $${result.details.budgetBreakdown.food}`);
    console.log(`  Activities: $${result.details.budgetBreakdown.activities}`);
    console.log(`  Transportation: $${result.details.budgetBreakdown.transportation}`);
    console.log(`  Contingency: $${result.details.budgetBreakdown.contingency}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testQuickRecommendations();
  await testFullItinerary();
  await testBudgetTrip();
  
  console.log('\n\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('='.repeat(60) + '\n');
}

runTests().catch(console.error);

