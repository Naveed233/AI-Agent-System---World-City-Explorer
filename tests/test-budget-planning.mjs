#!/usr/bin/env node
/**
 * Quick test script for budget itinerary planning
 */

const testQuery = `I want to go to Paris next week. Plan a 1 week itinerary in a 2000 dollar budget. I want to see historical sites and eat local food. I also want to limit hotel budget so try and make it all happen in 2000 dollars`;

console.log('🧪 Testing City Information Assistant - Budget Itinerary Planning\n');
console.log('📝 Query:', testQuery, '\n');
console.log('⏳ Sending request to agent...\n');

const response = await fetch('http://localhost:4111/api/agents/cityAssistantAgent/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: testQuery,
      }
    ],
    threadId: `budget-test-${Date.now()}`,
  }),
});

if (!response.ok) {
  console.error('❌ Error:', response.statusText);
  process.exit(1);
}

console.log('📡 Streaming response...\n');
console.log('=' . repeat(80));

let fullResponse = '';
let toolCalls = [];

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        
        // Track tool calls
        if (data.type === 'tool-call-start') {
          const toolName = data.payload?.name || 'unknown';
          toolCalls.push(toolName);
          console.log(`\n🔧 Calling tool: ${toolName}`);
        }
        
        // Collect text
        if (data.type === 'text-delta' && data.payload?.text) {
          process.stdout.write(data.payload.text);
          fullResponse += data.payload.text;
        }
        
        // Show thinking if available
        if (data.payload?.thinking) {
          console.log(`\n💭 Thinking: ${data.payload.thinking}`);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log('\n✅ Response complete!\n');
console.log('📊 Summary:');
console.log(`   - Tools called: ${toolCalls.join(', ')}`);
console.log(`   - Response length: ${fullResponse.length} characters`);
console.log(`   - Has budget breakdown: ${fullResponse.includes('budget') ? 'Yes ✅' : 'No ❌'}`);
console.log(`   - Has itinerary: ${fullResponse.includes('Day 1' || fullResponse.includes('day 1')) ? 'Yes ✅' : 'No ❌'}`);
console.log(`   - Has accommodation: ${fullResponse.includes('hotel' || fullResponse.includes('accommodation')) ? 'Yes ✅' : 'No ❌'}`);

console.log('\n🎉 Test complete!');

