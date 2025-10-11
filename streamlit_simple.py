"""
City Information Assistant - Streamlit Chat UI (Simple Direct Integration)
"""

import streamlit as st
import sys
import os
from datetime import datetime

# Add project to path
sys.path.insert(0, '/home/maqbool/City-Information-Assistant')

# Page config
st.set_page_config(
    page_title="City Information Assistant",
    page_icon="🏙️",
    layout="wide"
)

# Custom CSS - Dark theme
st.markdown("""
<style>
    .main {
        padding: 2rem;
        background-color: #1a1a1a;
    }
    
    .stTextInput > div > div > input {
        font-size: 16px;
        background-color: #2d2d2d;
        color: #ffffff;
        border: none;
    }
    
    /* Clean messages without borders */
    .user-msg {
        padding: 1rem;
        margin: 0.5rem 0;
        margin-left: 10%;
        color: #a0cfff;
    }
    
    .assistant-msg {
        padding: 1rem;
        margin: 0.5rem 0;
        margin-right: 10%;
        color: #e0e0e0;
    }
    
    [data-testid="stSidebar"] {
        background-color: #2d2d2d;
    }
    
    .stButton > button {
        background-color: #3d3d3d;
        color: #ffffff;
        border: none;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []
if "thread_id" not in st.session_state:
    st.session_state.thread_id = f"streamlit-{datetime.now().strftime('%Y%m%d%H%M%S')}"
if "mastra_loaded" not in st.session_state:
    try:
        # Import Mastra
        from src.mastra.index import mastra
        st.session_state.mastra = mastra
        st.session_state.agent = mastra.getAgent('cityAssistantAgent')
        st.session_state.mastra_loaded = True
    except Exception as e:
        st.session_state.mastra_loaded = False
        st.session_state.error = str(e)

# Header
col1, col2 = st.columns([3, 1])
with col1:
    st.title("🏙️ City Information Assistant")
    st.markdown("Ask me about any city - weather, time, facts, and travel recommendations!")

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
    
    if st.button("Tell me about Tokyo", use_container_width=True):
        st.session_state.pending_input = "Tell me about Tokyo"
        st.rerun()
    
    if st.button("I want to visit Paris", use_container_width=True):
        st.session_state.pending_input = "I want to visit Paris"
        st.rerun()
    
    if st.button("Recommend activities for London", use_container_width=True):
        st.session_state.pending_input = "Recommend activities for London based on current conditions"
        st.rerun()
    
    if st.button("What time is it in New York?", use_container_width=True):
        st.session_state.pending_input = "What time is it in New York?"
        st.rerun()
    
    st.markdown("---")
    if st.button("🔄 Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.session_state.thread_id = f"streamlit-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        st.rerun()

# Display chat messages
for msg in st.session_state.messages:
    if msg["role"] == "user":
        st.markdown(f'<div class="user-msg">👤 You: {msg["content"]}</div>', unsafe_allow_html=True)
    else:
        st.markdown(f'<div class="assistant-msg">🤖 Assistant: {msg["content"]}</div>', unsafe_allow_html=True)

# Handle pending input from sidebar buttons
if hasattr(st.session_state, 'pending_input'):
    user_input = st.session_state.pending_input
    del st.session_state.pending_input
else:
    user_input = st.chat_input("Ask me anything about cities...")

if user_input:
    # Add user message
    st.session_state.messages.append({
        "role": "user",
        "content": user_input
    })
    
    # Check if Mastra is loaded
    if not st.session_state.mastra_loaded:
        st.error(f"❌ Could not load Mastra: {st.session_state.get('error', 'Unknown error')}")
        st.session_state.messages.append({
            "role": "assistant",
            "content": "Sorry, I'm having trouble connecting to the AI backend. Please make sure the Mastra server is configured correctly."
        })
        st.rerun()
    
    # Generate response using Mastra agent directly
    with st.spinner("🤔 Thinking..."):
        try:
            agent = st.session_state.agent
            
            # Use agent.generate with streaming
            response_text = ""
            
            # Call agent synchronously
            result = agent.generate(
                messages=[{"role": "user", "content": user_input}],
                threadId=st.session_state.thread_id
            )
            
            response_text = result.text if hasattr(result, 'text') else str(result)
            
            # Add assistant response
            st.session_state.messages.append({
                "role": "assistant",
                "content": response_text
            })
            
        except Exception as e:
            error_msg = f"Error: {str(e)}"
            st.error(error_msg)
            st.session_state.messages.append({
                "role": "assistant",
                "content": f"I encountered an error: {error_msg}"
            })
    
    st.rerun()

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666; font-size: 14px;">
    🏙️ City Information Assistant | Direct Mastra Integration | Built with Streamlit
</div>
""", unsafe_allow_html=True)

