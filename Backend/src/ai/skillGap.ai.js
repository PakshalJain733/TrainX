import { config } from '../config/env.js';

/**
 * Helper to normalize input map/array into standard format: { [skillName]: scoreNumber }
 */
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

  // Map all raw skill/topic names to canonical technical skill domains
  const getCanonicalSkill = (name) => {
    if (!name) return 'General Technical';
    const lower = name.toLowerCase();
    if (lower.includes('sql') || lower.includes('mysql') || lower.includes('database') || lower.includes('dbms')) return 'MySQL & Databases';
    if (lower.includes('java') || lower.includes('oop') || lower.includes('object')) return 'Java & Object Oriented Programming';
    if (lower.includes('array') || lower.includes('algo') || lower.includes('data structure') || lower.includes('ds') || lower.includes('coding')) return 'Data Structures & Algorithms';
    if (lower.includes('system') || lower.includes('design') || lower.includes('architecture')) return 'System Design';
    return name;
  };

  const skillBuckets = {};

  const addScoreToBucket = (rawSkill, score, categoryName) => {
    const canonical = getCanonicalSkill(rawSkill);
    if (!skillBuckets[canonical]) {
      skillBuckets[canonical] = { scores: [], sources: [] };
    }
    skillBuckets[canonical].scores.push(score);
    skillBuckets[canonical].sources.push(`${categoryName}: ${score}%`);
  };

  for (const [s, val] of Object.entries(quizMarks)) addScoreToBucket(s, val, 'Quizzes');
  for (const [s, val] of Object.entries(codingMarks)) addScoreToBucket(s, val, 'Coding Practice & Tasks');
  for (const [s, val] of Object.entries(interviewScores)) addScoreToBucket(s, val, 'AI Interview');
  for (const [s, val] of Object.entries(milestoneProgress)) addScoreToBucket(s, val, 'Learning Milestone');

  const skillEvaluations = [];

  for (const [skill, bucket] of Object.entries(skillBuckets)) {
    const avgScore = Math.round(bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length);

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
      isWeak = false;
      priority = 'Low';
    }

    const reason = `Evaluated across ${bucket.sources.join(', ')}. Aggregated Score: ${avgScore}%.`;

    skillEvaluations.push({
      skill,
      score: avgScore,
      weakness_level: weaknessLevel,
      is_weak: isWeak,
      priority,
      reason,
      sources: bucket.sources,
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

/**
 * AI Diagnostics Generator for a topic
 */
export const generateAIDiagnostics = async ({ topic, batchName, deficiencyRate, avgScore }) => {
  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const configuredModel = config.ai?.model || 'gemini-3.1-flash-lite';
  const modelsToTry = Array.from(
    new Set([configuredModel, 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'])
  );

  const prompt = `You are a Principal Engineering Mentor and Curriculum Diagnostician.
Perform an in-depth technical skill gap diagnostic for a class/batch of engineering students:

TOPIC / CONCEPT: "${topic}"
AFFECTED BATCH: "${batchName || 'Computer Engineering Batch TE-A'}"
BATCH DEFICIENCY RATE: "${deficiencyRate}"
CLASS AVERAGE SCORE: "${avgScore}"

Generate a diagnostic report in JSON format with:
1. "rootCauses": Array of 3 key conceptual hurdles or typical failure modes students encounter with this topic.
2. "recommendedFocusAreas": Array of 3 subtopics to revise first.
3. "remedialActionPlan": String summarizing the fastest path to bridge this gap.
4. "suggestedExerciseTypes": Array of 3 hands-on drill suggestions (e.g., Code Walkthrough, Debugging Challenge, Implementation Task).

Output ONLY valid JSON matching this exact structure:
{
  "rootCauses": ["...", "...", "..."],
  "recommendedFocusAreas": ["...", "...", "..."],
  "remedialActionPlan": "...",
  "suggestedExerciseTypes": ["...", "...", "..."]
}`;

  if (!apiKey) {
    return getOfflineDiagnosticFallback(topic, deficiencyRate, avgScore);
  }

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, topK: 40, topP: 0.95 },
          }),
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonText);
      return {
        source: 'gemini-ai',
        modelUsed: model,
        ...parsed,
      };
    } catch (err) {
      console.warn(`[SkillGap AI] Gemini ${model} fallback: ${err.message}`);
    }
  }

  return getOfflineDiagnosticFallback(topic, deficiencyRate, avgScore);
};

/**
 * AI Remedial Assignment Generator
 */
export const generateRemedialAssignmentAI = async ({ topic, batchName, difficultyLevel = 'Medium' }) => {
  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const configuredModel = config.ai?.model || 'gemini-3.1-flash-lite';
  const modelsToTry = Array.from(
    new Set([configuredModel, 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'])
  );

  const prompt = `You are a Technical Trainer designing an interactive Remedial Assignment for college students weak in: "${topic}".
Difficulty Target: "${difficultyLevel}".
Batch: "${batchName || 'TE-A'}".

Create a structured remedial assignment JSON containing:
1. "title": Catchy assignment title (e.g. "Mastery Sprint: ${topic}").
2. "description": Concise overview explaining what students will achieve.
3. "learningObjectives": Array of 3 crisp bullet points.
4. "practiceProblems": Array of 3 concrete coding/conceptual tasks with "problemTitle", "difficulty", "description", and "expectedOutputHint".
5. "recommendedMaterials": Array of 2 curated learning items with "type" ('Documentation' | 'Video Tutorial' | 'Interactive Sandbox') and "title".

Output ONLY valid JSON matching this exact structure:
{
  "title": "...",
  "description": "...",
  "learningObjectives": ["...", "...", "..."],
  "practiceProblems": [
    {
      "problemTitle": "...",
      "difficulty": "...",
      "description": "...",
      "expectedOutputHint": "..."
    }
  ],
  "recommendedMaterials": [
    { "type": "...", "title": "..." }
  ]
}`;

  if (!apiKey) {
    return getOfflineRemedialFallback(topic, difficultyLevel);
  }

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, topK: 40, topP: 0.95 },
          }),
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonText);
      return {
        source: 'gemini-ai',
        modelUsed: model,
        ...parsed,
      };
    } catch (err) {
      console.warn(`[SkillGap AI] Gemini ${model} remedial fallback: ${err.message}`);
    }
  }

  return getOfflineRemedialFallback(topic, difficultyLevel);
};

// Offline intelligent fallbacks
function getOfflineDiagnosticFallback(topic, deficiencyRate, avgScore) {
  return {
    source: 'rule-based-engine',
    rootCauses: [
      `Insufficient hands-on drill exercises on ${topic} core primitives`,
      `Confusion between theoretical time/space trade-offs and live runtime implementation`,
      `Edge-case validation errors causing test-case failures`,
    ],
    recommendedFocusAreas: [
      `${topic} Fundamental Mechanics & Invariants`,
      `Common edge cases & debugging patterns`,
      `Optimized real-world implementation workflows`,
    ],
    remedialActionPlan: `Assign a focused 3-exercise remedial problem sprint targeting ${topic} with progressive difficulty.`,
    suggestedExerciseTypes: [
      'Visual Flow Tracing',
      'Refactoring / Bug-Fixing Sandbox',
      'Timed 30-minute Coding Drill',
    ],
  };
}

function getOfflineRemedialFallback(topic, difficultyLevel) {
  return {
    source: 'rule-based-engine',
    title: `Remedial Sprint: ${topic} Accelerated Mastery`,
    description: `Targeted intervention assignment designed to bridge concept gaps and boost practical score in ${topic}.`,
    learningObjectives: [
      `Understand and implement core logic for ${topic} without boilerplate hurdles`,
      `Identify and prevent common off-by-one and edge-case exceptions`,
      `Pass all automated unit tests in the Practice Arena`,
    ],
    practiceProblems: [
      {
        problemTitle: `Fundamental Warmup: Basic ${topic}`,
        difficulty: 'Easy',
        description: `Implement the primary standard pattern for ${topic} handling standard baseline inputs.`,
        expectedOutputHint: 'Outputs formatted results matching test case specification 1.',
      },
      {
        problemTitle: `Applied Challenge: ${topic} In Practice`,
        difficulty: difficultyLevel,
        description: `Solve an applied scenario incorporating boundary constraints and error handling for ${topic}.`,
        expectedOutputHint: 'Zero runtime exceptions on empty or negative input limits.',
      },
      {
        problemTitle: `Optimization Drill: High-Performance ${topic}`,
        difficulty: 'Hard',
        description: `Refactor initial approach to achieve optimal asymptotic time and space bounds.`,
        expectedOutputHint: 'Executes within 2000ms time limit across 10,000 data elements.',
      },
    ],
    recommendedMaterials: [
      { type: 'Documentation', title: `Official Technical Guide & Cheat Sheet on ${topic}` },
      { type: 'Video Tutorial', title: `Deep Dive: Visualizing ${topic} & Top 5 Interview Traps` },
    ],
  };
}

export const processskillGapAI = async (inputData) => {
  return await analyzeStudentPerformance(inputData);
};
