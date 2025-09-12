Write-Host "🚀 Запуск MinIO контейнера..." -ForegroundColor Green

Write-Host "📁 Останавливаем существующие контейнеры MinIO..." -ForegroundColor Yellow
docker stop company_courses_minio company_courses_minio_client 2>$null
docker rm company_courses_minio company_courses_minio_client 2>$null

Write-Host "🚀 Запускаем MinIO..." -ForegroundColor Green
docker-compose -f docker-compose-minio.yml up -d

Write-Host "⏳ Ждем запуска MinIO..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host "🔍 Проверяем статус MinIO..." -ForegroundColor Yellow
docker ps | Select-String "minio"

Write-Host "✅ MinIO запущен!" -ForegroundColor Green
Write-Host "📊 API: http://localhost:9075" -ForegroundColor Cyan
Write-Host "🖥️  Console: http://localhost:9001" -ForegroundColor Cyan
Write-Host "🔑 Логин: minioadmin" -ForegroundColor Yellow
Write-Host "🔑 Пароль: minioadmin" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎯 Теперь можете запускать backend!" -ForegroundColor Green
Write-Host "💡 Используйте: backend\start-local.ps1" -ForegroundColor Cyan

Read-Host "Нажмите Enter для продолжения" 