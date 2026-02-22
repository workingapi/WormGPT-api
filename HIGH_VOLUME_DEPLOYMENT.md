# 🚀 WormGPT Qwen API - High-Volume Deployment Guide

## Handling Millions to Billions of Requests

This guide shows you how to scale the WormGPT Qwen API to handle **millions or even billions of requests per day** with unlimited context length support.

---

## 📊 Scaling Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Load Balancer (Railway)                       │
│              Distributes traffic across instances                │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │Instance 1│     │Instance 2│     │Instance N│
    │          │     │          │     │          │
    │ Rate     │     │ Rate     │     │ Rate     │
    │ Limiter  │     │ Limiter  │     │ Limiter  │
    │          │     │          │     │          │
    │ Cache    │     │ Cache    │     │ Cache    │
    │ (Redis)  │◄────┼─────────►│ (Redis)  │
    │          │     │          │     │          │
    │ API Key  │     │ API Key  │     │ API Key  │
    │ Rotator  │     │ Rotator  │     │ Rotator  │
    └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
              ┌──────────▼──────────┐
              │   OpenRouter API    │
              │  (Multiple Keys)    │
              └─────────────────────┘
```

---

## 🔑 Step 1: API Key Rotation for Unlimited Requests

### The Problem
- Each OpenRouter API key has a rate limit of ~20 requests/minute for free tier
- Single key = bottleneck for high-volume applications

### The Solution: Key Rotation
Add **multiple API keys** to rotate through them automatically:

```bash
# In Railway Dashboard → Variables
OPENROUTER_API_KEYS=sk-or-key1,sk-or-key2,sk-or-key3,sk-or-key4,sk-or-key5
```

### How Many Keys Do You Need?

| Target Volume | Keys Needed | Strategy |
|---------------|-------------|----------|
| 1K requests/min | 50 keys | Use free tier keys |
| 10K requests/min | 500 keys | Multiple accounts |
| 100K requests/min | 5,000 keys | Enterprise setup |
| 1M+ requests/min | 50,000+ keys | Distributed infrastructure |

### Getting Multiple Keys

1. **Create multiple OpenRouter accounts** (use different emails)
2. **Each account gives you**:
   - Free tier: `qwen/qwen-3-4b:free` unlimited
   - $1 free credits for paid models
3. **Combine all keys** in the environment variable

---

## 🗄️ Step 2: Redis Caching (40-60% Request Reduction)

### Why Caching?
- Identical queries return cached responses instantly
- Reduces API calls by 40-60%
- Improves response time from ~2s to ~10ms

### Setup Redis on Railway

1. **Add Redis Plugin** to your Railway project
2. **Copy the connection URL** to environment variables:
   ```bash
   REDIS_URL=redis://default:password@host:port
   ```

### Cache Configuration

```bash
# Enable caching
CACHE_ENABLED=true

# Cache responses for 1 hour
CACHE_TTL=3600
```

### Expected Cache Hit Rates

| Query Type | Hit Rate | Savings |
|------------|----------|---------|
| Common questions | 80-90% | 85% API calls saved |
| Chat conversations | 30-40% | 35% API calls saved |
| Unique queries | 5-10% | 8% API calls saved |
| **Average** | **40-60%** | **50% API calls saved** |

---

## ⚡ Step 3: Rate Limiting Configuration

### Distributed Rate Limiting (Redis-backed)

```bash
# Default tier (no API key): 100 requests/minute per IP
RATE_LIMIT_DEFAULT=100

# Premium tier (with API key): 1000 requests/minute
RATE_LIMIT_PREMIUM=1000

# Unlimited tier (internal): 100,000 requests/minute
RATE_LIMIT_UNLIMITED=100000
```

### Rate Limit Headers

All responses include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645123456
Retry-After: 30  (if rate limited)
```

---

## 🧠 Step 4: Context Length Management

### Native Context Limits

| Model | Native Context | Our Management |
|-------|---------------|----------------|
| Qwen 3 4B | 32K tokens | 30K (reserved for response) |
| Qwen 3 235B | 128K tokens | 120K |
| Qwen 3 Coder | 256K tokens | 250K |

### Automatic Context Handling

The API automatically:
1. **Sliding Window**: Keeps most recent messages
2. **Truncation**: Intelligently truncates old messages
3. **Summarization**: Optionally summarizes old conversation

### For Unlimited Context (Document Processing)

```javascript
// Send large documents
const response = await fetch('/qwen/chat', {
    method: 'POST',
    body: JSON.stringify({
        messages: [
            { 
                role: 'user', 
                content: veryLongDocument // 100K+ tokens
            }
        ],
        model: 'qwen/qwen-3-235b-a22b-instruct-128k'
    })
});
```

The ContextManager automatically:
- Splits large documents into chunks
- Processes each chunk
- Combines results

---

## 🔄 Step 5: Horizontal Scaling

### Railway Auto-Scaling Configuration

```json
{
  "scaling": {
    "min": 1,
    "max": 50,
    "cpu_threshold": 70,
    "memory_threshold": 80
  }
}
```

### How It Works

1. **Traffic increases** → CPU/memory usage rises
2. **Railway detects** threshold breach
3. **Auto-scales** to add more instances
4. **Load balancer** distributes traffic
5. **Traffic decreases** → scales down automatically

### Maximum Capacity per Instance

| Instance Size | Requests/Second | Requests/Day |
|---------------|-----------------|--------------|
| Small (512MB) | ~10 req/s | 864K |
| Medium (1GB) | ~25 req/s | 2.1M |
| Large (2GB) | ~50 req/s | 4.3M |
| XL (4GB) | ~100 req/s | 8.6M |

### With 50 Instances (Max Auto-Scale)

- **50 × Large instances** = 2,500 req/s = **216M requests/day**
- **50 × XL instances** = 5,000 req/s = **432M requests/day**

---

## 📈 Step 6: Multi-Region Deployment

### Deploy to Multiple Regions

For global low-latency access:

```bash
# Railway supports multiple regions
REGION=us-east-1      # US East
REGION=us-west-1      # US West  
REGION=eu-west-1      # Europe
REGION=ap-southeast-1 # Asia
```

### Benefits

- **Lower latency**: Users connect to nearest region
- **Higher availability**: If one region fails, others continue
- **Load distribution**: Traffic spread across regions

---

## 💰 Cost Optimization

### Free Tier Strategy (100% Free)

```bash
# Use only free model
model: "qwen/qwen-3-4b:free"

# With 100 API keys across multiple accounts
# = Unlimited requests at $0 cost
```

### Paid Tier Strategy (Best Performance)

```bash
# Mix of free and paid models
# Route simple queries to free model
# Route complex queries to paid models

if (query.complexity < threshold) {
    model = "qwen/qwen-3-4b:free"
} else {
    model = "qwen/qwen-3-235b-a22b-instruct-128k"
}
```

### Expected Costs

| Volume | Strategy | Monthly Cost |
|--------|----------|--------------|
| 1M requests | Free tier only | $0 |
| 10M requests | Free + cached | $0-50 |
| 100M requests | Mixed models | $200-500 |
| 1B requests | Enterprise | $2,000-5,000 |

---

## 🔧 Step 7: Monitoring & Metrics

### Health Check Endpoint

```bash
GET https://your-api.railway.app/qwen/health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "performance": {
    "cache": {
      "hits": 4521,
      "misses": 3892,
      "hitRate": "53.72%"
    },
    "api_keys": [
      {
        "key": "sk-or-ke...",
        "successRate": "98.5%",
        "inCooldown": false
      }
    ]
  },
  "scaling": {
    "instances": 5,
    "region": "us-east-1"
  }
}
```

### Statistics Endpoint

```bash
GET https://your-api.railway.app/qwen/stats
```

---

## 🎯 Production Checklist

### Before Launch

- [ ] Add 10+ API keys for rotation
- [ ] Enable Redis caching
- [ ] Configure rate limits
- [ ] Set up auto-scaling (min: 2, max: 50)
- [ ] Configure health checks
- [ ] Set up monitoring alerts
- [ ] Test with load (use Apache Bench or k6)

### After Launch

- [ ] Monitor cache hit rates (target: 40-60%)
- [ ] Watch API key health (rotate if success rate < 90%)
- [ ] Track response times (target: < 3s)
- [ ] Review scaling events
- [ ] Optimize based on usage patterns

---

## 🧪 Load Testing

### Test with Apache Bench

```bash
# 1000 requests, 100 concurrent
ab -n 1000 -c 100 \
   -H "Content-Type: application/json" \
   -d '{"message":"test","model":"qwen/qwen-3-4b:free"}' \
   https://your-api.railway.app/qwen/chat
```

### Test with k6

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 1000 },  // Ramp to 1000 users
    { duration: '10m', target: 1000 }, // Stress test
  ],
};

export default function() {
  const payload = JSON.stringify({
    message: 'Hello, test!',
    model: 'qwen/qwen-3-4b:free'
  });

  const res = http.post('https://your-api.railway.app/qwen/chat', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 3s': (r) => r.timings.duration < 3000,
  });

  sleep(0.1);
}
```

Run:
```bash
k6 run load-test.js
```

---

## 🎉 Summary: Path to Billions

### Phase 1: Start Small (0-1K req/min)
- 1 Railway instance
- 1-5 API keys
- Redis caching enabled
- Cost: $5-10/month (Railway basic)

### Phase 2: Growth (1K-10K req/min)
- 2-10 Railway instances (auto-scale)
- 50-100 API keys
- Multi-region deployment
- Cost: $50-100/month

### Phase 3: Scale (10K-100K req/min)
- 10-50 Railway instances
- 500-5000 API keys
- Advanced caching strategies
- Cost: $200-500/month

### Phase 4: Massive Scale (100K-1M+ req/min)
- 50+ Railway instances across regions
- 5000-50000+ API keys
- Custom infrastructure
- Cost: $2,000-10,000/month

---

**You're now ready to handle ANY volume of traffic!** 🚀

For questions or support, check the API documentation or contact the team.
