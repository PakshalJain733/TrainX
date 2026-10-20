import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  const [dbs] = await conn.query('SHOW DATABASES');
  for (const dbRow of dbs) {
    const db = Object.values(dbRow)[0];
    try {
      const [b] = await conn.query(`SELECT * FROM \`${db}\`.\`batches\``);
      console.log(`Database ${db} batches:`, b);
    } catch (e) {}
  }
  await conn.end();
}

run().catch(console.error);
