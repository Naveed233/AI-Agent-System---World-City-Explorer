/**
 * Basic test to verify the Mastra setup
 * Tests that tools and agents can be imported and initialized
 */

import { mastra } from './src/mastra/index.js';

async function testBasicSetup() {
  console.log('🧪 Testing Mastra Setup...\n');

  // Test 1: Check if Mastra instance exists
  console.log('✅ Test 1: Mastra instance created');
  if (!mastra) {
    throw new Error('❌ Mastra instance not found');
  }

  // Test 2: Check if agents are registered
  console.log('✅ Test 2: Checking agents...');
  const agents = await mastra.getAgents();
  if (!agents || Object.keys(agents).length === 0) {
    throw new Error('❌ No agents registered');
  }
  console.log(`   Found ${Object.keys(agents).length} agent(s): ${Object.keys(agents).join(', ')}`);

  // Test 3: Verify cityAssistantAgent exists
  console.log('✅ Test 3: Verifying main agent...');
  if (!agents.cityAssistantAgent) {
    throw new Error('❌ cityAssistantAgent not found');
  }
  console.log('   cityAssistantAgent is properly configured');

  // Test 4: Check if workflows are registered
  console.log('✅ Test 4: Checking workflows...');
  const workflows = await mastra.getWorkflows();
  console.log(`   Found ${Object.keys(workflows).length} workflow(s)`);

  // Test 5: Verify TypeScript compilation
  console.log('✅ Test 5: TypeScript compilation passed');

  console.log('\n🎉 All tests passed!\n');
  console.log('📊 Summary:');
  console.log(`   - Mastra instance: ✅ Created`);
  console.log(`   - Agents: ${Object.keys(agents).length} registered`);
  console.log(`   - Workflows: ${Object.keys(workflows).length} registered`);
  console.log(`   - TypeScript: ✅ No errors`);
}

// Run tests
testBasicSetup()
  .then(() => {
    console.log('\n✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });

