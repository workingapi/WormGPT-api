const express = require('express');
const cors = require('cors');
const { puter } = require('@heyputer/puter.js');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for easy integration
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve auth page
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// All supported Qwen models
const QWEN_MODELS = [
    { id: 'qwen/qwen3-max-thinking', name: 'Qwen3 Max Thinking', type: 'chat', context: '256K' },
    { id: 'qwen/qwen3-coder-next', name: 'Qwen3 Coder Next', type: 'code', context: '128K' },
    { id: 'qwen/qwen3-next-80b-a3b-instruct', name: 'Qwen3 Next 80B Instruct', type: 'chat', context: '128K' },
    { id: 'qwen/qwen3-next-80b-a3b-thinking', name: 'Qwen3 Next 80B Thinking', type: 'chat', context: '128K' },
    { id: 'qwen/qwen-plus-2025-07-28', name: 'Qwen Plus', type: 'chat', context: '128K' },
    { id: 'qwen/qwen-plus-2025-07-28:thinking', name: 'Qwen Plus Thinking', type: 'chat', context: '128K' },
    { id: 'qwen/qwen3-235b-a22b-2507', name: 'Qwen3 235B', type: 'chat', context: '256K' },
    { id: 'qwen/qwen3-235b-a22b-thinking-2507', name: 'Qwen3 235B Thinking', type: 'chat', context: '256K' },
    { id: 'qwen/qwen3-30b-a3b-instruct-2507', name: 'Qwen3 30B Instruct', type: 'chat', context: '128K' },
    { id: 'qwen/qwen3-30b-a3b-thinking-2507', name: 'Qwen3 30B Thinking', type: 'chat', context: '128K' },
    { id: 'qwen/qwen3-coder', name: 'Qwen3 Coder', type: 'code', context: '128K' },
    { id: 'qwen/qwen3-coder-30b-a3b-instruct', name: 'Qwen3 Coder 30B', type: 'code', context: '128K' },
    { id: 'qwen/qwen3-coder-flash', name: 'Qwen3 Coder Flash', type: 'code', context: '128K' },
    { id: 'qwen/qwen3-coder-plus', name: 'Qwen3 Coder Plus', type: 'code', context: '128K' },
    { id: 'qwen/qwen3-vl-8b-instruct', name: 'Qwen3 VL 8B', type: 'vision', context: '128K' },
    { id: 'qwen/qwen3-vl-235b-a22b-instruct', name: 'Qwen3 VL 235B', type: 'vision', context: '256K' },
    { id: 'qwen/qwen3-vl-30b-a3b-instruct', name: 'Qwen3 VL 30B', type: 'vision', context: '128K' },
    { id: 'qwen/qwen3.5-coder', name: 'Qwen3.5 Coder', type: 'code', context: '256K' },
    { id: 'qwen/qwen3.5-coder:thinking', name: 'Qwen3.5 Coder Thinking', type: 'code', context: '256K' },
    { id: 'qwen/qwen3.5-instruct', name: 'Qwen3.5 Instruct', type: 'chat', context: '256K' },
    { id: 'qwen/qwen3.5-instruct:thinking', name: 'Qwen3.5 Instruct Thinking', type: 'chat', context: '256K' },
    { id: 'qwen/qwen3.5-vl', name: 'Qwen3.5 VL', type: 'vision', context: '256K' },
    { id: 'qwen/qwen-turbo', name: 'Qwen Turbo', type: 'chat', context: '128K' },
    { id: 'qwen/qwen-max', name: 'Qwen Max', type: 'chat', context: '256K' },
    { id: 'qwen/qwen-long-context', name: 'Qwen Long Context', type: 'chat', context: '1M' }
];

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'WormGPT Qwen API',
        version: '1.0.0',
        models: QWEN_MODELS.length,
        uptime: process.uptime()
    });
});

// Get all available models
app.get('/api/models', (req, res) => {
    res.json({
        success: true,
        count: QWEN_MODELS.length,
        models: QWEN_MODELS
    });
});

// Chat completion endpoint (OpenAI-compatible)
app.post('/v1/chat/completions', async (req, res) => {
    try {
        const { model = 'qwen/qwen3-next-80b-a3b-instruct', messages, stream = false, temperature, max_tokens } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'messages array is required',
                    type: 'invalid_request_error'
                }
            });
        }

        // Convert messages to format expected by Puter
        const conversation = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const lastMessage = conversation[conversation.length - 1]?.content;

        const options = { model };
        if (temperature !== undefined) options.temperature = temperature;
        if (max_tokens !== undefined) options.max_tokens = max_tokens;
        if (stream) options.stream = true;

        const startTime = Date.now();
        const response = await puter.ai.chat(lastMessage, options);
        const responseTime = Date.now() - startTime;

        // Handle streaming
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const content = typeof response === 'string' ? response : 
                           response.message?.content || 
                           response.content || 
                           response.text || 
                           JSON.stringify(response);

            const chunks = content.split(/(?=\s+)/);
            for (const chunk of chunks) {
                if (chunk.trim()) {
                    res.write(`data: ${JSON.stringify({
                        id: `chatcmpl-wormgpt-${Date.now()}`,
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: model,
                        choices: [{
                            index: 0,
                            delta: { content: chunk },
                            finish_reason: null
                        }]
                    })}\n\n`);
                }
            }

            res.write(`data: ${JSON.stringify({
                id: `chatcmpl-wormgpt-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model,
                choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: 'stop'
                }]
            })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
            return;
        }

        // Handle non-streaming response
        const content = typeof response === 'string' ? response : 
                       response.message?.content || 
                       response.content || 
                       response.text || 
                       JSON.stringify(response);

        res.json({
            id: `chatcmpl-wormgpt-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content: content
                },
                finish_reason: 'stop'
            }],
            usage: {
                prompt_tokens: conversation.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 4), 0),
                completion_tokens: Math.ceil(content.length / 4),
                total_tokens: Math.ceil((conversation.reduce((acc, msg) => acc + msg.content.length, 0) + content.length) / 4)
            },
            response_time: responseTime
        });

    } catch (error) {
        console.error('Chat completion error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Internal server error',
                type: 'api_error'
            }
        });
    }
});

// Simple chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, model = 'qwen/qwen3-next-80b-a3b-instruct', stream = false } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'prompt is required'
            });
        }

        const options = { model };
        if (stream) options.stream = true;

        const startTime = Date.now();
        const response = await puter.ai.chat(prompt, options);
        const responseTime = Date.now() - startTime;

        // Handle streaming
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const content = typeof response === 'string' ? response : 
                           response.message?.content || 
                           response.content || 
                           response.text || 
                           JSON.stringify(response);

            const chunks = content.split(/(?=\s+)/);
            for (const chunk of chunks) {
                if (chunk.trim()) {
                    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();
            return;
        }

        // Handle non-streaming response
        const content = typeof response === 'string' ? response : 
                       response.message?.content || 
                       response.content || 
                       response.text || 
                       JSON.stringify(response);

        res.json({
            success: true,
            response: content,
            model: model,
            response_time: responseTime
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Image analysis endpoint
app.post('/api/vision', async (req, res) => {
    try {
        const { prompt, image_url, model = 'qwen/qwen3-vl-8b-instruct' } = req.body;

        if (!prompt || !image_url) {
            return res.status(400).json({
                success: false,
                error: 'prompt and image_url are required'
            });
        }

        const response = await puter.ai.chat(prompt, image_url, { model });

        const content = typeof response === 'string' ? response : 
                       response.message?.content || 
                       response.content || 
                       response.text || 
                       JSON.stringify(response);

        res.json({
            success: true,
            response: content,
            model: model
        });

    } catch (error) {
        console.error('Vision error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Code generation endpoint
app.post('/api/code', async (req, res) => {
    try {
        const { prompt, model = 'qwen/qwen3-coder-next', language } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'prompt is required'
            });
        }

        const enhancedPrompt = language 
            ? `Write ${language} code for: ${prompt}`
            : prompt;

        const response = await puter.ai.chat(enhancedPrompt, { model });

        const content = typeof response === 'string' ? response : 
                       response.message?.content || 
                       response.content || 
                       response.text || 
                       JSON.stringify(response);

        res.json({
            success: true,
            code: content,
            model: model,
            language: language || 'auto-detected'
        });

    } catch (error) {
        console.error('Code generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
            type: 'internal_error'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Endpoint not found',
            type: 'not_found_error'
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🐛 WormGPT Qwen API Server                              ║
║                                                           ║
║   Server running on port ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'production'}                             ║
║   Models available: ${QWEN_MODELS.length}                                   ║
║                                                           ║
║   Endpoints:                                              ║
║   GET  /                    - Health check                ║
║   GET  /api/models          - List all models             ║
║   POST /v1/chat/completions - OpenAI-compatible chat      ║
║   POST /api/chat            - Simple chat                 ║
║   POST /api/vision          - Image analysis              ║
║   POST /api/code            - Code generation             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
