/*
 * WormGPT - API Key Rotation Service
 * Rotate through multiple API keys to handle billions of requests
 * Distributes load across multiple OpenRouter accounts
 */

// redisClient imported for future use
// const { redisClient } = require('../clients/redis/redisSingleton.js');

class APIKeyRotator {
    constructor () {
        this.keys = [];
        this.currentIndex = 0;
        this.keyHealth = new Map(); // Track key health/success rates
        this.initialized = false;
    }

    /**
     * Initialize API keys from environment variables
     */
    initialize () {
        if ( this.initialized ) return;

        // Load keys from environment (comma-separated)
        const keysEnv = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY;

        if ( keysEnv ) {
            this.keys = keysEnv.split(',').map(k => k.trim()).filter(k => k);
        }

        // Initialize health tracking
        this.keys.forEach(key => {
            this.keyHealth.set(key, {
                success: 0,
                failure: 0,
                lastUsed: 0,
                cooldownUntil: 0,
            });
        });

        this.initialized = true;
        console.log(`🔑 API Key Rotator: Loaded ${this.keys.length} API key(s)`);

        if ( this.keys.length === 0 ) {
            console.warn('⚠️  No API keys configured. Set OPENROUTER_API_KEYS environment variable.');
        } else if ( this.keys.length > 1 ) {
            console.log('✅ Multi-key rotation enabled for high-volume traffic');
        }
    }

    /**
     * Get the next available API key (round-robin with health checking)
     */
    getNextKey () {
        this.initialize();

        if ( this.keys.length === 0 ) {
            throw new Error('No API keys configured. Set OPENROUTER_API_KEYS in environment variables.');
        }

        if ( this.keys.length === 1 ) {
            return this.keys[0];
        }

        const now = Date.now();
        let attempts = 0;
        // startIndex reserved for future use
        // let startIndex = this.currentIndex;

        // Find a healthy key that's not in cooldown
        while ( attempts < this.keys.length ) {
            const key = this.keys[this.currentIndex];
            const health = this.keyHealth.get(key);

            // Move to next key for next call
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;
            attempts++;

            // Skip keys in cooldown
            if ( health.cooldownUntil > now ) {
                continue;
            }

            // Prefer keys with better success rates
            const total = health.success + health.failure;
            const successRate = total > 0 ? health.success / total : 1.0;

            // Use key if success rate is above 50% or if it's been a while since last use
            if ( successRate >= 0.5 || (now - health.lastUsed) > 300000 ) {
                health.lastUsed = now;
                return key;
            }
        }

        // All keys are unhealthy, use least recently used
        const lruKey = this.keys.reduce((a, b) =>
            this.keyHealth.get(a).lastUsed < this.keyHealth.get(b).lastUsed ? a : b);

        this.keyHealth.get(lruKey).lastUsed = now;
        return lruKey;
    }

    /**
     * Report API call success
     */
    reportSuccess (key) {
        const health = this.keyHealth.get(key);
        if ( health ) {
            health.success = Math.min(health.success + 1, 1000); // Cap to prevent overflow
            // Decay failure count over time
            health.failure = Math.max(0, health.failure - 1);
        }
    }

    /**
     * Report API call failure
     */
    reportFailure (key, error) {
        const health = this.keyHealth.get(key);
        if ( health ) {
            health.failure = Math.min(health.failure + 1, 1000);

            // Put key in cooldown for serious errors
            if ( error && (error.status === 429 || error.status === 401 || error.status === 403) ) {
                health.cooldownUntil = Date.now() + 60000; // 1 minute cooldown
                console.warn(`🔑 API Key ${key.slice(0, 10)}... in cooldown due to error ${error.status}`);
            }
        }
    }

    /**
     * Get key statistics
     */
    getStats () {
        return this.keys.map(key => {
            const health = this.keyHealth.get(key);
            const total = health.success + health.failure;
            return {
                key: `${key.slice(0, 10) }...`,
                success: health.success,
                failure: health.failure,
                successRate: total > 0 ? `${(health.success / total * 100).toFixed(1) }%` : 'N/A',
                inCooldown: health.cooldownUntil > Date.now(),
                lastUsed: new Date(health.lastUsed).toISOString(),
            };
        });
    }

    /**
     * Add a new API key at runtime
     */
    addKey (key) {
        if ( ! this.keys.includes(key) ) {
            this.keys.push(key);
            this.keyHealth.set(key, {
                success: 0,
                failure: 0,
                lastUsed: 0,
                cooldownUntil: 0,
            });
            console.log(`🔑 Added new API key. Total keys: ${this.keys.length}`);
        }
    }

    /**
     * Remove an API key
     */
    removeKey (key) {
        const index = this.keys.indexOf(key);
        if ( index !== -1 ) {
            this.keys.splice(index, 1);
            this.keyHealth.delete(key);
            console.log(`🔑 Removed API key. Total keys: ${this.keys.length}`);
        }
    }
}

// Singleton instance
const apiKeys = new APIKeyRotator();

module.exports = apiKeys;
