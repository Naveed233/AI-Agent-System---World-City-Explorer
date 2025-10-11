# 🧠 Memory & Conversation Context Configuration

## Overview

The City Information Assistant now has **full conversation memory** enabled! The agent remembers previous messages in a conversation and can reference them naturally.

## How It Works

### Automatic Memory Management

Mastra automatically handles conversation memory through:

1. **LibSQLStore Backend**
   - All conversation history is stored in `mastra.db` (LibSQL database)
   - Persistent across server restarts
   - Efficient retrieval and storage

2. **ThreadID-Based Context**
   - Each conversation has a unique `threadId`
   - All messages with the same `threadId` share context
   - The agent can reference previous messages naturally

3. **No Manual Configuration Required**
   - Memory works automatically for both agents
   - Streamlit UI maintains `threadId` in session state
   - Mastra Playground generates `threadId` automatically

## Configuration Details

### Storage Configuration (`src/mastra/index.ts`)

```typescript
export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: "file:./mastra.db",  // Persistent local database
  }),
  // ... other config
});
```

The `LibSQLStore` automatically handles:
- ✅ Conversation history storage
- ✅ Message retrieval by `threadId`
- ✅ Context management
- ✅ Efficient querying

### Agent Configuration

Both agents (`cityAssistantAgent` and `weatherAgent`) automatically use the shared storage for memory. No additional configuration needed!

```typescript
export const cityAssistantAgent = new Agent({
  name: 'City Information Assistant',
  instructions: `
    ...
    ### Context Awareness:
    - Remember previous messages in the conversation
    - Handle follow-up questions naturally
    - Reference earlier context when relevant
    ...
  `,
  model: openai('gpt-4o', {
    apiKey: process.env.OPENAI_API_KEY,
  }),
  tools: { /* ... */ },
});
```

## Testing Memory

### Example Multi-Turn Conversation

**Message 1:**
```
User: "Tell me about Paris"
Agent: [Provides information about Paris]
```

**Message 2** (same thread):
```
User: "What's the weather like there?"
Agent: [Understands "there" means Paris from previous context]
```

**Message 3** (same thread):
```
User: "Plan a 3-day trip for $1000"
Agent: [Knows you're planning a Paris trip based on conversation history]
```

### Testing with curl

```bash
# Message 1
curl -X POST http://localhost:4111/api/agents/cityAssistantAgent/stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Tell me about Tokyo"}],
    "threadId": "my-conversation-123"
  }'

# Message 2 (same threadId - has context!)
curl -X POST http://localhost:4111/api/agents/cityAssistantAgent/stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What activities should I do there?"}],
    "threadId": "my-conversation-123"
  }'
```

## Streamlit UI Memory

The Streamlit UI (`streamlit_simple.py`) maintains memory automatically:

```python
# Initialize thread ID in session state
if 'thread_id' not in st.session_state:
    st.session_state.thread_id = f"streamlit-{int(time.time())}"

# Use same thread ID for all messages in the session
response = requests.post(
    f"{MASTRA_API_URL}/agents/{AGENT_NAME}/stream",
    json={
        "messages": api_messages,
        "threadId": st.session_state.thread_id  # Maintains context!
    },
    stream=True
)
```

## Memory Features

✅ **Context Retention**
- Remembers all previous messages in a conversation
- Works across multiple turns
- Maintains context even after pauses

✅ **Natural Follow-ups**
- "What about that?" → Agent knows what "that" refers to
- "Tell me more" → Agent provides additional details on the last topic
- "Plan a trip there" → Agent knows which city you mean

✅ **Persistent Storage**
- Conversations stored in local database
- Survives server restarts
- Can retrieve old conversations by `threadId`

✅ **Efficient Performance**
- Fast retrieval from LibSQL
- Optimized for concurrent users
- Minimal overhead

## Storage Location

All conversation data is stored in:
```
/home/maqbool/City-Information-Assistant/mastra.db
```

This is a local LibSQL database file that contains:
- Message history for all conversations
- Tool call results
- Agent responses
- Metadata and timestamps

## Managing Conversations

### Clear All History
```bash
# Delete the database to start fresh
rm /home/maqbool/City-Information-Assistant/mastra.db
```

### Inspect Conversations
```bash
# Install sqlite3 if needed
sqlite3 /home/maqbool/City-Information-Assistant/mastra.db

# View tables
.tables

# Query messages
SELECT * FROM messages LIMIT 10;
```

## Best Practices

1. **Use Consistent ThreadIDs**
   - Keep the same `threadId` for related messages
   - Generate new `threadId` for new conversations

2. **Context-Aware Queries**
   - Users can ask follow-up questions without repeating information
   - Agent will reference previous messages naturally

3. **Long Conversations**
   - Memory works for very long conversations
   - Context window limits still apply (model-dependent)
   - Very old messages may be summarized or truncated

4. **Multiple Users**
   - Each user should have unique `threadId`
   - Conversations are isolated by `threadId`
   - No cross-contamination between users

## Troubleshooting

### Memory Not Working?

1. **Check threadId is consistent**
   ```javascript
   // Bad: Different threadId each time
   { threadId: Date.now() }  // ❌
   
   // Good: Same threadId for conversation
   { threadId: "user-123-session-1" }  // ✅
   ```

2. **Verify storage is configured**
   ```typescript
   // Check mastra/index.ts has storage
   storage: new LibSQLStore({ url: "file:./mastra.db" })
   ```

3. **Check database file exists**
   ```bash
   ls -lh /home/maqbool/City-Information-Assistant/mastra.db
   ```

### Testing Memory

Use the provided test script:
```bash
node test-memory.mjs
```

This will:
- Send 3 related messages
- Verify context is maintained
- Check if agent references previous messages

## Summary

✅ **Memory is fully enabled and working!**

The agent now:
- Remembers conversation history
- Handles follow-up questions naturally
- References previous context
- Maintains persistent storage
- Works seamlessly across all interfaces (Playground, API, Streamlit)

**No additional setup required** - memory works automatically with `threadId`!

---

**Last Updated**: October 11, 2025  
**Status**: ✅ Fully Operational

