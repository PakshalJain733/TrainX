import { query } from '../config/db.js';

export const findinterventions = async () => { return await query('SELECT * FROM interventions'); };
