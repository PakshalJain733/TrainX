import { config } from '../config/env.js';

/**
 * Pure Google Gemini AI Quiz Generator
 * Generates technical multiple-choice questions dynamically using Google AI API Key.
 */
export const generateQuizQuestionsAI = async (topic, count = 10) => {
  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const configuredModel = config.ai?.model || 'gemini-3.5-flash-lite';
  const numQuestions = Math.min(Math.max(parseInt(count, 10) || 5, 1), 30);

  if (!apiKey) {
    throw new Error('Google AI API Key is not configured in backend/.env (AI_API_KEY).');
  }

  const modelsToTry = Array.from(
    new Set([configuredModel, 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'])
  );

  const prompt = `You are an expert Technical Assessment & Exam Designer.
Generate exactly ${numQuestions} multiple-choice questions for a quiz on the topic: "${topic}".

RULES:
1. Generate high-quality, clear, non-repetitive technical questions covering core concepts and practical application.
2. Provide exactly 4 options (a, b, c, d) per question and set "correct" to 'a', 'b', 'c', or 'd'.
3. Output ONLY a valid JSON object matching this exact structure:
{
  "questions": [
    {
      "text": "Question text here?",
      "options": {
        "a": "Option A text",
        "b": "Option B text",
        "c": "Option C text",
        "d": "Option D text"
      },
      "correct": "a"
    }
  ]
}`;

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Google Gemini AI] Generating ${numQuestions} questions for topic "${topic}" via ${model}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.4,
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.warn(`[Google Gemini AI] Model ${model} returned status ${response.status}: ${errorBody.slice(0, 150)}`);
        lastError = new Error(`Gemini AI (${model}) error ${response.status}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        lastError = new Error(`Google Gemini (${model}) returned an empty response text.`);
        continue;
      }

      const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

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

      if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        lastError = new Error(`Invalid questions array from ${model}`);
        continue;
      }

      const sanitizedQuestions = parsed.questions.map((q, idx) => ({
        id: Date.now() + idx,
        text: q.text || `Q${idx + 1}: Question on ${topic}`,
        options: {
          a: q.options?.a || "Option A",
          b: q.options?.b || "Option B",
          c: q.options?.c || "Option C",
          d: q.options?.d || "Option D",
        },
        correct: (q.correct || "a").toLowerCase().trim(),
      }));

      console.log(`[Google Gemini AI] Successfully generated ${sanitizedQuestions.length} live questions for "${topic}" via ${model}!`);
      return sanitizedQuestions;
    } catch (err) {
      lastError = err;
      console.warn(`[Google Gemini AI] Connection error with model ${model}: ${err.message}`);
    }
  }

  throw (lastError || new Error('Failed to generate quiz questions using Google Gemini AI.'));
};
