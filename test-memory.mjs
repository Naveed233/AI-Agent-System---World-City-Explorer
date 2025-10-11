#!/usr/bin/env node
/**
 * Test script to verify memory/conversation context is working
 */

const THREAD_ID = `memory-test-${Date.now()}`;
const API_URL = 'http://localhost:4111/api/agents/cityAssistantAgent/stream';

console.log('🧪 Testing Memory / Conversation Context\n');
console.log(`Thread ID: ${THREAD_ID}\n`);

async function sendMessage(message, messageNumber) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 Message ${messageNumber}: "${message}"`);
  console.log('='.repeat(80));
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      threadId: THREAD_ID,
    }),
  });

  if (!response.ok) {
    console.error('❌ Error:', response.statusText);
    return '';
  }

  let fullResponse = '';
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
          if (data.type === 'text-delta' && data.payload?.text) {
            process.stdout.write(data.payload.text);
            fullResponse += data.payload.text;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
  
  console.log('\n');
  return fullResponse;
}

// Test conversation flow
(async () => {
  try {
    // Message 1: Ask about Paris
    const response1 = await sendMessage(
      "Tell me about Paris. What's the weather like?",
      1
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Message 2: Follow-up without mentioning Paris (tests memory)
    const response2 = await sendMessage(
      "What activities would you recommend there?",
      2
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Message 3: Another follow-up (tests longer context)
    const response3 = await sendMessage(
      "Now plan a 3-day budget trip for $1000",
      3
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 MEMORY TEST RESULTS:');
    console.log('='.repeat(80));
    
    // Check if responses show context awareness
    const parisInResponse2 = response2.toLowerCase().includes('paris');
    const parisInResponse3 = response3.toLowerCase().includes('paris');
    const hasItinerary = response3.toLowerCase().includes('day 1') || 
                         response3.toLowerCase().includes('budget');
    
    console.log(`\n✓ Message 1: Asked about Paris - ${response1.length} chars`);
    console.log(`✓ Message 2: Context check - ${parisInResponse2 ? '✅ PASSED' : '❌ FAILED'} (mentions Paris: ${parisInResponse2})`);
    console.log(`✓ Message 3: Context check - ${parisInResponse3 ? '✅ PASSED' : '❌ FAILED'} (mentions Paris: ${parisInResponse3})`);
    console.log(`✓ Message 3: Itinerary check - ${hasItinerary ? '✅ PASSED' : '❌ FAILED'} (has itinerary: ${hasItinerary})`);
    
    if (parisInResponse2 && parisInResponse3 && hasItinerary) {
      console.log('\n🎉 MEMORY IS WORKING! The agent remembers context across messages.');
    } else {
      console.log('\n⚠️  Memory may not be fully working. Check the responses above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
})();

