# 🚀 FREE WormGPT Qwen API Deployment

## ✨ NO API KEY REQUIRED!

This deployment uses **ONLY free Qwen models** - no OpenRouter API key needed!

---

## 🎯 What You Get

| Feature | Details |
|---------|---------|
| **Model** | `qwen/qwen-3-4b:free` |
| **Cost** | 100% FREE |
| **API Key** | NOT REQUIRED |
| **Rate Limit** | 100 req/min (default) |
| **Upgrade** | Get FREE unlimited key at `/api-keys/generate` |

---

## 🚀 Deploy to Railway in 3 Steps

### Step 1: Connect Railway to GitHub

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `workingapi/WormGPT-api`

### Step 2: Set Environment Variables (MINIMAL)

In Railway Dashboard → Variables, add ONLY:

```bash
PORT=4100
NODE_ENV=production
```

**That's it!** No API key needed! 🎉

### Step 3: Deploy

Railway will automatically:
1. Build the project (~4 minutes)
2. Start the server
3. Run health check
4. Deploy successfully ✅

---

## 📡 API Usage

### Free Chat (No API Key)

```bash
curl https://your-project.railway.app/qwen/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, WormGPT!",
    "model": "qwen/qwen-3-4b:free"
  }'
```

**Response:**
```json
{
  "success": true,
  "model": "qwen/qwen-3-4b:free",
  "response": "Hello! How can I help you today?",
  "cached": false,
  "response_time_ms": 1250
}
```

### Get FREE Unlimited API Key

```bash
curl https://your-project.railway.app/api-keys/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "myuser123",
    "username": "myuser"
  }'
```

You'll receive 2 FREE keys:
- **Standard**: 1,000 req/min, 100K/day
- **Premium**: 10,000 req/min, **UNLIMITED/day** 🚀

### Use Your FREE Premium Key

```bash
curl https://your-project.railway.app/qwen/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wgpt_your-premium-key" \
  -d '{
    "message": "Hello with unlimited key!",
    "model": "qwen/qwen-3-4b:free"
  }'
```

---

## 📊 Free Tier Capacity

| Setup | Requests/Min | Requests/Day |
|-------|--------------|--------------|
| No API Key | 100 | 144,000 |
| Standard Key | 1,000 | 1,440,000 |
| Premium Key | 10,000 | **UNLIMITED** |

---

## 🔧 Optional Configuration

### Add Redis (Recommended)

1. Add Redis plugin in Railway
2. Copy `REDIS_URL` to variables
3. Enables 40-60% cache hit rate

### Increase Rate Limits

```bash
# In Railway Variables
RATE_LIMIT_DEFAULT=200
RATE_LIMIT_PREMIUM=2000
```

---

## ✅ Test Your Deployment

### 1. Health Check
```bash
curl https://your-project.railway.app/qwen/health
```

### 2. List Models
```bash
curl https://your-project.railway.app/qwen/models
```

### 3. Test Chat
```bash
curl https://your-project.railway.app/qwen/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "Test!", "model": "qwen/qwen-3-4b:free"}'
```

---

## 🎉 What Makes This FREE?

- **OpenRouter** provides `qwen/qwen-3-4b:free` at no cost
- **No API key required** for basic usage
- **User API keys** are free with unlimited tier
- **Railway free tier** available for small deployments

---

## 🆚 FREE vs Paid Deployment

| Feature | FREE Tier | Paid Tier |
|---------|-----------|-----------|
| Models | qwen-3-4b:free | All Qwen models |
| API Key | Not required | Required |
| Cost | $0 | Pay per token |
| Rate Limit | 100/min (default) | Higher limits |
| Context | 32K tokens | Up to 256K |
| Best For | Testing, MVP | Production, advanced |

---

## 📞 Troubleshooting

### Deployment Fails

**Check**: 
1. PORT=4100 is set
2. Build completes successfully
3. Health check path is `/qwen/health`

### API Returns Error

**Check logs** in Railway Dashboard for details

### Slow Response

**Solution**: Add Redis for caching

---

## 🎯 Next Steps

1. ✅ Deploy to Railway
2. ✅ Test the API
3. ✅ Get your FREE unlimited API key
4. ✅ Integrate with your WormGPT website
5. ✅ Enjoy unlimited FREE AI! 🚀

---

**No credit card. No API key. 100% FREE!** 🎉

For questions, check the logs or contact support.
