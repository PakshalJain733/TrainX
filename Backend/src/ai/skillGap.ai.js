import { config } from '../config/env.js';

/**
 * Pure AI Skill Gap Diagnostics & Remedial Engine powered by Google Gemini AI.
 * Identifies concept misunderstandings, prescribes target practice problems, and synthesizes custom remedial assignments.
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

      if (!response.ok) {
        continue;
      }

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
