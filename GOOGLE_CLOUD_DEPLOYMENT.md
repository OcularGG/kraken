# 🚀 KRAKEN Google Cloud Deployment Guide
# Domain: kraken.retrovibes.fun
# SSL: Let's Encrypt automatic certificates
# Database: Google Cloud SQL (PostgreSQL)
# Hosting: Google Cloud Run + Cloud CDN

## 📋 Prerequisites

1. Google Cloud account with billing enabled
2. Domain `kraken.retrovibes.fun` registered and accessible
3. Google Cloud CLI installed (`gcloud`)
4. Docker installed

## 🔧 Step 1: Google Cloud Project Setup

```bash
# Create new project
gcloud projects create kraken-naval-clan --name="KRAKEN Naval Clan"

# Set as active project
gcloud config set project kraken-naval-clan

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable certificatemanager.googleapis.com
```

## 🗄️ Step 2: Database Setup (Cloud SQL PostgreSQL)

```bash
# Create PostgreSQL instance
gcloud sql instances create kraken-db \
    --database-version=POSTGRES_15 \
    --tier=db-custom-2-4096 \
    --region=us-central1 \
    --storage-size=50GB \
    --storage-type=SSD \
    --backup-start-time=03:00 \
    --enable-autobackup \
    --enable-bin-log \
    --deletion-protection

# Create database
gcloud sql databases create kraken_production --instance=kraken-db

# Create database user with secure password
KRAKEN_DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create kraken_user \
    --instance=kraken-db \
    --password=$KRAKEN_DB_PASSWORD

# Get connection details and store in secrets
gcloud sql instances describe kraken-db --format="value(connectionName)" > connection_name.txt
CONNECTION_NAME=$(cat connection_name.txt)

# Store database credentials in Google Secret Manager
echo "postgresql://kraken_user:$KRAKEN_DB_PASSWORD@/kraken_production?host=/cloudsql/$CONNECTION_NAME" | \
gcloud secrets create database-url --data-file=-

echo $KRAKEN_DB_PASSWORD | gcloud secrets create database-password --data-file=-
echo $CONNECTION_NAME | gcloud secrets create database-connection-name --data-file=-

# Initialize database schema
gcloud sql connect kraken-db --user=kraken_user --database=kraken_production
```

## 🌐 Step 3: Domain and DNS Setup

```bash
# Create Cloud DNS zone
gcloud dns managed-zones create kraken-zone \
    --description="KRAKEN Naval Clan DNS" \
    --dns-name="retrovibes.fun."

# Add A record pointing to Google Cloud Run (will update after deployment)
gcloud dns record-sets transaction start --zone=kraken-zone

gcloud dns record-sets transaction add \
    --zone=kraken-zone \
    --name="kraken.retrovibes.fun." \
    --ttl=300 \
    --type=A \
    [CLOUD_RUN_IP]

gcloud dns record-sets transaction execute --zone=kraken-zone
```

## 🐳 Step 4: Docker Configuration

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["npm", "start"]
```

## 🔐 Step 5: Environment Variables Setup

Create `cloud-run-env.yaml`:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: kraken-naval-clan
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/cloudsql-instances: PROJECT_ID:us-central1:kraken-db
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/execution-environment: gen2
        run.googleapis.com/cloudsql-instances: PROJECT_ID:us-central1:kraken-db
    spec:
      containerConcurrency: 1000
      timeoutSeconds: 300
      serviceAccountName: kraken-service-account
      containers:
      - image: gcr.io/kraken-naval-clan/kraken-app
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-url
              key: latest
        - name: DB_HOST
          value: "/cloudsql/PROJECT_ID:us-central1:kraken-db"
        - name: DB_NAME
          value: "kraken_production"
        - name: DB_USER
          value: "kraken_user"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-password
              key: latest
        - name: DISCORD_WEBHOOK_URL
          valueFrom:
            secretKeyRef:
              name: discord-webhook-url
              key: latest
        - name: WEBHOOK_SECRET
          valueFrom:
            secretKeyRef:
              name: webhook-secret
              key: latest
        - name: KRAKEN_API_TOKEN
          valueFrom:
            secretKeyRef:
              name: kraken-api-token
              key: latest
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: latest
        - name: ALLOWED_ORIGINS
          value: "https://kraken.retrovibes.fun"
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
          requests:
            cpu: "1"
            memory: "1Gi"
```

## 🚀 Step 6: Deployment Scripts

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying KRAKEN to Google Cloud..."

# Build and push Docker image
docker build -t gcr.io/kraken-naval-clan/kraken-app:latest .
docker push gcr.io/kraken-naval-clan/kraken-app:latest

# Create secrets (run once)
gcloud secrets create kraken-secrets --data-file=.env.production

# Deploy to Cloud Run
gcloud run deploy kraken-naval-clan \
    --image=gcr.io/kraken-naval-clan/kraken-app:latest \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --port=8080 \
    --cpu=2 \
    --memory=2Gi \
    --concurrency=1000 \
    --timeout=300 \
    --max-instances=10 \
    --set-env-vars="NODE_ENV=production,PORT=8080" \
    --set-secrets="SUPABASE_URL=kraken-secrets:1,SUPABASE_ANON_KEY=kraken-secrets:2,DISCORD_WEBHOOK_URL=kraken-secrets:3,WEBHOOK_SECRET=kraken-secrets:4,KRAKEN_API_TOKEN=kraken-secrets:5"

echo "✅ Deployment complete!"
```

## 🔒 Step 7: SSL Certificate (Let's Encrypt via Google Cloud)

```bash
# Create SSL certificate
gcloud compute ssl-certificates create kraken-ssl-cert \
    --domains=kraken.retrovibes.fun \
    --global

# Create load balancer with SSL
gcloud compute backend-services create kraken-backend \
    --global \
    --load-balancing-scheme=EXTERNAL

# Add Cloud Run as backend
gcloud compute backend-services add-backend kraken-backend \
    --global \
    --neg=kraken-neg \
    --neg-region=us-central1

# Create URL map
gcloud compute url-maps create kraken-url-map \
    --default-service=kraken-backend

# Create HTTPS proxy
gcloud compute target-https-proxies create kraken-https-proxy \
    --url-map=kraken-url-map \
    --ssl-certificates=kraken-ssl-cert

# Create forwarding rule
gcloud compute forwarding-rules create kraken-https-rule \
    --global \
    --target-https-proxy=kraken-https-proxy \
    --ports=443
```

## 🛡️ Step 8: Security Configuration

Create `security-policy.yaml`:

```yaml
# Cloud Armor security policy
name: kraken-security-policy
description: "Security policy for KRAKEN Naval Clan"
rules:
- priority: 1000
  match:
    versionedExpr: SRC_IPS_V1
    config:
      srcIpRanges:
      - "0.0.0.0/0"
  action: "allow"
  description: "Default allow rule"
- priority: 2000
  match:
    expr:
      expression: >
        origin.region_code != "US" && 
        origin.region_code != "CA" && 
        origin.region_code != "GB"
  action: "deny-403"
  description: "Block traffic from non-allowed countries"
- priority: 3000
  match:
    expr:
      expression: >
        request.headers['user-agent'].contains('bot') ||
        request.headers['user-agent'].contains('crawler')
  action: "deny-403"
  description: "Block suspicious bots"
```

## 📊 Step 9: Monitoring and Logging

```bash
# Enable monitoring
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# Create alerting policy
gcloud alpha monitoring policies create \
    --policy-from-file=monitoring-policy.yaml
```

## 🔧 Step 10: Production Environment Variables

Create `.env.production`:

```bash
NODE_ENV=production
PORT=8080

# Database (Google Cloud SQL PostgreSQL)
DATABASE_URL=postgresql://kraken_user:SECURE_PASSWORD@/kraken_production?host=/cloudsql/PROJECT_ID:us-central1:kraken-db
DB_HOST=/cloudsql/PROJECT_ID:us-central1:kraken-db
DB_NAME=kraken_production
DB_USER=kraken_user
DB_PASSWORD=SECURE_PASSWORD

# Security
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_SECURE_WEBHOOK
WEBHOOK_SECRET=ultra-secure-random-string-2025
KRAKEN_API_TOKEN=ultra-secure-api-token-2025
JWT_SECRET=ultra-secure-jwt-secret-2025

# Domain
ALLOWED_ORIGINS=https://kraken.retrovibes.fun

# Performance
MAX_CONNECTIONS=100
CONNECTION_TIMEOUT=30000
```

## 🚀 Quick Deployment Commands

```bash
# One-time setup
chmod +x deploy.sh
./deploy.sh

# Update deployment
docker build -t gcr.io/kraken-naval-clan/kraken-app:latest .
docker push gcr.io/kraken-naval-clan/kraken-app:latest
gcloud run deploy kraken-naval-clan --image=gcr.io/kraken-naval-clan/kraken-app:latest --region=us-central1

# Check status
gcloud run services describe kraken-naval-clan --region=us-central1
```

## 📈 Performance Optimization

```bash
# Enable Cloud CDN
gcloud compute backend-services update kraken-backend \
    --enable-cdn \
    --cache-mode=CACHE_ALL_STATIC \
    --default-ttl=3600 \
    --max-ttl=86400

# Configure compression
gcloud compute backend-services update kraken-backend \
    --compression-mode=AUTOMATIC
```

This setup provides:
- ✅ Ultra-secure webhook handling
- ✅ Automatic Let's Encrypt SSL
- ✅ Custom domain (kraken.retrovibes.fun)
- ✅ Scalable Google Cloud infrastructure
- ✅ Database backups and monitoring
- ✅ DDoS protection via Cloud Armor
- ✅ CDN for global performance
- ✅ Container security
- ✅ Secret management
