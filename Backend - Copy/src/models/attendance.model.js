import { query } from '../config/db.js';

export const findattendances = async () => { return await query('SELECT * FROM attendances'); };
