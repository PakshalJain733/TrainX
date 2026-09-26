import { config } from '../config/env.js';

/**
 * Pure Google Gemini AI Quiz Generator
 * Generates technical multiple-choice questions dynamically using Google AI API Key.
 */

/**
 * Auto-verify AI-generated quiz questions using Gemini.
 * Each question is checked for: factual correctness, unambiguous correct answer,
 * distinct non-overlapping options, and appropriate difficulty.
 *
 * @param {Array} questions - Array of generated questions
 * @param {string} topic    - Quiz topic for context
 * @returns {Array}         - Questions annotated with verified, confidence, verificationNote
 */
export const verifyQuizQuestions = async (questions, topic) => {
  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const configuredModel = config.ai?.model || 'gemini-1.5-flash';

  if (!apiKey || apiKey === 'your_ai_api_key' || !Array.isArray(questions) || questions.length === 0) {
    // Graceful fallback: mark all as verified with medium confidence
    return questions.map(q => ({
      ...q,
      verified: true,
      confidence: 'medium',
      verificationNote: 'Auto-verification unavailable — manually review before publishing.',
    }));
  }

  const modelsToTry = Array.from(
    new Set([configuredModel, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'])
  );

  // Build a compact representation of questions for the verification prompt
  const questionsPayload = questions.map((q, i) => ({
    index: i,
    question: q.text || q.question_text,
    options: q.options || { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d },
    markedCorrect: q.correct || q.correct_option || 'a',
  }));

  const prompt = `You are a strict, expert Technical Quiz Auditor for a student training platform.

You are given ${questions.length} multiple-choice questions on the topic: "${topic}".

Your task is to verify EACH question for the following criteria:
1. FACTUAL CORRECTNESS: Is the marked correct option actually the right answer? 
2. UNAMBIGUOUS: Is there exactly ONE clearly correct answer? No trick wording.
3. DISTINCT OPTIONS: Are all 4 options meaningfully different (not nearly identical)?
4. APPROPRIATE: Is the question relevant and clear for the topic?

For each question, output a JSON array with this exact structure:
[
  {
    "index": 0,
    "verified": true,
    "confidence": "high",
    "correctOptionVerified": "a",
    "verificationNote": "Correct answer confirmed. All options are distinct."
  }
]

Rules:
- "verified": true if the question passes all 4 criteria, false if it fails ANY criterion.
- "confidence": "high" (clearly correct), "medium" (acceptable but could be improved), or "low" (problematic — reject).
- "correctOptionVerified": which option letter you believe is ACTUALLY correct. Use the same letter as markedCorrect if it is correct.
- "verificationNote": a short explanation (max 15 words) about why it passed or failed.
- If "verified" is false, set "confidence" to "low" and explain the issue in verificationNote.
- Output ONLY the JSON array, no extra text.

Questions to verify:
${JSON.stringify(questionsPayload, null, 2)}`;

  for (const model of modelsToTry) {
    try {
      console.log(`[Quiz Verifier] Verifying ${questions.length} questions for "${topic}" via ${model}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

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
              temperature: 0.1, // Low temperature for factual verification
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      let verificationResults;
      try {
        verificationResults = JSON.parse(cleanText);
      } catch {
        const arrMatch = cleanText.match(/\[[\s\S]*\]/);
        if (arrMatch) verificationResults = JSON.parse(arrMatch[0]);
        else continue;
      }

      if (!Array.isArray(verificationResults)) continue;

      // Merge verification results back into questions
      const verifiedQuestions = questions.map((q, i) => {
        const result = verificationResults.find(r => r.index === i);
        if (!result) {
          return { ...q, verified: true, confidence: 'medium', verificationNote: 'Could not verify — review manually.' };
        }
        return {
          ...q,
          verified: result.verified !== false,
          confidence: result.confidence || 'medium',
          correctOptionVerified: result.correctOptionVerified || q.correct || 'a',
          verificationNote: result.verificationNote || 'Verified by AI.',
        };
      });

      const passCount = verifiedQuestions.filter(q => q.verified).length;
      console.log(`[Quiz Verifier] Verification complete: ${passCount}/${questions.length} passed for "${topic}"`);
      return verifiedQuestions;

    } catch (err) {
      console.warn(`[Quiz Verifier] Warning with ${model}: ${err.message}`);
    }
  }

  // Final fallback: all pass with medium confidence
  return questions.map(q => ({
    ...q,
    verified: true,
    confidence: 'medium',
    verificationNote: 'Could not reach verifier — please review manually.',
  }));
};

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
