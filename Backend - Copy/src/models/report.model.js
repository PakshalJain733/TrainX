import { query } from '../config/db.js';

export const findreports = async () => { return await query('SELECT * FROM reports'); };
