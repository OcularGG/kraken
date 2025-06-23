#!/bin/bash
set -e

# 🚀 KRAKEN Google Cloud Deployment Script
# This script deploys the entire KRAKEN clan website to Google Cloud

echo "🏴‍☠️ KRAKEN Google Cloud Deployment Starting..."

# Configuration
PROJECT_ID="kraken-naval-clan"
REGION="us-central1"
SERVICE_NAME="kraken-naval-clan"
DB_INSTANCE="kraken-db"
IMAGE_NAME="gcr.io/$PROJECT_ID/kraken-app"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first."
    exit 1
fi

# Set project
echo "🔧 Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable certificatemanager.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# Create service account
echo "🔐 Creating service account..."
gcloud iam service-accounts create kraken-service-account \
    --display-name="KRAKEN Service Account" \
    --description="Service account for KRAKEN Naval Clan application" || true

# Grant permissions to service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:kraken-service-account@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:kraken-service-account@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Create PostgreSQL database
echo "🗄️ Setting up database..."
gcloud sql instances create $DB_INSTANCE \
    --database-version=POSTGRES_15 \
    --tier=db-custom-2-4096 \
    --region=$REGION \
    --storage-size=50GB \
    --storage-type=SSD \
    --backup-start-time=03:00 \
    --enable-autobackup \
    --deletion-protection || echo "Database instance already exists"

# Create database
gcloud sql databases create kraken_production --instance=$DB_INSTANCE || echo "Database already exists"

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)
echo "Generated database password: $DB_PASSWORD"

# Create database user
gcloud sql users create kraken_user \
    --instance=$DB_INSTANCE \
    --password=$DB_PASSWORD || echo "User already exists"

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)")
echo "Database connection name: $CONNECTION_NAME"

# Create secrets
echo "🔒 Creating secrets..."

# Generate secure tokens
WEBHOOK_SECRET=$(openssl rand -base64 32)
KRAKEN_API_TOKEN=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

echo "Creating database URL secret..."
echo "postgresql://kraken_user:$DB_PASSWORD@/$PROJECT_ID:$REGION:$DB_INSTANCE/kraken_production?host=/cloudsql/$CONNECTION_NAME" | \
gcloud secrets create database-url --data-file=- || \
echo "postgresql://kraken_user:$DB_PASSWORD@/$PROJECT_ID:$REGION:$DB_INSTANCE/kraken_production?host=/cloudsql/$CONNECTION_NAME" | \
gcloud secrets versions add database-url --data-file=-

echo "Creating other secrets..."
echo $DB_PASSWORD | gcloud secrets create database-password --data-file=- || \
echo $DB_PASSWORD | gcloud secrets versions add database-password --data-file=-

echo $CONNECTION_NAME | gcloud secrets create database-connection-name --data-file=- || \
echo $CONNECTION_NAME | gcloud secrets versions add database-connection-name --data-file=-

echo $WEBHOOK_SECRET | gcloud secrets create webhook-secret --data-file=- || \
echo $WEBHOOK_SECRET | gcloud secrets versions add webhook-secret --data-file=-

echo $KRAKEN_API_TOKEN | gcloud secrets create kraken-api-token --data-file=- || \
echo $KRAKEN_API_TOKEN | gcloud secrets versions add kraken-api-token --data-file=-

echo $JWT_SECRET | gcloud secrets create jwt-secret --data-file=- || \
echo $JWT_SECRET | gcloud secrets versions add jwt-secret --data-file=-

# Prompt for Discord webhook URL
echo "Please enter your Discord webhook URL:"
read -s DISCORD_WEBHOOK_URL
echo $DISCORD_WEBHOOK_URL | gcloud secrets create discord-webhook-url --data-file=- || \
echo $DISCORD_WEBHOOK_URL | gcloud secrets versions add discord-webhook-url --data-file=-

# Build and push Docker image
echo "🐳 Building and pushing Docker image..."
gcloud builds submit --tag $IMAGE_NAME .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_NAME \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --port=8080 \
    --cpu=2 \
    --memory=4Gi \
    --concurrency=1000 \
    --timeout=300 \
    --max-instances=10 \
    --min-instances=0 \
    --service-account=kraken-service-account@$PROJECT_ID.iam.gserviceaccount.com \
    --add-cloudsql-instances=$PROJECT_ID:$REGION:$DB_INSTANCE \
    --set-env-vars="NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/$CONNECTION_NAME,DB_NAME=kraken_production,DB_USER=kraken_user,ALLOWED_ORIGINS=https://kraken.retrovibes.fun" \
    --set-secrets="DATABASE_URL=database-url:latest,DB_PASSWORD=database-password:latest,DISCORD_WEBHOOK_URL=discord-webhook-url:latest,WEBHOOK_SECRET=webhook-secret:latest,KRAKEN_API_TOKEN=kraken-api-token:latest,JWT_SECRET=jwt-secret:latest"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo "🌐 Service deployed at: $SERVICE_URL"

# Setup domain mapping
echo "🌍 Setting up custom domain..."
gcloud run domain-mappings create \
    --service=$SERVICE_NAME \
    --domain=kraken.retrovibes.fun \
    --region=$REGION || echo "Domain mapping already exists"

echo "✅ Deployment complete!"
echo ""
echo "🏴‍☠️ KRAKEN Naval Clan is now deployed to Google Cloud!"
echo "🌐 URL: https://kraken.retrovibes.fun"
echo "🗄️ Database: $CONNECTION_NAME"
echo "🔐 All secrets stored in Google Secret Manager"
echo ""
echo "📋 Next steps:"
echo "1. Configure your DNS to point kraken.retrovibes.fun to Google Cloud Run"
echo "2. SSL certificate will be automatically provisioned"
echo "3. Test all functionality at https://kraken.retrovibes.fun"
echo ""
echo "🔒 Security tokens generated:"
echo "- Webhook Secret: $WEBHOOK_SECRET"
echo "- API Token: $KRAKEN_API_TOKEN"
echo "- JWT Secret: $JWT_SECRET"
echo "- Database Password: $DB_PASSWORD"
echo ""
echo "⚠️  Save these tokens securely!"
