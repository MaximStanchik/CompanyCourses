Write-Host "🚀 Запуск фронтенда с HTTPS..." -ForegroundColor Green

# Проверяем наличие SSL сертификатов
if (!(Test-Path "frontend/ssl/cert.pem") -or !(Test-Path "frontend/ssl/key.pem")) {
    Write-Host "⚠️ SSL сертификаты не найдены!" -ForegroundColor Yellow
    Write-Host "🔐 Генерируем SSL сертификаты..." -ForegroundColor Cyan
    
    # Переходим в папку frontend и генерируем сертификаты
    Set-Location frontend
    & .\ssl\generate-ssl.ps1
    Set-Location ..
}

Write-Host "🐳 Запускаем фронтенд контейнер..." -ForegroundColor Yellow

# Останавливаем существующий контейнер если он запущен
docker stop company_courses_frontend 2>$null
docker rm company_courses_frontend 2>$null

# Собираем и запускаем фронтенд
docker-compose up --build frontend -d

Write-Host "⏳ Ждем запуска контейнера..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Проверяем статус
$containerStatus = docker ps --filter "name=company_courses_frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host "📊 Статус контейнера:" -ForegroundColor Cyan
Write-Host $containerStatus

Write-Host ""
Write-Host "✅ Фронтенд запущен!" -ForegroundColor Green
Write-Host "🌐 Доступен по адресу: https://localhost:3000" -ForegroundColor Cyan
Write-Host "⚠️ При первом посещении браузер может показать предупреждение о самоподписанном сертификате" -ForegroundColor Yellow
Write-Host "📝 Нажмите 'Дополнительно' -> 'Перейти на localhost (небезопасно)'" -ForegroundColor Yellow

Read-Host "Press Enter to continue" 