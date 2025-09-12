@echo off
echo 🚀 Запуск backend локально...

REM Устанавливаем переменные окружения для подключения к Docker контейнерам
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/company_courses
set DB_HOST=localhost
set DB_PORT=5433
set DB_USER=postgres
set DB_PASSWORD=postgres
set DB_NAME=company_courses

REM MinIO настройки
set MINIO_ENDPOINT=localhost
set MINIO_PORT=9075
set MINIO_ACCESS_KEY=minioadmin
set MINIO_SECRET_KEY=minioadmin
set MINIO_BUCKET=uploads
set MINIO_USE_SSL=false

REM JWT и другие настройки
set JWT_SECRET=your_jwt_secret_here
set PORT=9000
set NODE_ENV=development

echo ✅ Переменные окружения установлены
echo 📊 База данных: %DATABASE_URL%
echo 📁 MinIO: %MINIO_ENDPOINT%:%MINIO_PORT%

echo 🚀 Запуск backend...
node src/index.js

pause 