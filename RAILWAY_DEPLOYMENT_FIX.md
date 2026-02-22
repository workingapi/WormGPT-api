# 🚀 Railway Deployment Quick Fix Guide

## ⚠️ If Your Deployment Is Failing

Follow these steps to fix the health check issue:

### Step 1: Set Required Environment Variables

In Railway Dashboard → Variables, add these:

```bash
# Required
PORT=4100
NODE_ENV=production

# For AI to work (get from https://openrouter.ai)
OPENROUTER_API_KEY=sk-or-your-key-here

# Optional but recommended
REDIS_URL=redis://your-railway-redis-url  # Add Redis plugin first
```

### Step 2: Add Redis Plugin (Optional but Recommended)

1. Go to Railway Dashboard
2. Click "New" → "Redis"
3. Copy the `REDIS_URL` connection string
4. Add to your WormGPT-api service variables

### Step 3: Redeploy

After setting variables:
1. Go to Deployments tab
2. Click "Deploy" → "Deploy from latest commit"

### Step 4: Check Logs

If still failing:
1. Go to Logs tab
2. Look for error messages
3. Common issues:
   - Missing `OPENROUTER_API_KEY`
   - Port mismatch
   - Build errors

---

## ✅ Successful Deployment Checklist

- [ ] Build completes successfully (~4-5 minutes)
- [ ] Health check passes (`/qwen/health`)
- [ ] Logs show "Server started" message
- [ ] Can access `https://your-project.railway.app/qwen/health`

---

## 🔧 Troubleshooting

### "Health check failed" repeatedly

**Solution 1**: Wait longer - first startup can take 2-3 minutes

**Solution 2**: Check if service is actually running
```bash
# In Railway Logs, look for:
✅ Server started on port 4100
```

**Solution 3**: Manually test the endpoint
```bash
curl https://your-project.railway.app/qwen/health
```

### "Cannot find module" errors

**Cause**: TypeScript build failed

**Solution**:
```bash
# Check build logs for TypeScript errors
# Common fix: Clear cache and redeploy
```

### Service starts then immediately restarts

**Cause**: Missing environment variables

**Solution**: Add at minimum:
```bash
PORT=4100
NODE_ENV=production
```

### API returns 500 errors

**Cause**: Missing OpenRouter API key

**Solution**: 
1. Get key from https://openrouter.ai
2. Add to Railway variables: `OPENROUTER_API_KEY=sk-or-...`
3. Redeploy

---

## 📊 Expected Startup Logs

```
🚀 Starting WormGPT Qwen API...
📝 Creating default configuration...
⚙️  Configuration:
   PORT: 4100
   NODE_ENV: production
   OPENROUTER_API_KEY: ***CONFIGURED***
🌟 Starting Puter server...
[Puter] Server started on port 4100
✅ Qwen API router mounted at /qwen
✅ User API Key router mounted at /
```

---

## 🎯 Test Your Deployment

Once deployed, test these endpoints:

### 1. Health Check
```bash
curl https://your-project.railway.app/qwen/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "service": "WormGPT Qwen API"
}
```

### 2. List Models
```bash
curl https://your-project.railway.app/qwen/models
```

### 3. Test Chat (with API key)
```bash
curl https://your-project.railway.app/qwen/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wgpt_your-key-here" \
  -d '{"message": "Hello!", "model": "qwen/qwen-3-4b:free"}'
```

---

## 🔑 Get Your First API Keys

After deployment, generate your unlimited API keys:

```bash
curl https://your-project.railway.app/api-keys/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "admin",
    "username": "admin"
  }'
```

Save the keys immediately - you'll get:
- **Standard Key**: 1K req/min, 100K/day
- **Premium Key**: 10K req/min, **UNLIMITED/day** 🚀

---

## 💡 Pro Tips

1. **Add Redis** for 40-60% fewer API calls (caching)
2. **Set multiple API keys** for higher throughput:
   ```bash
   OPENROUTER_API_KEYS=key1,key2,key3
   ```
3. **Monitor logs** during first deployment
4. **Test health endpoint** before integrating

---

## 📞 Still Having Issues?

1. Check full logs in Railway Dashboard
2. Verify all environment variables are set
3. Try redeploying from scratch
4. Check Railway status page for outages

**Common successful configuration:**
```bash
PORT=4100
NODE_ENV=production
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
CACHE_ENABLED=true
```

Good luck with your deployment! 🎉
