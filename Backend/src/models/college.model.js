import { query } from '../config/db.js';

export const findcolleges = async () => { return await query('SELECT * FROM colleges'); };
