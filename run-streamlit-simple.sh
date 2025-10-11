#!/bin/bash

# Run City Information Assistant Streamlit UI (Simple Direct Integration)

echo "🏙️  Starting City Information Assistant Streamlit UI (Direct Integration)..."
echo ""
echo "This version uses Mastra SDK directly (no API needed)"
echo ""
echo "═══════════════════════════════════════════════════════════"

cd "$(dirname "$0")"
source streamlit-venv/bin/activate
streamlit run streamlit_simple.py --server.port 8502 --server.headless true

