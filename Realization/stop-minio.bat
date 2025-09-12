@echo off
echo 🛑 Остановка MinIO контейнеров...

echo 📁 Останавливаем MinIO...
docker stop company_courses_minio company_courses_minio_client

echo 🗑️ Удаляем контейнеры...
docker rm company_courses_minio company_courses_minio_client

echo ✅ MinIO остановлен!

pause 