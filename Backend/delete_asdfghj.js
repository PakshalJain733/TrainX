import { query } from './src/config/db.js';

const run = async () => {
  await query("DELETE FROM practice_problems WHERE title = 'asdfghj'");
  console.log('Deleted asdfghj problems');
  process.exit(0);
};

run().catch(console.error);
