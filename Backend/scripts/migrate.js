#!/usr/bin/env node
/**
 * Database Migration Runner for TrainX
 * Executable directly on self-hosted VPS, Docker, or CI/CD pipelines.
 * Usage: npm run db:migrate  OR  node scripts/migrate.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { initializeDatabase } from '../src/config/init_db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbName = process.env.DB_NAME || 'training_portal_db';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

  console.log('========================================================');
  console.log('⚡ [TrainX Database Migration Runner]');
  console.log('   Target Host:  ', dbHost);
  console.log('   Target Port:  ', dbPort);
  console.log('   Database Name:', dbName);
  console.log('   User:         ', dbUser);
  console.log('========================================================');

  const start = Date.now();
  try {
    // 1. Run core schema and table initializations
    const success = await initializeDatabase();
    if (!success) {
      console.error('❌ [Migration Failed] initializeDatabase returned false.');
      process.exit(1);
    }

    // 2. Establish connection to apply standalone SQL migrations & track them
    const conn = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      ...(dbSsl ? { ssl: dbSsl } : {}),
      multipleStatements: true,
    });

    try {
      // Ensure schema_migrations table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          migration_name VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      // Find all top-level .sql files in database/migrations
      const migrationsDir = path.resolve(__dirname, '../../database/migrations');
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir)
          .filter(f => f.endsWith('.sql'))
          .sort();

        for (const file of files) {
          const [alreadyRun] = await conn.query(
            'SELECT id FROM schema_migrations WHERE migration_name = ? LIMIT 1',
            [file]
          );

          if (alreadyRun && alreadyRun.length > 0) {
            console.log(`ℹ️ [Skip] Migration already applied: ${file}`);
            continue;
          }

          console.log(`🚀 [Applying] Migration: ${file}...`);
          const rawSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          const executableSql = rawSql
            .replace(/DELIMITER\s+\$\$/gi, '')
            .replace(/DELIMITER\s+;/gi, '')
            .replace(/\$\$/g, ';');

          await conn.query(executableSql);
          await conn.query(
            'INSERT INTO schema_migrations (migration_name) VALUES (?)',
            [file]
          );
          console.log(`✅ [Applied] Migration: ${file}`);
        }
      }
    } finally {
      await conn.end();
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log('========================================================');
    console.log(`✅ [Migration Complete] All tables, scripts & seeds verified in ${elapsed}s.`);
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('========================================================');
    console.error('❌ [Fatal Migration Error]:', err.message);
    console.error('========================================================');
    process.exit(1);
  }
}

run();
