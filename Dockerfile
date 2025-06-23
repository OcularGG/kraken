# 🐳 Production Dockerfile for Google Cloud Run
FROM node:18-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Remove development files
RUN rm -rf .git .gitignore README.md GOOGLE_CLOUD_DEPLOYMENT.md

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S kraken -u 1001 -G nodejs

# Set proper ownership
RUN chown -R kraken:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER kraken

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
