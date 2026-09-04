import { query } from '../config/db.js';

export const findbatchs = async () => { return await query('SELECT * FROM batchs'); };
