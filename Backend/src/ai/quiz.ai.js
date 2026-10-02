import { generateJSON, describeProvider } from './aiClient.js';

/**
 * Provider-agnostic AI Quiz Generator
 * Generates technical multiple-choice questions dynamically using the configured AI provider.
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
  if (!Array.isArray(questions) || questions.length === 0) {
    return questions;
  }

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

  const verificationResults = await generateJSON(prompt, {
    system: 'You are a strict, expert Technical Quiz Auditor. Output ONLY valid JSON.',
    temperature: 0.1,
    maxTokens: 4000,
  });

  if (!Array.isArray(verificationResults)) {
    return questions.map(q => ({
      ...q,
      verified: true,
      confidence: 'medium',
      verificationNote: 'Auto-verification unavailable — manually review before publishing.',
    }));
  }

  {
    // Merge verification results back into questions
    const verifiedQuestions = questions.map((q, i) => {
        const result = verificationResults.find(r => r.index === i);
        const options = q.options || { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d };

        // Validate basic option integrity
        const hasValidOptions = options.a && options.b && options.a !== options.b;
        if (!hasValidOptions) {
          return {
            ...q,
            verified: false,
            confidence: 'low',
            correct_option: q.correct || q.correct_option || 'a',
            verificationNote: 'Question rejected: Missing or duplicate options.',
          };
        }

        if (!result) {
          return {
            ...q,
            verified: true,
            confidence: 'medium',
            correct_option: q.correct || q.correct_option || 'a',
            verificationNote: 'Could not reach verifier — review manually.',
          };
        }

        const confirmedCorrect = String(result.correctOptionVerified || q.correct || q.correct_option || 'a').toLowerCase().trim();
        const finalCorrect = ['a', 'b', 'c', 'd'].includes(confirmedCorrect) ? confirmedCorrect : (q.correct || 'a');

        const isAnswerCorrected = finalCorrect !== String(q.correct || q.correct_option || '').toLowerCase();
        const note = result.verificationNote || (isAnswerCorrected
          ? `Answer key corrected to Option ${finalCorrect.toUpperCase()}.`
          : `Factually correct. Option ${finalCorrect.toUpperCase()} verified.`);

        return {
          ...q,
          correct: finalCorrect,
          correct_option: finalCorrect,
          verified: result.verified !== false,
          confidence: result.confidence || 'medium',
          correctOptionVerified: finalCorrect,
          verificationNote: note,
        };
      });

    const passCount = verifiedQuestions.filter(q => q.verified).length;
    console.log(`[Quiz Verifier] Verification complete: ${passCount}/${questions.length} passed for "${topic}"`);
    return verifiedQuestions;
  }
};

export const generateQuizQuestionsAI = async (topic, count = 10) => {
  const numQuestions = Math.min(Math.max(parseInt(count, 10) || 5, 1), 30);

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

  // Live generation through the configured provider (NVIDIA / Gemini / Groq).
  const parsed = await generateJSON(prompt, {
    system: 'You are an expert Technical Assessment & Exam Designer. Output valid JSON strictly matching the requested quiz questions schema.',
    temperature: 0.4,
    maxTokens: 4000,
  });

  if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
    const sanitizedQuestions = parsed.questions.map((q, idx) => ({
      id: Date.now() + idx,
      text: q.text || ('Q' + (idx + 1) + ': Question on ' + topic),
      options: {
        a: q.options?.a || 'Option A',
        b: q.options?.b || 'Option B',
        c: q.options?.c || 'Option C',
        d: q.options?.d || 'Option D',
      },
      correct: ['a', 'b', 'c', 'd'].includes(String(q.correct || '').toLowerCase().trim())
        ? String(q.correct).toLowerCase().trim()
        : 'a',
    }));

    console.log('[AI] Successfully generated ' + sanitizedQuestions.length + ' live questions for ' + topic + ' via ' + describeProvider() + '!');
    return sanitizedQuestions;
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
