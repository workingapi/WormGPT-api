/*
 * WormGPT - User API Key Service
 * Generate and manage unique API keys for each user
 * Each user gets 2 keys: Standard + Premium for unlimited usage
 */

const crypto = require('crypto');
const { redisClient } = require('../clients/redis/redisSingleton.js');

class UserAPIKeyService {
    constructor () {
        this.db = null;
        this.initialized = false;
    }

    /**
     * Initialize the service
     */
    async initialize (db) {
        if ( this.initialized ) return;

        this.db = db;
        await this.createTable();
        this.initialized = true;
        console.log('✅ UserAPIKeyService initialized');
    }

    /**
     * Create database table for API keys
     */
    async createTable () {
        if ( ! this.db ) return;

        await this.db.query(`
            CREATE TABLE IF NOT EXISTS user_api_keys (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                key_hash TEXT NOT NULL UNIQUE,
                key_prefix TEXT NOT NULL,
                key_type TEXT NOT NULL CHECK(key_type IN ('standard', 'premium')),
                name TEXT,
                rate_limit_per_minute INTEGER DEFAULT 1000,
                daily_limit INTEGER DEFAULT 100000,
                is_active INTEGER DEFAULT 1,
                is_unlimited INTEGER DEFAULT 0,
                usage_count INTEGER DEFAULT 0,
                last_used_at INTEGER,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                expires_at INTEGER,
                metadata TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create indexes for performance
        await this.db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id 
            ON user_api_keys(user_id)
        `);
        await this.db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_api_keys_key_hash 
            ON user_api_keys(key_hash)
        `);
        await this.db.query(`
            CREATE INDEX IF NOT EXISTS idx_user_api_keys_key_prefix 
            ON user_api_keys(key_prefix)
        `);

        console.log('📊 user_api_keys table created');
    }

    /**
     * Generate a unique API key
     */
    generateKey () {
        const prefix = 'wgpt'; // WormGPT
        const randomPart = crypto.randomBytes(24).toString('hex');
        const key = `${prefix}_${randomPart}`;
        return key;
    }

    /**
     * Hash API key for secure storage
     */
    hashKey (key) {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    /**
     * Get key ID from the key itself (for lookup)
     */
    getKeyPrefix (key) {
        return key.split('_')[0] || '';
    }

    /**
     * Create API keys for a new user
     * Each user gets 2 keys: Standard + Premium
     */
    async createUserKeys (userId, options = {}) {
        if ( ! this.db ) {
            throw new Error('Database not initialized');
        }

        const keys = [];
        const now = Date.now();

        // Standard Key - 1000 req/min, 100K/day
        const standardKey = this.generateKey();
        const standardKeyData = {
            id: crypto.randomUUID(),
            user_id: userId,
            key_hash: this.hashKey(standardKey),
            key_prefix: this.getKeyPrefix(standardKey),
            key_type: 'standard',
            name: options.standardKeyName || 'My Standard Key',
            rate_limit_per_minute: options.standardRateLimit || 1000,
            daily_limit: options.standardDailyLimit || 100000,
            is_active: 1,
            is_unlimited: 0,
            usage_count: 0,
            last_used_at: null,
            created_at: now,
            expires_at: null,
            metadata: JSON.stringify({
                created_for: 'user_signup',
                tier: 'standard',
            }),
        };

        // Premium Key - 10000 req/min, UNLIMITED daily
        const premiumKey = this.generateKey();
        const premiumKeyData = {
            id: crypto.randomUUID(),
            user_id: userId,
            key_hash: this.hashKey(premiumKey),
            key_prefix: this.getKeyPrefix(premiumKey),
            key_type: 'premium',
            name: options.premiumKeyName || 'My Premium Key',
            rate_limit_per_minute: options.premiumRateLimit || 10000,
            daily_limit: options.premiumDailyLimit || -1, // -1 = unlimited
            is_active: 1,
            is_unlimited: 1,
            usage_count: 0,
            last_used_at: null,
            created_at: now,
            expires_at: null,
            metadata: JSON.stringify({
                created_for: 'user_signup',
                tier: 'premium',
                unlimited: true,
            }),
        };

        // Insert into database
        await this.insertKey(standardKeyData);
        await this.insertKey(premiumKeyData);

        // Return keys with actual key values (only time they're visible)
        keys.push({
            ...standardKeyData,
            key: standardKey, // Return full key only once
            key_hash: undefined, // Don't return hash
        });

        keys.push({
            ...premiumKeyData,
            key: premiumKey, // Return full key only once
            key_hash: undefined, // Don't return hash
        });

        console.log(`🔑 Created 2 API keys for user ${userId}`);

        return keys;
    }

    /**
     * Insert a single API key
     */
    async insertKey (keyData) {
        const stmt = await this.db.prepare(`
            INSERT INTO user_api_keys (
                id, user_id, key_hash, key_prefix, key_type, name,
                rate_limit_per_minute, daily_limit, is_active, is_unlimited,
                usage_count, last_used_at, created_at, expires_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        await stmt.run(
            keyData.id,
            keyData.user_id,
            keyData.key_hash,
            keyData.key_prefix,
            keyData.key_type,
            keyData.name,
            keyData.rate_limit_per_minute,
            keyData.daily_limit,
            keyData.is_active,
            keyData.is_unlimited,
            keyData.usage_count,
            keyData.last_used_at,
            keyData.created_at,
            keyData.expires_at,
            keyData.metadata,
        );
    }

    /**
     * Validate API key and return key info
     */
    async validateKey (key) {
        if ( !this.db || !key ) {
            return { valid: false, reason: 'Invalid key' };
        }

        const keyHash = this.hashKey(key);

        const stmt = await this.db.prepare(`
            SELECT * FROM user_api_keys 
            WHERE key_hash = ? AND is_active = 1
        `);

        const keyData = await stmt.get(keyHash);

        if ( ! keyData ) {
            return { valid: false, reason: 'Key not found or inactive' };
        }

        // Check expiration
        if ( keyData.expires_at && Date.now() > keyData.expires_at ) {
            return { valid: false, reason: 'Key expired' };
        }

        // Check daily limit
        if ( keyData.daily_limit > 0 && keyData.usage_count >= keyData.daily_limit ) {
            return {
                valid: false,
                reason: 'Daily limit exceeded',
                daily_limit: keyData.daily_limit,
                usage_count: keyData.usage_count,
            };
        }

        // Update last used
        await this.updateLastUsed(keyData.id);

        return {
            valid: true,
            key: keyData,
            user_id: keyData.user_id,
            key_type: keyData.key_type,
            rate_limit: keyData.rate_limit_per_minute,
            daily_limit: keyData.daily_limit,
            is_unlimited: keyData.is_unlimited === 1,
            usage_count: keyData.usage_count,
        };
    }

    /**
     * Update last used timestamp and increment usage count
     */
    async updateLastUsed (keyId) {
        if ( ! this.db ) return;

        const stmt = await this.db.prepare(`
            UPDATE user_api_keys 
            SET last_used_at = ?, usage_count = usage_count + 1
            WHERE id = ?
        `);

        await stmt.run(Date.now(), keyId);

        // Also update Redis cache for fast access
        if ( redisClient ) {
            await redisClient.setex(
                `api_key_usage:${keyId}`,
                3600,
                JSON.stringify({
                    last_used: Date.now(),
                    usage_count: 1, // This is incremented, actual count in DB
                }),
            );
        }
    }

    /**
     * Get all API keys for a user
     */
    async getUserKeys (userId) {
        if ( ! this.db ) return [];

        const stmt = await this.db.prepare(`
            SELECT id, key_prefix, key_type, name, rate_limit_per_minute,
                   daily_limit, is_active, is_unlimited, usage_count,
                   last_used_at, created_at, expires_at, metadata
            FROM user_api_keys
            WHERE user_id = ?
            ORDER BY created_at DESC
        `);

        const keys = await stmt.all(userId);

        return keys.map(key => ({
            ...key,
            metadata: key.metadata ? JSON.parse(key.metadata) : null,
        }));
    }

    /**
     * Get a specific API key by ID
     */
    async getKeyById (keyId, userId) {
        if ( ! this.db ) return null;

        const stmt = await this.db.prepare(`
            SELECT * FROM user_api_keys
            WHERE id = ? AND user_id = ?
        `);

        const key = await stmt.get(keyId, userId);

        if ( key ) {
            key.metadata = key.metadata ? JSON.parse(key.metadata) : null;
        }

        return key;
    }

    /**
     * Create additional API key for a user
     */
    async createAdditionalKey (userId, options = {}) {
        const key = this.generateKey();
        const now = Date.now();

        const keyData = {
            id: crypto.randomUUID(),
            user_id: userId,
            key_hash: this.hashKey(key),
            key_prefix: this.getKeyPrefix(key),
            key_type: options.keyType || 'standard',
            name: options.name || 'Additional Key',
            rate_limit_per_minute: options.rateLimit || 1000,
            daily_limit: options.dailyLimit || 100000,
            is_active: 1,
            is_unlimited: options.unlimited ? 1 : 0,
            usage_count: 0,
            last_used_at: null,
            created_at: now,
            expires_at: options.expiresAt || null,
            metadata: JSON.stringify({
                created_for: options.purpose || 'user_created',
                custom: true,
            }),
        };

        await this.insertKey(keyData);

        return {
            ...keyData,
            key: key, // Return full key only once
            key_hash: undefined,
        };
    }

    /**
     * Revoke an API key
     */
    async revokeKey (keyId, userId) {
        if ( ! this.db ) return false;

        const stmt = await this.db.prepare(`
            UPDATE user_api_keys
            SET is_active = 0
            WHERE id = ? AND user_id = ?
        `);

        const result = await stmt.run(keyId, userId);
        return result.changes > 0;
    }

    /**
     * Update API key settings
     */
    async updateKey (keyId, userId, updates) {
        if ( ! this.db ) return false;

        const allowedFields = ['name', 'rate_limit_per_minute', 'daily_limit', 'is_unlimited'];
        const fields = [];
        const values = [];

        for ( const [key, value] of Object.entries(updates) ) {
            if ( allowedFields.includes(key) ) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if ( fields.length === 0 ) return false;

        values.push(keyId, userId);

        const stmt = await this.db.prepare(`
            UPDATE user_api_keys
            SET ${fields.join(', ')}
            WHERE id = ? AND user_id = ?
        `);

        const result = await stmt.run(...values);
        return result.changes > 0;
    }

    /**
     * Get usage statistics for a user
     */
    async getUserUsage (userId) {
        if ( ! this.db ) return null;

        const stmt = await this.db.prepare(`
            SELECT 
                COUNT(*) as total_keys,
                SUM(usage_count) as total_usage,
                SUM(CASE WHEN is_unlimited = 1 THEN 1 ELSE 0 END) as unlimited_keys,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_keys,
                MAX(last_used_at) as last_used
            FROM user_api_keys
            WHERE user_id = ?
        `);

        return await stmt.get(userId);
    }

    /**
     * Get rate limit for a specific key
     */
    getRateLimit (keyData) {
        return {
            limit: keyData.rate_limit_per_minute,
            remaining: keyData.rate_limit_per_minute, // Will be calculated by RateLimiter
            reset: Math.floor((Date.now() + 60000) / 1000),
        };
    }
}

// Singleton instance
const userAPIKeyService = new UserAPIKeyService();

module.exports = userAPIKeyService;
