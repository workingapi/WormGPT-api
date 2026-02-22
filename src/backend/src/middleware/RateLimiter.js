/*
 * WormGPT - High-Performance Rate Limiter
 * Handles millions of requests per minute with distributed rate limiting
 * Supports user-specific API keys with custom limits
 */

const { redisClient } = require('../clients/redis/redisSingleton.js');
const userAPIKeyService = require('../services/UserAPIKeyService');

class RateLimiter {
    constructor (options = {}) {
        this.windowMs = options.windowMs || 60000; // 1 minute default
        this.maxRequests = options.maxRequests || 100; // requests per window
        this.prefix = options.prefix || 'ratelimit';
        this.redisAvailable = false;
        this.userAPIKeyService = userAPIKeyService;

        // Try to connect to Redis
        this.init();
    }

    async init () {
        try {
            if ( redisClient ) {
                await redisClient.ping();
                this.redisAvailable = true;
                console.log('✅ Rate Limiter: Redis connected for distributed rate limiting');
            }
        } catch ( err ) {
            console.log('⚠️  Rate Limiter: Using in-memory limiting (Redis unavailable)');
        }
    }

    /**
     * Generate a unique key for rate limiting
     * @param {Request} req - Express request object
     * @returns {string} Rate limit key
     */
    getKey (req) {
        // Check for user API key first (wgpt_ prefix)
        const apiKey = req.headers['x-api-key'] || req.headers['authorization'];

        if ( apiKey && apiKey.startsWith('wgpt_') ) {
            // User API key - use the key itself for tracking
            return `${this.prefix}:user_key:${apiKey}`;
        }

        // Fallback to IP or other API key
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return `${this.prefix}:${apiKey || ip}`;
    }

    /**
     * Get rate limit for user API key
     */
    async getUserKeyLimit (apiKey) {
        try {
            // Initialize service if needed
            const services = global.services;
            if ( services && !this.userAPIKeyService.initialized ) {
                const db = services.get('database')?.get();
                await this.userAPIKeyService.initialize(db);
            }

            const validation = await this.userAPIKeyService.validateKey(apiKey);

            if ( validation.valid ) {
                return {
                    limit: validation.rate_limit,
                    isUnlimited: validation.is_unlimited,
                    dailyLimit: validation.daily_limit,
                    usageCount: validation.usage_count,
                    valid: true,
                };
            }
        } catch ( err ) {
            console.error('Error getting user key limit:', err);
        }

        return { valid: false };
    }

    /**
     * Check if request is within rate limit
     * @param {string} key - Rate limit key
     * @returns {Promise<{allowed: boolean, remaining: number, reset: number}>}
     */
    async checkLimit (key) {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        if ( this.redisAvailable ) {
            return this.checkLimitRedis(key, now, windowStart);
        } else {
            return this.checkLimitMemory(key, now, windowStart);
        }
    }

    /**
     * Redis-based rate limiting (distributed, production-ready)
     */
    async checkLimitRedis (key, now, windowStart) {
        const pipeline = redisClient.multi();

        // Remove old entries
        pipeline.zremrangebyscore(key, 0, windowStart);

        // Count current requests in window
        pipeline.zcard(key);

        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`);

        // Set expiry
        pipeline.pexpire(key, this.windowMs + 1000);

        const results = await pipeline.exec();
        const count = results[1][1];

        const allowed = count < this.maxRequests;
        const remaining = Math.max(0, this.maxRequests - count);
        const reset = now + this.windowMs;

        return { allowed, remaining, reset };
    }

    /**
     * In-memory rate limiting (fallback)
     */
    checkLimitMemory (key, now, windowStart) {
        if ( ! this.memoryStore ) {
            this.memoryStore = new Map();
        }

        const record = this.memoryStore.get(key) || { timestamps: [] };

        // Remove old timestamps
        record.timestamps = record.timestamps.filter(ts => ts > windowStart);

        const allowed = record.timestamps.length < this.maxRequests;
        const remaining = Math.max(0, this.maxRequests - record.timestamps.length);
        const reset = now + this.windowMs;

        if ( allowed ) {
            record.timestamps.push(now);
            this.memoryStore.set(key, record);
        }

        return { allowed, remaining, reset };
    }

    /**
     * Express middleware
     */
    middleware () {
        return async (req, res, next) => {
            const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
            const key = this.getKey(req);

            // Check if it's a user API key and get custom limits
            let customLimit = null;
            if ( apiKey && apiKey.startsWith('wgpt_') ) {
                customLimit = await this.getUserKeyLimit(apiKey);

                if ( ! customLimit.valid ) {
                    return res.status(401).json({
                        success: false,
                        error: 'Invalid or inactive API key',
                        code: 'INVALID_API_KEY',
                        message: 'Your API key is invalid, expired, or has been revoked. Please generate a new key.',
                    });
                }

                // Use custom rate limit for this user key
                if ( customLimit.isUnlimited ) {
                    // Set very high limit for unlimited keys
                    this.maxRequests = customLimit.limit; // 10000 for premium
                } else {
                    this.maxRequests = customLimit.limit;
                }
            }

            const limit = await this.checkLimit(key);

            // Set rate limit headers
            res.set('X-RateLimit-Limit', this.maxRequests);
            res.set('X-RateLimit-Remaining', limit.remaining);
            res.set('X-RateLimit-Reset', Math.floor(limit.reset / 1000));

            if ( ! limit.allowed ) {
                const retryAfter = Math.ceil((limit.reset - Date.now()) / 1000);
                res.set('Retry-After', retryAfter);

                return res.status(429).json({
                    success: false,
                    error: 'Too many requests',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: retryAfter,
                    message: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
                    upgrade_info: customLimit?.valid ? null : {
                        message: 'Get your free unlimited API key at /api-keys/generate',
                        benefits: {
                            standard: '1000 requests/minute, 100K/day',
                            premium: '10000 requests/minute, UNLIMITED/day',
                        },
                    },
                });
            }

            next();
        };
    }

    /**
     * Create a rate limiter with custom limits
     */
    static create (options) {
        return new RateLimiter(options);
    }
}

module.exports = RateLimiter;
