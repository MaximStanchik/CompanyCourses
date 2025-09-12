FROM postgres:15-alpine

# Установка переменных окружения
ENV POSTGRES_DB=ItCourses
ENV POSTGRES_USER=admin12345
ENV POSTGRES_PASSWORD=admin12345

# Копирование SQL скриптов для инициализации
COPY init.sql /docker-entrypoint-initdb.d/
COPY Scripts/ /docker-entrypoint-initdb.d/scripts/

# Экспорт порта
EXPOSE 5433

# Запуск PostgreSQL
CMD ["postgres", "-p", "5433"] 