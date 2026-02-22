# WormGPT Qwen API - Railway Deployment

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

A high-performance, production-ready Qwen AI API built on Puter infrastructure. Deploy directly to Railway for seamless integration with your WormGPT website - **no signup, no captcha, direct API access**.

## 🚀 Quick Deploy

### Option 1: One-Click Deploy on Railway

1. Click the "Deploy on Railway" button above
2. Connect your GitHub repository
3. Configure environment variables (see below)
4. Deploy!

### Option 2: Manual Deploy

```bash
# Clone the repository
git clone https://github.com/workingapi/WormGPT-api.git
cd WormGPT-api

# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## 🔧 Environment Variables

Set these in your Railway dashboard:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `4100` |
| `OPENROUTER_API_KEY` | OpenRouter API key for Qwen models | `sk-or-...` |
| `JWT_SECRET` | Random secret for sessions | `your-secret-here` |

### ⚠️ Important: Why You Need an API Key

**Puter.com** provides free Qwen access through their hosted platform (`api.puter.com`) using their "User-Pays" model where each user's activity covers costs.

When **self-hosting on Railway**, you're running your own instance, so you need to configure an AI provider:

- **OpenRouter** (recommended): All Qwen models, free tier available
- **TogetherAI**: Alternative provider with some Qwen models
- **Direct Qwen API**: If you have Alibaba Cloud access

**Free Option**: OpenRouter provides `qwen/qwen-3-4b:free` completely free!

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `DOMAIN` | Your Railway domain | `auto-detected` |
| `PROTOCOL` | Protocol (http/https) | `https` |
| `DEFAULT_QWEN_MODEL` | Default Qwen model | `qwen/qwen-3-4b:free` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `NODE_ENV` | Environment | `production` |

## 📡 API Endpoints

### Base URL
```
https://your-project.railway.app/qwen
```

### 1. Chat Endpoint

**POST** `/qwen/chat`

Send a message to Qwen AI.

#### Request Body

```json
{
  "message": "Hello, how are you?",
  "model": "qwen/qwen-3-4b:free",
  "stream": false,
  "temperature": 0.7,
  "max_tokens": 1000,
  "system_prompt": "You are a helpful assistant."
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes* | User message (or use `messages` array) |
| `messages` | array | Yes* | Array of message objects for conversation history |
| `model` | string | No | Model ID (default: `qwen/qwen-3-4b:free`) |
| `stream` | boolean | No | Enable streaming responses (default: `false`) |
| `temperature` | number | No | Sampling temperature (default: `0.7`) |
| `max_tokens` | number | No | Maximum tokens in response |
| `system_prompt` | string | No | System instruction for the AI |
| `image` | string | No | Image URL for vision models |

*Either `message` or `messages` is required.

#### Response

```json
{
  "success": true,
  "model": "qwen/qwen-3-4b:free",
  "response": "Hello! I'm doing well. How can I help you today?",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 12,
    "total_tokens": 27
  },
  "timestamp": "2026-02-22T12:00:00.000Z"
}
```

### 2. Models Endpoint

**GET** `/qwen/models`

Get list of available Qwen models.

#### Response

```json
{
  "success": true,
  "models": [
    {
      "id": "qwen/qwen-3-4b:free",
      "name": "Qwen 3 4B (Free)",
      "description": "Free tier for general chat",
      "context_length": 32768,
      "recommended_for": ["general_chat", "casual_conversation"]
    },
    {
      "id": "qwen/qwen-3-235b-a22b-instruct-128k",
      "name": "Qwen 3 235B A22B Instruct",
      "description": "Advanced conversations with 128K context",
      "context_length": 131072,
      "recommended_for": ["advanced_chat", "long_context"]
    }
  ],
  "default_model": "qwen/qwen-3-4b:free",
  "api_version": "1.0.0"
}
```

### 3. Health Check

**GET** `/qwen/health`

Check API health status.

#### Response

```json
{
  "success": true,
  "status": "healthy",
  "service": "WormGPT Qwen API",
  "version": "1.0.0",
  "timestamp": "2026-02-22T12:00:00.000Z"
}
```

## 🎯 Available Qwen Models

| Model ID | Name | Context | Pricing | Best For |
|----------|------|---------|---------|----------|
| `qwen/qwen-3-4b:free` | Qwen 3 4B | 32K | 🆓 **FREE** | General chat, testing |
| `qwen/qwen-3-30b-a3b-instruct` | Qwen 3 30B | 128K | 💰 Paid | Balanced performance |
| `qwen/qwen-3-32b-instruct` | Qwen 3 32B | 128K | 💰 Paid | Instruction following |
| `qwen/qwen-3-235b-a22b-instruct-128k` | Qwen 3 235B | 128K | 💰 Paid | Advanced conversations |
| `qwen/qwen-3-coder-480b-a35b-instruct` | Qwen 3 Coder 480B | 256K | 💰 Paid | Code generation |
| `qwen/qwen-3-max-thinking` | Qwen 3 Max Thinking | 64K | 💰 Paid | Complex reasoning |
| `qwen/qwen-3-vl-235b-a22b-instruct` | Qwen 3 Vision 235B | 128K | 💰 Paid | Image analysis |

**Note**: The free model (`qwen/qwen-3-4b:free`) is perfect for most use cases! Paid models offer better quality for complex tasks.

## 💻 Integration Examples

### JavaScript/Node.js

```javascript
const API_URL = 'https://your-railway-domain.railway.app';

async function chatWithQwen(message, model = 'qwen/qwen-3-4b:free') {
  const response = await fetch(`${API_URL}/qwen/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      model,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  
  if (data.success) {
    return data.response;
  } else {
    throw new Error(data.error);
  }
}

// Usage
chatWithQwen('Hello!')
  .then(response => console.log(response))
  .catch(console.error);
```

### Python

```python
import requests

API_URL = 'https://your-railway-domain.railway.app'

def chat_with_qwen(message, model='qwen/qwen-3-4b:free'):
    response = requests.post(
        f'{API_URL}/qwen/chat',
        json={
            'message': message,
            'model': model,
            'temperature': 0.7
        }
    )
    data = response.json()
    
    if data['success']:
        return data['response']
    else:
        raise Exception(data['error'])

# Usage
print(chat_with_qwen('Hello!'))
```

### HTML/JavaScript (Direct Browser Integration)

```html
<!DOCTYPE html>
<html>
<head>
    <title>WormGPT AI Chat</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .chat-container {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .messages {
            max-height: 500px;
            overflow-y: auto;
            margin-bottom: 20px;
        }
        .message {
            margin: 10px 0;
            padding: 12px 16px;
            border-radius: 8px;
            max-width: 80%;
        }
        .user {
            background: #007bff;
            color: white;
            margin-left: auto;
        }
        .ai {
            background: #e9ecef;
            color: #333;
        }
        textarea {
            width: 100%;
            min-height: 100px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            resize: vertical;
            font-size: 14px;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 10px;
        }
        button:hover {
            background: #0056b3;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .loading {
            display: inline-block;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <h1>🤖 WormGPT - Qwen AI Chat</h1>
        <div class="messages" id="messages"></div>
        <textarea id="input" placeholder="Type your message..." rows="3"></textarea>
        <button id="sendBtn" onclick="sendMessage()">Send</button>
    </div>

    <script>
        const API_URL = 'https://your-railway-domain.railway.app';
        const messagesDiv = document.getElementById('messages');
        const input = document.getElementById('input');
        const sendBtn = document.getElementById('sendBtn');

        // Add message to chat
        function addMessage(text, isUser) {
            const div = document.createElement('div');
            div.className = `message ${isUser ? 'user' : 'ai'}`;
            div.textContent = text;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Send message
        async function sendMessage() {
            const message = input.value.trim();
            if (!message) return;

            // Add user message
            addMessage(message, true);
            input.value = '';
            sendBtn.disabled = true;

            try {
                const response = await fetch(`${API_URL}/qwen/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        model: 'qwen/qwen-3-4b:free',
                        temperature: 0.7
                    })
                });

                const data = await response.json();

                if (data.success) {
                    addMessage(data.response, false);
                } else {
                    addMessage(`Error: ${data.error}`, false);
                }
            } catch (error) {
                addMessage(`Error: ${error.message}`, false);
            } finally {
                sendBtn.disabled = false;
                input.focus();
            }
        }

        // Send on Enter (without Shift)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

### React

```jsx
import { useState } from 'react';

function WormGPTChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://your-railway-domain.railway.app/qwen/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: 'qwen/qwen-3-4b:free',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg.role}: {msg.content}</div>
        ))}
      </div>
      <input 
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
        disabled={loading}
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
```

## 🔒 Security Notes

### For Production Deployment

1. **Set a strong JWT_SECRET**: Generate a random 32+ character secret
2. **Restrict CORS**: Set `CORS_ORIGIN` to your specific domain
3. **Use HTTPS**: Railway provides HTTPS automatically
4. **Rate Limiting**: Consider adding rate limiting middleware
5. **API Key Protection**: Keep your `OPENROUTER_API_KEY` secret

### Current Configuration

This API is configured for **direct integration** without:
- ❌ User signup requirements
- ❌ Captcha challenges
- ❌ Authentication barriers

Perfect for embedding in your WormGPT website!

## 🛠️ Troubleshooting

### API Returns 500 Error

1. Check Railway logs: `railway logs`
2. Verify `OPENROUTER_API_KEY` is set correctly
3. Ensure the service has started successfully

### CORS Errors

1. The API includes CORS headers for all origins (`*`)
2. If you restrict `CORS_ORIGIN`, ensure it matches your frontend domain

### Model Not Available

1. Check available models: `GET /qwen/models`
2. Some models may require higher OpenRouter tiers
3. Use `qwen/qwen-3-4b:free` for free tier access

### Slow Response Times

1. Check Railway resource usage
2. Consider upgrading Railway plan
3. Use smaller models for faster responses

## 📊 Monitoring

View logs and metrics in Railway dashboard:
- Real-time logs
- Resource usage (CPU, Memory)
- Request metrics
- Error tracking

## 🔄 Updates

To update your deployment:

```bash
# Push changes to GitHub
git add .
git commit -m "Update WormGPT API"
git push

# Railway will auto-deploy if connected
# Or manually trigger: railway up
```

## 📝 License

This project is built on Puter, which is licensed under AGPL-3.0.

## 🤝 Support

- **Documentation**: [Puter Developer Docs](https://developer.puter.com)
- **Railway Docs**: [Railway Documentation](https://docs.railway.app)
- **OpenRouter**: [OpenRouter Documentation](https://openrouter.ai/docs)

## 🎉 Features

✅ **No Authentication** - Direct API access  
✅ **No Captcha** - Seamless integration  
✅ **All Qwen 3 Models** - Full model access  
✅ **Streaming Support** - Real-time responses  
✅ **Vision Support** - Image analysis capabilities  
✅ **CORS Enabled** - Browser-ready  
✅ **Railway Optimized** - Production deployment  
✅ **Free Tier Friendly** - Works with OpenRouter free credits  

---

**Ready to deploy!** 🚀
