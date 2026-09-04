import { query } from '../config/db.js';

const mockColleges = [
  { id: 1, name: 'Vasantdada Patil Pratishthan College of Engineering', code: 'PVPPCOE', created_at: new Date('2026-01-01') },
  { id: 2, name: 'Don Bosco Institute of Technology', code: 'DBIT', created_at: new Date('2026-01-01') },
];

export const getAllCollegesModel = async () => {
  try {
    const results = await query('SELECT * FROM colleges ORDER BY id ASC');
    if (results && Array.isArray(results) && results.length > 0) return results;
  } catch (error) {
    console.warn(`[College Model] Database query fallback: ${error.message}`);
  }
  return mockColleges;
};

export const getCollegeByIdModel = async (id) => {
  const numId = parseInt(id, 10);
  try {
    const results = await query('SELECT * FROM colleges WHERE id = ?', [numId]);
    if (results && results.length > 0) return results[0];
  } catch (error) {
    console.warn(`[College Model] Database query fallback: ${error.message}`);
  }
  return mockColleges.find((c) => c.id === numId) || null;
};

export const createCollegeModel = async ({ name, code }) => {
  try {
    const res = await query('INSERT INTO colleges (name, code) VALUES (?, ?)', [name, code]);
    if (res && res.insertId) return { id: res.insertId, name, code, created_at: new Date() };
  } catch (error) {
    console.warn(`[College Model] Database insert fallback: ${error.message}`);
  }
  const newCol = { id: mockColleges.length + 1, name, code, created_at: new Date() };
  mockColleges.push(newCol);
  return newCol;
};
