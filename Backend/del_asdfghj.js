import { query } from './src/config/db.js';

const run = async () => {
  await query("DELETE FROM practice_problems WHERE title = 'asdfghj'");
  await query("DELETE FROM coding_problems WHERE title = 'asdfghj'");
  
  // Also fetch and print what's remaining to be sure
  const rows = await query("SELECT id, title FROM practice_problems");
  console.log("Remaining problems:", rows);
  
  process.exit(0);
};

run().catch(console.error);
