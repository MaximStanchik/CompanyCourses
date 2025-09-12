Write-Host "Testing frontend availability..." -ForegroundColor Green

# Check if container is running
$containerStatus = docker ps --filter "name=company_courses_frontend" --format "{{.Status}}"
if ($containerStatus -like "*Up*") {
    Write-Host "✅ Frontend container is running" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend container is not running" -ForegroundColor Red
    exit 1
}

# Test internal access
Write-Host "Testing internal access..." -ForegroundColor Yellow
$internalResponse = docker exec company_courses_frontend curl -k -s -o /dev/null -w "%{http_code}" https://localhost/
Write-Host "Internal response code: $internalResponse" -ForegroundColor Cyan

# Test external access
Write-Host "Testing external access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://localhost:3000/" -SkipCertificateCheck -UseBasicParsing
    Write-Host "External response code: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "Content length: $($response.Content.Length)" -ForegroundColor Cyan
    
    if ($response.Content.Length -gt 1000) {
        Write-Host "✅ Frontend is accessible externally" -ForegroundColor Green
        Write-Host "🌐 Open https://localhost:3000/ in your browser" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Frontend returned short content" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error accessing frontend: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure to accept the SSL certificate warning in your browser" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "If you see a blank page:" -ForegroundColor Yellow
Write-Host "1. Open Developer Tools (F12)" -ForegroundColor White
Write-Host "2. Check Console tab for errors" -ForegroundColor White
Write-Host "3. Check Network tab for failed requests" -ForegroundColor White

Read-Host "Press Enter to continue" 