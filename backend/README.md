# Subscription Tracker Backend

Node.js/Express backend API для приложения трекинга подписок KeyNeroCity.

## Основные возможности

- REST API для CRUD-операций по подпискам
- SQLite база данных на базе WebAssembly (`sql.js`) без нативной сборки
- Ежедневные email-напоминания о предстоящих списаниях (за 3 дня до события)
- Ручная отправка тестового письма для отдельной подписки

## Запуск

```bash
cd backend
npm install
cp .env.example .env # заполните SMTP данные
npm run dev
```

Если предварительно выполнить `npm run build` во фронтенде (`frontend/`), команда `npm start` будет автоматически раздавать статические файлы на `http://localhost:5000`.

## Маршруты

- `GET /api/subscriptions` — список всех подписок
- `POST /api/subscriptions` — создать подписку
- `PUT /api/subscriptions/:id` — обновить подписку
- `DELETE /api/subscriptions/:id` — удалить подписку
- `POST /api/subscriptions/:id/send-reminder` — отправить email-напоминание для выбранной подписки

## Переменные окружения

- `PORT` — порт сервера (по умолчанию 5000)
- `CLIENT_URL` — адрес фронтенда для CORS
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` — SMTP параметры
- `EMAIL_FROM` — отображаемое имя отправителя
- `EMAIL_TO` — адрес получателя уведомлений
