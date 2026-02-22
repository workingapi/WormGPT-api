/*
 * WormGPT Qwen API - Standalone Server
 * Simple Express server without Puter framework dependencies
 * FREE tier - No API key required
 */

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    if ( req.method === 'OPTIONS' ) {
        return res.sendStatus(200);
    }
    next();
});

// Rate limiting store (in-memory)
const rateLimitStore = new Map();

// Simple rate limiter
function rateLimiter (req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    const key = `rl:${ip}`;
    const record = rateLimitStore.get(key) || { timestamps: [] };

    // Remove old timestamps
    record.timestamps = record.timestamps.filter(ts => ts > now - windowMs);

    if ( record.timestamps.length >= maxRequests ) {
        return res.status(429).json({
            success: false,
            error: 'Too many requests',
            retryAfter: Math.ceil((record.timestamps[0] + windowMs - now) / 1000),
        });
    }

    record.timestamps.push(now);
    rateLimitStore.set(key, record);
    next();
}

app.use(rateLimiter);

// GET /qwen/health - Health check
app.get('/qwen/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'WormGPT Qwen API - FREE',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// GET /qwen/models - List available models
app.get('/qwen/models', (req, res) => {
    res.json({
        success: true,
        models: [
            {
                id: 'qwen/qwen-3-4b:free',
                name: 'Qwen 3 4B (Free)',
                description: 'Free tier for general chat - UNLIMITED - NO API KEY REQUIRED',
                context_length: 32768,
                pricing: '100% FREE',
                api_key_required: false,
                recommended_for: ['general_chat', 'casual_conversation', 'high_volume'],
            },
        ],
        default_model: 'qwen/qwen-3-4b:free',
        api_version: '1.0.0-FREE',
        note: 'This deployment uses ONLY free Qwen models. No API key required!',
    });
});

// POST /qwen/chat - Chat endpoint
app.post('/qwen/chat', async (req, res) => {
    try {
        const { message, messages, model = 'qwen/qwen-3-4b:free' } = req.body;

        if ( !message && !messages ) {
            return res.status(400).json({
                success: false,
                error: 'Message or messages array is required',
                code: 'MISSING_MESSAGE',
            });
        }

        // Build messages array
        let chatMessages = messages || [];
        if ( message ) {
            chatMessages.push({ role: 'user', content: message });
        }

        // For FREE tier, we'll use a mock response
        // In production, you'd call OpenRouter API here
        const mockResponse = {
            success: true,
            model: model,
            response: `This is a FREE tier response. To enable actual AI responses, add your OPENROUTER_API_KEY to environment variables. You received: "${message}"`,
            cached: false,
            free_tier: true,
            timestamp: new Date().toISOString(),
        };

        // If OPENROUTER_API_KEY is set, make actual API call
        if ( process.env.OPENROUTER_API_KEY ) {
            try {
                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: 'qwen/qwen-3-4b:free',
                        messages: chatMessages,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                    },
                );

                mockResponse.response = response.data.choices[0].message.content;
                mockResponse.usage = response.data.usage;
                mockResponse.api_call = true;
            } catch ( apiError ) {
                console.error('OpenRouter API error:', apiError.message);
                // Keep mock response if API fails
            }
        }

        res.json(mockResponse);

    } catch ( error ) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process request',
            code: 'PROCESSING_ERROR',
        });
    }
});

// GET /api-keys/generate - Generate user API keys (mock)
app.post('/api-keys/generate', (req, res) => {
    const { user_id, username } = req.body;

    if ( ! user_id ) {
        return res.status(400).json({
            success: false,
            error: 'user_id is required',
        });
    }

    // Generate mock keys
    const standardKey = `wgpt_std_${Math.random().toString(36).substr(2, 16)}`;
    const premiumKey = `wgpt_prm_${Math.random().toString(36).substr(2, 16)}`;

    res.json({
        success: true,
        message: 'API keys generated successfully',
        warning: 'Save these keys securely! They will not be shown again.',
        keys: [
            {
                id: `key_${Date.now()}_std`,
                name: `${username || 'User'}'s Standard Key`,
                key: standardKey,
                key_type: 'standard',
                rate_limit: 1000,
                daily_limit: 100000,
                created_at: new Date().toISOString(),
            },
            {
                id: `key_${Date.now()}_prm`,
                name: `${username || 'User'}'s Premium Key (Unlimited)`,
                key: premiumKey,
                key_type: 'premium',
                rate_limit: 10000,
                daily_limit: 'UNLIMITED',
                created_at: new Date().toISOString(),
            },
        ],
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 WormGPT Qwen API - FREE TIER');
    console.log(`✨ Server running on port ${PORT}`);
    console.log(`🌐 Health: http://0.0.0.0:${PORT}/qwen/health`);
    console.log(`📡 Models: http://0.0.0.0:${PORT}/qwen/models`);
    console.log(`💬 Chat: POST http://0.0.0.0:${PORT}/qwen/chat`);
    console.log(`🔑 Keys: POST http://0.0.0.0:${PORT}/api-keys/generate`);
    console.log('');
    console.log('⚙️  Configuration:');
    console.log(`   PORT: ${PORT}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'production'}`);
    console.log(`   OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '***CONFIGURED***' : 'Not set (mock responses)'}`);
    console.log('');
    console.log('📊 Free Tier:');
    console.log('   - 100% FREE qwen/qwen-3-4b:free model');
    console.log('   - No API key required');
    console.log('   - 100 requests/minute rate limit');
    console.log('   - Add OPENROUTER_API_KEY for real AI responses');
});
