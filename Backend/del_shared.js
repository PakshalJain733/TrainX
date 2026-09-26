import { query } from './src/config/db.js';

const run = async () => {
  await query("DELETE FROM shared_content WHERE title = 'asdfghj' OR type = 'coding'");
  console.log('Deleted all coding records from shared_content');
  process.exit(0);
};

run().catch(console.error);
