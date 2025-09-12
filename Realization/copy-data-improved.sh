#!/bin/bash

echo "🚀 Начинаем копирование данных из существующих контейнеров..."

# Проверяем, что существующие контейнеры запущены
echo "🔍 Проверяем существующие контейнеры..."

if ! docker ps | grep -q "dd400ac4d7ba8d5f2abaa9b7bd4d2aceda89bd1d9b21b588e5303b2b4aba7119"; then
    echo "❌ Контейнер PostgreSQL не найден! Убедитесь, что он запущен."
    exit 1
fi

if ! docker ps | grep -q "36176a234ce56018448101ca4786ddceb7485982490394be277fb1e3c641d2be"; then
    echo "❌ Контейнер MinIO не найден! Убедитесь, что он запущен."
    exit 1
fi

echo "✅ Существующие контейнеры найдены!"

# 1. Копируем данные PostgreSQL
echo "📊 Копируем данные PostgreSQL..."

# Создаем дамп данных
echo "Создаем дамп базы данных..."
docker exec dd400ac4d7ba8d5f2abaa9b7bd4d2aceda89bd1d9b21b588e5303b2b4aba7119 pg_dump -U postgres -d company_courses > temp_postgres_dump.sql

if [ $? -eq 0 ]; then
    echo "✅ Дамп PostgreSQL создан успешно!"
    
    # Ждем запуска нового контейнера PostgreSQL
    echo "⏳ Ждем запуска нового контейнера PostgreSQL..."
    sleep 15
    
    # Восстанавливаем данные
    echo "Восстанавливаем данные в новый контейнер..."
    docker exec -i company_courses_postgres psql -U postgres -d company_courses < temp_postgres_dump.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Данные PostgreSQL восстановлены успешно!"
    else
        echo "❌ Ошибка при восстановлении данных PostgreSQL"
    fi
    
    # Очищаем временный файл
    rm temp_postgres_dump.sql
else
    echo "❌ Ошибка при создании дампа PostgreSQL"
fi

# 2. Копируем данные MinIO
echo "📁 Копируем данные MinIO..."

# Создаем временный контейнер для копирования
echo "Создаем временный контейнер для копирования MinIO..."
docker run --rm --name temp_minio_copy \
    --network company_courses_app-network \
    -v $(pwd):/backup \
    minio/mc:latest \
    bash -c "
        echo 'Настраиваем MinIO клиент...'
        mc alias set source http://36176a234ce56018448101ca4786ddceb7485982490394be277fb1e3c641d2be:9000 minioadmin minioadmin
        mc alias set dest http://minio:9000 minioadmin minioadmin
        
        echo 'Копируем все бакеты...'
        mc mirror source dest
        
        echo 'Проверяем скопированные бакеты...'
        mc ls dest
    "

if [ $? -eq 0 ]; then
    echo "✅ Данные MinIO скопированы успешно!"
else
    echo "❌ Ошибка при копировании данных MinIO"
fi

echo ""
echo "🎉 Копирование данных завершено!"
echo ""
echo "📋 Проверьте доступность сервисов:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:9000"
echo "   - MinIO: http://localhost:9075"
echo "   - PostgreSQL: localhost:5433"
echo ""
echo "🔧 Если что-то не работает, проверьте логи:"
echo "   - docker-compose logs postgres"
echo "   - docker-compose logs minio"
echo "   - docker-compose logs backend"
echo "   - docker-compose logs frontend" 