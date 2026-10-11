import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

function getEnv() {
  const content = fs.readFileSync(path.resolve('.env'), 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      vars[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }
  return vars;
}

const env = getEnv();

async function runMigration() {
  const conn = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'training_portal_db',
    port: parseInt(env.DB_PORT || '3306')
  });

  console.log('--- 1. Enhancing training_programs schema ---');
  const addCol = async (table, colDef) => {
    try {
      await conn.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
      console.log(`✓ Added ${colDef} to ${table}`);
    } catch (e) {
      if (!e.message.includes('Duplicate column')) {
        console.warn(`Note on ${colDef}:`, e.message);
      } else {
        console.log(`• Column ${colDef.split(' ')[0]} already exists in ${table}`);
      }
    }
  };

  await addCol('training_programs', 'start_date DATE NULL');
  await addCol('training_programs', 'end_date DATE NULL');
  await addCol('training_programs', 'registration_open_date DATE NULL');
  await addCol('training_programs', 'registration_close_date DATE NULL');
  await addCol('training_programs', 'payment_instructions TEXT NULL');
  await addCol('training_programs', 'payment_qr_url TEXT NULL');
  await addCol('training_programs', 'eligibility_criteria TEXT NULL');
  await addCol('training_programs', 'restrictions JSON NULL');
  await addCol('training_programs', 'google_form_url VARCHAR(500) NULL');
  await addCol('training_programs', 'google_sheet_url VARCHAR(500) NULL');

  console.log('\n--- 2. Enhancing c2c_enrollments schema ---');
  await addCol('c2c_enrollments', 'training_id INT NULL');
  await addCol('c2c_enrollments', 'training_code VARCHAR(100) NULL');
  await addCol('c2c_enrollments', 'student_id INT NULL');
  await addCol('c2c_enrollments', "approval_status VARCHAR(50) NOT NULL DEFAULT 'Pending'");
  await addCol('c2c_enrollments', 'approved_at DATETIME NULL');
  await addCol('c2c_enrollments', 'approved_by INT NULL');
  await addCol('c2c_enrollments', 'rejection_reason TEXT NULL');

  try {
    await conn.query('ALTER TABLE c2c_enrollments ADD INDEX idx_c2c_training (training_id)');
    console.log('✓ Added index idx_c2c_training');
  } catch (_) {}
  try {
    await conn.query('ALTER TABLE c2c_enrollments ADD INDEX idx_c2c_approval (approval_status)');
    console.log('✓ Added index idx_c2c_approval');
  } catch (_) {}
  try {
    await conn.query('ALTER TABLE c2c_enrollments ADD INDEX idx_c2c_training_email (training_id, email)');
    console.log('✓ Added index idx_c2c_training_email');
  } catch (_) {}

  console.log('\n--- 3. Migrating existing records safely ---');
  // Associate existing records without training_id to Training ID 4 (C2C 2026)
  const [updateRes] = await conn.query("UPDATE c2c_enrollments SET training_id = 4, training_code = 'C2C 2026' WHERE training_id IS NULL");
  console.log(`✓ Mapped ${updateRes.affectedRows} existing c2c_enrollments to training_id = 4 ('C2C 2026')`);

  // Ensure default dates and status for training programs
  await conn.query("UPDATE training_programs SET status = 'Open' WHERE status = 'Active'");
  await conn.query("UPDATE training_programs SET start_date = '2026-07-01', end_date = '2026-12-31', registration_open_date = '2026-06-01', registration_close_date = '2026-07-15' WHERE start_date IS NULL");

  console.log('\n--- 4. Verification ---');
  const [tps] = await conn.query('SELECT id, name, code, fee_amount, status, start_date, end_date FROM training_programs');
  console.log('training_programs:');
  console.table(tps);

  const [enrs] = await conn.query('SELECT id, training_id, training_code, full_name, email, payment_status, approval_status FROM c2c_enrollments');
  console.log('c2c_enrollments:');
  console.table(enrs);

  await conn.end();
  console.log('\n Migration completed successfully!');
}

runMigration().catch(console.error);
