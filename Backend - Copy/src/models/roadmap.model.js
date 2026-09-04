import { query } from '../config/db.js';

export const findroadmaps = async () => { return await query('SELECT * FROM roadmaps'); };
