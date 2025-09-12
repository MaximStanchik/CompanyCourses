# Многоэтапная сборка для оптимизации размера образа
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Production образ с nginx
FROM nginx:alpine AS production

# Копируем собранные файлы
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]

# Development образ
FROM node:18-alpine AS development
# Устанавливаем рабочую директорию
WORKDIR /app
# Копируем package.json и package-lock.json
COPY package*.json ./
# Устанавливаем зависимости с флагом для разрешения конфликтов
RUN npm install --legacy-peer-deps
# Копируем исходный код
COPY . .
# Открываем порт 3000
EXPOSE 3000
# Устанавливаем переменные окружения для React
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true
ENV HOST=0.0.0.0
ENV HTTPS=true
ENV SSL_CRT_FILE=/app/LAB.crt
ENV SSL_KEY_FILE=/app/LAB.key
ENV PORT=3000
# Команда для запуска приложения в режиме разработки
CMD ["npm", "start"] 