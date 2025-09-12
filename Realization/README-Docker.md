# Запуск приложения через Docker

Этот проект содержит два контейнера: backend (Node.js) и frontend (React).

## Предварительные требования

- Docker
- Docker Compose

## Структура проекта

```
Realization/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
├── docker-compose.yml
└── README-Docker.md
```

## Запуск приложения

### 1. Сборка и запуск всех контейнеров

```bash
docker-compose up --build
```

### 2. Запуск в фоновом режиме

```bash
docker-compose up -d --build
```

### 3. Остановка контейнеров

```bash
docker-compose down
```

## Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:9000

## Отдельный запуск контейнеров

### Backend

```bash
cd backend
docker build -t company-courses-backend .
docker run -p 9000:9000 company-courses-backend
```

### Frontend

```bash
cd frontend
docker build -t company-courses-frontend .
docker run -p 3000:3000 company-courses-frontend
```

## Просмотр логов

```bash
# Все контейнеры
docker-compose logs

# Конкретный сервис
docker-compose logs backend
docker-compose logs frontend

# Логи в реальном времени
docker-compose logs -f
```

## Пересборка контейнеров

```bash
# Пересборка всех контейнеров
docker-compose up --build

# Пересборка конкретного сервиса
docker-compose up --build backend
docker-compose up --build frontend
```

## Очистка

```bash
# Остановка и удаление контейнеров
docker-compose down

# Удаление образов
docker-compose down --rmi all

# Полная очистка (включая volumes)
docker-compose down -v
```

## Примечания

- Backend запускается на порту 9000
- Frontend запускается на порту 3000
- Используются volumes для hot-reload в режиме разработки
- Контейнеры связаны через Docker network 