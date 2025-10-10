# 🚀 Quick Start Guide

Get your City Information Assistant up and running in 5 minutes!

## Step 1: Clone & Install

```bash
git clone <your-repo-url>
cd City-Information-Assistant
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```bash
OPENAI_API_KEY=sk-your-key-here
```

> **Note**: The other API keys are optional. The app will use fallback data if they're not set.

## Step 3: Run the Application

```bash
npm run dev
```

Wait for the server to start, then open: **http://localhost:3456**

## Step 4: Try It Out!

In the Mastra playground, try these example prompts:

### Example 1: City Information
```
Tell me about Tokyo
```

### Example 2: Plan a Visit
```
I want to visit Paris. Give me a complete overview.
```

### Example 3: Get Recommendations
```
What activities would you recommend for London right now?
```

### Example 4: Follow-up Questions
```
Tell me about New York

[Then ask:]
What about the weather there?

[Then ask:]
Recommend some activities
```

## 🎮 Playground Features

The Mastra playground provides:
- 💬 **Interactive Chat**: Real-time conversation
- 🔧 **Tool Visibility**: See which tools are being called
- 📊 **Execution Logs**: Debug tool execution
- 🧠 **Memory Inspector**: View conversation history
- ⚡ **Streaming**: Watch responses generate in real-time

## 🧪 Run Tests

```bash
npm test
```

This will run the automated test suite that demonstrates:
- City information retrieval
- Multi-turn conversations
- Tool orchestration
- Memory persistence

## 📚 Next Steps

- Read **README.md** for detailed documentation
- Check **DEPLOYMENT.md** for production deployment
- Review **PROJECT_SUMMARY.md** for assignment details

## 🆘 Troubleshooting

### "Agent not found" error
- Make sure you ran `npm install`
- Check that all files in `src/mastra/` are present

### API errors
- Verify your `OPENAI_API_KEY` is correct
- Check that your OpenAI account has credits
- The app will use mock data if other API keys aren't set

### Port already in use
- Kill the process using port 3456
- Or set a custom port: `PORT=3457 npm run dev`

## 💡 Pro Tips

1. **Use streaming**: Watch the agent think and respond in real-time
2. **Check logs**: Monitor the console for detailed execution info
3. **Try follow-ups**: Test the memory system with related questions
4. **Explore tools**: See how different prompts trigger different tools

---

**Ready to explore cities worldwide? Start chatting!** 🌍✈️

