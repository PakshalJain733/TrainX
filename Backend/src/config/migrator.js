import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tolerable idempotent error codes in MySQL
const TOLERABLE_ERROR_CODES = new Set([
  'ER_DUP_FIELDNAME',          // 1060: Duplicate column name
  'ER_DUP_KEYNAME',            // 1061: Duplicate key name
  'ER_TABLE_EXISTS_ERROR',     // 1050: Table already exists
  'ER_CANT_DROP_FIELD_OR_KEY', // 1091: Can't DROP '...'; check that column/key exists
  'ER_NONUNIQ_TABLE',          // 1066: Not unique table/alias
]);

/**
 * Creates connection with multipleStatements support for migrations
 */
async function createMigrationConnection() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'training_portal_db';
  const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

  return await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ...(dbSsl ? { ssl: dbSsl } : {}),
    multipleStatements: true,
  });
}

/**
 * Ensures the `schema_migrations` tracking table exists
 */
async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      batch INT DEFAULT 1,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  try {
    await conn.query('ALTER TABLE schema_migrations ADD COLUMN batch INT DEFAULT 1');
  } catch (_) {}
}

/**
 * Discovers migration files from database/migrations and Backend/src/migrations
 */
function discoverMigrationFiles() {
  const candidateDirs = [
    path.resolve(__dirname, '../../database/migrations'),
    path.resolve(__dirname, '../migrations'),
  ];

  const migrationMap = new Map();

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const filename = entry.name;
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.sql' || ext === '.js' || ext === '.mjs') {
        if (!migrationMap.has(filename)) {
          migrationMap.set(filename, path.join(dir, filename));
        }
      }
    }
  }

  // Sort files naturally by filename
  const sortedNames = [...migrationMap.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return sortedNames.map(name => ({
    name,
    fullPath: migrationMap.get(name),
    ext: path.extname(name).toLowerCase(),
  }));
}

/**
 * Main migration runner: Applies all pending migrations in order
 */
export async function runMigrations() {
  let conn;
  let appliedCount = 0;
  let skippedCount = 0;

  try {
    conn = await createMigrationConnection();
    await ensureMigrationsTable(conn);

    // Get current batch index
    const [batchRows] = await conn.query('SELECT COALESCE(MAX(batch), 0) + 1 AS next_batch FROM schema_migrations');
    const currentBatch = batchRows[0]?.next_batch || 1;

    // Get set of already applied migration names
    const [appliedRows] = await conn.query('SELECT migration_name FROM schema_migrations');
    const appliedSet = new Set((appliedRows || []).map(r => r.migration_name));

    const migrationFiles = discoverMigrationFiles();

    for (const file of migrationFiles) {
      if (appliedSet.has(file.name)) {
        skippedCount++;
        continue;
      }

      console.log(`[AutoMigrator] 🚀 Applying pending migration: ${file.name}...`);

      if (file.ext === '.sql') {
        const rawSql = fs.readFileSync(file.fullPath, 'utf8');
        // Clean out DELIMITER keywords for mysql2 driver compatibility
        const executableSql = rawSql
          .replace(/DELIMITER\s+\$\$/gi, '')
          .replace(/DELIMITER\s+;/gi, '')
          .replace(/\$\$/g, ';');

        try {
          await conn.query(executableSql);
        } catch (sqlErr) {
          if (!TOLERABLE_ERROR_CODES.has(sqlErr.code)) {
            console.error(`[AutoMigrator] ❌ Error in SQL migration '${file.name}':`, sqlErr.message);
            throw sqlErr;
          } else {
            console.warn(`[AutoMigrator] ⚠️ Tolerated notice in '${file.name}': ${sqlErr.code}`);
          }
        }
      } else if (file.ext === '.js' || file.ext === '.mjs') {
        try {
          const fileUrl = new URL(`file://${file.fullPath.replace(/\\/g, '/')}`).href;
          const migrationModule = await import(fileUrl);
          if (typeof migrationModule.up === 'function') {
            await migrationModule.up();
          }
        } catch (jsErr) {
          console.error(`[AutoMigrator] ❌ Error in JS migration '${file.name}':`, jsErr.message);
          throw jsErr;
        }
      }

      // Record migration as applied
      await conn.query(
        'INSERT INTO schema_migrations (migration_name, batch) VALUES (?, ?)',
        [file.name, currentBatch]
      );
      console.log(`[AutoMigrator] ✅ Applied migration: ${file.name}`);
      appliedCount++;
    }

    const totalApplied = appliedSet.size + appliedCount;
    if (appliedCount > 0) {
      console.log(`[AutoMigrator] 🎉 Successfully applied ${appliedCount} migration(s). Total applied: ${totalApplied}.`);
    } else {
      console.log(`[AutoMigrator] ✨ Database schema is up to date (${totalApplied} migrations verified).`);
    }

    return { appliedCount, skippedCount, total: totalApplied };
  } catch (err) {
    console.error('[AutoMigrator Error]', err.message);
    throw err;
  } finally {
    if (conn) await conn.end();
  }
}

/**
 * Hook executed on application boot in server.js
 * Runs safely without crashing the HTTP server on non-fatal DB errors
 */
export async function migrateOnBoot() {
  try {
    console.log('[AutoMigrator] Checking database schema on boot...');
    const result = await runMigrations();
    return result;
  } catch (err) {
    console.warn('[AutoMigrator Warning] Boot migration check encountered an issue:', err.message);
    return null;
  }
}
