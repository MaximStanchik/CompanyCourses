# 👥 Пользователи по умолчанию

При запуске Docker контейнеров автоматически создаются следующие пользователи:

## 🔑 Учетные данные для входа

### **Администратор**
- **Логин**: `admin12345`
- **Email**: `admin@example.com`
- **Пароль**: `admin12345`
- **Роль**: `ADMIN`
- **Доступ**: Полный доступ ко всем функциям системы

### **Обычный пользователь**
- **Логин**: `user12345`
- **Email**: `user@example.com`
- **Пароль**: `admin12345`
- **Роль**: `USER`
- **Доступ**: Запись на курсы, прохождение уроков, комментарии

### **Преподаватель**
- **Логин**: `teacher12345`
- **Email**: `teacher@example.com`
- **Пароль**: `admin12345`
- **Роль**: `TEACHER`
- **Доступ**: Создание курсов, управление уроками, проверка работ

## 🚀 Автоматическое создание

Пользователи создаются автоматически при первом запуске Docker контейнеров:

1. **PostgreSQL** запускается и создает базу данных
2. **Backend** ждет готовности PostgreSQL
3. **Применяются Prisma миграции**
4. **Выполняется SQL скрипт** с пользователями
5. **Backend запускается** с готовой базой данных

## 🗄️ Запуск MinIO отдельно

### **Вариант 1: PowerShell (рекомендуется)**
```powershell
# В корневой папке проекта
.\start-minio.ps1
```

### **Вариант 2: Command Prompt**
```cmd
# В корневой папке проекта
start-minio.bat
```

### **Остановка MinIO**
```powershell
# PowerShell
.\stop-minio.ps1

# Command Prompt
stop-minio.bat
```

### **Доступ к MinIO**
- **API**: http://localhost:9075
- **Console**: http://localhost:9001
- **Логин**: `minioadmin`
- **Пароль**: `minioadmin`

## 🔧 Запуск backend локально (без Docker)

Если вы хотите запустить backend из консоли, используйте один из скриптов:

### **Windows (PowerShell)**
```powershell
# В папке backend
.\start-local.ps1
```

### **Windows (Command Prompt)**
```cmd
# В папке backend
start-local.bat
```

### **Ручная установка переменных окружения**
```powershell
# PowerShell
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/company_courses"
$env:MINIO_ENDPOINT = "localhost"
$env:MINIO_PORT = "9075"
$env:MINIO_ACCESS_KEY = "minioadmin"
$env:MINIO_SECRET_KEY = "minioadmin"
$env:MINIO_BUCKET = "uploads"
$env:MINIO_USE_SSL = "false"

# Затем запуск
node src/index.js
```

## 🚨 Решение проблем с подключением

### **Ошибка "Authentication failed against database server at localhost"**
**Проблема**: Backend пытается подключиться к `localhost:5432` вместо `localhost:5433`

**Решение**: Убедитесь, что переменная `DATABASE_URL` указывает на правильный порт:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/company_courses
```

### **Ошибка "The Access Key Id you provided does not exist"**
**Проблема**: Неправильные настройки MinIO

**Решение**: 
1. **Запустите MinIO**: `.\start-minio.ps1`
2. **Проверьте переменные окружения**:
```
MINIO_ENDPOINT=localhost
MINIO_PORT=9075
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=uploads
MINIO_USE_SSL=false
```

### **Проверка подключения к PostgreSQL**
```bash
# Проверить, что PostgreSQL доступен
psql -h localhost -p 5433 -U postgres -d company_courses

# Или через Docker
docker exec -it company_courses_postgres psql -U postgres -d company_courses
```

### **Проверка подключения к MinIO**
```bash
# Проверить через браузер
http://localhost:9075

# Или через Docker
docker exec -it company_courses_minio mc admin info local
```

## 🔧 Ручное создание пользователей

Если нужно создать пользователей вручную:

```sql
-- Подключиться к базе данных
psql -h localhost -p 5433 -U postgres -d company_courses

-- Добавить пользователя
INSERT INTO "User" (username, email, password, role, "isVerified", "createdAt", "updatedAt")
VALUES ('newuser', 'newuser@example.com', '$2a$05$7Cqu098ySvvJUrOViilV5OCSi6pdddznShJ/LpUBRYyo2n6IjA4YS', 'USER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

## 🔐 Хеш пароля

Все пользователи используют один хеш пароля: `$2a$05$7Cqu098ySvvJUrOViilV5OCSi6pdddznShJ/LpUBRYyo2n6IjA4YS`

Это соответствует паролю: `admin12345`

## 🎯 Роли и права доступа

### **ADMIN**
- ✅ Полный доступ ко всем функциям
- ✅ Управление пользователями и ролями
- ✅ Создание, редактирование, удаление курсов
- ✅ Просмотр системной статистики

### **TEACHER**
- ✅ Создание и управление собственными курсами
- ✅ Управление модулями и уроками
- ✅ Создание тестов и заданий
- ✅ Проверка работ студентов

### **USER**
- ✅ Запись на курсы
- ✅ Прохождение уроков и тестов
- ✅ Добавление комментариев и отзывов
- ✅ Отслеживание прогресса обучения

## 🚨 Безопасность

**ВНИМАНИЕ**: Эти учетные данные предназначены только для разработки и тестирования!

Для продакшена обязательно:
1. **Измените пароли** всех пользователей
2. **Используйте сложные пароли**
3. **Включите двухфакторную аутентификацию**
4. **Настройте ограничения на вход**
5. **Регулярно обновляйте пароли**

## 🔍 Проверка пользователей

```sql
-- Посмотреть всех пользователей
SELECT username, email, role, "isVerified", "createdAt" 
FROM "User" 
ORDER BY "createdAt";

-- Посмотреть пользователей по роли
SELECT username, email, "createdAt" 
FROM "User" 
WHERE role = 'ADMIN';
``` 