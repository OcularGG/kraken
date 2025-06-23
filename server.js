// 🚀 KRAKEN Production Server for Google Cloud Run
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // CSP for webhook security
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://api.retrovibes.fun; " +
        "frame-src https://na-map.netlify.app http://www.navalactioncraft.com;"
    );
    
    next();
});

// CORS configuration
const corsOptions = {
    origin: [
        'https://kraken.retrovibes.fun',
        'https://kraken-clan.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature'],
    credentials: true
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// API Routes (before static files to avoid conflicts)
app.use('/api/discord-webhook', require('./api/discord-webhook-ultra-secure'));
app.use('/api/health', require('./api/health'));
app.use('/api/init-db', require('./api/init-db'));
app.use('/api/init-db-postgres', require('./api/init-db-postgres'));
app.use('/api/test-db', require('./api/test-db'));
app.use('/api/db-test', require('./api/db-test'));
app.use('/api/applications', require('./api/applications'));
app.use('/api/port-battles', require('./api/port-battles'));
app.use('/api/signups', require('./api/signups'));
app.use('/api/captains', require('./api/captains'));
app.use('/api/gallery', require('./api/gallery'));

// Redirect .html URLs to clean URLs (301 permanent redirect for SEO)
// This MUST come before static files and general routing
app.get('/:page.html', (req, res) => {
    const page = req.params.page;
    res.redirect(301, `/${page}`);
});

// Static files (after redirects to avoid serving .html files directly)
app.use(express.static(path.join(__dirname), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Serve HTML files with clean URLs
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Clean URL routing (without .html extension)
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    
    // Skip API routes and specific endpoints
    if (page.startsWith('api') || page === 'health' || page === 'robots.txt' || page === 'sitemap.xml') {
        return next();
    }
    
    const filePath = path.join(__dirname, `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).sendFile(path.join(__dirname, 'index.html'));
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// SEO and robots files
app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 KRAKEN server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: Ultra-secure webhook protection enabled`);
});

module.exports = app;
