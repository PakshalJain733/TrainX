import { query } from '../config/db.js';

export const findinterviews = async () => { return await query('SELECT * FROM interviews'); };
