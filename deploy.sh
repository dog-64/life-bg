#!/bin/bash

# Скрипт для деплоя Conway's Game of Life в Docker
# Использование: ./deploy.sh [--clean] [--no-cache]

CLEAN_IMAGES=false
NO_CACHE=false

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
  case $1 in
    --clean)
      CLEAN_IMAGES=true
      shift
      ;;
    --no-cache)
      NO_CACHE=true
      shift
      ;;
    -h|--help)
      echo "Использование: $0 [--clean] [--no-cache]"
      echo "  --clean     Удалить старые образы перед сборкой"
      echo "  --no-cache  Собрать без использования кэша"
      echo "  --help      Показать эту справку"
      exit 0
      ;;
    *)
      echo "Неизвестный параметр: $1"
      echo "Используйте --help для справки"
      exit 1
      ;;
  esac
done

echo "🚀 Запуск деплоя Conway's Game of Life..."

# Останавливаем и удаляем существующие контейнеры
echo "📦 Останавливаем существующие контейнеры..."
docker-compose down

# Удаляем старые образы только если указан флаг --clean
if [ "$CLEAN_IMAGES" = true ]; then
  echo "🗑️  Удаляем старые образы..."
  docker rmi $(docker images "life-gb*" -q) 2>/dev/null || true
  # Удаляем также dangling образы
  docker image prune -f
fi

# Собираем новый образ (используем кэш для ускорения)
echo "🔨 Собираем новый образ..."
if [ "$NO_CACHE" = true ]; then
  docker-compose build --no-cache
else
  docker-compose build
fi

# Запускаем контейнер
echo "▶️  Запускаем контейнер..."
docker-compose up -d

# Проверяем статус
echo "✅ Проверяем статус..."
sleep 5
docker-compose ps

echo ""
echo "🎉 Деплой завершен!"
echo "🌐 Игра доступна по адресу: http://localhost:8000"
echo ""
echo "Полезные команды:"
echo "  docker-compose logs -f    # Просмотр логов"
echo "  docker-compose stop       # Остановка"
echo "  docker-compose restart    # Перезапуск"
echo "  docker-compose down       # Полная остановка"
echo ""
echo "Опции деплоя:"
echo "  ./deploy.sh --clean       # Деплой с очисткой старых образов"
echo "  ./deploy.sh --no-cache    # Деплой без кэша Docker"
echo "  ./deploy.sh --clean --no-cache  # Полная пересборка" 