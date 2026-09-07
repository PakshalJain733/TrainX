import { query } from '../config/db.js';

// Get stored skill gap analysis for a student from MySQL DB
export const getSkillGapByUserId = async (userId) => {
  const numId = parseInt(userId, 10);
  if (!numId) return null;

  try {
    const rows = await query('SELECT * FROM skill_gap_analysis WHERE user_id = ?', [numId]);
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        ...r,
        weak_areas: typeof r.weak_areas === 'string' ? JSON.parse(r.weak_areas) : (r.weak_areas || []),
        all_evaluated_skills: typeof r.all_evaluated_skills === 'string' ? JSON.parse(r.all_evaluated_skills) : (r.all_evaluated_skills || []),
        suggestions: typeof r.suggestions === 'string' ? JSON.parse(r.suggestions) : (r.suggestions || []),
      };
    }
  } catch (error) {
    console.warn(`[Skill Gap Model] Query error: ${error.message}`);
  }
  return null;
};

// Save or update skill gap analysis result in MySQL DB
export const saveSkillGapAnalysis = async (userId, data) => {
  const numId = parseInt(userId, 10);
  if (!numId) return;

  const { overall_status, weak_areas_count, weak_areas, all_evaluated_skills, suggestions } = data;

  const weakAreasJson = JSON.stringify(weak_areas || []);
  const allSkillsJson = JSON.stringify(all_evaluated_skills || []);
  const suggestionsJson = JSON.stringify(suggestions || []);

  try {
    // Check if user exists before inserting foreign key
    const userCheck = await query('SELECT id FROM users WHERE id = ?', [numId]);
    if (userCheck && userCheck.length > 0) {
      await query(
        `INSERT INTO skill_gap_analysis 
          (user_id, overall_status, weak_areas_count, weak_areas, all_evaluated_skills, suggestions)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          overall_status = VALUES(overall_status),
          weak_areas_count = VALUES(weak_areas_count),
          weak_areas = VALUES(weak_areas),
          all_evaluated_skills = VALUES(all_evaluated_skills),
          suggestions = VALUES(suggestions)`,
        [numId, overall_status, weak_areas_count, weakAreasJson, allSkillsJson, suggestionsJson]
      );
    }
  } catch (error) {
    console.warn(`[Skill Gap Model] Insert/Update warning: ${error.message}`);
  }
};
