# KeyNeroCity Subscription Tracker

Полноценное приложение для отслеживания подписок на сервисы KeyNeroCity. Включает Node.js backend с напоминаниями по email и современный React-интерфейс с плавными анимациями.

## Структура

- `backend/` — Express API, SQLite база данных и планировщик email-уведомлений
- `frontend/` — Vite + React SPA с Tailwind CSS и Framer Motion

## Быстрый старт

### Backend

```bash
cd backend
npm install
cp .env.example .env # укажите SMTP данные
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Фронтенд по умолчанию обращается к API `http://localhost:5000/api`. При необходимости задайте `VITE_API_URL` в `.env` фронтенда.

## Возможности

- CRUD для подписок с хранением в SQLite
- Автоматические email-напоминания за 3 дня до списания
- Ручное тестовое напоминание из интерфейса
- Красивый UI с неоморфными карточками, градиентами и плавными анимациями
- Подсчет количества подписок и ориентировочных месячных затрат
