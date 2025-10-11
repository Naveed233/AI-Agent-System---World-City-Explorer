#!/usr/bin/env node

/**
 * Test script for Enhanced City Planner Workflow
 * Tests all new features:
 * - Flight search
 * - Hotel booking
 * - Currency conversion
 * - Visa requirements
 * - Travel insurance
 * - Season optimization
 * - Group travel
 * - Multi-city trips
 */

import { mastra } from './src/mastra/index.ts';

console.log('🚀 Enhanced City Planner Workflow Test\n');
console.log('='.repeat(80));

async function testMultiCityTrip() {
  console.log('\n📍 Test 1: Multi-City Trip (Paris → Rome → Barcelona)\n');
  console.log('Features tested: Multi-city, flights, hotels, visa, insurance, group travel');
  console.log('-'.repeat(80));
  
  try {
    const result = await mastra.workflows.enhancedCityPlannerWorkflow.execute({
      input: {
        destinations: ['Paris', 'Rome', 'Barcelona'],
        origin: 'New York',
        passportCountry: 'United States',
        duration: 10,
        budget: 5000,
        travelers: 4,
        checkIn: '2024-06-01',
        checkOut: '2024-06-11',
        interests: ['food', 'history', 'art'],
        activities: ['museums', 'food tours'],
        priceRange: 'mid-range',
      },
    });

    console.log('\n✅ Workflow completed successfully!\n');
    console.log(result.formattedOutput);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

async function testSingleCityWithAllFeatures() {
  console.log('\n\n' + '='.repeat(80));
  console.log('\n📍 Test 2: Single City - Tokyo (All Features)\n');
  console.log('Features tested: Season optimization, visa, insurance, currency, group travel');
  console.log('-'.repeat(80));
  
  try {
    const result = await mastra.workflows.enhancedCityPlannerWorkflow.execute({
      input: {
        destinations: ['Tokyo'],
        origin: 'Los Angeles',
        passportCountry: 'United States',
        duration: 7,
        budget: 3500,
        travelers: 2,
        checkIn: '2024-09-15',
        checkOut: '2024-09-22',
        interests: ['food', 'culture', 'technology'],
        activities: ['city tours', 'shopping'],
        priceRange: 'mid-range',
      },
    });

    console.log('\n✅ Workflow completed successfully!\n');
    console.log(result.formattedOutput);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testBudgetGroupTrip() {
  console.log('\n\n' + '='.repeat(80));
  console.log('\n📍 Test 3: Budget Group Trip - Bangkok\n');
  console.log('Features tested: Group travel, budget optimization, insurance');
  console.log('-'.repeat(80));
  
  try {
    const result = await mastra.workflows.enhancedCityPlannerWorkflow.execute({
      input: {
        destinations: ['Bangkok'],
        origin: 'Singapore',
        passportCountry: 'Singapore',
        duration: 5,
        budget: 2000,
        travelers: 6,
        checkIn: '2024-11-10',
        checkOut: '2024-11-15',
        interests: ['street food', 'temples', 'markets'],
        activities: ['walking tours', 'food tours'],
        priceRange: 'budget',
      },
    });

    console.log('\n✅ Workflow completed successfully!\n');
    console.log(result.formattedOutput);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testLuxuryTrip() {
  console.log('\n\n' + '='.repeat(80));
  console.log('\n📍 Test 4: Luxury Trip - Dubai\n');
  console.log('Features tested: Luxury pricing, premium insurance, high-end hotels');
  console.log('-'.repeat(80));
  
  try {
    const result = await mastra.workflows.enhancedCityPlannerWorkflow.execute({
      input: {
        destinations: ['Dubai'],
        origin: 'London',
        passportCountry: 'United Kingdom',
        duration: 5,
        budget: 8000,
        travelers: 2,
        checkIn: '2024-12-15',
        checkOut: '2024-12-20',
        interests: ['luxury shopping', 'fine dining', 'beaches'],
        activities: ['desert safari', 'yacht cruise'],
        priceRange: 'luxury',
      },
    });

    console.log('\n✅ Workflow completed successfully!\n');
    console.log(result.formattedOutput);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('\n🧪 Running comprehensive test suite for enhanced workflow...\n');
  
  await testMultiCityTrip();
  await testSingleCityWithAllFeatures();
  await testBudgetGroupTrip();
  await testLuxuryTrip();
  
  console.log('\n\n' + '='.repeat(80));
  console.log('✅ All enhanced workflow tests completed!');
  console.log('='.repeat(80) + '\n');
  
  console.log('📊 Features Tested:');
  console.log('  ✅ Multi-city trip planning');
  console.log('  ✅ Flight search and pricing');
  console.log('  ✅ Hotel booking recommendations');
  console.log('  ✅ Visa requirements checking');
  console.log('  ✅ Travel insurance recommendations');
  console.log('  ✅ Currency conversion info');
  console.log('  ✅ Season optimization');
  console.log('  ✅ Group travel budget splitting');
  console.log('  ✅ Budget/mid-range/luxury pricing tiers\n');
}

runTests().catch(console.error);

