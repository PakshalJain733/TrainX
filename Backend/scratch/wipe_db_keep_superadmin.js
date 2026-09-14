import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function wipeDatabaseKeepSuperAdmin() {
  try {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || 'Ganeshvs@2006';
    const database = process.env.DB_NAME || 'training_portal_db';

    const conn = await mysql.createConnection({ host, port, user, password, database });

    console.log('Connected to MySQL database:', database);

    // Disable foreign key checks to allow clean truncation/deletion
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // Get all tables in database dynamically
    const [rows] = await conn.query('SHOW TABLES');
    const tableKey = Object.keys(rows[0] || {})[0];
    const allTables = rows.map(r => r[tableKey]);

    console.log('Found database tables:', allTables);

    for (const table of allTables) {
      if (table === 'users') continue; // Handled separately
      try {
        await conn.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`[Wiped] Table: ${table}`);
      } catch (err) {
        try {
          await conn.query(`DELETE FROM \`${table}\``);
          console.log(`[Deleted All] Table: ${table}`);
        } catch (e) {
          console.log(`[Skip] Table ${table}: ${e.message}`);
        }
      }
    }

    // Clean USERS table: keep ONLY super_admin
    const [beforeUsers] = await conn.query('SELECT id, name, email, role FROM users');
    console.log('\nUsers before cleanup:', beforeUsers);

    await conn.query(`DELETE FROM users WHERE role NOT IN ('super_admin', 'superadmin')`);

    // Ensure at least 1 super_admin exists if users table had none
    const [superAdmins] = await conn.query(`SELECT id, name, email, role FROM users WHERE role IN ('super_admin', 'superadmin')`);
    if (superAdmins.length === 0) {
      await conn.query(
        `INSERT INTO users (name, email, mobile_number, role, college_id, is_active) VALUES ('Super Admin', 'training.portal0987@gmail.com', '9876543210', 'super_admin', NULL, 1)`
      );
      console.log('[Created] Default Super Admin account (training.portal0987@gmail.com)');
    } else {
      console.log(`\n[Retained Super Admin User(s)] (${superAdmins.length}):`, superAdmins);
    }

    // Re-enable foreign key checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const [afterUsers] = await conn.query('SELECT id, name, email, role FROM users');
    console.log('\nRemaining Users in Database:', afterUsers);

    console.log('\n--- SUCCESS: DATABASE CLEANUP COMPLETE ---');
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('Error during DB cleanup:', error);
    process.exit(1);
  }
}

wipeDatabaseKeepSuperAdmin();
