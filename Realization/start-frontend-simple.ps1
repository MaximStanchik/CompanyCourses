Write-Host "Starting frontend with HTTPS..." -ForegroundColor Green

# Check if SSL certificates exist
if (!(Test-Path "frontend/ssl/cert.pem") -or !(Test-Path "frontend/ssl/key.pem")) {
    Write-Host "SSL certificates not found!" -ForegroundColor Yellow
    Write-Host "Generating SSL certificates..." -ForegroundColor Cyan
    
    # Go to frontend folder and generate certificates
    Set-Location frontend
    & .\ssl\generate-ssl-simple.ps1
    Set-Location ..
}

Write-Host "Starting frontend container..." -ForegroundColor Yellow

# Stop existing container if running
docker stop company_courses_frontend 2>$null
docker rm company_courses_frontend 2>$null

# Build and start frontend
docker-compose up --build frontend -d

Write-Host "Waiting for container to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check status
$containerStatus = docker ps --filter "name=company_courses_frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host "Container status:" -ForegroundColor Cyan
Write-Host $containerStatus

Write-Host ""
Write-Host "Frontend started!" -ForegroundColor Green
Write-Host "Available at: https://localhost:3000" -ForegroundColor Cyan
Write-Host "Note: Browser may show security warning for self-signed certificate" -ForegroundColor Yellow
Write-Host "Click 'Advanced' -> 'Proceed to localhost (unsafe)'" -ForegroundColor Yellow

Read-Host "Press Enter to continue" 