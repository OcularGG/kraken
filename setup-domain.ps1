# KRAKEN Custom Domain & HTTPS Setup Script (PowerShell)
# Run this to set up kraken.retrovibes.fun with automatic SSL

Write-Host "🌐 Setting up Custom Domain and HTTPS for KRAKEN..." -ForegroundColor Green

# Variables
$PROJECT_ID = "kraken-naval-clan"
$DOMAIN = "kraken.retrovibes.fun"
$REGION = "us-central1"
$SERVICE_NAME = "kraken-naval-clan"

Write-Host "📡 Creating Network Endpoint Group for Cloud Run..." -ForegroundColor Yellow
gcloud compute network-endpoint-groups create kraken-neg `
    --region=$REGION `
    --network-endpoint-type=serverless `
    --cloud-run-service=$SERVICE_NAME `
    --project=$PROJECT_ID

Write-Host "🔄 Creating Backend Service..." -ForegroundColor Yellow
gcloud compute backend-services create kraken-backend `
    --global `
    --load-balancing-scheme=EXTERNAL `
    --project=$PROJECT_ID

Write-Host "🔗 Adding Cloud Run as Backend..." -ForegroundColor Yellow
gcloud compute backend-services add-backend kraken-backend `
    --global `
    --network-endpoint-group=kraken-neg `
    --network-endpoint-group-region=$REGION `
    --project=$PROJECT_ID

Write-Host "🔒 Creating Managed SSL Certificate..." -ForegroundColor Yellow
gcloud compute ssl-certificates create kraken-ssl `
    --domains=$DOMAIN `
    --global `
    --project=$PROJECT_ID

Write-Host "🗺️ Creating URL Map..." -ForegroundColor Yellow
gcloud compute url-maps create kraken-url-map `
    --default-service=kraken-backend `
    --project=$PROJECT_ID

Write-Host "🔐 Creating HTTPS Proxy..." -ForegroundColor Yellow
gcloud compute target-https-proxies create kraken-https-proxy `
    --url-map=kraken-url-map `
    --ssl-certificates=kraken-ssl `
    --project=$PROJECT_ID

Write-Host "⚡ Creating Forwarding Rule..." -ForegroundColor Yellow
gcloud compute forwarding-rules create kraken-https-rule `
    --global `
    --target-https-proxy=kraken-https-proxy `
    --ports=443 `
    --project=$PROJECT_ID

Write-Host "📋 Getting Load Balancer IP Address..." -ForegroundColor Yellow
$LB_IP = gcloud compute forwarding-rules describe kraken-https-rule --global --format="value(IPAddress)" --project=$PROJECT_ID

Write-Host ""
Write-Host "✅ HTTPS Load Balancer Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 IMPORTANT - DNS Configuration Required:" -ForegroundColor Cyan
Write-Host "   Domain: $DOMAIN" -ForegroundColor White
Write-Host "   Load Balancer IP: $LB_IP" -ForegroundColor White
Write-Host ""
Write-Host "🔧 DNS Setup Steps:" -ForegroundColor Cyan
Write-Host "   1. Login to your DNS provider (where retrovibes.fun is registered)" -ForegroundColor White
Write-Host "   2. Add an A record:" -ForegroundColor White
Write-Host "      Name: kraken" -ForegroundColor White
Write-Host "      Type: A" -ForegroundColor White
Write-Host "      Value: $LB_IP" -ForegroundColor White
Write-Host "      TTL: 300 (5 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "⏱️ SSL Certificate Provisioning:" -ForegroundColor Cyan
Write-Host "   - Let's Encrypt certificate will be automatically provisioned" -ForegroundColor White
Write-Host "   - This takes 10-60 minutes after DNS propagation" -ForegroundColor White
Write-Host "   - Check status: gcloud compute ssl-certificates describe kraken-ssl --global" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Once DNS propagates, your site will be available at:" -ForegroundColor Cyan
Write-Host "   https://$DOMAIN" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Monitor setup progress:" -ForegroundColor Cyan
Write-Host "   gcloud compute ssl-certificates describe kraken-ssl --global --format='value(managed.status)'" -ForegroundColor White
