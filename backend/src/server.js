import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  initDatabase,
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription
} from './db.js';
import { sendReminderEmail } from './email.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const hasFrontendBuild = fs.existsSync(distPath);

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/subscriptions', (_req, res) => {
  const subscriptions = listSubscriptions();
  res.json(subscriptions);
});

app.post('/api/subscriptions', (req, res) => {
  const {
    service_name,
    plan_name,
    price,
    currency = 'RUB',
    billing_interval,
    next_billing_date,
    notes
  } = req.body;

  if (!service_name || !billing_interval || !next_billing_date) {
    return res.status(400).json({ error: 'service_name, billing_interval и next_billing_date обязательны' });
  }

  const interval = Number(billing_interval);
  if (!Number.isFinite(interval) || interval <= 0) {
    return res.status(400).json({ error: 'billing_interval должен быть положительным числом' });
  }

  const parsedDate = new Date(next_billing_date);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: 'Некорректная дата списания' });
  }

  try {
    const created = createSubscription({
      service_name,
      plan_name,
      price,
      currency,
      billing_interval: interval,
      next_billing_date,
      notes
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Failed to create subscription', error);
    res.status(400).json({ error: 'Не удалось создать подписку', details: error.message });
  }
});

app.put('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  const existing = getSubscription(id);
  if (!existing) {
    return res.status(404).json({ error: 'Подписка не найдена' });
  }

  let updated;
  try {
    updated = updateSubscription(id, req.body);
  } catch (error) {
    console.error('Failed to update subscription', error);
    return res.status(400).json({ error: 'Не удалось обновить подписку', details: error.message });
  }

  res.json(updated);
});

app.delete('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  deleteSubscription(id);
  res.status(204).send();
});

app.post('/api/subscriptions/:id/send-reminder', async (req, res) => {
  const { id } = req.params;
  const subscription = getSubscription(id);
  if (!subscription) {
    return res.status(404).json({ error: 'Подписка не найдена' });
  }

  try {
    await sendReminderEmail(subscription);
    res.json({ status: 'Email отправлен' });
  } catch (error) {
    console.error('Failed to send manual reminder', error);
    res.status(500).json({ error: 'Не удалось отправить письмо', details: error.message });
  }
});

if (hasFrontendBuild) {
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function bootstrap() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      startScheduler();
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

bootstrap();
