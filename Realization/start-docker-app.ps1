param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "logs-backend", "logs-frontend")]
    [string]$Action = "status"
)

Write-Host "CompanyCourses Docker Application Manager" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

switch ($Action) {
    "start" {
        Write-Host "Starting CompanyCourses application..." -ForegroundColor Yellow
        docker-compose -f docker-compose-local.yml up -d
        Write-Host "Application started!" -ForegroundColor Green
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Backend: https://localhost:9000" -ForegroundColor Cyan
        Write-Host "MinIO Console: http://localhost:9001" -ForegroundColor Cyan
        Write-Host "PostgreSQL: localhost:5433" -ForegroundColor Cyan
    }
    
    "stop" {
        Write-Host "Stopping CompanyCourses application..." -ForegroundColor Yellow
        docker-compose -f docker-compose-local.yml down
        Write-Host "Application stopped!" -ForegroundColor Green
    }
    
    "restart" {
        Write-Host "Restarting CompanyCourses application..." -ForegroundColor Yellow
        docker-compose -f docker-compose-local.yml restart
        Write-Host "Application restarted!" -ForegroundColor Green
    }
    
    "status" {
        Write-Host "Checking application status..." -ForegroundColor Yellow
        docker-compose -f docker-compose-local.yml ps
        Write-Host ""
        Write-Host "Ports:" -ForegroundColor Cyan
        Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
        Write-Host "  Backend: https://localhost:9000" -ForegroundColor White
        Write-Host "  MinIO Console: http://localhost:9001" -ForegroundColor White
        Write-Host "  PostgreSQL: localhost:5433" -ForegroundColor White
    }
    
    "logs" {
        Write-Host "Showing all logs..." -ForegroundColor Yellow
        docker-compose -f docker-compose-local.yml logs -f
    }
    
    "logs-backend" {
        Write-Host "Showing backend logs..." -ForegroundColor Yellow
        docker-compose -f docker-compose-local.yml logs -f backend
    }
    
    "logs-frontend" {
        Write-Host "Showing frontend logs..." -ForegroundColor Yellow
        docker-compose -f docker-compose-local.yml logs -f frontend
    }
}

Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Yellow
Write-Host "  .\start-docker-app.ps1 start      - Start application" -ForegroundColor White
Write-Host "  .\start-docker-app.ps1 stop       - Stop application" -ForegroundColor White
Write-Host "  .\start-docker-app.ps1 restart    - Restart application" -ForegroundColor White
Write-Host "  .\start-docker-app.ps1 status     - Show status" -ForegroundColor White
Write-Host "  .\start-docker-app.ps1 logs       - Show all logs" -ForegroundColor White
Write-Host "  .\start-docker-app.ps1 logs-backend  - Show backend logs" -ForegroundColor White
Write-Host "  .\start-docker-app.ps1 logs-frontend - Show frontend logs" -ForegroundColor White 