// 🔒 ULTRA-SECURE Discord Webhook API - Server-Side Only
// ⚠️  CRITICAL: NEVER expose Discord webhook URLs to client-side code
// ⚠️  CRITICAL: Always use environment variables for webhook URLs
// ⚠️  CRITICAL: Immediately revoke any exposed webhook URLs

const https = require('https');
const { URL } = require('url');
const { createHash, randomBytes, timingSafeEqual } = require('crypto');

// 🔐 SECURITY CONFIGURATION - Environment Variables Required
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || randomBytes(32).toString('hex');
const API_KEY = process.env.WEBHOOK_API_KEY; // Optional additional auth layer
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Reduced from 15 for tighter security
const MAX_CONTENT_LENGTH = 8 * 1024 * 1024; // Reduced to 8MB
const REQUEST_TIMEOUT = 8000; // Reduced timeout

// 🚨 BANNED WEBHOOK PATTERNS - These are compromised/example URLs
const BANNED_WEBHOOK_PATTERNS = [
    '1386130290640162857', // Example webhook ID - NEVER use in production
    'example',
    'test',
    'default'
];

// In-memory rate limiting (use Redis/Database in production)
const rateLimitStore = new Map();
const requestCounts = new Map();
const suspiciousIPs = new Set(); // Track suspicious activity

// 🔐 STRICT ALLOWED ORIGINS - Only your verified domains
const ALLOWED_ORIGINS = [
    'https://kraken-clan.vercel.app',
    'https://your-custom-domain.com', // Replace with your actual domain
    // Remove localhost in production for maximum security
    ...(process.env.NODE_ENV === 'development' ? [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ] : [])
];

// Security validation functions
function validateRequest(req) {
    // Validate Discord webhook URL is configured and not default
    if (!DISCORD_WEBHOOK_URL || 
        !DISCORD_WEBHOOK_URL.includes('discord.com/api/webhooks/') ||
        DISCORD_WEBHOOK_URL.includes('1386130290640162857')) { // Block default/example URL
        throw new Error('Discord webhook not properly configured');
    }
    
    // Validate content length
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > MAX_CONTENT_LENGTH) {
        throw new Error('Request payload too large');
    }
    
    return true;
}

function applyRateLimit(req) {
    // Get client identifier (IP address)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     'unknown';
    
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Clean expired entries
    for (const [key, timestamp] of rateLimitStore.entries()) {
        if (timestamp < windowStart) {
            rateLimitStore.delete(key);
            requestCounts.delete(key);
        }
    }
    
    // Check rate limit for this client
    const requestCount = requestCounts.get(clientIp) || 0;
    if (requestCount >= RATE_LIMIT_MAX_REQUESTS) {
        throw new Error(`Rate limit exceeded: ${requestCount}/${RATE_LIMIT_MAX_REQUESTS} requests per minute`);
    }
    
    // Update counters
    requestCounts.set(clientIp, requestCount + 1);
    rateLimitStore.set(clientIp, now);
    
    return clientIp;
}

function sanitizePayload(data) {
    // Recursively sanitize data to prevent injection attacks
    if (typeof data === 'string') {
        return data
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/data:/gi, '') // Remove data: URLs  
            .substring(0, 4000); // Limit length
    }
    
    if (Array.isArray(data)) {
        return data.slice(0, 50).map(item => sanitizePayload(item));
    }
    
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        let fieldCount = 0;
        for (const [key, value] of Object.entries(data)) {
            if (fieldCount >= 100) break;
            const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
            sanitized[cleanKey] = sanitizePayload(value);
            fieldCount++;
        }
        return sanitized;
    }
    
    return data;
}

module.exports = async (req, res) => {
    const startTime = Date.now();
    
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CORS headers with strict origin checking
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        console.warn('⚠️ Invalid method attempted:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    let clientIp = 'unknown';
    
    try {
        // Apply security validations
        validateRequest(req);
        clientIp = applyRateLimit(req);
        
        console.log('🔒 Secure webhook request from:', clientIp.substring(0, 10), 'at:', new Date().toISOString());
        
        // Validate request body
        if (!req.body) {
            throw new Error('Request body is required');
        }
        
        // Sanitize the payload
        const sanitizedPayload = sanitizePayload(req.body);
        
        // Add security metadata
        const securePayload = {
            ...sanitizedPayload,
            _meta: {
                timestamp: new Date().toISOString(),
                source: 'kraken-secure-api',
                requestId: randomBytes(8).toString('hex')
            }
        };
        
        // Send to Discord
        await sendToDiscord(securePayload);
        
        const processingTime = Date.now() - startTime;
        console.log('✅ Webhook delivered securely in', processingTime, 'ms');
        
        return res.status(200).json({
            success: true,
            message: 'Message delivered successfully',
            processingTime: processingTime
        });
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Secure webhook error:', {
            error: error.message,
            clientIp: clientIp.substring(0, 10),
            processingTime: processingTime,
            timestamp: new Date().toISOString()
        });
        
        // Return generic error message to prevent information leakage
        let statusCode = 500;
        let errorMessage = 'Internal server error';
        
        if (error.message.includes('Rate limit')) {
            statusCode = 429;
            errorMessage = 'Too many requests';
        } else if (error.message.includes('payload too large')) {
            statusCode = 413;
            errorMessage = 'Request too large';
        } else if (error.message.includes('not properly configured')) {
            statusCode = 503;
            errorMessage = 'Service temporarily unavailable';
        }
        
        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            processingTime: processingTime
        });
    }
};

async function sendToDiscord(payload) {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(DISCORD_WEBHOOK_URL);
            const postData = JSON.stringify(payload);
            
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'KRAKEN-Secure-Webhook/1.0'
                },
                timeout: 10000 // 10 second timeout
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log('✅ Discord API responded successfully');
                        resolve({ statusCode: res.statusCode, data: data });
                    } else {
                        console.error('❌ Discord API error:', {
                            statusCode: res.statusCode,
                            response: data.substring(0, 500)
                        });
                        reject(new Error(`Discord API error: ${res.statusCode}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('❌ Request error:', error.message);
                reject(new Error('Network error'));
            });
            
            req.on('timeout', () => {
                console.error('❌ Request timeout');
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.write(postData);
            req.end();
            
        } catch (error) {
            console.error('❌ Discord send error:', error.message);
            reject(error);
        }
    });
}

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Webhook request received at:', new Date().toISOString());
    console.log('Request method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Check if this is a multipart/form-data request (with file upload)
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data with file upload
      console.log('Processing multipart form data with file upload...');
      
      // For Vercel, we need to handle the raw body
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        return res.status(400).json({ error: 'Missing boundary in multipart data' });
      }
      
      // Get raw body as buffer
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        
        // Forward the multipart data directly to Discord
        await forwardMultipartToDiscord(buffer, contentType, res);
      });
      
    } else {
      // Handle JSON payload (existing functionality)
      console.log('Processing JSON payload...');
      const payload = req.body;
      
      // Validate that we have the required Discord webhook structure
      if (!payload.embeds || !Array.isArray(payload.embeds) || payload.embeds.length === 0) {
        console.error('Invalid payload structure:', payload);
        return res.status(400).json({ error: 'Invalid payload structure' });
      }
      
      await sendJsonToDiscord(payload, res);
    }

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

async function forwardMultipartToDiscord(buffer, contentType, res) {
  return new Promise((resolve, reject) => {
    const url = new URL(DISCORD_WEBHOOK_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length
      }
    };

    const discordRequest = https.request(options, (discordRes) => {
      let data = '';
      
      discordRes.on('data', (chunk) => {
        data += chunk;
      });
      
      discordRes.on('end', () => {
        if (discordRes.statusCode >= 200 && discordRes.statusCode < 300) {
          console.log('Successfully sent multipart data to Discord');
          res.status(200).json({ success: true });
          resolve();
        } else {
          console.error('Discord webhook error:', {
            status: discordRes.statusCode,
            statusMessage: discordRes.statusMessage,
            data: data
          });
          res.status(500).json({ 
            error: 'Discord webhook error', 
            details: data || `HTTP ${discordRes.statusCode}: ${discordRes.statusMessage}` 
          });
          reject(new Error('Discord webhook error'));
        }
      });
    });

    discordRequest.on('error', (err) => {
      console.error('Discord request error:', err);
      res.status(500).json({ error: 'Network error', details: err.message });
      reject(err);
    });

    discordRequest.write(buffer);
    discordRequest.end();
  });
}

async function sendJsonToDiscord(payload, res) {
  return new Promise((resolve, reject) => {
    const url = new URL(DISCORD_WEBHOOK_URL);
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const discordRequest = https.request(options, (discordRes) => {
      let data = '';
      
      discordRes.on('data', (chunk) => {
        data += chunk;
      });
      
      discordRes.on('end', () => {
        if (discordRes.statusCode >= 200 && discordRes.statusCode < 300) {
          console.log('Successfully sent JSON to Discord');
          res.status(200).json({ success: true });
          resolve();
        } else {
          console.error('Discord webhook error:', {
            status: discordRes.statusCode,
            statusMessage: discordRes.statusMessage,
            data: data
          });
          res.status(500).json({ 
            error: 'Discord webhook error', 
            details: data || `HTTP ${discordRes.statusCode}: ${discordRes.statusMessage}` 
          });
          reject(new Error('Discord webhook error'));
        }
      });
    });

    discordRequest.on('error', (err) => {
      console.error('Discord request error:', err);
      res.status(500).json({ error: 'Network error', details: err.message });
      reject(err);
    });

    discordRequest.write(postData);
    discordRequest.end();
  });
}
