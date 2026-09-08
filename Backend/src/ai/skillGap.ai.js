import { config } from '../config/env.js';

/**
 * AI & Logic Service for Skill Gap Analysis & Recommendations
 * Tasks:
 * 1. Collect student performance for analysis (Quiz, Coding, Interview, Milestones)
 * 2. Detect weak areas (Per topic/skill aggregated scoring and thresholding)
 * 3. Generate improvement suggestions with (skill, score, weakness_level, reason, recommendation, priority)
 */

// Helper to normalize input map/array into standard format: { [skillName]: scoreNumber }
function normalizeCategoryData(data) {
  const result = {};
  if (!data) return result;

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && item.topic && item.score !== undefined) {
        result[item.topic] = parseScoreValue(item.score);
      } else if (item && item.skill && item.score !== undefined) {
        result[item.skill] = parseScoreValue(item.score);
      }
    }
  } else if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      result[key] = parseScoreValue(value);
    }
  }

  return result;
}

// Convert various score representations (numbers, "35%", "Weak", "Good") to 0-100 percentage scale
function parseScoreValue(val) {
  if (typeof val === 'number') {
    return Math.min(Math.max(val, 0), 100);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.endsWith('%')) {
      const parsed = parseFloat(trimmed.replace('%', ''));
      if (!isNaN(parsed)) return Math.min(Math.max(parsed, 0), 100);
    }
    const lower = trimmed.toLowerCase();
    if (lower === 'critical' || lower === 'very weak') return 20;
    if (lower === 'weak' || lower === 'poor') return 35;
    if (lower === 'average' || lower === 'moderate' || lower === 'fair') return 60;
    if (lower === 'good' || lower === 'strong') return 85;
    if (lower === 'excellent') return 95;

    const num = parseFloat(trimmed);
    if (!isNaN(num)) return Math.min(Math.max(num, 0), 100);
  }
  return 50; // Default fallback
}

/**
 * Task 1: Collect / Aggregation of student performance
 */
export const collectStudentPerformance = async (inputData = {}) => {
  const quizMarks = normalizeCategoryData(inputData.quizMarks || inputData.quiz_marks || inputData.quiz);
  const codingMarks = normalizeCategoryData(inputData.codingMarks || inputData.coding_marks || inputData.coding);
  const interviewScores = normalizeCategoryData(inputData.interviewScores || inputData.interview_scores || inputData.interview);
  const milestoneProgress = normalizeCategoryData(inputData.milestoneProgress || inputData.milestone_progress || inputData.learning);

  return {
    quizMarks,
    codingMarks,
    interviewScores,
    milestoneProgress,
  };
};

/**
 * Task 2: Detect Weak Areas across all evaluated skills/topics
 */
export const detectWeakAreas = (performanceData) => {
  const { quizMarks, codingMarks, interviewScores, milestoneProgress } = performanceData;

  // Collect all unique skill/topic names across all 4 categories
  const skillNames = new Set([
    ...Object.keys(quizMarks),
    ...Object.keys(codingMarks),
    ...Object.keys(interviewScores),
    ...Object.keys(milestoneProgress),
  ]);

  const skillEvaluations = [];

  for (const skill of skillNames) {
    const sources = [];
    const scores = [];

    if (skill in quizMarks) {
      const s = quizMarks[skill];
      scores.push(s);
      sources.push(`Quiz: ${s}%`);
    }
    if (skill in codingMarks) {
      const s = codingMarks[skill];
      scores.push(s);
      sources.push(`Coding: ${s}%`);
    }
    if (skill in interviewScores) {
      const s = interviewScores[skill];
      scores.push(s);
      sources.push(`Interview: ${s}%`);
    }
    if (skill in milestoneProgress) {
      const s = milestoneProgress[skill];
      scores.push(s);
      sources.push(`Milestone Progress: ${s}%`);
    }

    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    let weaknessLevel = 'None';
    let isWeak = false;
    let priority = 'Low';

    if (avgScore < 45) {
      weaknessLevel = 'Critical';
      isWeak = true;
      priority = 'High';
    } else if (avgScore < 60) {
      weaknessLevel = 'Moderate';
      isWeak = true;
      priority = 'Medium';
    } else if (avgScore < 75) {
      weaknessLevel = 'Minor';
      isWeak = false; // Slight weakness, but not major weak skill
      priority = 'Low';
    }

    const reason = `Performance breakdown for ${skill}: ${sources.join(', ')}. Overall average score is ${avgScore}%.`;

    skillEvaluations.push({
      skill,
      score: avgScore,
      weakness_level: weaknessLevel,
      is_weak: isWeak,
      priority,
      reason,
      sources,
    });
  }

  // Sort by score ascending (weakest first)
  skillEvaluations.sort((a, b) => a.score - b.score);

  const weakAreas = skillEvaluations.filter((s) => s.is_weak);

  return {
    allSkills: skillEvaluations,
    weakAreas,
    hasWeakAreas: weakAreas.length > 0,
  };
};

/**
 * Default rule-based recommendation generator
 */
function getRuleBasedRecommendation(skill, score, weaknessLevel) {
  const recommendationsMap = {
    'dynamic programming': [
      'Revise DP fundamentals (Memoization & Tabulation)',
      'Practice Easy DP problems',
      'Complete 5 practice questions',
      'Take another assessment',
    ],
    'dbms': [
      'Revise SQL queries and Relational Database fundamentals',
      'Practice Normalization, Joins, and Indexing concepts',
      'Complete 5 hands-on SQL query challenges',
      'Take a mock DBMS assessment',
    ],
    'arrays': [
      'Review Array traversal and Searching/Sorting algorithms',
      'Practice Two-Pointer and Sliding Window techniques',
      'Solve 5 medium Array coding problems',
      'Re-evaluate Array problem-solving speed and accuracy',
    ],
    'oop': [
      'Revise Object-Oriented Programming principles (Abstraction, Encapsulation, Inheritance, Polymorphism)',
      'Design clean class structures for sample real-world entities',
      'Complete 5 OOP conceptual quizzes',
      'Submit an OOP code review exercise',
    ],
    'data structures': [
      'Study core Data Structures (Arrays, Linked Lists, Trees, Graphs)',
      'Implement standard data structures from scratch',
      'Solve 5 foundational DS practice problems',
      'Retake the Data Structures evaluation',
    ],
  };

  const normalizedSkill = skill.toLowerCase().trim();
  if (recommendationsMap[normalizedSkill]) {
    return recommendationsMap[normalizedSkill];
  }

  // Generic tailored suggestions
  return [
    `Revise core fundamentals of ${skill}`,
    `Practice beginner to intermediate ${skill} exercises`,
    `Complete 5 targeted practice questions in ${skill}`,
    `Take another topic-specific assessment to verify progress`,
  ];
}

/**
 * Task 3: Generate Improvement Suggestions
 */
export const generateImprovementSuggestions = async (weakAreas) => {
  return weakAreas.map((item) => {
    const { skill, score, weakness_level, priority, reason } = item;
    const recommendationSteps = getRuleBasedRecommendation(skill, score, weakness_level);

    return {
      skill,
      score: `${score}%`,
      score_numeric: score,
      weakness_level,
      reason,
      recommendation: recommendationSteps,
      priority,
    };
  });
};

/**
 * Task 1 + 2 + 3 Main Pipeline Orchestrator
 */
export const analyzeStudentPerformance = async (inputData) => {
  // Step 1: Collect student performance
  const collectedData = await collectStudentPerformance(inputData);

  // Step 2: Detect weak areas
  const detectionResult = detectWeakAreas(collectedData);

  // Step 3: Generate improvement suggestions for weak areas
  const suggestions = await generateImprovementSuggestions(detectionResult.weakAreas);

  return {
    student_id: inputData.student_id || inputData.studentId || null,
    student_name: inputData.student_name || inputData.studentName || 'Student',
    collected_performance: collectedData,
    overall_status: detectionResult.hasWeakAreas ? 'Needs Improvement' : 'On Track / Strong',
    weak_areas_count: detectionResult.weakAreas.length,
    weak_areas: detectionResult.weakAreas.map((w) => w.skill),
    all_evaluated_skills: detectionResult.allSkills,
    suggestions, // Array of { skill, score, weakness_level, reason, recommendation, priority }
  };
};
