#!/bin/bash

# Run City Information Assistant Streamlit UI

echo "🏙️  Starting City Information Assistant Streamlit UI..."
echo ""
echo "Make sure Mastra server is running on port 4111!"
echo "If not, run: npm run dev"
echo ""
echo "═══════════════════════════════════════════════════════════"

cd "$(dirname "$0")"
source streamlit-venv/bin/activate
streamlit run streamlit_app.py --server.port 8501 --server.headless true

