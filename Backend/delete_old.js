import { query } from './src/config/db.js';

const run = async () => {
  await query("DELETE FROM practice_problems WHERE title NOT LIKE '%(Very Easy)%'");
  console.log('Deleted all old and test problems');
  process.exit(0);
};

run().catch(console.error);
