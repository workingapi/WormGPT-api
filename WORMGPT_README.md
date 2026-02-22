# WormGPT - Railway Deployment Guide

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/wormgpt)

## Setup Instructions

### 1. Deploy to Railway

```bash
# Connect to Railway
railway login

# Initialize Railway project
railway init

# Deploy
railway up
```

### 2. Configure Environment Variables

In Railway dashboard, set these variables:

```bash
# Required
PORT=4100
DOMAIN=your-project.railway.app
PROTOCOL=https

# Optional - Customize secrets
JWT_SECRET=your-random-secret-here
COOKIE_NAME=wormgpt-session
```

### 3. Update Config

Edit `volatile/config/config.json`:
- Change `domain` to your Railway domain
- Update secrets for production

## API Integration for WormGPT Website

### Direct Qwen 3 API (No Auth Required)

#### Chat Endpoint
```javascript
// POST https://your-railway-domain.railway.app/qwen/chat
const response = await fetch('https://your-railway-domain.railway.app/qwen/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        message: "Hello, how are you?",
        model: "qwen/qwen3-4b:free",  // Optional, default model
        stream: false  // Optional, for streaming responses
    })
});

const data = await response.json();
console.log(data.response);
```

#### Get Available Models
```javascript
// GET https://your-railway-domain.railway.app/qwen/models
const response = await fetch('https://your-railway-domain.railway.app/qwen/models');
const data = await response.json();
console.log(data.models);
```

### Available Qwen 3 Models

| Model ID | Description | Use Case |
|----------|-------------|----------|
| `qwen/qwen3-4b:free` | Qwen 3 4B | Free tier, general chat |
| `qwen/qwen3-next-80b-a3b-instruct` | Qwen 3 Next 80B | Advanced conversations |
| `qwen/qwen3-coder-next` | Qwen 3 Coder | Code generation |
| `qwen/qwen3-max-thinking` | Qwen 3 Max | Complex reasoning |
| `qwen/qwen3-vl-8b-instruct` | Qwen 3 Vision | Image analysis |

### Complete Integration Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>WormGPT AI Chat</title>
    <style>
        #chat { max-width: 800px; margin: 50px auto; padding: 20px; }
        .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .user { background: #e3f2fd; }
        .ai { background: #f5f5f5; }
        textarea { width: 100%; height: 100px; }
        button { padding: 10px 20px; margin-top: 10px; }
    </style>
</head>
<body>
    <div id="chat">
        <h1>WormGPT - Qwen 3 AI</h1>
        <div id="messages"></div>
        <textarea id="input" placeholder="Type your message..."></textarea>
        <br>
        <button onclick="sendMessage()">Send</button>
    </div>

    <script>
        const API_URL = 'https://your-railway-domain.railway.app';

        async function sendMessage() {
            const input = document.getElementById('input');
            const messages = document.getElementById('messages');
            const message = input.value.trim();

            if (!message) return;

            // Add user message
            messages.innerHTML += `<div class="message user"><strong>You:</strong> ${message}</div>`;
            input.value = '';

            // Call API
            try {
                const response = await fetch(`${API_URL}/qwen/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: message,
                        model: 'qwen/qwen3-4b:free'
                    })
                });

                const data = await response.json();

                // Add AI response
                messages.innerHTML += `<div class="message ai"><strong>WormGPT:</strong> ${data.response}</div>`;
                messages.scrollTop = messages.scrollHeight;
            } catch (error) {
                messages.innerHTML += `<div class="message ai"><strong>Error:</strong> ${error.message}</div>`;
            }
        }
    </script>
</body>
</html>
```

## Features

✅ **No Authentication Required** - Direct API access
✅ **No Captcha** - Seamless integration
✅ **Qwen 3 Models** - Access to all Qwen models
✅ **Free Tier** - Uses Puter's free Qwen access
✅ **Easy Integration** - Simple REST API
✅ **Self-Hosted** - Full control on Railway

## Configuration Options

### Enable/Disable Features

Edit `volatile/config/config.json`:

```json
{
    "captcha": {
        "enabled": false  // Set to true to enable captcha
    },
    "disable_temp_users": true,  // Keep true for no signup
    "allow_anonymous_api_access": true,  // Allow API without auth
    "api_allow_no_auth": true  // Allow unauthenticated API calls
}
```

## Troubleshooting

### CORS Issues
Add CORS headers in your Railway app or use a proxy.

### API Not Responding
Check Railway logs: `railway logs`

### Model Not Available
Some Qwen models may require API keys. The free tier model `qwen/qwen3-4b:free` should always work.

## Support

- Documentation: https://developer.puter.com
- Railway Docs: https://docs.railway.app
- Puter GitHub: https://github.com/HeyPuter/puter
