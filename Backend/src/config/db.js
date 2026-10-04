import mysql from 'mysql2/promise';

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'training_portal_db';
const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
const connectTimeout = parseInt(process.env.DB_CONNECT_TIMEOUT || '15000', 10);

export const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(dbSsl ? { ssl: dbSsl } : {}),
  connectTimeout: connectTimeout,
});

export const query = async (sql, params = []) => {
  const safeParams = (params || []).map((p) => (p === undefined ? null : p));
  const [results] = await pool.execute(sql, safeParams);
  return results;
};

export const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log(`[Database] Connected successfully to MySQL database: ${dbName}`);
    return true;
  } catch (error) {
    console.warn(`[Database Warning] Database connection failed (${error.message}). Server running with fallback mode.`);
    return false;
  }
};
