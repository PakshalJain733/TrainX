import { config } from '../config/env.js';

/**
 * Pure AI Roadmap Engine powered directly by Google Gemini AI
 * Dynamically designs customized technical learning milestones for any role or career path.
 * Zero static mock data.
 */
export const processroadmapAI = async (inputData) => {
  const {
    targetRole = 'Full Stack Developer',
    studentProfile = {},
    currentSkills = [],
  } = inputData;

  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const configuredModel = config.ai?.model || 'gemini-3.6-flash';
  const skillsListStr = Array.isArray(currentSkills) ? currentSkills.join(', ') : currentSkills;

  if (!apiKey) {
    throw new Error('Google AI API Key is not configured in backend/.env (AI_API_KEY). Please set a valid Gemini API key.');
  }

  // Active Google Gemini models to cycle through if Google experiences temporary 503 high demand
  const modelsToTry = Array.from(
    new Set([configuredModel, 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'])
  );

  const prompt = `You are a high-level Curriculum Architect AI. Design a detailed, progressive 5 to 6 milestone technical learning roadmap for a student targeting the following goal:

TARGET CAREER ROLE / TOPIC: "${targetRole}"

STUDENT PROFILE & CONFIRMED SKILLS:
- Department / Semester: ${studentProfile.department || 'Engineering'}, ${studentProfile.semester || 'Semester 6'}, CGPA: ${studentProfile.cgpa || '8.5'}
- Confirmed Mastered Skills: [${skillsListStr || 'None specified'}]

RULES:
1. Generate exactly 5 to 6 ordered milestones starting from foundational knowledge through advanced real-world capstones.
2. If any prerequisite skill is already in the student's confirmed mastered skills ([${skillsListStr}]), mark that milestone with status: "completed", progress: 100, and append "(Mastered ✓)" to the title.
3. The next uncompleted milestone should have status: "in-progress" and progress: 35-50. Remaining milestones should have status: "locked" and progress: 0.
4. Each milestone must include: id (number 1 to 6), title (string), desc (string describing concepts and technologies), status ("completed" | "in-progress" | "locked"), progress (number 0 to 100), tags (array of 3-5 strings), quizzes (number between 2 and 5), exercises (number between 5 and 15).
5. Output ONLY valid JSON matching this exact structure without any markdown formatting or explanations:
{
  "milestones": [
    {
      "id": 1,
      "title": "Milestone 1: ...",
      "desc": "...",
      "status": "completed",
      "progress": 100,
      "tags": ["Tag1", "Tag2", "Tag3"],
      "quizzes": 3,
      "exercises": 8
    }
  ]
}`;

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Google Gemini AI] Requesting live curriculum generation for "${targetRole}" via ${model}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.warn(`[Google Gemini AI] Model ${model} returned status ${response.status}: ${errorBody.slice(0, 150)}`);
        lastError = new Error(`Gemini AI (${model}) error ${response.status}: ${errorBody}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        lastError = new Error(`Google Gemini (${model}) returned an empty candidate text.`);
        continue;
      }

      // Clean JSON delimiters if returned
      const cleanJsonText = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanJsonText);
      } catch (parseErr) {
        const jsonMatch = cleanJsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          lastError = new Error(`JSON parse failure from ${model}: ${parseErr.message}`);
          continue;
        }
      }

      if (!parsed || !Array.isArray(parsed.milestones) || parsed.milestones.length === 0) {
        lastError = new Error(`Invalid milestones array from ${model}`);
        continue;
      }

      const sanitizedMilestones = parsed.milestones.map((m, index) => ({
        id: index + 1,
        title: m.title || `Milestone ${index + 1}: ${targetRole} Module`,
        desc: m.desc || `Core learning concepts for ${targetRole}`,
        status: m.status || (index === 0 ? 'in-progress' : 'locked'),
        progress: typeof m.progress === 'number' ? m.progress : (index === 0 ? 40 : 0),
        tags: Array.isArray(m.tags) ? m.tags : [targetRole],
        quizzes: typeof m.quizzes === 'number' ? m.quizzes : 3,
        exercises: typeof m.exercises === 'number' ? m.exercises : 8,
      }));

      console.log(`[Google Gemini AI] Successfully generated ${sanitizedMilestones.length} live AI milestones for "${targetRole}" via ${model}!`);

      return {
        source: 'gemini-ai',
        modelUsed: model,
        milestones: sanitizedMilestones,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[Google Gemini AI] Connection error with model ${model}: ${err.message}`);
    }
  }

  throw (lastError || new Error('Failed to generate roadmap from Google Gemini AI.'));
};
