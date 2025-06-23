# KRAKEN Google Cloud Deployment Script (PowerShell)
# This script deploys the entire KRAKEN clan website to Google Cloud

Write-Host "KRAKEN Google Cloud Deployment Starting..." -ForegroundColor Green

# Configuration
$PROJECT_ID = "kraken-naval-clan"
$REGION = "us-central1"
$SERVICE_NAME = "kraken-naval-clan"
$DB_INSTANCE = "kraken-db"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/kraken-app"

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "Google Cloud CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Set project
Write-Host "Setting up Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable certificatemanager.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# Create service account
Write-Host "Creating service account..." -ForegroundColor Yellow
gcloud iam service-accounts create kraken-service-account --display-name="KRAKEN Service Account" --description="Service account for KRAKEN Naval Clan application"

# Grant permissions to service account
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:kraken-service-account@$PROJECT_ID.iam.gserviceaccount.com" --role="roles/cloudsql.client"
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:kraken-service-account@$PROJECT_ID.iam.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"

# Create PostgreSQL database
Write-Host "Setting up database..." -ForegroundColor Yellow
gcloud sql instances create $DB_INSTANCE --database-version=POSTGRES_15 --tier=db-custom-2-4096 --region=$REGION --storage-size=50GB --storage-type=SSD --backup-start-time=03:00 --enable-autobackup --deletion-protection

# Create database
gcloud sql databases create kraken_production --instance=$DB_INSTANCE

# Generate secure password
$DB_PASSWORD = [System.Web.Security.Membership]::GeneratePassword(32, 8)
Write-Host "Generated database password: $DB_PASSWORD"

# Create database user
gcloud sql users create kraken_user --instance=$DB_INSTANCE --password=$DB_PASSWORD

# Get connection name
$CONNECTION_NAME = (gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)")
Write-Host "Database connection name: $CONNECTION_NAME"

# Create secrets
Write-Host "Creating secrets..." -ForegroundColor Yellow

# Generate secure tokens
$WEBHOOK_SECRET = [System.Web.Security.Membership]::GeneratePassword(32, 8)
$KRAKEN_API_TOKEN = [System.Web.Security.Membership]::GeneratePassword(32, 8)
$JWT_SECRET = [System.Web.Security.Membership]::GeneratePassword(32, 8)

# Create database URL secret
$DATABASE_URL = "postgresql://kraken_user:$DB_PASSWORD@/$PROJECT_ID`:$REGION`:$DB_INSTANCE/kraken_production?host=/cloudsql/$CONNECTION_NAME"
$DATABASE_URL | gcloud secrets create database-url --data-file=-

# Create other secrets
$DB_PASSWORD | gcloud secrets create database-password --data-file=-
$CONNECTION_NAME | gcloud secrets create database-connection-name --data-file=-
$WEBHOOK_SECRET | gcloud secrets create webhook-secret --data-file=-
$KRAKEN_API_TOKEN | gcloud secrets create kraken-api-token --data-file=-
$JWT_SECRET | gcloud secrets create jwt-secret --data-file=-

# Build and push Docker image
Write-Host "Building and pushing Docker image..." -ForegroundColor Yellow
docker build -t $IMAGE_NAME .
docker push $IMAGE_NAME

# Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME --image=$IMAGE_NAME --platform=managed --region=$REGION --allow-unauthenticated --port=8080 --cpu=2 --memory=2Gi --concurrency=1000 --timeout=300 --max-instances=10 --service-account="kraken-service-account@$PROJECT_ID.iam.gserviceaccount.com" --add-cloudsql-instances="$PROJECT_ID`:$REGION`:$DB_INSTANCE" --set-env-vars="NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/$CONNECTION_NAME,DB_NAME=kraken_production,DB_USER=kraken_user" --set-secrets="DB_PASSWORD=database-password:latest,WEBHOOK_SECRET=webhook-secret:latest,KRAKEN_API_TOKEN=kraken-api-token:latest,JWT_SECRET=jwt-secret:latest"

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Generated tokens (save these securely):" -ForegroundColor Yellow
Write-Host "- Webhook Secret: $WEBHOOK_SECRET"
Write-Host "- KRAKEN API Token: $KRAKEN_API_TOKEN"
Write-Host "- JWT Secret: $JWT_SECRET"
Write-Host "- Database Password: $DB_PASSWORD"
Write-Host ""
Write-Host "WARNING: Save these tokens securely!" -ForegroundColor Red
