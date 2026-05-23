const Database = require('better-sqlite3');
const path = require('path');

// On Railway, mount a volume at /data and set DATA_DIR=/data
const dataDir = process.env.DATA_DIR || __dirname;
const dbPath = path.join(dataDir, 'waitlist.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    location TEXT,
    services TEXT,
    want_to_be_stepper INTEGER DEFAULT 0,
    customer_type TEXT,
    would_pay TEXT,
    submitted_at TEXT
  )
`);

module.exports = db;
