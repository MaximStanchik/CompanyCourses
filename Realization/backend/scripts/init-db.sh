#!/bin/bash

echo "🚀 Инициализация базы данных..."

# Ждем, пока PostgreSQL будет готов
echo "⏳ Ожидание готовности PostgreSQL..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "PostgreSQL недоступен - ждем..."
  sleep 2
done

echo "✅ PostgreSQL готов!"

# Применяем Prisma миграции
echo "📊 Применение Prisma миграций..."
npx prisma migrate deploy

# Генерируем Prisma клиент
echo "🔧 Генерация Prisma клиента..."
npx prisma generate

# Применяем дополнительные SQL миграции
echo "📝 Применение дополнительных SQL миграций..."

# Применяем миграцию для пользователей
echo "👥 Добавление пользователей по умолчанию..."
psql $DATABASE_URL -f /app/prisma/migrations/add_default_users.sql

echo "✅ База данных инициализирована успешно!"

# Запускаем приложение
echo "🚀 Запуск приложения..."
exec npm start 