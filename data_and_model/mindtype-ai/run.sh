#!/bin/bash
# MindType AI — Start full stack
# Usage: bash run.sh

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔══════════════════════════════════════════╗"
echo "║         MindType AI — Full Stack          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌ Python3 not found"; exit 1
fi

# Install deps
echo "📦 Installing dependencies..."
pip install -r "$ROOT/requirements.txt" --break-system-packages -q

# Create data dir
mkdir -p "$ROOT/data"

# Start backend
echo ""
echo "🚀 Starting Backend API on http://localhost:8000"
cd "$ROOT"
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 3

# Start frontend
echo "🎨 Starting Frontend Dashboard on http://localhost:8501"
streamlit run frontend/app.py --server.port 8501 --server.address 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "✅ Both services running!"
echo "   Backend  → http://localhost:8000"
echo "   Frontend → http://localhost:8501"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services."

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" SIGINT SIGTERM

wait
