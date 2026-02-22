# 🔑 WormGPT User API Key System

## Overview

Every user automatically gets **2 FREE API keys** with unlimited usage when they create an account:

| Key Type | Requests/Minute | Requests/Day | Best For |
|----------|-----------------|--------------|----------|
| **Standard** | 1,000 | 100,000 | Regular usage |
| **Premium** | 10,000 | **UNLIMITED** 🚀 | High-volume production |

---

## 🎁 Automatic Key Generation

When a user signs up, they **automatically** receive 2 API keys:

```javascript
// Example: User signs up
const user = await createUser({
    user_id: 'user_12345',
    email: 'user@example.com',
    username: 'john_doe'
});

// Automatically generates 2 keys:
// 1. Standard Key (1K req/min, 100K/day)
// 2. Premium Key (10K req/min, UNLIMITED/day)
```

---

## 📝 Getting Your API Keys

### Method 1: During Signup

```bash
POST https://your-api.com/api-keys/generate
Content-Type: application/json

{
    "user_id": "your_unique_user_id",
    "email": "you@example.com",
    "username": "your_username"
}
```

**Response:**
```json
{
    "success": true,
    "message": "API keys generated successfully",
    "warning": "Save these keys securely! They will not be shown again.",
    "keys": [
        {
            "id": "key_abc123",
            "name": "john_doe's Standard Key",
            "key": "wgpt_a1b2c3d4e5f6...",  // ← SAVE THIS!
            "key_type": "standard",
            "rate_limit": 1000,
            "daily_limit": 100000
        },
        {
            "id": "key_def456",
            "name": "john_doe's Premium Key (Unlimited)",
            "key": "wgpt_x7y8z9w0v1u2...",  // ← SAVE THIS!
            "key_type": "premium",
            "rate_limit": 10000,
            "daily_limit": "UNLIMITED"
        }
    ]
}
```

⚠️ **IMPORTANT**: Save your keys immediately! They will **never be shown again**.

### Method 2: From Dashboard

After signup, you can view your keys (but not the full key value) at:
```
GET https://your-api.com/api-keys/:user_id
```

---

## 🔧 Using Your API Keys

### Standard Usage

```javascript
const STANDARD_KEY = 'wgpt_a1b2c3d4e5f6...';

const response = await fetch('https://your-api.com/qwen/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': STANDARD_KEY  // ← Your API key
    },
    body: JSON.stringify({
        message: 'Hello, WormGPT!',
        model: 'qwen/qwen-3-4b:free'
    })
});

const data = await response.json();
console.log(data.response);
```

### Premium Unlimited Usage

```javascript
const PREMIUM_KEY = 'wgpt_x7y8z9w0v1u2...';

const response = await fetch('https://your-api.com/qwen/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PREMIUM_KEY  // ← Premium unlimited key
    },
    body: JSON.stringify({
        message: 'Hello, WormGPT!',
        model: 'qwen/qwen-3-4b:free'
    })
});
```

---

## 📊 Rate Limits Explained

### Standard Key
- **1,000 requests per minute**
- **100,000 requests per day**
- Resets every minute
- Perfect for: Development, testing, moderate usage

### Premium Key (Unlimited)
- **10,000 requests per minute**
- **UNLIMITED requests per day** 🎉
- Resets every minute
- Perfect for: Production, high-traffic apps, commercial use

### What Happens When You Exceed Limits?

```json
// Standard key exceeds daily limit
{
    "success": false,
    "error": "Daily limit exceeded",
    "code": "RATE_LIMIT_EXCEEDED",
    "upgrade_info": {
        "message": "Use your Premium Unlimited key for higher limits",
        "benefits": {
            "premium": "10000 requests/minute, UNLIMITED/day"
        }
    }
}
```

**Solution**: Switch to your Premium key!

---

## 🗂️ Managing Your API Keys

### View All Your Keys

```bash
GET https://your-api.com/api-keys/:user_id
```

**Response:**
```json
{
    "success": true,
    "user_id": "user_12345",
    "keys": [
        {
            "id": "key_abc123",
            "key_prefix": "wgpt_...",
            "key_type": "standard",
            "name": "My Standard Key",
            "rate_limit": 1000,
            "daily_limit": 100000,
            "is_active": true,
            "usage_count": 5420,
            "last_used": "2026-02-22T14:30:00Z"
        },
        {
            "id": "key_def456",
            "key_prefix": "wgpt_...",
            "key_type": "premium",
            "name": "My Premium Key (Unlimited)",
            "rate_limit": 10000,
            "daily_limit": "UNLIMITED",
            "is_active": true,
            "usage_count": 125000,
            "last_used": "2026-02-22T14:35:00Z"
        }
    ],
    "total_keys": 2
}
```

### Create Additional Key

```bash
POST https://your-api.com/api-keys/:user_id/create
Content-Type: application/json

{
    "name": "My Production Key",
    "key_type": "premium",
    "unlimited": true
}
```

### Revoke a Key

```bash
DELETE https://your-api.com/api-keys/:user_id/:key_id
```

### Update Key Settings

```bash
PUT https://your-api.com/api-keys/:user_id/:key_id
Content-Type: application/json

{
    "name": "Updated Key Name",
    "rate_limit": 5000
}
```

### View Usage Statistics

```bash
GET https://your-api.com/api-keys/:user_id/usage
```

**Response:**
```json
{
    "success": true,
    "usage": {
        "total_keys": 2,
        "total_usage": 130420,
        "unlimited_keys": 1,
        "active_keys": 2,
        "last_used": "2026-02-22T14:35:00Z"
    },
    "keys_breakdown": [
        {
            "id": "key_abc123",
            "name": "My Standard Key",
            "key_type": "standard",
            "usage_count": 5420,
            "rate_limit": 1000,
            "is_active": true
        },
        {
            "id": "key_def456",
            "name": "My Premium Key",
            "key_type": "premium",
            "usage_count": 125000,
            "rate_limit": 10000,
            "is_active": true
        }
    ]
}
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Save your keys immediately when generated
- Store keys in environment variables
- Use different keys for development/production
- Rotate keys periodically
- Revoke compromised keys immediately

### ❌ DON'T:
- Share your API keys publicly
- Commit keys to Git repositories
- Use keys in client-side code (expose them)
- Use the same key across multiple projects

### Example: Secure Storage

```bash
# .env file (NEVER commit this!)
WORMGPT_STANDARD_KEY=wgpt_a1b2c3d4e5f6...
WORMGPT_PREMIUM_KEY=wgpt_x7y8z9w0v1u2...
```

```javascript
// Use in code
const PREMIUM_KEY = process.env.WORMGPT_PREMIUM_KEY;

const response = await fetch('/qwen/chat', {
    headers: { 'X-API-Key': PREMIUM_KEY }
});
```

---

## 📈 Scaling with User API Keys

### Single User Capacity

| Key | Per Minute | Per Hour | Per Day |
|-----|------------|----------|---------|
| Standard | 1,000 | 60,000 | 100,000 (capped) |
| Premium | 10,000 | 600,000 | **UNLIMITED** |

### Multiple Users = More Capacity

Each user gets their own keys, so:

- **1 user** = 10K req/min unlimited
- **10 users** = 100K req/min unlimited (10 keys each)
- **100 users** = 1M req/min unlimited (100 keys each)
- **1000 users** = 10M req/min unlimited

**Strategy**: Create multiple user accounts to multiply capacity!

---

## 🎯 Use Cases

### 1. Personal Project
```javascript
// Use your Premium key for unlimited access
const KEY = process.env.WORMGPT_PREMIUM_KEY;
// Capacity: 10K req/min, unlimited daily
```

### 2. Small Business (10 users)
```javascript
// Create accounts for team members
// Each gets 2 keys = 20 keys total
// Rotate through keys for 200K req/min
const keys = [
    'wgpt_user1_premium',
    'wgpt_user2_premium',
    // ... more keys
];
```

### 3. High-Volume SaaS
```javascript
// Create 100 user accounts
// 100 premium keys = 1M req/min capacity
// Use key rotation for load balancing
```

---

## 🆘 Troubleshooting

### "Invalid API Key" Error

**Causes:**
- Key was revoked
- Key expired (if you set expiration)
- Typo in the key

**Solution:**
1. Check key is active: `GET /api-keys/:user_id`
2. Generate new key if needed
3. Update your code with correct key

### "Rate Limit Exceeded" Error

**Causes:**
- Exceeded per-minute limit
- Standard key exceeded daily limit

**Solution:**
1. Wait for limit to reset (1 minute)
2. Switch to Premium key for higher limits
3. Use multiple keys with rotation

### "Daily Limit Exceeded" Error

**Causes:**
- Standard key hit 100K daily limit

**Solution:**
- **Use your Premium Unlimited key!** 🚀

---

## 📚 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api-keys/generate` | Generate keys for new user |
| GET | `/api-keys/:user_id` | List all user keys |
| POST | `/api-keys/:user_id/create` | Create additional key |
| DELETE | `/api-keys/:user_id/:key_id` | Revoke a key |
| PUT | `/api-keys/:user_id/:key_id` | Update key settings |
| GET | `/api-keys/:user_id/usage` | Get usage stats |

### Key Types

| Type | Rate Limit | Daily Limit | Recommended For |
|------|------------|-------------|-----------------|
| `standard` | 1,000/min | 100,000/day | Development |
| `premium` | 10,000/min | UNLIMITED | Production |

---

## 🎉 Summary

✅ **Every user gets 2 FREE API keys**
✅ **Standard: 1K/min, 100K/day**
✅ **Premium: 10K/min, UNLIMITED/day**
✅ **No credit card required**
✅ **Keys never expire (unless you set expiration)**
✅ **Create additional keys anytime**
✅ **Revoke and regenerate as needed**

**Start building with unlimited AI power!** 🚀

---

For more information, visit the API documentation or contact support.
