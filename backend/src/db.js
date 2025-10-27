import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'subscriptions.sqlite');

let SQL = null;
let database = null;

async function loadSqlJs() {
  if (SQL) {
    return SQL;
  }

  SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
  });

  return SQL;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabaseInstance() {
  ensureDataDir();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    database = new SQL.Database(new Uint8Array(fileBuffer));
  } else {
    database = new SQL.Database();
  }
}

function persistDatabase() {
  ensureDataDir();
  const data = database.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function withTransaction(callback) {
  database.run('BEGIN TRANSACTION;');
  try {
    const result = callback(database);
    database.run('COMMIT;');
    persistDatabase();
    return result;
  } catch (error) {
    database.run('ROLLBACK;');
    throw error;
  }
}

function ensureSchema() {
  database.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      plan_name TEXT,
      price REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'RUB',
      billing_interval INTEGER NOT NULL,
      next_billing_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  persistDatabase();
}

function queryAll(sql, params = {}) {
  const stmt = database.prepare(sql);
  if (params && Object.keys(params).length > 0) {
    stmt.bind(params);
  }
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = {}) {
  const rows = queryAll(sql, params);
  return rows[0] ?? null;
}

function insert(sql, params) {
  return withTransaction((db) => {
    db.run(sql, params);
    const result = db.exec('SELECT last_insert_rowid() as id;');
    const id = result[0]?.values?.[0]?.[0];
    return typeof id === 'number' ? id : null;
  });
}

function run(sql, params) {
  return withTransaction((db) => {
    db.run(sql, params);
    return db.getRowsModified();
  });
}

function normalizeDate(value) {
  return new Date(value).toISOString();
}

export async function initDatabase() {
  await loadSqlJs();

  if (!database) {
    loadDatabaseInstance();
    ensureSchema();
  }
}

export function listSubscriptions() {
  return queryAll('SELECT * FROM subscriptions ORDER BY next_billing_date ASC;');
}

export function getSubscription(id) {
  return queryOne('SELECT * FROM subscriptions WHERE id = $id LIMIT 1;', { $id: Number(id) });
}

export function createSubscription({
  service_name,
  plan_name = null,
  price = 0,
  currency = 'RUB',
  billing_interval,
  next_billing_date,
  notes = null
}) {
  const now = new Date().toISOString();
  const normalizedDate = normalizeDate(next_billing_date);
  const interval = Number(billing_interval);
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('billing_interval должен быть положительным числом');
  }

  const id = insert(
    `
      INSERT INTO subscriptions (
        service_name,
        plan_name,
        price,
        currency,
        billing_interval,
        next_billing_date,
        notes,
        created_at,
        updated_at
      ) VALUES (
        $service_name,
        $plan_name,
        $price,
        $currency,
        $billing_interval,
        $next_billing_date,
        $notes,
        $created_at,
        $updated_at
      );
    `,
    {
      $service_name: service_name,
      $plan_name: plan_name,
      $price: Number(price) || 0,
      $currency: currency,
      $billing_interval: interval,
      $next_billing_date: normalizedDate,
      $notes: notes,
      $created_at: now,
      $updated_at: now
    }
  );

  return getSubscription(id);
}

export function updateSubscription(id, updates) {
  const existing = getSubscription(id);
  if (!existing) {
    return null;
  }

  const payload = {
    service_name: updates.service_name ?? existing.service_name,
    plan_name: updates.plan_name ?? existing.plan_name,
    price: updates.price ?? existing.price,
    currency: updates.currency ?? existing.currency,
    billing_interval: updates.billing_interval ?? existing.billing_interval,
    next_billing_date: normalizeDate(updates.next_billing_date ?? existing.next_billing_date),
    notes: updates.notes ?? existing.notes
  };

  const interval = Number(payload.billing_interval);
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('billing_interval должен быть положительным числом');
  }

  run(
    `
      UPDATE subscriptions SET
        service_name = $service_name,
        plan_name = $plan_name,
        price = $price,
        currency = $currency,
        billing_interval = $billing_interval,
        next_billing_date = $next_billing_date,
        notes = $notes,
        updated_at = $updated_at
      WHERE id = $id;
    `,
    {
      $id: Number(id),
      $service_name: payload.service_name,
      $plan_name: payload.plan_name,
      $price: Number(payload.price) || 0,
      $currency: payload.currency,
      $billing_interval: interval,
      $next_billing_date: payload.next_billing_date,
      $notes: payload.notes,
      $updated_at: new Date().toISOString()
    }
  );

  return getSubscription(id);
}

export function deleteSubscription(id) {
  run('DELETE FROM subscriptions WHERE id = $id;', { $id: Number(id) });
}

export function findUpcomingSubscriptions(daysAhead = 3) {
  const today = new Date();
  const limit = new Date(today);
  limit.setDate(today.getDate() + Number(daysAhead));

  const start = today.toISOString().split('T')[0];
  const end = limit.toISOString().split('T')[0];

  return queryAll(
    `
      SELECT * FROM subscriptions
      WHERE DATE(next_billing_date) BETWEEN DATE($start) AND DATE($end)
      ORDER BY next_billing_date ASC;
    `,
    { $start: start, $end: end }
  );
}
