import { query } from './src/config/db.js';

const run = async () => {
  await query("DELETE FROM practice_problems WHERE difficulty != 'Easy'");
  console.log('Deleted hard/medium problems');
  process.exit(0);
};

run().catch(console.error);
