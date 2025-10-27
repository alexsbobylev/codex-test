import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'subscriptions.db');

const db = new Database(dbPath);

const createTable = `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    plan_name TEXT,
    price REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_interval INTEGER NOT NULL,
    next_billing_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

db.exec('PRAGMA foreign_keys = ON;');
db.exec(createTable);

db.function('now', () => new Date().toISOString());

db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_subscriptions_timestamp
  AFTER UPDATE ON subscriptions
  BEGIN
    UPDATE subscriptions SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
`);

export default db;
