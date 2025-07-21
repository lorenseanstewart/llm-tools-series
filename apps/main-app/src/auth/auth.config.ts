import Database = require("better-sqlite3");
import { join } from "path";

// Create database directory if it doesn't exist
const dbPath = join(process.cwd(), "auth.db");
const db = new Database(dbPath);

// Initialize database schema
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

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: string;
}

// Export db instance  
export const getDatabase = (): any => db;