#!/bin/bash

# Загружаем переменные окружения из .env файла
source .env

# Проверяем, что токен бота установлен
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "Ошибка: TELEGRAM_BOT_TOKEN не установлен в файле .env"
    exit 1
fi

# Проверяем, что URL приложения установлен
if [ -z "$NEXT_PUBLIC_WEBAPP_URL" ]; then
    echo "Ошибка: NEXT_PUBLIC_WEBAPP_URL не установлен в файле .env"
    exit 1
fi

# Формируем URL для вебхука
WEBHOOK_URL="$NEXT_PUBLIC_WEBAPP_URL/api/webhooks/telegram?secret_hash=32e58fbahey833349df3383dc910e181"

echo "Настраиваем вебхук для бота на URL: $WEBHOOK_URL"

# Отправляем запрос на установку вебхука
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\": \"$WEBHOOK_URL\", \"drop_pending_updates\": true}"

echo -e "\n\nГотово! Вебхук настроен."
echo "Теперь вы можете использовать этот URL в настройках вашего бота в BotFather:"
echo "$NEXT_PUBLIC_WEBAPP_URL" 