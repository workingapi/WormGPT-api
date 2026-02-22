#!/bin/sh
# WormGPT Railway Startup Script (Alpine-compatible)

echo "🚀 Starting WormGPT Qwen API..."

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
    "captcha": {
        "enabled": false
    },
    "disable_temp_users": false,
    "allow_anonymous_api_access": true,
    "api_allow_no_auth": true,
    "domain": "0.0.0.0",
    "protocol": "http"
}
EOF
fi

# Display configuration
echo "⚙️  Configuration:"
echo "   PORT: $PORT"
echo "   NODE_ENV: $NODE_ENV"
echo "   OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:+***CONFIGURED***}"
echo "   OPENROUTER_API_KEYS: ${OPENROUTER_API_KEYS:+***CONFIGURED***}"
echo "   REDIS_URL: ${REDIS_URL:+***CONFIGURED***}"

# Start the application
echo "🌟 Starting Puter server..."
npm start
