/*
 * WormGPT - High-Performance Rate Limiter
 * Handles millions of requests per minute with distributed rate limiting
 */

const { redisClient } = require('../clients/redis/redisSingleton.js');

class RateLimiter {
    constructor (options = {}) {
        this.windowMs = options.windowMs || 60000; // 1 minute default
        this.maxRequests = options.maxRequests || 100; // requests per window
        this.prefix = options.prefix || 'ratelimit';
        this.redisAvailable = false;

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
        // Use API key if provided, otherwise IP address
        const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return `${this.prefix}:${apiKey || ip}`;
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
            const key = this.getKey(req);
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
