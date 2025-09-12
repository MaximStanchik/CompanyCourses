#!/bin/bash

echo "🚀 Начинаем копирование данных из существующих контейнеров..."

# 1. Копируем данные PostgreSQL
echo "📊 Копируем данные PostgreSQL из контейнера dd400ac4d7ba8d5f2abaa9b7bd4d2aceda89bd1d9b21b588e5303b2b4aba7119..."

# Создаем временный контейнер для копирования данных
docker run --rm -v company_courses_postgres_data:/data -v $(pwd):/backup postgres:latest bash -c "
  # Ждем, пока основной контейнер postgres запустится
  sleep 10
  
  # Копируем данные из существующего контейнера
  docker exec dd400ac4d7ba8d5f2abaa9b7bd4d2aceda89bd1d9b21b588e5303b2b4aba7119 pg_dump -U postgres -d company_courses > /backup/temp_dump.sql
  
  # Восстанавливаем данные в новый контейнер
  psql -h postgres -U postgres -d company_courses < /backup/temp_dump.sql
  
  # Очищаем временный файл
  rm /backup/temp_dump.sql
"

echo "✅ Данные PostgreSQL скопированы!"

# 2. Копируем данные MinIO
echo "📁 Копируем данные MinIO из контейнера 36176a234ce56018448101ca4786ddceb7485982490394be277fb1e3c641d2be..."

# Создаем временный контейнер для копирования данных MinIO
docker run --rm -v company_courses_minio_data:/data -v $(pwd):/backup minio/mc:latest bash -c "
  # Ждем, пока основной контейнер MinIO запустится
  sleep 10
  
  # Настраиваем MinIO клиент
  mc alias set source http://localhost:9000 minioadmin minioadmin
  mc alias set dest http://minio:9000 minioadmin minioadmin
  
  # Копируем все бакеты и данные
  mc mirror source dest
  
  echo '✅ Данные MinIO скопированы!'
"

echo "🎉 Копирование данных завершено!"
echo ""
echo "📋 Инструкции по запуску:"
echo "1. Запустите контейнеры: docker-compose up -d"
echo "2. Подождите 30 секунд для полного запуска"
echo "3. Запустите скрипт копирования: ./copy-data.sh"
echo "4. Проверьте доступность сервисов:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:9000"
echo "   - MinIO: http://localhost:9075"
echo "   - PostgreSQL: localhost:5433" 