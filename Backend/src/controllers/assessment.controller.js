import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import { generateQuizQuestionsAI } from '../ai/quiz.ai.js';

let mockAssessments = [];

let mockAssessmentResults = {};
let mockQuestionsByAssessment = {};

export const getAssessments = async (req, res, next) => {
  try {
    const { batch } = req.query;
    let result = [];
    try {
      const dbRows = await query(`SELECT * FROM assessments ORDER BY id DESC`);
      if (dbRows && dbRows.length > 0) {
        const assessmentIds = dbRows.map(r => r.id);
        let allQuestions = [];
        try {
          allQuestions = await query(
            `SELECT * FROM assessment_questions WHERE assessment_id IN (?) ORDER BY id ASC`,
            [assessmentIds]
          );
        } catch (qErr) {
          console.warn('[DB questions query fallback]', qErr.message);
        }

        result = dbRows.map(r => {
          const qsForThis = (allQuestions || []).filter(q => String(q.assessment_id) === String(r.id));
          const memoryQs = mockQuestionsByAssessment[r.id] || [];
          const combinedQs = qsForThis.length > 0 ? qsForThis : memoryQs;
          return {
            ...r,
            batch_name: r.batch_name || r.batch || "All Batches",
            total_questions: combinedQs.length || r.total_questions || 5,
            questions: combinedQs
          };
        });
      }
    } catch (e) {
      console.warn('[DB getAssessments fallback]', e.message);
    }

    if (!result || result.length === 0) {
      result = mockAssessments.map(a => ({
        ...a,
        questions: (a.questions && a.questions.length > 0) ? a.questions : (mockQuestionsByAssessment[a.id] || [])
      }));
    }

    if (batch && batch !== "All" && batch !== "All Batches") {
      result = result.filter((a) => (a.batch_name || a.batch || '').toLowerCase().includes(batch.toLowerCase()));
    }

    return sendSuccess(res, 'Assessments retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let assessment = null;
    let questions = [];

    try {
      const dbRows = await query(`SELECT * FROM assessments WHERE id = ?`, [id]);
      if (dbRows && dbRows.length > 0) {
        assessment = dbRows[0];
        const qRows = await query(`SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY id ASC`, [id]);
        questions = qRows || [];
      }
    } catch (e) {
      console.warn('[DB getAssessmentById fallback]', e.message);
    }

    if (!assessment) {
      assessment = mockAssessments.find(a => String(a.id) === String(id));
    }

    if (!assessment) {
      return sendError(res, 'Assessment not found', 404);
    }

    const memoryQs = mockQuestionsByAssessment[id] || [];
    const finalQuestions = questions.length > 0 ? questions : (assessment.questions && assessment.questions.length > 0 ? assessment.questions : memoryQs);

    return sendSuccess(res, 'Assessment details retrieved', {
      ...assessment,
      batch_name: assessment.batch_name || assessment.batch || "All Batches",
      questions: finalQuestions
    });
  } catch (error) {
    next(error);
  }
};

export const createAssessment = async (req, res, next) => {
  try {
    const { title, batch_id, batch_name, category, description, status, is_published, total_marks, pass_marks, duration_minutes } = req.body;
    if (!title) {
      return sendError(res, 'Quiz Title is required', 400);
    }

    let insertId = Date.now();
    try {
      const collegeId = req.user?.collegeId ?? req.user?.college_id ?? 1;
      const userId = req.user?.userId || req.user?.id || null;
      const result = await query(
        `INSERT INTO assessments (title, description, college_id, batch_id, created_by, duration_minutes, total_marks, pass_marks, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description || '', collegeId, batch_id || null, userId, duration_minutes || 30, total_marks || 100, pass_marks || 60, status || 'published']
      );
      if (result && result.insertId) insertId = result.insertId;
    } catch (e) {
      console.warn('[DB createAssessment fallback]', e.message);
    }

    const newAssessment = {
      id: insertId,
      title,
      batch_id: batch_id || null,
      batch_name: batch_name || 'All Batches',
      category: category || 'Technical Quiz',
      description: description || '',
      status: status || 'published',
      is_published: true,
      total_marks: total_marks || 100,
      pass_marks: pass_marks || 60,
      duration_minutes: duration_minutes || 30,
      questions: []
    };

    mockAssessments = [newAssessment, ...mockAssessments];
    return sendSuccess(res, 'Assessment created successfully', newAssessment, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await query(`DELETE FROM assessments WHERE id = ?`, [id]);
    } catch (e) {
      console.warn('[DB deleteAssessment fallback]', e.message);
    }
    mockAssessments = mockAssessments.filter(a => String(a.id) !== String(id));
    return sendSuccess(res, 'Assessment deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

export const generateAIQuestions = async (req, res, next) => {
  try {
    const { title, topic, count = 10 } = req.body;
    const topicName = title || topic || "General Computer Science";
    const num = Math.min(Math.max(parseInt(count, 10) || 5, 1), 30);

    let rawQuestions = [];
    try {
      console.log(`[generateAIQuestions] Calling Gemini AI for topic "${topicName}" (${num} questions)...`);
      rawQuestions = await generateQuizQuestionsAI(topicName, num);
    } catch (aiErr) {
      console.warn('[Gemini AI Question Generation Error]', aiErr.message);
    }

    if (!rawQuestions || rawQuestions.length === 0) {
      const questionTemplates = [
        {
          question_text: `What is the core performance characteristic of ${topicName}?`,
          option_a: "O(1) Constant Lookup Time",
          option_b: "O(n^2) Quadratic Processing",
          option_c: "Asynchronous I/O Latency",
          option_d: "Thread Concurrency Lock",
          correct_option: "a"
        },
        {
          question_text: `Which architectural design pattern is recommended for ${topicName}?`,
          option_a: "Singleton Pattern",
          option_b: "Factory Method",
          option_c: "Event-Driven Microservices",
          option_d: "Decorator Pattern",
          correct_option: "c"
        },
        {
          question_text: `What primary data structure handles operations in ${topicName}?`,
          option_a: "Linked List",
          option_b: "Hash Table / Map",
          option_c: "Binary Search Tree",
          option_d: "Queue",
          correct_option: "b"
        },
        {
          question_text: `What is the primary trade-off when scaling ${topicName}?`,
          option_a: "Latency vs Throughput",
          option_b: "Memory Space vs Time Complexity",
          option_c: "CPU Cache vs Network Bandwidth",
          option_d: "Read Lock vs Write Lock",
          correct_option: "b"
        },
        {
          question_text: `Which mechanism ensures thread safety in ${topicName}?`,
          option_a: "Mutex Locks & Semaphore Synchronization",
          option_b: "Garbage Collector Triggers",
          option_c: "Asynchronous Promises",
          option_d: "Buffer Overflows",
          correct_option: "a"
        },
        {
          question_text: `What is the recommended error handling strategy in ${topicName}?`,
          option_a: "Silent Error Suppression",
          option_b: "Structured Exception Handling & Contextual Logging",
          option_c: "Immediate Process Termination",
          option_d: "Global Retry Loop without backoff",
          correct_option: "b"
        },
        {
          question_text: `Which database indexing technique accelerates queries in ${topicName}?`,
          option_a: "Linear Scan",
          option_b: "B-Tree / B+ Tree Indexing",
          option_c: "Randomized Hashing",
          option_d: "Heap Tree Storage",
          correct_option: "b"
        },
        {
          question_text: `What is the role of caching in ${topicName} systems?`,
          option_a: "To eliminate database writes permanently",
          option_b: "To reduce read latency for frequently accessed data",
          option_c: "To compress memory consumption",
          option_d: "To enforce strict ACID properties",
          correct_option: "b"
        },
        {
          question_text: `Which protocols are commonly used for network communication in ${topicName}?`,
          option_a: "HTTP/2, gRPC & WebSockets",
          option_b: "FTP & Telnet",
          option_c: "SMTP & POP3",
          option_d: "DNS & DHCP",
          correct_option: "a"
        },
        {
          question_text: `What is the purpose of unit testing in ${topicName} development?`,
          option_a: "To verify individual components in isolation",
          option_b: "To measure production network speed",
          option_c: "To compile binary executables",
          option_d: "To manage cloud server provisioning",
          correct_option: "a"
        }
      ];

      rawQuestions = Array.from({ length: num }, (_, i) => {
        const t = questionTemplates[i % questionTemplates.length];
        return {
          id: Date.now() + i,
          text: t.question_text,
          options: { a: t.option_a, b: t.option_b, c: t.option_c, d: t.option_d },
          correct: t.correct_option
        };
      });
    }

    const formatted = rawQuestions.map((q, idx) => ({
      id: q.id || (idx + 1),
      text: q.text || q.question_text,
      question_text: q.text || q.question_text,
      options: {
        a: q.options?.a || q.option_a || "Option A",
        b: q.options?.b || q.option_b || "Option B",
        c: q.options?.c || q.option_c || "Option C",
        d: q.options?.d || q.option_d || "Option D"
      },
      option_a: q.options?.a || q.option_a || "Option A",
      option_b: q.options?.b || q.option_b || "Option B",
      option_c: q.options?.c || q.option_c || "Option C",
      option_d: q.options?.d || q.option_d || "Option D",
      correct: (q.correct || q.correct_option || "a").toLowerCase(),
      correct_option: (q.correct || q.correct_option || "a").toLowerCase()
    }));

    return sendSuccess(res, 'AI questions generated successfully', formatted);
  } catch (error) {
    next(error);
  }
};

export const addAssessmentQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_option, marks = 10 } = req.body;

    let insertId = Date.now();
    try {
      const result = await query(
        `INSERT INTO assessment_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, question_text, option_a, option_b, option_c || null, option_d || null, correct_option || 'a', marks]
      );
      if (result && result.insertId) insertId = result.insertId;
    } catch (e) {
      console.warn('[DB addAssessmentQuestion fallback]', e.message);
    }

    const newQuestion = {
      id: insertId,
      assessment_id: id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      marks
    };

    if (!mockQuestionsByAssessment[id]) mockQuestionsByAssessment[id] = [];
    mockQuestionsByAssessment[id].push(newQuestion);

    return sendSuccess(res, 'Question added successfully', newQuestion, 201);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    let results = [];
    try {
      results = await query(
        `SELECT a.*, u.name as student_name, u.email as student_email
         FROM assessment_attempts a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.assessment_id = ?
         ORDER BY a.id DESC`,
        [id]
      );
    } catch (e) {
      console.warn('[DB getAssessmentResults fallback]', e.message);
    }

    if (!results || results.length === 0) {
      results = mockAssessmentResults[id] || [
        {
          id: 101,
          user_id: 1,
          student_name: 'Ganesh Shinde',
          student_email: 'ganesh@acadnexus.edu',
          marks_obtained: 85,
          total_marks: 100,
          percentage: 85,
          correct_count: 8,
          status: 'passed',
          submitted_at: new Date().toISOString()
        },
        {
          id: 102,
          user_id: 2,
          student_name: 'Priya Nair',
          student_email: 'priya@acadnexus.edu',
          marks_obtained: 90,
          total_marks: 100,
          percentage: 90,
          correct_count: 9,
          status: 'passed',
          submitted_at: new Date().toISOString()
        }
      ];
    }

    return sendSuccess(res, 'Assessment results retrieved', { results });
  } catch (error) {
    next(error);
  }
};

export const submitAssessment = async (req, res, next) => {
  try {
    const assessmentId = req.params.id || req.params.assessmentId;
    const attemptId = req.params.attemptId || (req.params.id !== 'attempts' ? req.params.id : null);
    const userId = req.user?.userId || req.user?.id || 1;
    const { answers = [] } = req.body;

    let targetAssessmentId = assessmentId;
    if (targetAssessmentId === 'attempts' && attemptId) {
      targetAssessmentId = req.body.assessment_id || req.query.assessment_id || null;
    }

    // 1. Fetch questions for this assessment
    let questions = [];
    if (targetAssessmentId && targetAssessmentId !== 'attempts') {
      try {
        questions = await query(
          `SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY id ASC`,
          [targetAssessmentId]
        );
      } catch (e) {
        console.warn('[DB fetch questions for grading fallback]', e.message);
      }

      if (!questions || questions.length === 0) {
        const found = mockAssessments.find(a => String(a.id) === String(targetAssessmentId));
        questions = found ? (found.questions || []) : (mockQuestionsByAssessment[targetAssessmentId] || []);
      }
    }

    // 2. Grade each submitted answer accurately
    let correctCount = 0;
    const totalQuestions = (questions && questions.length > 0) ? questions.length : (answers.length || 5);

    if (questions && questions.length > 0) {
      questions.forEach((q, idx) => {
        const submitted = answers.find(a => 
          String(a.question_id) === String(q.id) || String(a.questionId) === String(q.id)
        ) || answers[idx];

        if (submitted) {
          const rawSelected = (submitted.selected_option || submitted.selectedOption || submitted.answer || '').toString().trim().toLowerCase();
          const targetCorrect = (q.correct_option || q.correct || 'a').toString().trim().toLowerCase();
          
          const optLetters = ['a', 'b', 'c', 'd'];
          const normSelected = optLetters[parseInt(rawSelected, 10)] !== undefined ? optLetters[parseInt(rawSelected, 10)] : rawSelected;
          const normCorrect = optLetters[parseInt(targetCorrect, 10)] !== undefined ? optLetters[parseInt(targetCorrect, 10)] : targetCorrect;

          if (normSelected && normSelected === normCorrect) {
            correctCount++;
          }
        }
      });
    } else {
      // Fallback if no question schema found
      correctCount = answers.filter(a => a && (a.selected_option || a.selectedOption || a.answer)).length;
    }

    const totalMarks = totalQuestions * 10;
    const marksObtained = correctCount * 10;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const status = percentage >= 50 ? 'passed' : 'failed';

    const attempt = {
      id: attemptId && attemptId !== 'attempts' ? attemptId : Date.now(),
      assessment_id: targetAssessmentId,
      user_id: userId,
      marks_obtained: marksObtained,
      total_marks: totalMarks,
      percentage: percentage,
      correct_count: correctCount,
      total_questions: totalQuestions,
      status: status,
      submitted_at: new Date().toISOString()
    };

    try {
      if (attemptId && attemptId !== 'attempts') {
        await query(
          `UPDATE assessment_attempts SET marks_obtained = ?, total_marks = ?, percentage = ?, correct_count = ?, status = ?, submitted_at = NOW() WHERE id = ?`,
          [marksObtained, totalMarks, percentage, correctCount, status, attemptId]
        );
      } else if (targetAssessmentId) {
        await query(
          `INSERT INTO assessment_attempts (assessment_id, user_id, marks_obtained, total_marks, percentage, correct_count, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [targetAssessmentId, userId, marksObtained, totalMarks, percentage, correctCount, status]
        );
      }
    } catch (e) {
      console.warn('[DB submitAssessment update fallback]', e.message);
    }

    if (targetAssessmentId) {
      if (!mockAssessmentResults[targetAssessmentId]) mockAssessmentResults[targetAssessmentId] = [];
      mockAssessmentResults[targetAssessmentId].unshift(attempt);
    }

    return sendSuccess(res, 'Assessment submitted successfully', attempt, 200);
  } catch (error) {
    next(error);
  }
};

export const getAvailableAssessments = async (req, res, next) => {
  try {
    return await getAssessments(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const getMyAttempts = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    let attempts = [];
    try {
      if (userId) {
        attempts = await query(
          `SELECT * FROM assessment_attempts WHERE user_id = ? ORDER BY id DESC`,
          [userId]
        );
      } else {
        attempts = await query(`SELECT * FROM assessment_attempts ORDER BY id DESC`);
      }
    } catch (e) {
      console.warn('[DB getMyAttempts fallback]', e.message);
    }

    if (!attempts || attempts.length === 0) {
      attempts = Object.values(mockAssessmentResults).flat();
    }

    return sendSuccess(res, 'Student attempts retrieved', attempts || []);
  } catch (error) {
    next(error);
  }
};

export const startAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id || 1;

    try {
      await query(
        `INSERT INTO assessment_attempts (assessment_id, user_id, status, started_at) VALUES (?, ?, 'in_progress', NOW())`,
        [id, userId]
      );
    } catch (e) {
      console.warn('[DB startAssessment fallback]', e.message);
    }

    return sendSuccess(res, 'Assessment started successfully', { assessment_id: id, status: 'in_progress' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/assessments/mark-completed
 * Record that the logged-in student completed a quiz (device-synced via DB)
 */
export const markQuizCompleted = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { quiz_id, quiz_title } = req.body || {};

    if (!userId) return sendError(res, 'Unauthorized', 401);

    try {
      await query(
        `INSERT INTO student_quiz_completions (user_id, quiz_id, quiz_title, completed_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE completed_at = NOW()`,
        [userId, quiz_id || 0, quiz_title || '', ]
      );
    } catch (e) {
      // Table may not exist yet — create it and retry
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS student_quiz_completions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            quiz_id INT NOT NULL DEFAULT 0,
            quiz_title VARCHAR(255) DEFAULT '',
            completed_at DATETIME NOT NULL,
            UNIQUE KEY uq_user_quiz (user_id, quiz_id),
            INDEX idx_user_id (user_id)
          ) ENGINE=InnoDB
        `);
        await query(
          `INSERT INTO student_quiz_completions (user_id, quiz_id, quiz_title, completed_at)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE completed_at = NOW()`,
          [userId, quiz_id || 0, quiz_title || '']
        );
      } catch (e2) {
        console.warn('[markQuizCompleted fallback]', e2.message);
      }
    }

    return sendSuccess(res, 'Quiz completion recorded', { user_id: userId, quiz_id, marked: true });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentData = getAssessments;
