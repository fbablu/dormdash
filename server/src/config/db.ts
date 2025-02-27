// server/src/config/db.ts
// Contributors: @Fardeen Bablu
// Time spent: 30 minutes

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "dormdash_user",
  password: process.env.DB_PASSWORD || "dormdash_VU",
  database: process.env.DB_NAME || "dormdash",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000,
  debug: process.env.NODE_ENV !== "production",
});

export default pool;
