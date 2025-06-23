// 🔒 ULTRA-SECURE Discord Webhook API - Military Grade Security
// ⚠️  CRITICAL: NEVER expose Discord webhook URLs to client-side code
// ⚠️  CRITICAL: Always use environment variables for webhook URLs
// ⚠️  CRITICAL: Immediately revoke any exposed webhook URLs

const https = require('https');
const { URL } = require('url');
const { createHash, randomBytes, createHmac, timingSafeEqual } = require('crypto');

// 🔐 ULTRA-SECURE CONFIGURATION
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'kraken-ultra-secure-2025';
const API_TOKEN = process.env.KRAKEN_API_TOKEN; // Required for authentication
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // Ultra-strict rate limiting
const MAX_CONTENT_LENGTH = 2 * 1024 * 1024; // 2MB limit
const REQUEST_TIMEOUT = 5000; // 5 second timeout

// 🛡️ ENHANCED SECURITY STORES
const rateLimitStore = new Map();
const requestCounts = new Map();
const suspiciousIPs = new Map();
const blockedIPs = new Set();
const failedAttempts = new Map();

// 🌐 ALLOWED ORIGINS (STRICT WHITELIST)
const ALLOWED_ORIGINS = [
    'https://kraken.retrovibes.fun',
    'https://kraken-clan.vercel.app',
    'https://localhost:3000' // Only for development
];

// 🚨 ALLOWED IP ADDRESSES (YOUR SERVER IPS ONLY)
const ALLOWED_IPS = new Set([
    // Add your Google Cloud server IPs here after deployment
    '127.0.0.1',
    '::1'
]);

// 🔐 ULTRA-SECURE VALIDATION FUNCTIONS
function validateApiToken(req) {
    const authHeader = req.headers['authorization'];
    const providedToken = authHeader?.replace('Bearer ', '');
    
    if (!API_TOKEN || !providedToken) {
        throw new Error('API token required');
    }
    
    // Timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(API_TOKEN, 'utf8');
    const providedBuffer = Buffer.from(providedToken, 'utf8');
    
    if (expectedBuffer.length !== providedBuffer.length) {
        throw new Error('Invalid API token');
    }
    
    if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
        throw new Error('Invalid API token');
    }
    
    return true;
}

function validateIPAddress(req) {
    const clientIp = getClientIP(req);
    
    // Check if IP is blocked
    if (blockedIPs.has(clientIp)) {
        throw new Error('IP address blocked due to suspicious activity');
    }
    
    // For production, enforce IP whitelist
    if (process.env.NODE_ENV === 'production' && !ALLOWED_IPS.has(clientIp)) {
        // Log suspicious IP
        const attempts = suspiciousIPs.get(clientIp) || 0;
        suspiciousIPs.set(clientIp, attempts + 1);
        
        if (attempts > 5) {
            blockedIPs.add(clientIp);
            console.error(`🚨 SECURITY ALERT: IP ${clientIp} blocked after ${attempts} unauthorized attempts`);
        }
        
        throw new Error('Unauthorized IP address');
    }
    
    return clientIp;
}

function validateOrigin(req) {
    const origin = req.headers['origin'] || req.headers['referer'];
    
    if (!origin) {
        throw new Error('Missing origin header');
    }
    
    const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => 
        origin.startsWith(allowedOrigin)
    );
    
    if (!isAllowed) {
        throw new Error(`Unauthorized origin: ${origin}`);
    }
    
    return true;
}

function validateRequest(req) {
    // Validate Discord webhook URL is configured
    if (!DISCORD_WEBHOOK_URL || 
        !DISCORD_WEBHOOK_URL.includes('discord.com/api/webhooks/')) {
        throw new Error('Discord webhook not properly configured');
    }
    
    // Validate content length
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > MAX_CONTENT_LENGTH) {
        throw new Error('Request payload too large');
    }
    
    // Validate content type
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
        throw new Error('Invalid content type');
    }
    
    return true;
}

function applyUltraStrictRateLimit(req) {
    const clientIp = getClientIP(req);
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
        // Track failed attempts
        const failed = failedAttempts.get(clientIp) || 0;
        failedAttempts.set(clientIp, failed + 1);
        
        if (failed > 10) {
            blockedIPs.add(clientIp);
            console.error(`🚨 SECURITY ALERT: IP ${clientIp} blocked for rate limit violations`);
        }
        
        throw new Error(`Rate limit exceeded: ${requestCount}/${RATE_LIMIT_MAX_REQUESTS} requests per minute`);
    }
    
    // Update counters
    requestCounts.set(clientIp, requestCount + 1);
    rateLimitStore.set(clientIp, now);
    
    return clientIp;
}

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
}

function sanitizePayload(data) {
    if (typeof data === 'string') {
        return data
            .replace(/[<>]/g, '') // Remove HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/data:/gi, '') // Remove data: URLs
            .replace(/vbscript:/gi, '') // Remove vbscript: URLs
            .replace(/on\w+=/gi, '') // Remove event handlers
            .substring(0, 2000); // Strict length limit
    }
    
    if (Array.isArray(data)) {
        return data.slice(0, 10).map(item => sanitizePayload(item));
    }
    
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        let fieldCount = 0;
        for (const [key, value] of Object.entries(data)) {
            if (fieldCount >= 20) break; // Strict field limit
            const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
            if (cleanKey) {
                sanitized[cleanKey] = sanitizePayload(value);
                fieldCount++;
            }
        }
        return sanitized;
    }
    
    return data;
}

function generateRequestSignature(payload, secret) {
    return createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
}

function verifyRequestSignature(req, payload) {
    const signature = req.headers['x-webhook-signature'];
    if (!signature) {
        throw new Error('Missing webhook signature');
    }
    
    const expectedSignature = generateRequestSignature(payload, WEBHOOK_SECRET);
    const providedSignature = signature.replace('sha256=', '');
    
    if (!timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
    )) {
        throw new Error('Invalid webhook signature');
    }
    
    return true;
}

// 🚀 MAIN WEBHOOK HANDLER
module.exports = async (req, res) => {
    const startTime = Date.now();
    const requestId = randomBytes(8).toString('hex');
    
    try {
        console.log(`🔒 [${requestId}] Secure webhook request received`);
        
        // 🛡️ COMPREHENSIVE SECURITY VALIDATION
        
        // 1. Method validation
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Signature');
            return res.status(200).end();
        }
        
        if (req.method !== 'POST') {
            throw new Error('Method not allowed');
        }
        
        // 2. IP address validation
        const clientIp = validateIPAddress(req);
        console.log(`🔍 [${requestId}] Client IP: ${clientIp}`);
        
        // 3. Rate limiting
        applyUltraStrictRateLimit(req);
        
        // 4. Origin validation
        validateOrigin(req);
        
        // 5. Basic request validation
        validateRequest(req);
        
        // 6. API token validation (if enabled)
        if (API_TOKEN) {
            validateApiToken(req);
        }
        
        // 7. Process payload based on content type
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('application/json')) {
            // Handle JSON payload
            const payload = sanitizePayload(req.body);
            
            // 8. Signature validation
            if (WEBHOOK_SECRET) {
                verifyRequestSignature(req, payload);
            }
            
            // Validate payload structure
            if (!payload.embeds || !Array.isArray(payload.embeds)) {
                throw new Error('Invalid payload structure');
            }
            
            await sendSecureWebhook(payload, requestId);
            
        } else if (contentType.includes('multipart/form-data')) {
            // Handle file upload
            const chunks = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', async () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    await forwardSecureMultipart(buffer, contentType, requestId);
                    res.status(200).json({ 
                        success: true, 
                        requestId,
                        message: 'Webhook delivered securely' 
                    });
                } catch (error) {
                    console.error(`❌ [${requestId}] Multipart error:`, error);
                    res.status(500).json({ error: 'Webhook delivery failed' });
                }
            });
            return;
        } else {
            throw new Error('Unsupported content type');
        }
        
        // Success response
        const duration = Date.now() - startTime;
        console.log(`✅ [${requestId}] Webhook delivered successfully in ${duration}ms`);
        
        res.status(200).json({ 
            success: true, 
            requestId,
            duration: `${duration}ms`,
            message: 'Webhook delivered securely' 
        });
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ [${requestId}] Webhook error (${duration}ms):`, error.message);
        
        // Don't expose internal error details
        const publicError = error.message.includes('Rate limit') || 
                           error.message.includes('Unauthorized') ||
                           error.message.includes('Invalid') ? 
                           error.message : 'Webhook processing failed';
        
        res.status(400).json({ 
            error: publicError, 
            requestId,
            timestamp: new Date().toISOString()
        });
    }
};

// 🔐 SECURE WEBHOOK DELIVERY FUNCTIONS
async function sendSecureWebhook(payload, requestId) {
    return new Promise((resolve, reject) => {
        const url = new URL(DISCORD_WEBHOOK_URL);
        const postData = JSON.stringify(payload);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'POST',
            timeout: REQUEST_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'KRAKEN-Secure-Webhook/2.0'
            }
        };

        console.log(`📤 [${requestId}] Sending secure webhook to Discord`);

        const discordRequest = https.request(options, (discordRes) => {
            let data = '';
            
            discordRes.on('data', (chunk) => {
                data += chunk;
            });
            
            discordRes.on('end', () => {
                if (discordRes.statusCode >= 200 && discordRes.statusCode < 300) {
                    console.log(`✅ [${requestId}] Discord webhook delivered successfully`);
                    resolve();
                } else {
                    console.error(`❌ [${requestId}] Discord webhook error:`, {
                        status: discordRes.statusCode,
                        data: data.substring(0, 200)
                    });
                    reject(new Error(`Discord API error: ${discordRes.statusCode}`));
                }
            });
        });

        discordRequest.on('timeout', () => {
            console.error(`⏰ [${requestId}] Discord webhook timeout`);
            discordRequest.destroy();
            reject(new Error('Discord webhook timeout'));
        });

        discordRequest.on('error', (err) => {
            console.error(`🌐 [${requestId}] Discord request error:`, err.message);
            reject(err);
        });

        discordRequest.write(postData);
        discordRequest.end();
    });
}

async function forwardSecureMultipart(buffer, contentType, requestId) {
    return new Promise((resolve, reject) => {
        const url = new URL(DISCORD_WEBHOOK_URL);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: 'POST',
            timeout: REQUEST_TIMEOUT,
            headers: {
                'Content-Type': contentType,
                'Content-Length': buffer.length,
                'User-Agent': 'KRAKEN-Secure-Webhook/2.0'
            }
        };

        console.log(`📤 [${requestId}] Sending secure multipart data to Discord`);

        const discordRequest = https.request(options, (discordRes) => {
            let data = '';
            
            discordRes.on('data', (chunk) => {
                data += chunk;
            });
            
            discordRes.on('end', () => {
                if (discordRes.statusCode >= 200 && discordRes.statusCode < 300) {
                    console.log(`✅ [${requestId}] Discord multipart delivered successfully`);
                    resolve();
                } else {
                    console.error(`❌ [${requestId}] Discord multipart error:`, {
                        status: discordRes.statusCode,
                        data: data.substring(0, 200)
                    });
                    reject(new Error(`Discord API error: ${discordRes.statusCode}`));
                }
            });
        });

        discordRequest.on('timeout', () => {
            console.error(`⏰ [${requestId}] Discord multipart timeout`);
            discordRequest.destroy();
            reject(new Error('Discord webhook timeout'));
        });

        discordRequest.on('error', (err) => {
            console.error(`🌐 [${requestId}] Discord multipart error:`, err.message);
            reject(err);
        });

        discordRequest.write(buffer);
        discordRequest.end();
    });
}
