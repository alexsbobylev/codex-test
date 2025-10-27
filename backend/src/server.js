import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';
import { sendReminderEmail } from './email.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

const listStmt = db.prepare('SELECT * FROM subscriptions ORDER BY next_billing_date ASC');
const getStmt = db.prepare('SELECT * FROM subscriptions WHERE id = ?');
const insertStmt = db.prepare(`
  INSERT INTO subscriptions (
    service_name, plan_name, price, currency, billing_interval, next_billing_date, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const updateStmt = db.prepare(`
  UPDATE subscriptions SET
    service_name = ?,
    plan_name = ?,
    price = ?,
    currency = ?,
    billing_interval = ?,
    next_billing_date = ?,
    notes = ?
  WHERE id = ?
`);
const deleteStmt = db.prepare('DELETE FROM subscriptions WHERE id = ?');

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/subscriptions', (_req, res) => {
  const subscriptions = listStmt.all();
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

  const info = insertStmt.run(
    service_name,
    plan_name,
    Number(price) || 0,
    currency,
    Number(billing_interval),
    new Date(next_billing_date).toISOString(),
    notes
  );

  const created = getStmt.get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.put('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  const existing = getStmt.get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Подписка не найдена' });
  }

  const {
    service_name = existing.service_name,
    plan_name = existing.plan_name,
    price = existing.price,
    currency = existing.currency,
    billing_interval = existing.billing_interval,
    next_billing_date = existing.next_billing_date,
    notes = existing.notes
  } = req.body;

  updateStmt.run(
    service_name,
    plan_name,
    Number(price) || 0,
    currency,
    Number(billing_interval),
    new Date(next_billing_date).toISOString(),
    notes,
    id
  );

  const updated = getStmt.get(id);
  res.json(updated);
});

app.delete('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  deleteStmt.run(id);
  res.status(204).send();
});

app.post('/api/subscriptions/:id/send-reminder', async (req, res) => {
  const { id } = req.params;
  const subscription = getStmt.get(id);
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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  startScheduler();
});
