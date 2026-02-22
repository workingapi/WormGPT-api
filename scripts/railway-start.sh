#!/bin/sh
# WormGPT Railway Startup Script - Standalone Server
# FREE TIER - NO API KEY REQUIRED

echo "🚀 Starting WormGPT Qwen API - FREE TIER..."
echo "✨ No API key required - using free qwen/qwen-3-4b:free model"

# Set defaults
export PORT=${PORT:-8080}
export NODE_ENV=${NODE_ENV:-production}

# Display configuration
echo "⚙️  Configuration:"
echo "   PORT: $PORT"
echo "   NODE_ENV: $NODE_ENV"
echo "   Model: qwen/qwen-3-4b:free (FREE)"
echo "   API Key Required: NO"
echo "   OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:+***CONFIGURED***}"
echo ""
echo "📊 Free Tier:"
echo "   - 100% FREE qwen/qwen-3-4b:free model"
echo "   - No API key required"
echo "   - 100 requests/minute"
echo ""

# Start the standalone server
echo "🌟 Starting WormGPT server..."
node server.js
