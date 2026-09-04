import { query } from '../config/db.js';

export const findassessments = async () => { return await query('SELECT * FROM assessments'); };
