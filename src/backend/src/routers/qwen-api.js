/*
 * Copyright (C) 2024-present Puter Technologies Inc.
 *
 * This file is part of Puter.
 *
 * Puter is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const express = require('express');
const { Endpoint } = require('../expressutil.js');

/**
 * Public Qwen 3 AI API endpoint - No authentication required
 * Allows direct integration with WormGPT website
 * Railway-ready deployment configuration
 */
const router = express.Router();

// CORS middleware for direct browser integration
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if ( req.method === 'OPTIONS' ) {
        return res.sendStatus(200);
    }
    next();
});

Endpoint({
    path: '/models',
    methods: ['GET'],
    handler: async (req, res) => {
        try {
            // Return list of available Qwen models via OpenRouter
            res.json({
                success: true,
                models: [
                    {
                        id: 'qwen/qwen-3-4b:free',
                        name: 'Qwen 3 4B (Free)',
                        description: 'Free tier for general chat',
                        context_length: 32768,
                        recommended_for: ['general_chat', 'casual_conversation'],
                    },
                    {
                        id: 'qwen/qwen-3-235b-a22b-instruct-128k',
                        name: 'Qwen 3 235B A22B Instruct',
                        description: 'Advanced conversations with 128K context',
                        context_length: 131072,
                        recommended_for: ['advanced_chat', 'long_context'],
                    },
                    {
                        id: 'qwen/qwen-3-coder-480b-a35b-instruct',
                        name: 'Qwen 3 Coder 480B',
                        description: 'Code generation and programming tasks',
                        context_length: 256000,
                        recommended_for: ['coding', 'programming', 'code_review'],
                    },
                    {
                        id: 'qwen/qwen-3-max-thinking',
                        name: 'Qwen 3 Max Thinking',
                        description: 'Complex reasoning and problem solving',
                        context_length: 65536,
                        recommended_for: ['reasoning', 'math', 'science'],
                    },
                    {
                        id: 'qwen/qwen-3-vl-235b-a22b-instruct',
                        name: 'Qwen 3 Vision 235B',
                        description: 'Image analysis and visual understanding',
                        context_length: 131072,
                        recommended_for: ['image_analysis', 'visual_qa', 'ocr'],
                    },
                    {
                        id: 'qwen/qwen-3-30b-a3b-instruct',
                        name: 'Qwen 3 30B A3B Instruct',
                        description: 'Balanced performance for general tasks',
                        context_length: 131072,
                        recommended_for: ['general_chat', 'writing', 'analysis'],
                    },
                    {
                        id: 'qwen/qwen-3-32b-instruct',
                        name: 'Qwen 3 32B Instruct',
                        description: 'Efficient instruction following',
                        context_length: 131072,
                        recommended_for: ['instruction_following', 'tasks'],
                    },
                ],
                default_model: 'qwen/qwen-3-4b:free',
                api_version: '1.0.0',
            });
        } catch ( error ) {
            console.error('Error fetching models:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch models',
                code: 'MODELS_FETCH_ERROR',
            });
        }
    },
}).attach(router);

Endpoint({
    path: '/chat',
    methods: ['POST'],
    handler: async (req, res) => {
        try {
            const {
                message,
                messages,
                model = 'qwen/qwen-3-4b:free',
                stream = false,
                image,
                temperature = 0.7,
                max_tokens,
                system_prompt,
            } = req.body;

            // Validate input
            if ( !message && !messages ) {
                return res.status(400).json({
                    success: false,
                    error: 'Message or messages array is required',
                    code: 'MISSING_MESSAGE',
                });
            }

            // Get services from app
            const services = req.app.get('services');
            if ( ! services ) {
                return res.status(500).json({
                    success: false,
                    error: 'Services not available',
                    code: 'SERVICES_UNAVAILABLE',
                });
            }

            const aiChatService = services.get('ai-chat');
            if ( ! aiChatService ) {
                return res.status(500).json({
                    success: false,
                    error: 'AI chat service not initialized',
                    code: 'CHAT_SERVICE_UNAVAILABLE',
                });
            }

            // Build messages array
            let chatMessages = messages || [];

            // Add system prompt if provided
            if ( system_prompt ) {
                chatMessages = [
                    { role: 'system', content: system_prompt },
                    ...chatMessages,
                ];
            }

            // Add single message if provided
            if ( message ) {
                chatMessages.push({ role: 'user', content: message });
            }

            // Handle image if provided (for vision models)
            if ( image ) {
                const lastMessage = chatMessages[chatMessages.length - 1];
                if ( lastMessage && lastMessage.role === 'user' ) {
                    lastMessage.content = [
                        { type: 'text', text: lastMessage.content },
                        { type: 'image_url', image_url: { url: image } },
                    ];
                }
            }

            // Build the request to Qwen
            const chatOptions = {
                model: model,
                messages: chatMessages,
                stream: stream,
                temperature: temperature,
            };

            if ( max_tokens ) {
                chatOptions.max_tokens = max_tokens;
            }

            // Handle streaming response
            if ( stream ) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('X-Accel-Buffering', 'no');

                const streamResult = await aiChatService.complete(chatOptions);

                if ( streamResult && streamResult.stream ) {
                    streamResult.stream.pipe(res);
                } else {
                    res.write(`${JSON.stringify({
                        success: true,
                        model: model,
                        response: streamResult?.message?.content || '',
                        timestamp: new Date().toISOString(),
                    }) }\n`);
                    res.end();
                }
                return;
            }

            // Make the AI chat request
            const response = await aiChatService.complete(chatOptions);

            // Return the response
            res.json({
                success: true,
                model: model,
                response: response?.message?.content || response,
                usage: response?.usage,
                timestamp: new Date().toISOString(),
            });

        } catch ( error ) {
            console.error('Qwen Chat API Error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to process request',
                code: 'AI_PROCESSING_ERROR',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            });
        }
    },
}).attach(router);

Endpoint({
    path: '/health',
    methods: ['GET'],
    handler: async (req, res) => {
        res.json({
            success: true,
            status: 'healthy',
            service: 'WormGPT Qwen API',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        });
    },
}).attach(router);

module.exports = router;
