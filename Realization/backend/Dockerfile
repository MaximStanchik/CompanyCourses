# Используем официальный образ Node.js 18
FROM node:18-alpine

# Устанавливаем необходимые зависимости
RUN apk add --no-cache postgresql-client openssl

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент для Alpine Linux
RUN npx prisma generate

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

USER nodejs

# Открываем порт
EXPOSE 9000

# Запускаем приложение напрямую
CMD ["npm", "start"] 