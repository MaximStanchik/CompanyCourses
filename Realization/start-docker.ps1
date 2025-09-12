Write-Host "🚀 Запуск Company Courses через Docker..." -ForegroundColor Green

# Проверяем, установлен ли Docker
try {
    docker --version | Out-Null
} catch {
    Write-Host "❌ Docker не установлен. Пожалуйста, установите Docker." -ForegroundColor Red
    exit 1
}

# Проверяем, установлен ли Docker Compose
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ Docker Compose не установлен. Пожалуйста, установите Docker Compose." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Сборка и запуск контейнеров..." -ForegroundColor Yellow
docker-compose up --build

Write-Host "✅ Приложение запущено!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:9000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Для остановки используйте: docker-compose down" -ForegroundColor Yellow 