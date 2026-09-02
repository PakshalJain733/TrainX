import { query } from '../config/db.js';

export const findtrainings = async () => { return await query('SELECT * FROM trainings'); };
