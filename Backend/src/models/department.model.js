import { query } from '../config/db.js';

export const finddepartments = async () => { return await query('SELECT * FROM departments'); };
