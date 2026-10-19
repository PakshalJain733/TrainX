import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  });
  const [dbs] = await c.query('SHOW DATABASES');
  for (const d of dbs) {
    const dbName = d.Database;
    if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) continue;
    try {
      const [tables] = await c.query('SHOW TABLES FROM ' + dbName);
      for (const t of tables) {
        const tName = Object.values(t)[0];
        try {
          const [rows] = await c.query('SELECT * FROM ' + dbName + '.' + tName);
          const s = JSON.stringify(rows);
          if (s.includes('vedant345') || s.includes('Siddhesh') || s.includes('admin@kj.ac.in')) {
            console.log('FOUND IN DATABASE:', dbName, 'TABLE:', tName);
            console.log(rows.filter(r => JSON.stringify(r).includes('vedant345') || JSON.stringify(r).includes('admin@kj.ac.in') || JSON.stringify(r).includes('Siddhesh')));
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
  process.exit(0);
}
run();
