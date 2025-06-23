# KRAKEN DNS Update Instructions
# 
# Current Problem: ERR_EMPTY_RESPONSE
# Cause: DNS points to wrong IP address
#
# Required Action: Update DNS A Record
# FROM: 34.36.75.159
# TO:   34.111.136.130
#
# DNS Provider Instructions:
# 1. Login to your DNS provider (where retrovibes.fun is hosted)
# 2. Find the A record for "kraken.retrovibes.fun" 
# 3. Change the IP address from 34.36.75.159 to 34.111.136.130
# 4. Set TTL to 300 seconds (5 minutes)
# 5. Save the changes
#
# What happens after DNS update:
# 1. DNS propagation: 5-15 minutes
# 2. SSL certificate provisioning: 10-60 minutes  
# 3. Site becomes accessible at https://kraken.retrovibes.fun
# 4. HTTP automatically redirects to HTTPS
#
# Verification Commands (run after DNS update):
#
# Check DNS resolution:
# nslookup kraken.retrovibes.fun
#
# Check SSL certificate:
# gcloud compute ssl-certificates describe kraken-ssl --global
#
# Test HTTP redirect:
# curl -I http://kraken.retrovibes.fun
#
# Test HTTPS site:
# curl https://kraken.retrovibes.fun/api/health

Write-Host "🚨 URGENT: Update DNS A record for kraken.retrovibes.fun" -ForegroundColor Red
Write-Host "FROM: 34.36.75.159" -ForegroundColor Red  
Write-Host "TO:   34.111.136.130" -ForegroundColor Green
Write-Host ""
Write-Host "After DNS update, the site will work at https://kraken.retrovibes.fun" -ForegroundColor Green
