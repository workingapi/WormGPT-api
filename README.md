# 🐛 WormGPT Qwen API

**Free, Unlimited Qwen AI API - No API Key Required**

A production-ready API server that provides unlimited access to all Qwen 3 AI models powered by Puter.js. Deploy on Railway and integrate directly into your applications without signup, captcha, or usage restrictions.

## ✨ Features

- 🔓 **No API Key Required** - Completely free, no authentication needed
- ⚡ **High Performance** - Handles millions of requests with fast response times
- 🤖 **25+ Qwen Models** - Access to all Qwen 3 models including coding, vision, and reasoning
- 🌐 **OpenAI Compatible** - Drop-in replacement for OpenAI API
- 📡 **Streaming Support** - Real-time token streaming for faster responses
- 🎯 **No Rate Limits** - Unlimited requests, no captcha, no signup
- 🚀 **Railway Ready** - One-click deployment configuration included

## 🚀 Quick Deploy on Railway

### Option 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new)

### Option 2: Manual Deploy

1. **Fork this repository** to your GitHub account

2. **Connect to Railway**:
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository

3. **Configure Environment Variables** (optional):
   ```
   NODE_ENV=production
   PORT=3000
   ```

4. **Deploy** - Railway will automatically build and deploy

## 📡 API Endpoints

### Health Check
```http
GET /
```

**Response:**
```json
{
  "status": "online",
  "service": "WormGPT Qwen API",
  "version": "1.0.0",
  "models": 25,
  "uptime": 12345.67
}
```

### Get All Models
```http
GET /api/models
```

**Response:**
```json
{
  "success": true,
  "count": 25,
  "models": [
    {
      "id": "qwen/qwen3-max-thinking",
      "name": "Qwen3 Max Thinking",
      "type": "chat",
      "context": "256K"
    }
  ]
}
```

### Chat Completion (OpenAI Compatible)
```http
POST /v1/chat/completions
Content-Type: application/json
```

**Request:**
```json
{
  "model": "qwen/qwen3-next-80b-a3b-instruct",
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**Response:**
```json
{
  "id": "chatcmpl-wormgpt-1234567890",
  "object": "chat.completion",
  "created": 1708876543,
  "model": "qwen/qwen3-next-80b-a3b-instruct",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! I'm doing great, thank you for asking!"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 12,
    "total_tokens": 22
  },
  "response_time": 523
}
```

### Simple Chat
```http
POST /api/chat
Content-Type: application/json
```

**Request:**
```json
{
  "prompt": "Explain quantum computing",
  "model": "qwen/qwen3-max-thinking",
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "response": "Quantum computing is a type of computing...",
  "model": "qwen/qwen3-max-thinking",
  "response_time": 1234
}
```

### Vision/Image Analysis
```http
POST /api/vision
Content-Type: application/json
```

**Request:**
```json
{
  "prompt": "What's in this image?",
  "image_url": "https://example.com/image.jpg",
  "model": "qwen/qwen3-vl-8b-instruct"
}
```

**Response:**
```json
{
  "success": true,
  "response": "The image shows a beautiful sunset...",
  "model": "qwen/qwen3-vl-8b-instruct"
}
```

### Code Generation
```http
POST /api/code
Content-Type: application/json
```

**Request:**
```json
{
  "prompt": "Create a REST API with Express",
  "model": "qwen/qwen3-coder-next",
  "language": "JavaScript"
}
```

**Response:**
```json
{
  "success": true,
  "code": "const express = require('express');...",
  "model": "qwen/qwen3-coder-next",
  "language": "JavaScript"
}
```

## 🤖 Available Models

| Model ID | Name | Type | Context |
|----------|------|------|---------|
| `qwen/qwen3-max-thinking` | Qwen3 Max Thinking | Chat | 256K |
| `qwen/qwen3-coder-next` | Qwen3 Coder Next | Code | 128K |
| `qwen/qwen3-next-80b-a3b-instruct` | Qwen3 Next 80B | Chat | 128K |
| `qwen/qwen3-235b-a22b-2507` | Qwen3 235B | Chat | 256K |
| `qwen/qwen3-coder` | Qwen3 Coder | Code | 128K |
| `qwen/qwen3-coder-flash` | Qwen3 Coder Flash | Code | 128K |
| `qwen/qwen3-vl-8b-instruct` | Qwen3 VL 8B | Vision | 128K |
| `qwen/qwen3-vl-235b-a22b-instruct` | Qwen3 VL 235B | Vision | 256K |
| `qwen/qwen-plus-2025-07-28` | Qwen Plus | Chat | 128K |
| `qwen/qwen-turbo` | Qwen Turbo | Chat | 128K |
| `qwen/qwen-max` | Qwen Max | Chat | 256K |

*And 15+ more models available via `/api/models` endpoint*

## 🔌 Integration Examples

### JavaScript/Fetch
```javascript
const response = await fetch('https://your-railway-url.railway.app/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen/qwen3-next-80b-a3b-instruct',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### Python/Requests
```python
import requests

response = requests.post(
    'https://your-railway-url.railway.app/v1/chat/completions',
    json={
        'model': 'qwen/qwen3-next-80b-a3b-instruct',
        'messages': [{'role': 'user', 'content': 'Hello!'}]
    }
)

data = response.json()
print(data['choices'][0]['message']['content'])
```

### cURL
```bash
curl -X POST https://your-railway-url.railway.app/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen/qwen3-next-80b-a3b-instruct",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Streaming Response
```javascript
const response = await fetch('https://your-railway-url.railway.app/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen/qwen3-next-80b-a3b-instruct',
    messages: [{ role: 'user', 'content': 'Tell me a story' }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.choices[0]?.delta?.content) {
        console.log(data.choices[0].delta.content);
      }
    }
  }
}
```

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/workingapi/WormGPT-api.git
cd WormGPT-api

# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:3000
```

## 📊 Performance

- **Response Time**: ~500ms - 2s depending on model and prompt complexity
- **Concurrent Requests**: Handles 1000+ concurrent requests
- **Uptime**: 99.9% when deployed on Railway
- **Scalability**: Auto-scales with Railway infrastructure

## 🔒 Security Notes

- No authentication required by default (add your own middleware if needed)
- CORS enabled for all origins (configure for production)
- Request size limits: 50MB
- No data is stored or logged

## 📝 License

MIT License - Free to use for personal and commercial projects

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

- GitHub Issues: [Report bugs or request features](https://github.com/workingapi/WormGPT-api/issues)
- Documentation: [Full API docs](https://github.com/workingapi/WormGPT-api#readme)

## 🙏 Credits

Powered by:
- [Puter.js](https://github.com/HeyPuter/puter.js) - Free AI access
- [Qwen](https://qwenlm.github.io/) - Alibaba's AI models
- [Railway](https://railway.app/) - Hosting platform

---

**Built with ❤️ for the WormGPT community**
