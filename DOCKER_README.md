# 🐳 Docker деплой Conway's Game of Life

Полностью готовое решение для продакшн деплоя React-версии игры в Docker контейнере.

## 🚀 Быстрый запуск

### Требования
- Docker 20.0+
- Docker Compose 2.0+

### Автоматический деплой

```bash
# Быстрый деплой (рекомендуется)
./deploy.sh

# Деплой с очисткой старых образов
./deploy.sh --clean

# Деплой без кэша Docker (медленнее, но чище)
./deploy.sh --no-cache

# Полная пересборка
./deploy.sh --clean --no-cache

# Справка по опциям
./deploy.sh --help
```

### Ручной деплой

```bash
# 1. Сборка образа
docker-compose build

# 2. Запуск контейнера
docker-compose up -d

# 3. Проверка статуса
docker-compose ps
```

## 📋 Доступ к приложению

После запуска игра будет доступна по адресу:
**http://localhost:8000**

## 🛠️ Управление контейнером

### Основные команды

```bash
# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose stop

# Перезапуск
docker-compose restart

# Полная остановка и удаление
docker-compose down

# Пересборка при изменениях
docker-compose build --no-cache
docker-compose up -d
```

### Мониторинг

```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats conway-game-of-life

# Логи в реальном времени
docker-compose logs -f --tail=100
```

## ⚙️ Конфигурация

### Порты

- **8000** - основной порт приложения
- Можно изменить в `docker-compose.yml`:

```yaml
ports:
  - "9000:80"  # Изменить на нужный порт
```

### Переменные окружения

Доступные переменные в `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - REACT_APP_CUSTOM_VAR=value
```

## 🏗️ Архитектура контейнера

### Multi-stage сборка

1. **Этап 1 (builder)**: Node.js 18 Alpine
   - Установка зависимостей
   - Сборка React приложения

2. **Этап 2 (production)**: Nginx Alpine
   - Отдача статических файлов
   - Оптимизированная конфигурация

### Оптимизации

- ✅ Gzip сжатие
- ✅ Кэширование статических файлов (1 год)
- ✅ Security headers
- ✅ SPA routing поддержка
- ✅ Минимальный размер образа (~50MB)

## 🔒 Безопасность

### Настроенные заголовки

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`

### Рекомендации для продакшена

1. **Изменить домен** в nginx.conf:
   ```nginx
   server_name ваш-домен.com;
   ```

2. **Добавить SSL/TLS**:
   ```yaml
   # docker-compose.yml
   ports:
     - "443:443"
   volumes:
     - ./ssl:/etc/nginx/ssl
   ```

3. **Настроить reverse proxy** (Traefik, Nginx Proxy Manager)

## 📊 Производительность

### Размеры

- **Исходный код**: ~2MB
- **node_modules**: ~200MB (только для сборки)
- **Итоговый образ**: ~50MB
- **Сжатый JS/CSS**: ~500KB

### Метрики

- **Время сборки**: ~2-3 минуты
- **Время запуска**: ~5 секунд
- **Память**: ~20MB RAM
- **CPU**: Минимальное использование

## 🐛 Решение проблем

### Контейнер не запускается

```bash
# Проверить логи
docker-compose logs

# Проверить образы
docker images

# Пересобрать
docker-compose build --no-cache
```

### Порт занят

```bash
# Найти процесс на порту 3000
lsof -i :3000

# Изменить порт в docker-compose.yml
ports:
  - "8080:80"
```

### Проблемы с сетью

```bash
# Пересоздать сеть
docker-compose down
docker network prune
docker-compose up -d
```

## 🚀 Деплой на сервер

### VPS/Dedicated сервер

```bash
# 1. Скопировать файлы на сервер
scp -r . user@server:/path/to/app/

# 2. Подключиться к серверу
ssh user@server

# 3. Запустить
cd /path/to/app/
./deploy.sh
```

### Docker Swarm

```bash
# Инициализация Swarm
docker swarm init

# Деплой как сервис
docker stack deploy -c docker-compose.yml conway
```

### Kubernetes

Конвертация в K8s манифесты:

```bash
# Установить kompose
curl -L https://github.com/kubernetes/kompose/releases/latest/download/kompose-linux-amd64 -o kompose

# Конвертировать
kompose convert
```

## 📈 Мониторинг

### Prometheus метрики

Добавить в `docker-compose.yml`:

```yaml
services:
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter
    ports:
      - "9113:9113"
    command:
      - -nginx.scrape-uri=http://conway-game-of-life/nginx_status
```

### Health check

```yaml
# В docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

**🎮 Готово! Ваша игра Жизни Конвея работает в продакшене с Docker! 🐳** 