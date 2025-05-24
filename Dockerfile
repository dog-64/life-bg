# Multi-stage Dockerfile для React-версии игры Жизни Конвея

# Этап 1: Сборка React приложения
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение для продакшена
RUN npm run build

# Этап 2: Настройка Nginx для отдачи статики
FROM nginx:alpine AS production

# Копируем собранное приложение из предыдущего этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомную конфигурацию Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт 80
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"] 