import dotenv from 'dotenv';
dotenv.config();
import { query } from './src/config/db.js';

async function seed() {
  try {
    console.log('Seeding student progress data for quizzes, tasks, coding, and attendance...');

    // 1. Get batches and students
    const batches = await query("SELECT id, name FROM batches");
    const students = await query("SELECT u.id, u.name, s.batch_id, s.department_id FROM users u LEFT JOIN students s ON u.id = s.user_id WHERE u.role = 'student'");

    console.log(`Found ${batches.length} batches, ${students.length} students.`);

    // 2. Ensure assessments exist
    const existingAssessments = await query("SELECT id FROM assessments");
    let assessmentIds = existingAssessments.map(a => a.id);

    if (assessmentIds.length === 0) {
      const quizData = [
        { title: 'Data Structures & Algorithms Diagnostic Quiz', category: 'Technical Quiz', duration_minutes: 45, total_marks: 50, pass_marks: 30, passing_percentage: 60 },
        { title: 'React & Frontend Fundamentals Assessment', category: 'Technical Quiz', duration_minutes: 30, total_marks: 40, pass_marks: 24, passing_percentage: 60 },
        { title: 'Database Systems & SQL Optimization Quiz', category: 'Technical Quiz', duration_minutes: 40, total_marks: 50, pass_marks: 30, passing_percentage: 60 },
        { title: 'Python Core & OOP Assessment', category: 'Technical Quiz', duration_minutes: 35, total_marks: 40, pass_marks: 24, passing_percentage: 60 },
        { title: 'System Design & REST API Quiz', category: 'Technical Quiz', duration_minutes: 40, total_marks: 50, pass_marks: 30, passing_percentage: 60 },
      ];

      for (const q of quizData) {
        const res = await query(
          "INSERT INTO assessments (college_id, title, category, duration_minutes, total_marks, pass_marks, passing_percentage, status, is_published) VALUES (3, ?, ?, ?, ?, ?, ?, 'published', 1)",
          [q.title, q.category, q.duration_minutes, q.total_marks, q.pass_marks, q.passing_percentage]
        );
        assessmentIds.push(res.insertId);
      }
      console.log(`Created ${assessmentIds.length} assessments.`);
    }

    // 3. Ensure batch tasks exist
    const existingTasks = await query("SELECT id FROM batch_tasks");
    let taskIds = existingTasks.map(t => t.id);

    if (taskIds.length === 0) {
      const tasksData = [
        { batch_id: 1, title: 'Implement Binary Search Tree with Traversals', topic: 'Data Structures', difficulty: 'Medium', points: 100, deadline: '2026-11-15' },
        { batch_id: 1, title: 'Build Dynamic Form with Custom Validation in React', topic: 'Frontend', difficulty: 'Easy', points: 100, deadline: '2026-11-18' },
        { batch_id: 2, title: 'Implement JWT Auth & Refresh Tokens in Node.js', topic: 'Backend', difficulty: 'Hard', points: 150, deadline: '2026-11-20' },
        { batch_id: 2, title: 'Complex SQL Grouping & Window Functions Task', topic: 'Database', difficulty: 'Medium', points: 100, deadline: '2026-11-22' },
        { batch_id: 4, title: 'Python File Parsing & Log Aggregation Script', topic: 'Python', difficulty: 'Medium', points: 100, deadline: '2026-11-25' },
      ];

      for (const t of tasksData) {
        const res = await query(
          "INSERT INTO batch_tasks (batch_id, title, topic, difficulty, points, deadline) VALUES (?, ?, ?, ?, ?, ?)",
          [t.batch_id, t.title, t.topic, t.difficulty, t.points, t.deadline]
        );
        taskIds.push(res.insertId);
      }
      console.log(`Created ${taskIds.length} batch tasks.`);
    }

    // 4. Ensure practice problems exist
    const problems = await query("SELECT id FROM practice_problems");
    const problemIds = problems.map(p => p.id);

    // 5. Seed assessment attempts, task submissions, coding submissions, and attendance for each student
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const batchId = s.batch_id || 1;

      // Realistic student performance profile based on index
      // Top students, good students, average students, needs-work students
      const performanceTier = i % 4; // 0 = high (85-98%), 1 = good (75-85%), 2 = average (60-74%), 3 = needs-work (45-59%)
      let baseQuiz = 0;
      let baseTask = 0;
      let baseAtt = 0;

      if (performanceTier === 0) {
        baseQuiz = 88 + (i % 10);
        baseTask = 92 + (i % 8);
        baseAtt = 94 + (i % 6);
      } else if (performanceTier === 1) {
        baseQuiz = 76 + (i % 10);
        baseTask = 80 + (i % 8);
        baseAtt = 84 + (i % 10);
      } else if (performanceTier === 2) {
        baseQuiz = 64 + (i % 10);
        baseTask = 68 + (i % 8);
        baseAtt = 74 + (i % 10);
      } else {
        baseQuiz = 48 + (i % 12);
        baseTask = 52 + (i % 12);
        baseAtt = 62 + (i % 12);
      }

      baseQuiz = Math.min(100, Math.max(35, baseQuiz));
      baseTask = Math.min(100, Math.max(30, baseTask));
      baseAtt = Math.min(100, Math.max(50, baseAtt));

      // Clear existing attempts for clean sync
      await query("DELETE FROM assessment_attempts WHERE user_id = ?", [s.id]);
      await query("DELETE FROM task_submissions WHERE user_id = ?", [s.id]);
      await query("DELETE FROM practice_problem_submissions WHERE user_id = ?", [s.id]);
      await query("DELETE FROM attendance WHERE user_id = ?", [s.id]);

      // Seed 2-3 quiz attempts
      for (let qIdx = 0; qIdx < Math.min(3, assessmentIds.length); qIdx++) {
        const aId = assessmentIds[qIdx];
        const variance = ((i * 7 + qIdx * 13) % 15) - 7;
        const pct = Math.min(100, Math.max(30, baseQuiz + variance));
        const totalMarks = 50;
        const marksObtained = Math.round((pct / 100) * totalMarks);

        await query(
          `INSERT INTO assessment_attempts 
           (assessment_id, user_id, college_id, score, total_questions, attempted_questions, correct_count, incorrect_count, unattempted_count, marks_obtained, total_marks, percentage, status, completed_at)
           VALUES (?, ?, 3, ?, 25, 25, ?, ?, 0, ?, ?, ?, 'completed', NOW() - INTERVAL ? DAY)`,
          [aId, s.id, marksObtained, Math.round(marksObtained / 2), 25 - Math.round(marksObtained / 2), marksObtained, totalMarks, pct, (qIdx + 1) * 3]
        );
      }

      // Seed task submissions
      for (let tIdx = 0; tIdx < taskIds.length; tIdx++) {
        const tId = taskIds[tIdx];
        const isSubmitted = performanceTier !== 3 || (i + tIdx) % 2 === 0;
        if (isSubmitted) {
          const taskScore = Math.min(100, Math.max(40, baseTask + ((i * 3 + tIdx * 5) % 11) - 5));
          const status = taskScore >= 60 ? 'Passed' : 'Submitted';
          await query(
            `INSERT INTO task_submissions (task_id, user_id, batch_id, code, status, score, marks_obtained, feedback, submitted_at)
             VALUES (?, ?, ?, 'function solution() { return true; }', ?, ?, ?, 'Evaluated successfully.', NOW() - INTERVAL ? DAY)`,
            [tId, s.id, batchId, status, taskScore, taskScore, (tIdx + 1) * 2]
          );
        }
      }

      // Seed practice problem submissions if problems exist
      if (problemIds.length > 0) {
        for (const pId of problemIds) {
          const solved = performanceTier !== 3 || i % 2 === 0;
          if (solved) {
            await query(
              `INSERT INTO practice_problem_submissions (problem_id, user_id, code_submitted, language, status, points_earned)
               VALUES (?, ?, 'console.log(\"solved\");', 'javascript', 'Solved', 100)`,
              [pId, s.id]
            );
          }
        }
      }

      // Seed attendance (10 sessions)
      for (let day = 1; day <= 10; day++) {
        const isPresent = ((i * 3 + day * 7) % 100) < baseAtt ? 'present' : 'absent';
        await query(
          "INSERT INTO attendance (user_id, college_id, batch_id, session_date, status) VALUES (?, 3, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY), ?)",
          [s.id, batchId, day, isPresent]
        );
      }

      // Update skill_gap_analysis
      const weakAreas = [];
      if (baseQuiz < 65) weakAreas.push('Database & SQL');
      if (baseTask < 70) weakAreas.push('Data Structures & Algorithms');
      if (baseAtt < 75) weakAreas.push('Attendance Regularity');
      const statusText = baseQuiz >= 80 ? 'Excellent' : baseQuiz >= 65 ? 'Average' : 'Needs Improvement';

      await query(
        `INSERT INTO skill_gap_analysis (user_id, overall_status, weak_areas)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE overall_status = VALUES(overall_status), weak_areas = VALUES(weak_areas)`,
        [s.id, statusText, JSON.stringify(weakAreas)]
      );
    }

    console.log('Successfully seeded rich progress, assessments, tasks, and attendance data!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    process.exit(0);
  }
}

seed();
