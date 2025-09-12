# 🐳 Docker Setup для Company Courses

Этот проект содержит Docker конфигурацию для запуска всех сервисов в контейнерах.

## 📋 Сервисы

- **PostgreSQL** - База данных (порт 5433)
- **MinIO** - Объектное хранилище (порт 9075)
- **Backend** - Node.js API (порт 9000)
- **Frontend** - React приложение (порт 3000)

## 🚀 Быстрый запуск

### 1. Запуск контейнеров

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps
```

### 2. Копирование данных из существующих контейнеров

После запуска контейнеров нужно скопировать данные:

```bash
# Сделать скрипт исполняемым
chmod +x copy-data-improved.sh

# Запустить копирование данных
./copy-data-improved.sh
```

**Важно:** Убедитесь, что существующие контейнеры запущены:
- PostgreSQL: `dd400ac4d7ba8d5f2abaa9b7bd4d2aceda89bd1d9b21b588e5303b2b4aba7119`
- MinIO: `36176a234ce56018448101ca4786ddceb7485982490394be277fb1e3c641d2be`

### 3. Проверка доступности

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:9000
- **MinIO**: http://localhost:9075
- **PostgreSQL**: localhost:5433

## 🔧 Управление контейнерами

```bash
# Остановить все сервисы
docker-compose down

# Перезапустить конкретный сервис
docker-compose restart backend

# Посмотреть логи
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f minio

# Остановить и удалить все (включая volumes)
docker-compose down -v
```

## 📁 Структура файлов

```
.
├── docker-compose.yml          # Основной файл Docker Compose
├── copy-data-improved.sh      # Скрипт копирования данных
├── backend/
│   ├── Dockerfile             # Dockerfile для backend
│   └── .dockerignore          # Исключения для backend
└── frontend/
    ├── Dockerfile             # Dockerfile для frontend
    ├── nginx.conf             # Конфигурация nginx
    └── .dockerignore          # Исключения для frontend
```

## 🐛 Устранение неполадок

### Проблемы с PostgreSQL

```bash
# Проверить логи
docker-compose logs postgres

# Подключиться к базе данных
docker exec -it company_courses_postgres psql -U postgres -d company_courses
```

### Проблемы с MinIO

```bash
# Проверить логи
docker-compose logs minio

# Проверить доступность
curl http://localhost:9075/minio/health/live
```

### Проблемы с Backend

```bash
# Проверить логи
docker-compose logs backend

# Проверить переменные окружения
docker exec company_courses_backend env
```

### Проблемы с Frontend

```bash
# Проверить логи
docker-compose logs frontend

# Проверить nginx конфигурацию
docker exec company_courses_frontend nginx -t
```

## 🔒 Переменные окружения

### Backend

- `DATABASE_URL` - URL подключения к PostgreSQL
- `MINIO_ENDPOINT` - Endpoint MinIO
- `MINIO_ACCESS_KEY` - Ключ доступа MinIO
- `MINIO_SECRET_KEY` - Секретный ключ MinIO
- `JWT_SECRET` - Секрет для JWT токенов

### Frontend

- `REACT_APP_API_URL` - URL API backend
- `REACT_APP_MINIO_URL` - URL MinIO

## 📊 Мониторинг

```bash
# Статистика использования ресурсов
docker stats

# Информация о контейнерах
docker inspect company_courses_postgres
docker inspect company_courses_minio
docker inspect company_courses_backend
docker inspect company_courses_frontend
```

## 🧹 Очистка

```bash
# Остановить и удалить все контейнеры
docker-compose down

# Удалить все образы
docker-compose down --rmi all

# Удалить все volumes (данные будут потеряны!)
docker-compose down -v

# Полная очистка Docker
docker system prune -a --volumes
```

## 📝 Примечания

- PostgreSQL данные сохраняются в volume `postgres_data`
- MinIO данные сохраняются в volume `minio_data`
- Backend загруженные файлы сохраняются в `./backend/uploads`
- Frontend собирается в production режиме и обслуживается nginx
- Все сервисы автоматически перезапускаются при сбоях 