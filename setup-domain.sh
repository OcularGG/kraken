#!/bin/bash
# KRAKEN Custom Domain & HTTPS Setup Script
# Run this to set up kraken.retrovibes.fun with automatic SSL

set -e

echo "🌐 Setting up Custom Domain and HTTPS for KRAKEN..."

# Variables
PROJECT_ID="kraken-naval-clan"
DOMAIN="kraken.retrovibes.fun"
REGION="us-central1"
SERVICE_NAME="kraken-naval-clan"

echo "📡 Creating Network Endpoint Group for Cloud Run..."
gcloud compute network-endpoint-groups create kraken-neg \
    --region=$REGION \
    --network-endpoint-type=serverless \
    --cloud-run-service=$SERVICE_NAME \
    --project=$PROJECT_ID

echo "🔄 Creating Backend Service..."
gcloud compute backend-services create kraken-backend \
    --global \
    --load-balancing-scheme=EXTERNAL \
    --project=$PROJECT_ID

echo "🔗 Adding Cloud Run as Backend..."
gcloud compute backend-services add-backend kraken-backend \
    --global \
    --network-endpoint-group=kraken-neg \
    --network-endpoint-group-region=$REGION \
    --project=$PROJECT_ID

echo "🔒 Creating Managed SSL Certificate..."
gcloud compute ssl-certificates create kraken-ssl \
    --domains=$DOMAIN \
    --global \
    --project=$PROJECT_ID

echo "🗺️ Creating URL Map..."
gcloud compute url-maps create kraken-url-map \
    --default-service=kraken-backend \
    --project=$PROJECT_ID

echo "🔐 Creating HTTPS Proxy..."
gcloud compute target-https-proxies create kraken-https-proxy \
    --url-map=kraken-url-map \
    --ssl-certificates=kraken-ssl \
    --project=$PROJECT_ID

echo "⚡ Creating Forwarding Rule..."
gcloud compute forwarding-rules create kraken-https-rule \
    --global \
    --target-https-proxy=kraken-https-proxy \
    --ports=443 \
    --project=$PROJECT_ID

echo "📋 Getting Load Balancer IP Address..."
LB_IP=$(gcloud compute forwarding-rules describe kraken-https-rule --global --format="value(IPAddress)" --project=$PROJECT_ID)

echo ""
echo "✅ HTTPS Load Balancer Setup Complete!"
echo ""
echo "📌 IMPORTANT - DNS Configuration Required:"
echo "   Domain: $DOMAIN"
echo "   Load Balancer IP: $LB_IP"
echo ""
echo "🔧 DNS Setup Steps:"
echo "   1. Login to your DNS provider (where retrovibes.fun is registered)"
echo "   2. Add an A record:"
echo "      Name: kraken"
echo "      Type: A"
echo "      Value: $LB_IP"
echo "      TTL: 300 (5 minutes)"
echo ""
echo "⏱️ SSL Certificate Provisioning:"
echo "   - Let's Encrypt certificate will be automatically provisioned"
echo "   - This takes 10-60 minutes after DNS propagation"
echo "   - Check status: gcloud compute ssl-certificates describe kraken-ssl --global"
echo ""
echo "🌐 Once DNS propagates, your site will be available at:"
echo "   https://$DOMAIN"
echo ""
echo "🔍 Monitor setup progress:"
echo "   gcloud compute ssl-certificates describe kraken-ssl --global --format='value(managed.status)'"
