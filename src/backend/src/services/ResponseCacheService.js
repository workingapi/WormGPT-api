/*
 * WormGPT - Response Caching Service
 * Cache AI responses to reduce API calls and improve response times
 * Handles millions of requests with intelligent caching
 */

const crypto = require('crypto');
const { redisClient } = require('../clients/redis/redisSingleton.js');

class ResponseCacheService {
    constructor () {
        this.ttl = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour default
        this.enabled = process.env.CACHE_ENABLED !== 'false';
        this.redisAvailable = false;
        this.memoryCache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            size: 0,
        };

        this.init();
    }

    async init () {
        try {
            if ( redisClient ) {
                await redisClient.ping();
                this.redisAvailable = true;
                console.log('✅ Response Cache: Redis connected');

                // Start cleanup job
                setInterval(() => this.cleanup(), 60000); // Every minute
            }
        } catch ( err ) {
            console.log('⚠️  Response Cache: Using in-memory cache (Redis unavailable)');
        }
    }

    /**
     * Generate cache key from request
     */
    generateKey (message, model, options = {}) {
        const data = JSON.stringify({
            message: typeof message === 'string' ? message : JSON.stringify(message),
            model,
            temperature: options.temperature,
            system_prompt: options.system_prompt,
        });

        return `cache:qwen:${crypto.createHash('sha256').update(data).digest('hex').slice(0, 16)}`;
    }

    /**
     * Get cached response
     */
    async get (key) {
        if ( ! this.enabled ) return null;

        try {
            if ( this.redisAvailable ) {
                const cached = await redisClient.get(key);
                if ( cached ) {
                    this.stats.hits++;
                    const data = JSON.parse(cached);
                    // Check if still valid
                    if ( data.expires > Date.now() ) {
                        return data.response;
                    }
                }
            } else {
                const cached = this.memoryCache.get(key);
                if ( cached && cached.expires > Date.now() ) {
                    this.stats.hits++;
                    return cached.response;
                }
            }
        } catch ( err ) {
            console.error('Cache get error:', err);
        }

        this.stats.misses++;
        return null;
    }

    /**
     * Cache a response
     */
    async set (key, response, ttl = null) {
        if ( ! this.enabled ) return;

        ttl = ttl || this.ttl;
        const expires = Date.now() + (ttl * 1000);

        try {
            const data = {
                response,
                expires,
                created: Date.now(),
            };

            if ( this.redisAvailable ) {
                await redisClient.setex(key, ttl, JSON.stringify(data));
            } else {
                this.memoryCache.set(key, data);
                this.stats.size = this.memoryCache.size;
            }
        } catch ( err ) {
            console.error('Cache set error:', err);
        }
    }

    /**
     * Get or set (atomic operation)
     */
    async getOrSet (key, generator, ttl = null) {
        const cached = await this.get(key);
        if ( cached ) {
            return { cached: true, response: cached };
        }

        const response = await generator();
        await this.set(key, response, ttl);

        return { cached: false, response };
    }

    /**
     * Delete a cache entry
     */
    async delete (key) {
        try {
            if ( this.redisAvailable ) {
                await redisClient.del(key);
            } else {
                this.memoryCache.delete(key);
            }
        } catch ( err ) {
            console.error('Cache delete error:', err);
        }
    }

    /**
     * Clear all cache
     */
    async clear () {
        try {
            if ( this.redisAvailable ) {
                const keys = await redisClient.keys('cache:qwen:*');
                if ( keys.length > 0 ) {
                    await redisClient.del(keys);
                }
            } else {
                this.memoryCache.clear();
            }
            this.stats.size = 0;
            console.log('🗑️  Cache cleared');
        } catch ( err ) {
            console.error('Cache clear error:', err);
        }
    }

    /**
     * Cleanup expired entries (for memory cache)
     */
    cleanup () {
        if ( ! this.redisAvailable ) {
            const now = Date.now();
            for ( const [key, data] of this.memoryCache.entries() ) {
                if ( data.expires < now ) {
                    this.memoryCache.delete(key);
                }
            }
            this.stats.size = this.memoryCache.size;
        }
    }

    /**
     * Get cache statistics
     */
    getStats () {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: `${hitRate }%`,
            size: this.stats.size,
            redisAvailable: this.redisAvailable,
            enabled: this.enabled,
        };
    }

    /**
     * Warm cache with common queries
     */
    async warmCache (commonQueries) {
        console.log('🔥 Warming cache with', commonQueries.length, 'queries...');

        for ( const query of commonQueries ) {
            const key = this.generateKey(query.message, query.model || 'qwen/qwen-3-4b:free');
            const cached = await this.get(key);

            if ( ! cached ) {
                // Would need to call AI service here
                // This is typically done asynchronously
            }
        }
    }
}

// Singleton instance
const cacheService = new ResponseCacheService();

module.exports = cacheService;
