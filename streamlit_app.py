"""
City Information Assistant - Streamlit Chat UI
"""

import streamlit as st
import requests
import json
from datetime import datetime

# Page config
st.set_page_config(
    page_title="City Information Assistant",
    page_icon="🏙️",
    layout="wide"
)

# Mastra API configuration
MASTRA_API_URL = "http://localhost:4111/api"
AGENT_NAME = "cityAssistantAgent"

# Custom CSS
st.markdown("""
<style>
    /* Dark background */
    .main {
        padding: 2rem;
        background-color: #1a1a1a;
    }
    
    /* Input styling */
    .stTextInput > div > div > input {
        font-size: 16px;
        background-color: #2d2d2d;
        color: #ffffff;
        border: none;
    }
    
    /* Remove borders, clean messages */
    .chat-message {
        padding: 1rem 0;
        margin-bottom: 1rem;
        border: none;
    }
    
    .user-message {
        margin-left: 10%;
    }
    
    .assistant-message {
        margin-right: 10%;
    }
    
    .message-content {
        margin: 0.5rem 0;
        font-size: 16px;
        line-height: 1.6;
        color: #e0e0e0;
    }
    
    .message-time {
        font-size: 11px;
        color: #888;
        margin-top: 0.3rem;
    }
    
    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background-color: #2d2d2d;
    }
    
    /* Button styling */
    .stButton > button {
        background-color: #3d3d3d;
        color: #ffffff;
        border: none;
    }
    
    .stButton > button:hover {
        background-color: #4d4d4d;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []
if "thread_id" not in st.session_state:
    st.session_state.thread_id = f"streamlit-{datetime.now().strftime('%Y%m%d%H%M%S')}"
if "resource_id" not in st.session_state:
    # Use a unique ID per browser session for memory isolation
    import uuid
    st.session_state.resource_id = f"user-{uuid.uuid4().hex[:8]}"

# Header
col1, col2 = st.columns([3, 1])
with col1:
    st.title("🏙️ City Information Assistant")
    st.markdown("Ask me about any city - weather, time, facts, and travel recommendations!")
with col2:
    st.markdown(f"**Thread ID:** `{st.session_state.thread_id[:12]}...`")

# Sidebar
with st.sidebar:
    st.header("ℹ️ About")
    st.markdown("""
    This AI assistant helps you:
    - 🌤️ Get current weather
    - 🕐 Check local time
    - 📍 Learn city facts
    - ✈️ Plan your visit
    - 🎯 Get activity recommendations
    """)
    
    st.markdown("---")
    st.header("🎮 Example Prompts")
    example_prompts = [
        "Tell me about Tokyo",
        "I want to visit Paris",
        "Recommend activities for London",
        "What time is it in New York?",
        "Compare Tokyo and Paris"
    ]
    
    for prompt in example_prompts:
        if st.button(prompt, key=f"example_{prompt}", use_container_width=True):
            st.session_state.user_input = prompt
    
    st.markdown("---")
    if st.button("🔄 Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.session_state.thread_id = f"streamlit-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        st.rerun()

# Display chat messages
chat_container = st.container()
with chat_container:
    for message in st.session_state.messages:
        role = message["role"]
        content = message["content"]
        timestamp = message.get("timestamp", "")
        
        if role == "user":
            st.markdown(f"""
            <div class="chat-message user-message">
                <div><strong>👤 You</strong></div>
                <p class="message-content">{content}</p>
                <div class="message-time">{timestamp}</div>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div class="chat-message assistant-message">
                <div><strong>🤖 Assistant</strong></div>
                <p class="message-content">{content}</p>
                <div class="message-time">{timestamp}</div>
            </div>
            """, unsafe_allow_html=True)

# Chat input
st.markdown("---")
user_input = st.text_input(
    "Ask me anything about cities:",
    placeholder="e.g., Tell me about Tokyo, What's the weather in Paris?",
    key="chat_input",
    label_visibility="collapsed"
)

# Handle user input
if user_input or (hasattr(st.session_state, 'user_input') and st.session_state.user_input):
    if hasattr(st.session_state, 'user_input'):
        user_input = st.session_state.user_input
        del st.session_state.user_input
    
    if user_input:
        # Add user message
        timestamp = datetime.now().strftime("%H:%M:%S")
        st.session_state.messages.append({
            "role": "user",
            "content": user_input,
            "timestamp": timestamp
        })
        
        # Create placeholder for streaming
        with st.spinner("🤔 Thinking..."):
            try:
                # Prepare FULL conversation history for API (for context/memory)
                api_messages = []
                for msg in st.session_state.messages:
                    api_messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
                
                # Call Mastra API with streaming (with resourceId for memory)
                response = requests.post(
                    f"{MASTRA_API_URL}/agents/{AGENT_NAME}/stream",
                    json={
                        "messages": api_messages,  # Full history for context!
                        "threadId": st.session_state.thread_id,
                        "resourceId": st.session_state.resource_id  # Required for Memory
                    },
                    stream=True,
                    timeout=120
                )
                
                if response.status_code == 200:
                    # Create container for streaming response
                    response_placeholder = st.empty()
                    full_response = ""
                    
                    # Stream the response
                    for line in response.iter_lines():
                        if line:
                            line_text = line.decode('utf-8')
                            # Parse SSE format
                            if line_text.startswith('data: '):
                                try:
                                    data = json.loads(line_text[6:])
                                    if 'text' in data:
                                        full_response = data['text']
                                        response_placeholder.markdown(full_response)
                                except json.JSONDecodeError:
                                    continue
                    
                    # If streaming didn't work, try regular generate
                    if not full_response:
                        response = requests.post(
                            f"{MASTRA_API_URL}/agents/{AGENT_NAME}/generate",
                            json={
                                "messages": api_messages,
                                "threadId": st.session_state.thread_id
                            },
                            timeout=60
                        )
                        if response.status_code == 200:
                            data = response.json()
                            full_response = data.get("text", "I apologize, but I couldn't generate a response.")
                        else:
                            full_response = "I'm having trouble responding. The API returned an error."
                    
                    # Add assistant message
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": full_response,
                        "timestamp": timestamp
                    })
                    response_placeholder.empty()
                    
                else:
                    error_msg = f"API Error: {response.status_code}"
                    st.error(error_msg)
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": "I'm having trouble connecting. Please make sure the Mastra server is running on port 4111.",
                        "timestamp": datetime.now().strftime("%H:%M:%S")
                    })
            
            except requests.exceptions.ConnectionError:
                st.error("❌ Cannot connect to Mastra server. Make sure it's running: `npm run dev`")
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": "⚠️ Connection failed. Please start the Mastra server with: npm run dev",
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
            
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": f"An error occurred: {str(e)}",
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
        
        # Rerun to show new messages
        st.rerun()

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666; font-size: 14px;">
    🏙️ City Information Assistant | Powered by Mastra & AI SDK v5 | Built with Streamlit
</div>
""", unsafe_allow_html=True)

