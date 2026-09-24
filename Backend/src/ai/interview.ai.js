import { config } from '../config/env.js';
import { retrieveContext } from '../services/rag/rag.service.js';

const getApiKey = () => config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
const getModel = () => config.ai?.model || 'gemini-3.6-flash';

const modelsToTry = (configured) => Array.from(
  new Set([configured, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-pro'])
);

export async function callGemini(prompt, { temperature = 0.7 } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  for (const model of modelsToTry(getModel())) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, topK: 40, topP: 0.95 },
          }),
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) return rawText;
    } catch (err) {
      console.warn(`[Interview AI] Gemini ${model} fallback: ${err.message}`);
    }
  }

  return null;
}

export function parseAIJson(rawText) {
  if (!rawText) return null;
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const clean = match[0].replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

async function buildKnowledgeContext(query, owner, limit = 4) {
  try {
    const chunks = await retrieveContext({ query, owner, topK: limit });
    if (!chunks || chunks.length === 0) return '';
    return chunks
      .map((c, i) => `[Knowledge #${i + 1}]\n${c.text}`)
      .join('\n\n');
  } catch {
    return '';
  }
}

/**
 * Generate the FIRST interview question dynamically (no hardcoded data).
 */
export const generateOpeningQuestion = async ({ role, topic, difficulty, owner, priorQa = [] }) => {
  const knowledge = await buildKnowledgeContext(`${role} ${topic} interview question`, owner);
  const prompt = `You are a senior technical interviewer conducting a live ${difficulty} mock interview for a candidate targeting the role: "${role}".

Interview scope/topic: "${topic}".

Ground the question in the candidate's study knowledge below when relevant (cite concepts from it):
${knowledge || 'No knowledge base provided — ask a standard high-quality question for the topic.'}

Generate ONE crisp, challenging interview question. It must be realistic, specific, and answerable in ~90 seconds verbally.

Respond ONLY with valid JSON:
{
  "question": "The full question text",
  "topic": "a concise topic label",
  "hint": "a one-line guiding hint for the candidate"
}`;

  const raw = await callGemini(prompt, { temperature: 0.8 });
  const parsed = parseAIJson(raw);
  if (parsed && parsed.question) {
    return {
      source: 'gemini-ai',
      ...parsed,
    };
  }
  return null;
};

/**
 * Generate a follow-up question given conversation history.
 */
export const generateFollowUpQuestion = async ({ role, topic, difficulty, owner, priorQa = [], askedTopics = [] }) => {
  const lastQa = priorQa.slice(-4).map(
    (qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer || '(no answer)'}\nScored: ${qa.score ?? 'N/A'}/10`
  ).join('\n\n');

  const usedTopics = askedTopics.filter(Boolean).map((t) => `"${t}"`).join(', ');
  const knowledge = await buildKnowledgeContext(`${role} ${topic} next question`, owner);

  const prompt = `You are a senior technical interviewer continuing a ${difficulty} mock interview for role "${role}" (scope: "${topic}").

Knowledge base context (use when relevant):
${knowledge || 'No knowledge base provided.'}

Conversation so far:
${lastQa || 'No prior questions yet.'}

Questions already asked (avoid repeating these topics unless probing deeper): ${usedTopics || 'None'}

Generate the NEXT interview question. Requirements:
- Vary the topic or probe deeper based on the previous answers.
- Do NOT repeat earlier questions.
- Be realistic and specific, answerable verbally in ~90 seconds.

Respond ONLY with valid JSON:
{
  "question": "The full question text",
  "topic": "a concise topic label",
  "hint": "a one-line guiding hint"
}`;

  const raw = await callGemini(prompt, { temperature: 0.8 });
  const parsed = parseAIJson(raw);
  if (parsed && parsed.question) {
    return {
      source: 'gemini-ai',
      ...parsed,
    };
  }
  return null;
};

/**
 * Evaluate a candidate answer and produce per-question feedback + score.
 */
export const evaluateAnswer = async ({ role, topic, question, answer, owner, difficulty }) => {
  const knowledge = await buildKnowledgeContext(`${topic} ${question}`, owner);
  const prompt = `You are a strict but fair senior technical interviewer evaluating a candidate's verbal answer for role "${role}" (topic: "${topic}", difficulty: ${difficulty}).

QUESTION:
${question}

CANDIDATE ANSWER (transcribed from speech):
${answer || '(Candidate did not provide an answer)'}

Reference knowledge to compare correctness (if provided):
${knowledge || 'No reference knowledge provided.'}

Evaluate the answer and respond ONLY with valid JSON:
{
  "score": <number 0-10>,
  "technical": <number 0-10>,
  "communication": <number 0-10>,
  "feedback": "2-3 sentence constructive feedback",
  "modelAnswer": "a concise gold-standard answer the candidate should have conveyed",
  "isCorrectDirection": true|false
}`;

  const raw = await callGemini(prompt, { temperature: 0.3 });
  const parsed = parseAIJson(raw);

  if (parsed && typeof parsed.score === 'number') {
    return { source: 'gemini-ai', ...parsed };
  }

  return null;
};

/**
 * Generate the final scorecard + improvement plan.
 */
export const generateScorecard = async ({ role, topic, evaluationHistory }) => {
  const transcript = evaluationHistory
    .map((e, i) => `Q${i + 1} [${e.topic}]: ${e.question}\nA: ${e.answer}}\nScore: ${e.score}/10\nFeedback: ${e.feedback}`)
    .join('\n\n');

  const prompt = `You are an interview panel lead producing the final report for a mock interview for role "${role}" (scope "${topic}").

PER-QUESTION EVALUATIONS:
${transcript}

Compute the final scorecard and respond ONLY with valid JSON:
{
  "overallScore": <number 0-100>,
  "technical": <number 0-100>,
  "problemSolving": <number 0-100>,
  "communication": <number 0-100>,
  "grade": "Excellent|Good|Average|Needs Improvement",
  "feedback": "overall 3-4 sentence evaluation",
  "strengths": ["...", "..."],
  "improvementAreas": ["...", "..."],
  "recommendedTopics": ["...", "..."],
  "readiness": "Interview Readiness Summary text"
}`;

  const raw = await callGemini(prompt, { temperature: 0.4 });
  const parsed = parseAIJson(raw);

  if (parsed && typeof parsed.overallScore === 'number') {
    return { source: 'gemini-ai', ...parsed };
  }
  return null;
};

export const processinterviewAI = async (inputData) => {
  return { status: 'processed', inputData };
};