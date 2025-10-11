"""
City Information Assistant - Streamlit Chat UI (Working Version with subprocess)
"""

import streamlit as st
import subprocess
import json
from datetime import datetime
import os

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
        st.markdown(f'<div class="user-msg">👤 **You:** {msg["content"]}</div>', unsafe_allow_html=True)
    else:
        st.markdown(f'<div class="assistant-msg">🤖 **Assistant:**\n\n{msg["content"]}</div>', unsafe_allow_html=True)

# Handle pending input from sidebar buttons
if hasattr(st.session_state, 'pending_input'):
    user_input = st.session_state.pending_input
    del st.session_state.pending_input
else:
    user_input = st.chat_input("Ask me anything about cities...")

def call_mastra_agent(prompt, thread_id):
    """Call Mastra agent using Node.js subprocess"""
    try:
        # Create a simple Node.js script to call the agent
        script = f"""
const {{ mastra }} = require('./src/mastra/index.ts');

async function run() {{
    const agent = mastra.getAgent('cityAssistantAgent');
    const result = await agent.generate(
        [{{ role: 'user', content: '{prompt.replace("'", "\\'")}' }}],
        {{ threadId: '{thread_id}' }}
    );
    console.log(JSON.stringify({{ text: result.text || result.toString() }}));
}}

run().catch(err => {{
    console.error(JSON.stringify({{ error: err.message }}));
    process.exit(1);
}});
"""
        
        # Write temporary script
        script_path = '/tmp/mastra_call.mjs'
        with open(script_path, 'w') as f:
            f.write(script)
        
        # Run with Node
        result = subprocess.run(
            ['node', '--loader', 'tsx', script_path],
            cwd='/home/maqbool/City-Information-Assistant',
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            try:
                data = json.loads(result.stdout)
                return data.get('text', 'No response generated')
            except json.JSONDecodeError:
                return result.stdout.strip() or "No response generated"
        else:
            return f"Error: {result.stderr}"
            
    except subprocess.TimeoutExpired:
        return "Request timed out. Please try again."
    except Exception as e:
        return f"Error calling agent: {str(e)}"

if user_input:
    # Add user message
    st.session_state.messages.append({
        "role": "user",
        "content": user_input
    })
    
    # Generate response
    with st.spinner("🤔 Thinking..."):
        response_text = call_mastra_agent(user_input, st.session_state.thread_id)
        
        # Add assistant response
        st.session_state.messages.append({
            "role": "assistant",
            "content": response_text
        })
    
    st.rerun()

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666; font-size: 14px;">
    🏙️ City Information Assistant | Mastra + AI SDK v5 | Built with Streamlit
</div>
""", unsafe_allow_html=True)

