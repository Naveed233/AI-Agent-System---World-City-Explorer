// Quick test of city assistant agent
import { mastra } from './src/mastra/index.ts';

async function test() {
    console.log('Testing City Assistant Agent...\n');
    
    const agent = mastra.getAgent('cityAssistantAgent');
    
    if (!agent) {
        console.error('Agent not found!');
        process.exit(1);
    }
    
    console.log('Agent found:', agent.name);
    
    try {
        console.log('\nGenerating response to: "Hello"...\n');
        
        const result = await agent.generate(
            [{ role: 'user', content: 'Hello' }],
            { threadId: 'test-123' }
        );
        
        console.log('Response:', result.text || JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();

