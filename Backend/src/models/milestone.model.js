import { query } from '../config/db.js';

export const findmilestones = async () => { return await query('SELECT * FROM milestones'); };
