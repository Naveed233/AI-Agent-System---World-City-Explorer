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
    .main {
        padding: 2rem;
    }
    .stTextInput > div > div > input {
        font-size: 16px;
    }
    .chat-message {
        padding: 1.5rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
    }
    .user-message {
        background-color: #e3f2fd;
        margin-left: 20%;
    }
    .assistant-message {
        background-color: #f5f5f5;
        margin-right: 20%;
    }
    .message-content {
        margin: 0;
        font-size: 16px;
        line-height: 1.6;
    }
    .message-time {
        font-size: 12px;
        color: #666;
        margin-top: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []
if "thread_id" not in st.session_state:
    st.session_state.thread_id = f"streamlit-{datetime.now().strftime('%Y%m%d%H%M%S')}"

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
        
        # Show thinking indicator
        with st.spinner("🤔 Thinking..."):
            try:
                # Prepare messages for API
                messages = [{"role": msg["role"], "content": msg["content"]} 
                           for msg in st.session_state.messages]
                
                # Call Mastra API
                response = requests.post(
                    f"{MASTRA_API_URL}/agents/{AGENT_NAME}/generate",
                    json={
                        "messages": messages,
                        "threadId": st.session_state.thread_id
                    },
                    timeout=60
                )
                
                if response.status_code == 200:
                    data = response.json()
                    assistant_message = data.get("text", "I apologize, but I couldn't generate a response.")
                    
                    # Add assistant message
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": assistant_message,
                        "timestamp": timestamp
                    })
                else:
                    error_msg = f"API Error: {response.status_code} - {response.text}"
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
                    "content": "⚠️ Connection failed. Please start the Mastra server:\n\n```\ncd /home/maqbool/City-Information-Assistant\nnpm run dev\n```",
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

