Write-Host "🛑 Остановка фронтенда..." -ForegroundColor Red

Write-Host "📁 Останавливаем фронтенд контейнер..." -ForegroundColor Yellow
docker stop company_courses_frontend

Write-Host "🗑️ Удаляем контейнер..." -ForegroundColor Yellow
docker rm company_courses_frontend

Write-Host "✅ Фронтенд остановлен!" -ForegroundColor Green

Read-Host "Нажмите Enter для продолжения" 