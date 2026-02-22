#!/bin/sh
# WormGPT Railway Startup Script (Alpine-compatible)
# FREE TIER - NO API KEY REQUIRED

echo "🚀 Starting WormGPT Qwen API - FREE TIER..."
echo "✨ No API key required - using free qwen/qwen-3-4b:free model"

# Set defaults if not provided
export PORT=${PORT:-4100}
export NODE_ENV=${NODE_ENV:-production}

# Create required directories
mkdir -p volatile/config
mkdir -p volatile/runtime

# Create default config if not exists
if [ ! -f volatile/config/config.json ]; then
    echo "📝 Creating default configuration..."
    cat > volatile/config/config.json << 'EOF'
{
    "$": "user-config",
    "config_name": "production",
    "title": "WormGPT Qwen API",
    "short_description": "FREE Qwen AI API - No API Key Required",
    "domain": "0.0.0.0",
    "protocol": "http",
    "pub_port": 8080,
    "http_port": 8080,
    "captcha": {
        "enabled": false
    },
    "disable_temp_users": false,
    "allow_anonymous_api_access": true,
    "api_allow_no_auth": true,
    "free_tier_only": true,
    "disable_fallback_mechanisms": false
}
EOF
fi

# Display configuration
echo "⚙️  Configuration:"
echo "   PORT: $PORT"
echo "   NODE_ENV: $NODE_ENV"
echo "   Model: qwen/qwen-3-4b:free (FREE)"
echo "   API Key Required: NO"
echo "   OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:+***OPTIONAL***}"
echo "   OPENROUTER_API_KEYS: ${OPENROUTER_API_KEYS:+***OPTIONAL***}"
echo "   REDIS_URL: ${REDIS_URL:+***CONFIGURED***}"
echo ""
echo "📊 Free Tier Limits:"
echo "   - Default: 100 req/min (no API key)"
echo "   - Premium: 1000 req/min (with user API key)"
echo "   - Get your FREE unlimited key: POST /api-keys/generate"
echo ""

# Start the application
echo "🌟 Starting Puter server..."
npm start
