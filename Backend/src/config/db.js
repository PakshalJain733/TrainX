import mysql from 'mysql2/promise';
import { config } from './env.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const query = async (sql, params = []) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

export const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log(`[Database] Connected successfully to MySQL database: ${config.db.database}`);
    return true;
  } catch (error) {
    console.warn(`[Database Warning] Database connection failed (${error.message}). Server running with fallback mode.`);
    return false;
  }
};
