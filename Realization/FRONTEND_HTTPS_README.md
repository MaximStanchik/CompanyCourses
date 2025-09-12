# 🚀 Настройка HTTPS для фронтенда

Этот документ описывает, как настроить фронтенд с HTTPS доступом на `https://localhost:3000/`.

## 📋 Предварительные требования

- Docker и Docker Compose установлены
- OpenSSL доступен в системе
- PowerShell (для Windows)

## 🔐 Генерация SSL сертификатов

### Автоматическая генерация
Запустите скрипт для автоматической генерации SSL сертификатов:

```powershell
.\start-frontend.ps1
```

Скрипт автоматически:
1. Проверит наличие SSL сертификатов
2. Сгенерирует их при необходимости
3. Запустит фронтенд контейнер

### Ручная генерация
Если хотите сгенерировать сертификаты вручную:

```powershell
cd frontend
.\ssl\generate-ssl.ps1
```

## 🚀 Запуск фронтенда

### Запуск с HTTPS
```powershell
.\start-frontend.ps1
```

### Остановка
```powershell
.\stop-frontend.ps1
```

## 🌐 Доступ к приложению

После успешного запуска фронтенд будет доступен по адресу:
**https://localhost:3000/**

## ⚠️ Важные замечания

### Самоподписанный сертификат
При первом посещении браузер покажет предупреждение о небезопасном соединении. Это нормально для самоподписанных сертификатов.

**Для Chrome/Edge:**
1. Нажмите "Дополнительно"
2. Нажмите "Перейти на localhost (небезопасно)"

**Для Firefox:**
1. Нажмите "Дополнительно"
2. Нажмите "Принять риск и продолжить"

### Порт 3000
Фронтенд настроен на работу через порт 3000, который внутри контейнера соответствует порту 443 (HTTPS).

## 🔧 Структура файлов

```
frontend/
├── ssl/
│   ├── cert.pem          # SSL сертификат
│   ├── key.pem           # Приватный ключ
│   └── generate-ssl.ps1  # Скрипт генерации
├── nginx.conf            # Конфигурация nginx
├── Dockerfile            # Docker образ
└── ...
```

## 🐛 Устранение неполадок

### Ошибка "SSL certificate not found"
Убедитесь, что SSL сертификаты сгенерированы:
```powershell
ls frontend/ssl/
```

### Ошибка "Port already in use"
Остановите существующий контейнер:
```powershell
docker stop company_courses_frontend
docker rm company_courses_frontend
```

### Проблемы с сертификатом
Удалите существующие сертификаты и перегенерируйте:
```powershell
Remove-Item frontend/ssl/*.pem
.\start-frontend.ps1
```

## 📚 Дополнительные ресурсы

- [Docker Compose документация](https://docs.docker.com/compose/)
- [Nginx SSL настройки](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [OpenSSL команды](https://www.openssl.org/docs/manmaster/man1/)

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте логи контейнера: `docker logs company_courses_frontend`
2. Убедитесь, что все порты свободны
3. Проверьте, что Docker демон запущен 