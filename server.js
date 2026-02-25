const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for easy integration
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    // If browser request, serve the HTML
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        // API health check
        res.json({
            status: 'online',
            service: 'WormGPT Qwen API',
            version: '1.0.0',
            message: 'For chat interface, visit http://localhost:' + PORT
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
            type: 'internal_error'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Endpoint not found',
            type: 'not_found_error'
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🐛 WormGPT Qwen API Server                              ║
║                                                           ║
║   Server running on port ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'production'}                             ║
║                                                           ║
║   Open in browser:                                        ║
║   👉 http://localhost:${PORT}                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
