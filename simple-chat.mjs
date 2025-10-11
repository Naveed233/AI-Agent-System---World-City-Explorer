#!/usr/bin/env node

/**
 * Simple Terminal Chat with City Information Assistant
 * Bypasses Mastra complexity and uses OpenAI directly
 */

import OpenAI from 'openai';
import * as readline from 'readline';
import { config } from 'dotenv';

// Load environment variables
config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `You are a helpful and knowledgeable City Information Assistant. Your role is to help users gather information about cities worldwide and plan their visits effectively.

You can provide:
- City facts (country, population, notable features)
- Weather information (use mock data: sunny, 22°C)
- Local time (use mock data based on timezone)
- Travel recommendations

Be friendly, helpful, and conversational. Use emojis sparingly (✈️ 🌤️ 🏙️ 🕐 📍).`;

const conversationHistory = [
  { role: 'system', content: systemPrompt }
];

async function chat(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for reliability
      messages: conversationHistory,
      temperature: 0.7,
      stream: true,
    });
    
    let fullResponse = '';
    process.stdout.write('\n🤖 Assistant: ');
    
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        process.stdout.write(content);
        fullResponse += content;
      }
    }
    
    process.stdout.write('\n\n');
    conversationHistory.push({ role: 'assistant', content: fullResponse });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function main() {
  console.log('\n🏙️  City Information Assistant - Terminal Chat\n');
  console.log('Ask me about any city! (Type "exit" to quit)\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = () => {
    rl.question('👤 You: ', async (input) => {
      const message = input.trim();
      
      if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
        console.log('\n✨ Goodbye! Happy traveling! 🌍✈️\n');
        rl.close();
        process.exit(0);
      }
      
      if (message) {
        await chat(message);
      }
      
      askQuestion();
    });
  };
  
  askQuestion();
}

main();

