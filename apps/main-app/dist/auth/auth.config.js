"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = void 0;
const Database = require("better-sqlite3");
const path_1 = require("path");
const dbPath = (0, path_1.join)(process.cwd(), "auth.db");
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
const getDatabase = () => db;
exports.getDatabase = getDatabase;
//# sourceMappingURL=auth.config.js.map