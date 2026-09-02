import { query } from '../config/db.js';

export const findstudents = async () => { return await query('SELECT * FROM students'); };
