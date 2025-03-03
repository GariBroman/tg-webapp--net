#!/bin/bash

# Устанавливаем переменные окружения
export NODE_ENV=development
export DEBUG="localtunnel:*"

# Фиксированный поддомен для localtunnel
SUBDOMAIN="tg-webapp-mir"

# Проверяем наличие localtunnel
if ! command -v lt &> /dev/null; then
    echo "Установка localtunnel..."
    npm install -g localtunnel
fi

# Завершаем все предыдущие процессы
pkill -f "next dev" || true
pkill -f localtunnel || true

# Запускаем базу данных в фоновом режиме
echo "Запускаем базу данных..."
./start-database.sh &
DB_PID=$!

# Функция для корректного завершения всех процессов
cleanup() {
    echo "Завершаем все процессы..."
    kill $DB_PID 2>/dev/null
    kill $NEXT_PID 2>/dev/null
    kill $TUNNEL_PID 2>/dev/null
    exit 0
}

# Устанавливаем обработчик сигналов для корректного завершения
trap cleanup SIGINT SIGTERM

# Устанавливаем зависимости, если они еще не установлены
if [ ! -d "node_modules" ]; then
    echo "Устанавливаем зависимости..."
    pnpm install
fi

# Запускаем Next.js приложение
echo "Запускаем Next.js приложение..."
pnpm run dev &
NEXT_PID=$!

# Даем время для запуска Next.js
sleep 5

# Запускаем localtunnel с фиксированным поддоменом и дополнительными параметрами
echo "Запускаем localtunnel с поддоменом $SUBDOMAIN..."
lt -l 127.0.0.1 --port 3000 --subdomain $SUBDOMAIN --print-requests --max-conn 20 &
TUNNEL_PID=$!

# Получаем URL туннеля
TUNNEL_URL="https://$SUBDOMAIN.loca.lt"
echo "URL туннеля: $TUNNEL_URL"

# Обновляем .env файл с новым URL
sed -i '' "s|NEXT_PUBLIC_WEBAPP_URL=.*|NEXT_PUBLIC_WEBAPP_URL=\"$TUNNEL_URL\"|" .env

echo "Обновлен .env файл с URL: $TUNNEL_URL"

# Выводим информацию о запущенных процессах
echo "Процессы запущены:"
echo "База данных: PID $DB_PID"
echo "Next.js: PID $NEXT_PID"
echo "Localtunnel: PID $TUNNEL_PID"

# Ожидаем завершения процессов
wait 