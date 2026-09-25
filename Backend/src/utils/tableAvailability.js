import { query } from '../config/db.js';

/**
 * Table availability helpers.
 *
 * The portal runs a mix of `init_db.js` migrations and one-off import scripts
 * (e.g. the C2C 2029 importer), so a few analytics tables are not guaranteed
 * to exist on every deployment. These helpers let read APIs answer with honest
 * empty data when an optional table is genuinely missing, while still letting
 * real database errors bubble up to the error handler.
 */

export const getAvailableTables = async (tableNames = []) => {
  const names = [...new Set(tableNames.filter(Boolean).map((n) => String(n)))];
  if (names.length === 0) return new Set();

  const placeholders = names.map(() => '?').join(', ');
  const rows = await query(
    `SELECT TABLE_NAME AS table_name
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN (${placeholders})`,
    names
  );

  return new Set((rows || []).map((r) => String(r.table_name).toLowerCase()));
};

export const tableExists = async (tableName) => {
  const available = await getAvailableTables([tableName]);
  return available.has(String(tableName).toLowerCase());
};

/**
 * Returns `{ tableName: boolean }` for the requested tables using a single
 * information_schema round trip.
 */
export const tableAvailabilityMap = async (tableNames = []) => {
  const names = [...new Set(tableNames.filter(Boolean).map((n) => String(n)))];
  const available = await getAvailableTables(names);
  return names.reduce((acc, name) => {
    acc[name] = available.has(String(name).toLowerCase());
    return acc;
  }, {});
};

/**
 * Builds `?, ?, ?` placeholders for an IN (...) clause.
 */
export const inPlaceholders = (values = []) => values.map(() => '?').join(', ');
