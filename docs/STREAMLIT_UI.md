# 🎨 Streamlit Chat UI for City Information Assistant

A beautiful, standalone Streamlit chat interface for the City Information Assistant.

## ✨ Features

- 💬 **Clean Chat Interface** - Beautiful, responsive chat UI
- 🎯 **Example Prompts** - Quick-start buttons in sidebar
- 🔄 **Real-time Streaming** - Live responses from the agent
- 🧵 **Thread Management** - Maintains conversation context
- 📱 **Mobile Friendly** - Works on all devices
- 🎨 **Modern Design** - Clean, professional interface

## 🚀 Quick Start

### 1. Make sure Mastra server is running:

```bash
# Terminal 1 - Start Mastra
npm run dev
```

Wait for: `Playground: http://localhost:4111/`

### 2. Start Streamlit UI:

```bash
# Terminal 2 - Start Streamlit
npm run streamlit
# OR
./run-streamlit.sh
# OR
source streamlit-venv/bin/activate && streamlit run streamlit_app.py
```

### 3. Open in browser:

```
http://localhost:8501
```

## 📋 Requirements

- Python 3.8+
- Mastra server running on port 4111
- Dependencies installed (done automatically)

## 🎮 How to Use

1. **Type your question** in the input box at the bottom
2. **Use example prompts** from the sidebar for quick starts
3. **See real-time responses** from the AI agent
4. **Clear chat** anytime with the button in sidebar

### Example Prompts:

- "Tell me about Tokyo"
- "I want to visit Paris"
- "Recommend activities for London"
- "What time is it in New York?"
- "Compare Tokyo and Paris"

## 🔧 How It Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Streamlit  │ ────→   │ Mastra API   │ ────→   │  AI Agent   │
│     UI      │         │ (Port 4111)  │         │  (GPT-4o)   │
└─────────────┘ ←────   └──────────────┘ ←────   └─────────────┘
  (Port 8501)              HTTP/JSON              Tool Calling
```

The Streamlit app sends messages to the Mastra API, which routes them to the City Information Assistant agent. The agent uses its tools (weather, time, facts, etc.) and returns responses.

## 🐛 Troubleshooting

### "Cannot connect to Mastra server"

**Solution**: Make sure Mastra is running:
```bash
npm run dev
```

### "Connection refused"

**Solution**: Check ports:
- Mastra should be on port 4111
- Streamlit should be on port 8501

```bash
# Check Mastra
curl http://localhost:4111/api/agents

# Check Streamlit
curl http://localhost:8501
```

### "Module not found"

**Solution**: Reinstall dependencies:
```bash
source streamlit-venv/bin/activate
pip install streamlit requests
```

## 🎨 Customization

### Change Port

Edit `run-streamlit.sh`:
```bash
streamlit run streamlit_app.py --server.port 8502
```

### Modify Styles

Edit the CSS in `streamlit_app.py`:
```python
st.markdown("""
<style>
    /* Your custom CSS here */
</style>
""", unsafe_allow_html=True)
```

### Add Features

The Streamlit app is in `streamlit_app.py` - feel free to customize:
- Add file upload for images
- Add voice input
- Add export chat feature
- Add user authentication

## 📦 File Structure

```
City-Information-Assistant/
├── streamlit_app.py          # Main Streamlit application
├── streamlit-venv/           # Python virtual environment
├── run-streamlit.sh          # Startup script
├── requirements.txt          # Python dependencies
└── STREAMLIT_UI.md          # This file
```

## 🚀 Deployment

### Deploy Streamlit App

```bash
# Install Streamlit Cloud CLI
pip install streamlit

# Deploy
streamlit deploy streamlit_app.py
```

### Environment Variables

For production, set:
```bash
MASTRA_API_URL=https://your-mastra-api.com/api
```

## 💡 Tips

1. **Keep both servers running** - Mastra on 4111, Streamlit on 8501
2. **Use example prompts** to get started quickly
3. **Clear chat** to start fresh conversations
4. **Check terminal** for debug info if issues occur

## 📚 Learn More

- **Streamlit Docs**: https://docs.streamlit.io/
- **Mastra Docs**: https://mastra.ai/docs
- **Project README**: See main README.md

---

**Enjoy chatting with your City Information Assistant!** 🏙️✨

