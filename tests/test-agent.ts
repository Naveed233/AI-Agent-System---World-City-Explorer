/**
 * Test script for City Information Assistant
 * Run with: npx tsx test-agent.ts
 */

import { mastra } from './src/mastra/index';

async function testAgent() {
  console.log('🏙️  Testing City Information Assistant\n');
  console.log('═'.repeat(60));
  
  const agent = mastra.getAgent('cityAssistantAgent');
  
  if (!agent) {
    console.error('❌ Agent not found!');
    process.exit(1);
  }
  
  console.log('✅ Agent loaded successfully');
  console.log(`📝 Agent name: ${agent.name}`);
  console.log(`🔧 Tools available: ${Object.keys(agent.tools || {}).length}`);
  console.log('\n' + '═'.repeat(60) + '\n');
  
  // Test 1: Ask about a city
  console.log('📍 Test 1: Asking about Tokyo\n');
  
  try {
    const response = await agent.generate(
      [
        {
          role: 'user',
          content: 'Tell me about Tokyo - I want to know the weather, time, and basic facts.'
        }
      ],
      {
        threadId: 'test-thread-1',
      }
    );
    
    console.log('Agent Response:');
    console.log(response.text);
    console.log('\n' + '-'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error in Test 1:', error);
  }
  
  // Test 2: Follow-up question (tests memory)
  console.log('📍 Test 2: Follow-up question about Paris\n');
  
  try {
    const response2 = await agent.generate(
      [
        {
          role: 'user',
          content: 'What about Paris?'
        }
      ],
      {
        threadId: 'test-thread-1',
      }
    );
    
    console.log('Agent Response:');
    console.log(response2.text);
    console.log('\n' + '-'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error in Test 2:', error);
  }
  
  // Test 3: Activity recommendations
  console.log('📍 Test 3: Trip recommendations for London\n');
  
  try {
    const response3 = await agent.generate(
      [
        {
          role: 'user',
          content: 'Give me activity recommendations for London based on current conditions'
        }
      ],
      {
        threadId: 'test-thread-2',
      }
    );
    
    console.log('Agent Response:');
    console.log(response3.text);
    console.log('\n' + '═'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error in Test 3:', error);
  }
  
  console.log('✅ All tests completed!');
  console.log('\n🚀 To use the interactive playground, run: npm run dev');
  console.log('📖 Then navigate to: http://localhost:3456\n');
}

// Run tests
testAgent().catch(console.error);

