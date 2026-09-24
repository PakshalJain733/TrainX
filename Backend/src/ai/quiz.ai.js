import { config } from '../config/env.js';

/**
 * Pure Google Gemini AI Quiz Generator
 * Generates technical multiple-choice questions dynamically using Google AI API Key.
 */
export const generateQuizQuestionsAI = async (topic, count = 10) => {
  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const configuredModel = config.ai?.model || 'gemini-1.5-flash';
  const numQuestions = Math.min(Math.max(parseInt(count, 10) || 5, 1), 30);

  if (!apiKey || apiKey === 'your_ai_api_key') {
    return buildFallbackQuestions(topic, numQuestions);
  }

  const modelsToTry = Array.from(
    new Set([configuredModel, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'])
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
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) continue;

      const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanJsonText);
      } catch (parseErr) {
        const jsonMatch = cleanJsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          continue;
        }
      }

      if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
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
      console.warn(`[Google Gemini AI] Connection warning with model ${model}: ${err.message}`);
    }
  }

  // Graceful fallback questions
  return buildFallbackQuestions(topic, numQuestions);
};

function buildFallbackQuestions(topic, count) {
  const defaultQuestions = [
    {
      text: `What is the primary architectural advantage of utilizing ${topic}?`,
      options: {
        a: "Enhanced scalability and modular separation of concerns",
        b: "Elimination of all network latency overhead",
        c: "Automatic hardware memory overclocking",
        d: "Guaranteed single-threaded synchronous execution",
      },
      correct: "a",
    },
    {
      text: `Which best practice is crucial when implementing ${topic} in production?`,
      options: {
        a: "Disabling error boundaries and validation checks",
        b: "Robust exception handling, structured logging, and input sanitization",
        c: "Storing raw credentials in client-side storage",
        d: "Avoiding version control and automated testing",
      },
      correct: "b",
    },
    {
      text: `How does concurrency or asynchronous processing impact ${topic}?`,
      options: {
        a: "Prevents non-blocking execution across the event loop",
        b: "Forces the database to rebuild all primary keys",
        c: "Enables non-blocking I/O operations and higher request throughput",
        d: "Limits application scaling to a single user session",
      },
      correct: "c",
    },
    {
      text: `What is the recommended approach for state persistence when working with ${topic}?`,
      options: {
        a: "Using relational/NoSQL databases with indexed query optimization",
        b: "Hardcoding state inside static configuration files",
        c: "Storing all persistent data exclusively in RAM variables",
        d: "Relying on browser local cookies without encryption",
      },
      correct: "a",
    },
    {
      text: `Which testing strategy provides optimal coverage for ${topic}?`,
      options: {
        a: "Manual smoke testing right before production deploy only",
        b: "A balanced pyramid of unit, integration, and end-to-end tests",
        c: "Skipping regression testing to accelerate delivery speed",
        d: "Only checking syntax with a code linter",
      },
      correct: "b",
    },
  ];

  return defaultQuestions.slice(0, count).map((q, idx) => ({
    id: Date.now() + idx,
    ...q,
  }));
}
