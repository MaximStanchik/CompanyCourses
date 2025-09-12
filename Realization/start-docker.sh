#!/bin/bash

echo "🚀 Запуск Company Courses через Docker..."

# Проверяем, установлен ли Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Пожалуйста, установите Docker."
    exit 1
fi

# Проверяем, установлен ли Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Пожалуйста, установите Docker Compose."
    exit 1
fi

echo "📦 Сборка и запуск контейнеров..."
docker-compose up --build

echo "✅ Приложение запущено!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:9000"
echo ""
echo "Для остановки используйте: docker-compose down" 