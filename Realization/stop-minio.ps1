Write-Host "🛑 Остановка MinIO контейнеров..." -ForegroundColor Red

Write-Host "📁 Останавливаем MinIO..." -ForegroundColor Yellow
docker stop company_courses_minio company_courses_minio_client

Write-Host "🗑️ Удаляем контейнеры..." -ForegroundColor Yellow
docker rm company_courses_minio company_courses_minio_client

Write-Host "✅ MinIO остановлен!" -ForegroundColor Green

Read-Host "Нажмите Enter для продолжения" 