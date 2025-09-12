@echo off
echo 🚀 Запуск MinIO контейнера...

echo 📁 Останавливаем существующие контейнеры MinIO...
docker stop company_courses_minio company_courses_minio_client 2>nul
docker rm company_courses_minio company_courses_minio_client 2>nul

echo 🚀 Запускаем MinIO...
docker-compose -f docker-compose-minio.yml up -d

echo ⏳ Ждем запуска MinIO...
timeout /t 15 /nobreak >nul

echo 🔍 Проверяем статус MinIO...
docker ps | findstr minio

echo ✅ MinIO запущен!
echo 📊 API: http://localhost:9075
echo 🖥️  Console: http://localhost:9001
echo 🔑 Логин: minioadmin
echo 🔑 Пароль: minioadmin

echo.
echo 🎯 Теперь можете запускать backend!
echo 💡 Используйте: backend\start-local.bat

pause 