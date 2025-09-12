Write-Host "🚀 Запуск backend локально..." -ForegroundColor Green

# Устанавливаем переменные окружения для подключения к Docker контейнерам
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/company_courses"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5433"
$env:DB_USER = "postgres"
$env:DB_PASSWORD = "postgres"
$env:DB_NAME = "company_courses"

# MinIO настройки
$env:MINIO_ENDPOINT = "localhost"
$env:MINIO_PORT = "9075"
$env:MINIO_ACCESS_KEY = "minioadmin"
$env:MINIO_SECRET_KEY = "minioadmin"
$env:MINIO_BUCKET = "uploads"
$env:MINIO_USE_SSL = "false"

# JWT и другие настройки
$env:JWT_SECRET = "your_jwt_secret_here"
$env:PORT = "9000"
$env:NODE_ENV = "development"

Write-Host "✅ Переменные окружения установлены" -ForegroundColor Green
Write-Host "📊 База данных: $env:DATABASE_URL" -ForegroundColor Cyan
Write-Host "📁 MinIO: $env:MINIO_ENDPOINT`:$env:MINIO_PORT" -ForegroundColor Cyan

Write-Host "🚀 Запуск backend..." -ForegroundColor Green
node src/index.js 