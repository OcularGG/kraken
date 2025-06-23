#!/bin/bash
# 🚀 KRAKEN Google Cloud Deployment Script

set -e

echo "🏴‍☠️ Starting KRAKEN deployment to Google Cloud..."

# Configuration
PROJECT_ID="kraken-naval-clan"
REGION="us-central1"
SERVICE_NAME="kraken-naval-clan"
IMAGE_NAME="gcr.io/${PROJECT_ID}/kraken-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker."
    exit 1
fi

# Check if logged in to gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    print_error "Not logged in to gcloud. Run 'gcloud auth login' first."
    exit 1
fi

print_success "Prerequisites check passed"

# Set project
print_status "Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

print_success "APIs enabled"

# Build Docker image
print_status "Building Docker image..."
docker build -t $IMAGE_NAME:latest .

print_success "Docker image built"

# Configure Docker to use gcloud as credential helper
print_status "Configuring Docker authentication..."
gcloud auth configure-docker

# Push image to Google Container Registry
print_status "Pushing image to Google Container Registry..."
docker push $IMAGE_NAME:latest

print_success "Image pushed to GCR"

# Create secrets if they don't exist
print_status "Setting up secrets..."

if ! gcloud secrets describe discord-webhook-url &> /dev/null; then
    print_warning "Discord webhook URL secret not found. Creating placeholder..."
    echo "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN" | gcloud secrets create discord-webhook-url --data-file=-
    print_warning "⚠️  IMPORTANT: Update the discord-webhook-url secret with your actual webhook URL!"
fi

if ! gcloud secrets describe webhook-secret &> /dev/null; then
    print_status "Generating webhook secret..."
    openssl rand -hex 32 | gcloud secrets create webhook-secret --data-file=-
    print_success "Webhook secret created"
fi

if ! gcloud secrets describe kraken-api-token &> /dev/null; then
    print_status "Generating API token..."
    openssl rand -hex 32 | gcloud secrets create kraken-api-token --data-file=-
    print_success "API token created"
fi

# Deploy to Cloud Run
print_status "Deploying to Cloud Run..."

gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_NAME:latest \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --port=8080 \
    --cpu=2 \
    --memory=2Gi \
    --concurrency=1000 \
    --timeout=300 \
    --max-instances=10 \
    --min-instances=0 \
    --set-env-vars="NODE_ENV=production,PORT=8080" \
    --set-secrets="/secrets/discord-webhook-url=discord-webhook-url:latest,/secrets/webhook-secret=webhook-secret:latest,/secrets/kraken-api-token=kraken-api-token:latest" \
    --service-account=$SERVICE_NAME@$PROJECT_ID.iam.gserviceaccount.com

print_success "Cloud Run deployment complete"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "🌍 Service URL: $SERVICE_URL"
echo "🏴‍☠️ Project: $PROJECT_ID"
echo "📍 Region: $REGION"
echo "🐳 Image: $IMAGE_NAME:latest"
echo ""
echo "🔧 Next Steps:"
echo "1. Update your DNS to point kraken.retrovibes.fun to the service URL"
echo "2. Set up SSL certificate for your custom domain"
echo "3. Update Discord webhook URL secret with your actual webhook"
echo "4. Test the deployment at: $SERVICE_URL"
echo ""
echo "🔒 Security Features Enabled:"
echo "✅ Ultra-secure webhook protection"
echo "✅ Rate limiting (3 requests/minute per IP)"
echo "✅ IP allowlisting capability"
echo "✅ Request signature validation"
echo "✅ Content sanitization"
echo "✅ CORS protection"
echo "✅ Security headers"
echo ""
print_success "KRAKEN is ready to sail! ⚓"
