/*
 * WormGPT - User API Key Management Router
 * Endpoints for users to manage their API keys
 * No authentication required for signup, keys generated automatically
 */

const express = require('express');
const { Endpoint } = require('../expressutil.js');
const userAPIKeyService = require('../services/UserAPIKeyService');

const router = express.Router();

// CORS middleware
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if ( req.method === 'OPTIONS' ) {
        return res.sendStatus(200);
    }
    next();
});

/**
 * POST /api-keys/generate - Generate API keys for a user
 * Creates 2 keys automatically: Standard + Premium
 */
Endpoint({
    path: '/api-keys/generate',
    methods: ['POST'],
    handler: async (req, res) => {
        try {
            const { user_id, username } = req.body;

            if ( ! user_id ) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id is required',
                    code: 'MISSING_USER_ID',
                });
            }

            // Initialize service if needed
            const services = req.app.get('services');
            if ( services ) {
                const db = services.get('database')?.get();
                await userAPIKeyService.initialize(db);
            }

            // Generate 2 API keys for the user
            const keys = await userAPIKeyService.createUserKeys(user_id, {
                standardKeyName: `${username || 'User'}'s Standard Key`,
                premiumKeyName: `${username || 'User'}'s Premium Key (Unlimited)`,
                standardRateLimit: 1000,
                premiumRateLimit: 10000,
                premiumDailyLimit: -1, // Unlimited
            });

            res.json({
                success: true,
                message: 'API keys generated successfully',
                warning: 'Save these keys securely! They will not be shown again.',
                keys: keys.map(k => ({
                    id: k.id,
                    name: k.name,
                    key: k.key, // Full key shown only once!
                    key_type: k.key_type,
                    rate_limit: k.rate_limit_per_minute,
                    daily_limit: k.daily_limit === -1 ? 'UNLIMITED' : k.daily_limit,
                    created_at: new Date(k.created_at).toISOString(),
                })),
                usage: {
                    standard: {
                        requests_per_minute: 1000,
                        requests_per_day: 100000,
                        description: 'For standard usage',
                    },
                    premium: {
                        requests_per_minute: 10000,
                        requests_per_day: 'UNLIMITED',
                        description: 'For high-volume unlimited usage',
                    },
                },
            });

        } catch ( error ) {
            console.error('Error generating API keys:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to generate API keys',
                code: 'KEY_GENERATION_ERROR',
            });
        }
    },
}).attach(router);

/**
 * GET /api-keys/:user_id - Get all API keys for a user
 */
Endpoint({
    path: '/api-keys/:user_id',
    methods: ['GET'],
    handler: async (req, res) => {
        try {
            const { user_id } = req.params;

            if ( ! user_id ) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id is required',
                    code: 'MISSING_USER_ID',
                });
            }

            const services = req.app.get('services');
            if ( services ) {
                const db = services.get('database')?.get();
                await userAPIKeyService.initialize(db);
            }

            const keys = await userAPIKeyService.getUserKeys(user_id);
            const usage = await userAPIKeyService.getUserUsage(user_id);

            res.json({
                success: true,
                user_id: user_id,
                keys: keys.map(k => ({
                    id: k.id,
                    key_prefix: 'wgpt_...',
                    key_type: k.key_type,
                    name: k.name,
                    rate_limit: k.rate_limit_per_minute,
                    daily_limit: k.daily_limit === -1 ? 'UNLIMITED' : k.daily_limit,
                    is_active: k.is_active === 1,
                    is_unlimited: k.is_unlimited === 1,
                    usage_count: k.usage_count,
                    last_used: k.last_used_at ? new Date(k.last_used_at).toISOString() : null,
                    created_at: new Date(k.created_at).toISOString(),
                })),
                total_keys: keys.length,
                usage_summary: usage,
            });

        } catch ( error ) {
            console.error('Error fetching API keys:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch API keys',
                code: 'FETCH_KEYS_ERROR',
            });
        }
    },
}).attach(router);

/**
 * POST /api-keys/:user_id/create - Create additional API key
 */
Endpoint({
    path: '/api-keys/:user_id/create',
    methods: ['POST'],
    handler: async (req, res) => {
        try {
            const { user_id } = req.params;
            const { name, key_type, rate_limit, daily_limit, unlimited } = req.body;

            if ( ! user_id ) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id is required',
                    code: 'MISSING_USER_ID',
                });
            }

            const services = req.app.get('services');
            if ( services ) {
                const db = services.get('database')?.get();
                await userAPIKeyService.initialize(db);
            }

            const newKey = await userAPIKeyService.createAdditionalKey(user_id, {
                name: name || 'Additional Key',
                keyType: key_type || 'standard',
                rateLimit: rate_limit || 1000,
                dailyLimit: unlimited ? -1 : (daily_limit || 100000),
                unlimited: unlimited || false,
                purpose: 'user_created',
            });

            res.json({
                success: true,
                message: 'Additional API key created',
                warning: 'Save this key securely! It will not be shown again.',
                key: {
                    id: newKey.id,
                    name: newKey.name,
                    key: newKey.key, // Full key shown only once!
                    key_type: newKey.key_type,
                    rate_limit: newKey.rate_limit_per_minute,
                    daily_limit: newKey.daily_limit === -1 ? 'UNLIMITED' : newKey.daily_limit,
                    created_at: new Date(newKey.created_at).toISOString(),
                },
            });

        } catch ( error ) {
            console.error('Error creating API key:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to create API key',
                code: 'CREATE_KEY_ERROR',
            });
        }
    },
}).attach(router);

/**
 * DELETE /api-keys/:user_id/:key_id - Revoke an API key
 */
Endpoint({
    path: '/api-keys/:user_id/:key_id',
    methods: ['DELETE'],
    handler: async (req, res) => {
        try {
            const { user_id, key_id } = req.params;

            if ( !user_id || !key_id ) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id and key_id are required',
                    code: 'MISSING_PARAMETERS',
                });
            }

            const services = req.app.get('services');
            if ( services ) {
                const db = services.get('database')?.get();
                await userAPIKeyService.initialize(db);
            }

            const revoked = await userAPIKeyService.revokeKey(key_id, user_id);

            if ( revoked ) {
                res.json({
                    success: true,
                    message: 'API key revoked successfully',
                    key_id: key_id,
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'API key not found',
                    code: 'KEY_NOT_FOUND',
                });
            }

        } catch ( error ) {
            console.error('Error revoking API key:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to revoke API key',
                code: 'REVOKE_KEY_ERROR',
            });
        }
    },
}).attach(router);

/**
 * PUT /api-keys/:user_id/:key_id - Update API key settings
 */
Endpoint({
    path: '/api-keys/:user_id/:key_id',
    methods: ['PUT'],
    handler: async (req, res) => {
        try {
            const { user_id, key_id } = req.params;
            const { name, rate_limit, daily_limit, unlimited } = req.body;

            if ( !user_id || !key_id ) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id and key_id are required',
                    code: 'MISSING_PARAMETERS',
                });
            }

            const services = req.app.get('services');
            if ( services ) {
                const db = services.get('database')?.get();
                await userAPIKeyService.initialize(db);
            }

            const updates = {};
            if ( name ) updates.name = name;
            if ( rate_limit ) updates.rate_limit_per_minute = rate_limit;
            if ( daily_limit ) updates.daily_limit = daily_limit;
            if ( unlimited !== undefined ) updates.is_unlimited = unlimited ? 1 : 0;

            const updated = await userAPIKeyService.updateKey(key_id, user_id, updates);

            if ( updated ) {
                res.json({
                    success: true,
                    message: 'API key updated successfully',
                    key_id: key_id,
                    updates: updates,
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'API key not found',
                    code: 'KEY_NOT_FOUND',
                });
            }

        } catch ( error ) {
            console.error('Error updating API key:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to update API key',
                code: 'UPDATE_KEY_ERROR',
            });
        }
    },
}).attach(router);

/**
 * GET /api-keys/:user_id/usage - Get usage statistics
 */
Endpoint({
    path: '/api-keys/:user_id/usage',
    methods: ['GET'],
    handler: async (req, res) => {
        try {
            const { user_id } = req.params;

            if ( ! user_id ) {
                return res.status(400).json({
                    success: false,
                    error: 'user_id is required',
                    code: 'MISSING_USER_ID',
                });
            }

            const services = req.app.get('services');
            if ( services ) {
                const db = services.get('database')?.get();
                await userAPIKeyService.initialize(db);
            }

            const usage = await userAPIKeyService.getUserUsage(user_id);
            const keys = await userAPIKeyService.getUserKeys(user_id);

            res.json({
                success: true,
                user_id: user_id,
                usage: usage,
                keys_breakdown: keys.map(k => ({
                    id: k.id,
                    name: k.name,
                    key_type: k.key_type,
                    usage_count: k.usage_count,
                    rate_limit: k.rate_limit_per_minute,
                    is_active: k.is_active === 1,
                    last_used: k.last_used_at ? new Date(k.last_used_at).toISOString() : null,
                })),
            });

        } catch ( error ) {
            console.error('Error fetching usage:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch usage statistics',
                code: 'FETCH_USAGE_ERROR',
            });
        }
    },
}).attach(router);

module.exports = router;
