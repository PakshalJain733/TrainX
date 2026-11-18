import 'dotenv/config';
import bcrypt from 'bcrypt';
import { query } from '../src/config/db.js';

async function resetSuperAdmin() {
  try {
    const args = process.argv.slice(2);
    const email = (args[0] || process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
    const password = args[1] || process.env.SUPER_ADMIN_PASSWORD;
    const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
    const mobile = process.env.SUPER_ADMIN_MOBILE || '9876543210';

    if (!email) {
      console.error('❌ Error: SUPER_ADMIN_EMAIL is not defined in .env and not provided as an argument.');
      console.log('Usage: node scripts/reset_superadmin.js [email] [new_password]');
      console.log('Or set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in your Backend/.env file.');
      process.exit(1);
    }

    if (!password) {
      console.error('❌ Error: SUPER_ADMIN_PASSWORD is not defined in .env and not provided as an argument.');
      console.log('Usage: node scripts/reset_superadmin.js [email] [new_password]');
      console.log('Or set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in your Backend/.env file.');
      process.exit(1);
    }

    console.log(`🔐 Resetting Super Admin password for: ${email}...`);

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const existingUsers = await query(
      'SELECT id, name, email, role FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (existingUsers && existingUsers.length > 0) {
      const user = existingUsers[0];
      await query(
        `UPDATE users 
         SET password_hash = ?, 
             role = 'super_admin', 
             is_active = 1, 
             is_verified = 1, 
             is_approved = 1 
         WHERE id = ?`,
        [passwordHash, user.id]
      );
      console.log(`✅ Successfully updated Super Admin password in database for user ID #${user.id} (${email})!`);
    } else {
      const insertResult = await query(
        `INSERT INTO users 
         (name, email, mobile_number, password_hash, role, college_id, is_active, is_verified, is_approved) 
         VALUES (?, ?, ?, ?, 'super_admin', NULL, 1, 1, 1)`,
        [name, email, mobile, passwordHash]
      );
      console.log(`✅ Successfully created and seeded new Super Admin account (ID #${insertResult.insertId}) for ${email}!`);
    }

    console.log('\n--- Super Admin Credentials ---');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('-------------------------------\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to reset Super Admin password:', error);
    process.exit(1);
  }
}

resetSuperAdmin();

