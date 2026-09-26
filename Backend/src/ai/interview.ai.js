import { config } from '../config/env.js';
import { retrieveContext } from '../services/rag/rag.service.js';

const getApiKey = () => config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
const getModel = () => config.ai?.model || 'gemini-1.5-flash';

// Try real Gemini models in order
const modelsToTry = (configured) => Array.from(
  new Set([configured, 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-2.0-flash'])
);

export async function callGemini(prompt, { temperature = 0.7 } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  // Quick sanity check — real Gemini API keys start with "AIza"
  if (!apiKey.startsWith('AIza')) {
    console.warn('[Interview AI] AI_API_KEY does not look like a valid Google Gemini key (should start with "AIza"). Skipping Gemini call.');
    return null;
  }

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

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.warn(`[Interview AI] Gemini ${model} HTTP ${response.status}: ${errBody?.error?.message || 'Unknown error'}`);
        continue;
      }
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) return rawText;
    } catch (err) {
      console.warn(`[Interview AI] Gemini ${model} error: ${err.message}`);
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

// ---------------------------------------------------------------------------
// FALLBACK QUESTION BANK — used when Gemini API is unavailable/invalid
// ---------------------------------------------------------------------------
const FALLBACK_QUESTIONS = {
  JavaScript: [
    { question: 'Explain the difference between `var`, `let`, and `const` in JavaScript. When would you use each?', topic: 'Variable Declarations', hint: 'Consider hoisting and block scope.' },
    { question: 'What is the event loop in JavaScript and how does it handle asynchronous operations?', topic: 'Event Loop', hint: 'Think about call stack, task queue, and microtask queue.' },
    { question: 'Explain closures in JavaScript with a practical example.', topic: 'Closures', hint: 'Think about a function returning another function that accesses outer scope.' },
    { question: 'What is the difference between `==` and `===` in JavaScript?', topic: 'Type Coercion', hint: 'Consider type coercion and strict equality.' },
    { question: 'Explain Promises and async/await. How do they improve over callbacks?', topic: 'Async Programming', hint: 'Mention error handling, chaining, and readability.' },
    { question: 'What is prototypal inheritance in JavaScript? How does it differ from classical inheritance?', topic: 'Prototypes', hint: 'Think about the prototype chain and Object.create().' },
    { question: 'Explain the concept of `this` in JavaScript. How does it behave in arrow functions vs regular functions?', topic: 'Context & this', hint: 'Consider binding, call/apply/bind, and lexical this.' },
    { question: 'What are higher-order functions? Give examples like map, filter, and reduce.', topic: 'Functional Programming', hint: 'Functions that take or return other functions.' },
    { question: 'What is debouncing vs throttling? When would you use each?', topic: 'Performance', hint: 'Consider rate limiting user actions like search input vs scroll events.' },
    { question: 'Explain the difference between deep copy and shallow copy in JavaScript. How do you perform each?', topic: 'Objects & Copying', hint: 'Think about Object.assign, spread operator, and JSON.parse/stringify.' },
    { question: 'What are generators in JavaScript? How do they differ from regular functions?', topic: 'Generators', hint: 'Think about the yield keyword and lazy evaluation.' },
    { question: 'How does garbage collection work in JavaScript?', topic: 'Memory Management', hint: 'Think about mark-and-sweep, reference counting.' },
  ],
  Python: [
    { question: 'Explain list comprehensions in Python with an example. How do they differ from map/filter?', topic: 'List Comprehensions', hint: 'Syntax: [expr for item in iterable if condition]' },
    { question: 'What are Python decorators? Write a simple decorator that logs function calls.', topic: 'Decorators', hint: 'Decorators are higher-order functions that wrap other functions.' },
    { question: 'Explain the difference between `__init__` and `__new__` in Python classes.', topic: 'OOP', hint: '__new__ creates the instance, __init__ initializes it.' },
    { question: 'What are Python generators? How do they differ from regular functions?', topic: 'Generators', hint: 'Think about the yield keyword and memory efficiency.' },
    { question: 'Explain Python\'s GIL (Global Interpreter Lock) and its implications for threading.', topic: 'Concurrency', hint: 'GIL prevents true parallel execution of Python bytecode.' },
    { question: 'What is the difference between mutable and immutable types in Python? Give examples.', topic: 'Data Types', hint: 'Lists are mutable, tuples and strings are immutable.' },
    { question: 'Explain Python\'s context managers and the `with` statement.', topic: 'Context Managers', hint: 'Think about __enter__ and __exit__ methods.' },
    { question: 'What are *args and **kwargs in Python? When would you use them?', topic: 'Function Arguments', hint: '*args for positional, **kwargs for keyword arguments.' },
  ],
  React: [
    { question: 'Explain the difference between controlled and uncontrolled components in React.', topic: 'Components', hint: 'Controlled components use state; uncontrolled use refs.' },
    { question: 'What is the Virtual DOM and how does React use it for efficient rendering?', topic: 'Virtual DOM', hint: 'Think about diffing and reconciliation.' },
    { question: 'Explain React hooks. What problem do useState and useEffect solve?', topic: 'React Hooks', hint: 'State and side effects in functional components.' },
    { question: 'What is the difference between useMemo and useCallback?', topic: 'Performance', hint: 'Both memoize — useMemo for values, useCallback for functions.' },
    { question: 'Explain the Context API. When would you use it over props drilling?', topic: 'State Management', hint: 'Context avoids passing props through many component levels.' },
    { question: 'What is React.memo and when should you use it?', topic: 'Performance', hint: 'Prevents re-renders when props have not changed.' },
    { question: 'Explain the concept of lifting state up in React.', topic: 'State Management', hint: 'Move shared state to the closest common ancestor.' },
    { question: 'What are React keys and why are they important in lists?', topic: 'Keys', hint: 'Keys help React identify which items have changed, added, or removed.' },
  ],
  'Node.js': [
    { question: 'Explain the Node.js event-driven architecture. How does it differ from multi-threaded servers?', topic: 'Architecture', hint: 'Single-threaded non-blocking I/O vs thread-per-request.' },
    { question: 'What is middleware in Express.js? Write an example authentication middleware.', topic: 'Middleware', hint: 'Functions with (req, res, next) signature.' },
    { question: 'Explain streams in Node.js. What are the four types?', topic: 'Streams', hint: 'Readable, Writable, Duplex, Transform.' },
    { question: 'What is the difference between process.nextTick() and setImmediate()?', topic: 'Event Loop', hint: 'nextTick runs before I/O; setImmediate runs after I/O.' },
    { question: 'How does Node.js handle CPU-intensive tasks without blocking?', topic: 'Performance', hint: 'Child processes, worker threads, or offloading to external services.' },
    { question: 'What is clustering in Node.js? How does it help performance?', topic: 'Scaling', hint: 'Fork multiple processes to use all CPU cores.' },
  ],
  'SQL / Databases': [
    { question: 'Explain the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN with examples.', topic: 'SQL Joins', hint: 'INNER returns matches; LEFT includes all from left table.' },
    { question: 'What is database normalization? Explain 1NF, 2NF, and 3NF.', topic: 'Normalization', hint: 'Each normal form eliminates a specific type of data redundancy.' },
    { question: 'What are database indexes? How do they improve query performance? What are the tradeoffs?', topic: 'Indexing', hint: 'Indexes speed reads but slow writes and use extra storage.' },
    { question: 'Explain ACID properties in database transactions.', topic: 'Transactions', hint: 'Atomicity, Consistency, Isolation, Durability.' },
    { question: 'What is the difference between SQL and NoSQL databases? When would you choose each?', topic: 'Database Types', hint: 'Consider schema flexibility, scalability, and consistency needs.' },
    { question: 'Explain what a query execution plan is and how you would use it to optimize slow queries.', topic: 'Query Optimization', hint: 'Use EXPLAIN to analyze how the database executes a query.' },
  ],
  'Data Structures & Algorithms': [
    { question: 'Explain the difference between BFS and DFS. When would you use each?', topic: 'Graph Traversal', hint: 'BFS uses a queue; DFS uses a stack or recursion.' },
    { question: 'What is dynamic programming? Explain with the Fibonacci example.', topic: 'Dynamic Programming', hint: 'Memoization vs tabulation approaches.' },
    { question: 'Explain binary search. What is its time complexity and when can it be applied?', topic: 'Binary Search', hint: 'Array must be sorted. O(log n) time complexity.' },
    { question: 'What are hash tables? How do they handle collisions?', topic: 'Hash Tables', hint: 'Chaining vs open addressing for collision resolution.' },
    { question: 'Explain the difference between a stack and a queue. Give real-world examples.', topic: 'Data Structures', hint: 'Stack: LIFO (function calls). Queue: FIFO (print queue).' },
    { question: 'What is the time complexity of quicksort in best, average, and worst cases?', topic: 'Sorting', hint: 'O(n log n) average, O(n²) worst case with bad pivot choice.' },
  ],
  Java: [
    { question: 'Explain the four pillars of OOP in Java with examples.', topic: 'OOP', hint: 'Encapsulation, Inheritance, Polymorphism, Abstraction.' },
    { question: 'What is the difference between an interface and an abstract class in Java?', topic: 'Interfaces', hint: 'Interfaces define contracts; abstract classes share partial implementation.' },
    { question: 'Explain Java generics and their benefits.', topic: 'Generics', hint: 'Type safety at compile time, eliminates casting.' },
    { question: 'What is the Java memory model? Explain heap, stack, and garbage collection.', topic: 'Memory Management', hint: 'Stack for method frames; heap for objects; GC reclaims unused objects.' },
    { question: 'Explain the difference between ArrayList and LinkedList in Java.', topic: 'Collections', hint: 'ArrayList: O(1) random access; LinkedList: O(1) insertion/deletion.' },
    { question: 'What are Java streams? How do they differ from collections?', topic: 'Streams API', hint: 'Streams are lazy and functional; collections are eager and data structures.' },
  ],
  'System Design Basics': [
    { question: 'How would you design a URL shortener like bit.ly? Walk me through your design.', topic: 'System Design', hint: 'Consider hashing, redirection, database storage, and scaling.' },
    { question: 'Explain the CAP theorem. Can you give examples of systems that favor CP vs AP?', topic: 'Distributed Systems', hint: 'Consistency, Availability, Partition Tolerance — pick 2.' },
    { question: 'What is horizontal vs vertical scaling? When would you use each?', topic: 'Scalability', hint: 'Horizontal: more machines. Vertical: bigger machine.' },
    { question: 'Explain the role of a load balancer in a distributed system.', topic: 'Load Balancing', hint: 'Distribute traffic, provide failover, enable horizontal scaling.' },
    { question: 'What is caching? Explain cache invalidation strategies.', topic: 'Caching', hint: 'TTL, write-through, write-back, cache-aside patterns.' },
    { question: 'How would you design a notification system that handles millions of users?', topic: 'System Design', hint: 'Consider message queues, push vs pull, fan-out patterns.' },
  ],
};

const GENERIC_QUESTIONS = [
  { question: 'Describe a challenging technical problem you solved recently. What was your approach?', topic: 'Problem Solving', hint: 'Use the STAR method: Situation, Task, Action, Result.' },
  { question: 'How do you stay updated with the latest developments in software engineering?', topic: 'Learning', hint: 'Mention blogs, courses, open source, conferences.' },
  { question: 'Explain the concept of clean code. What principles do you follow?', topic: 'Code Quality', hint: 'Think SOLID, DRY, KISS principles.' },
  { question: 'How do you approach debugging a production issue you\'ve never seen before?', topic: 'Debugging', hint: 'Mention logs, monitoring, reproducing, bisecting.' },
  { question: 'What is the difference between unit testing, integration testing, and end-to-end testing?', topic: 'Testing', hint: 'Scope, speed, and isolation differ at each level.' },
  { question: 'Explain what REST is. What makes an API RESTful?', topic: 'API Design', hint: 'Stateless, resource-based, standard HTTP methods.' },
  { question: 'How do you handle technical debt in a codebase?', topic: 'Engineering Practices', hint: 'Prioritization, refactoring, documentation, team alignment.' },
  { question: 'What is microservices architecture? What are its advantages and disadvantages?', topic: 'Architecture', hint: 'Independent deployability, fault isolation, but network complexity.' },
];

function getFallbackQuestions(topic) {
  const pool = FALLBACK_QUESTIONS[topic] || GENERIC_QUESTIONS;
  return [...pool];
}

// Track used fallback question indices per session
const fallbackSessionState = new Map();

function pickFallbackQuestion(sessionId, topic, askedTopics) {
  const key = `${sessionId}-${topic}`;
  if (!fallbackSessionState.has(key)) {
    // Shuffle the pool
    const pool = getFallbackQuestions(topic);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    fallbackSessionState.set(key, { pool, used: 0 });
  }
  const state = fallbackSessionState.get(key);
  if (state.used >= state.pool.length) {
    // All used — shuffle generic
    const generic = [...GENERIC_QUESTIONS];
    for (let i = generic.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generic[i], generic[j]] = [generic[j], generic[i]];
    }
    return { source: 'fallback', ...generic[0] };
  }
  const q = state.pool[state.used];
  state.used += 1;
  return { source: 'fallback', ...q };
}

/**
 * Generate the FIRST interview question dynamically (no hardcoded data).
 * Falls back to a curated question bank if Gemini is unavailable.
 */
export const generateOpeningQuestion = async ({ role, topic, difficulty, owner, priorQa = [], sessionId = 'default' }) => {
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

  // Gemini unavailable — use fallback question bank
  console.info(`[Interview AI] Gemini unavailable — using fallback question bank for topic: ${topic}`);
  return pickFallbackQuestion(sessionId, topic, []);
};

/**
 * Generate a follow-up question given conversation history.
 * Falls back to a curated question bank if Gemini is unavailable.
 */
export const generateFollowUpQuestion = async ({ role, topic, difficulty, owner, priorQa = [], askedTopics = [], sessionId = 'default' }) => {
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

  // Gemini unavailable — use fallback question bank
  console.info(`[Interview AI] Gemini unavailable — using fallback question for topic: ${topic}`);
  return pickFallbackQuestion(sessionId, topic, askedTopics);
};

/**
 * Evaluate a candidate answer and produce per-question feedback + score.
 * Falls back to a basic scoring heuristic if Gemini is unavailable.
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

  // Fallback: rough heuristic based on answer length
  const words = (answer || '').trim().split(/\s+/).filter(Boolean).length;
  const baseScore = Math.min(10, Math.max(2, Math.round(words / 15)));
  return {
    source: 'fallback',
    score: baseScore,
    technical: baseScore,
    communication: Math.min(10, baseScore + 1),
    feedback: words < 10
      ? 'Your answer was very brief. Try to elaborate with specific examples and technical depth.'
      : words < 30
      ? 'Good attempt. Consider adding more technical detail and concrete examples to strengthen your answer.'
      : 'Solid response. Keep building on your technical vocabulary and structured explanations.',
    modelAnswer: 'AI evaluation unavailable. Review the topic independently.',
    isCorrectDirection: words >= 10,
  };
};

/**
 * Generate the final scorecard + improvement plan.
 * Falls back to a computed scorecard if Gemini is unavailable.
 */
export const generateScorecard = async ({ role, topic, evaluationHistory }) => {
  if (!evaluationHistory || evaluationHistory.length === 0) {
    return {
      source: 'computed',
      overallScore: 0,
      technical: 0,
      problemSolving: 0,
      communication: 0,
      grade: 'Needs Improvement',
      feedback: 'You did not answer any questions. Please participate to receive an evaluation.',
      strengths: ['None'],
      improvementAreas: ['Attempt all questions in the interview'],
      recommendedTopics: [topic],
      readiness: 'Not ready'
    };
  }

  const transcript = evaluationHistory
    .map((e, i) => `Q${i + 1} [${e.topic}]: ${e.question}\nA: ${e.answer}\nScore: ${e.score}/10\nFeedback: ${e.feedback}`)
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

  // Fallback computed scorecard
  const avg = evaluationHistory.reduce((a, e) => a + (e.score || 0), 0) / evaluationHistory.length;
  const overallScore = Math.round(avg * 10);
  const grade = avg >= 8 ? 'Excellent' : avg >= 6 ? 'Good' : avg >= 4 ? 'Average' : 'Needs Improvement';

  return {
    source: 'fallback',
    overallScore,
    technical: overallScore,
    communication: overallScore === 0 ? 0 : Math.min(100, overallScore + 5),
    problemSolving: overallScore === 0 ? 0 : Math.max(0, overallScore - 5),
    grade,
    feedback: `You answered ${evaluationHistory.length} question${evaluationHistory.length !== 1 ? 's' : ''} with an average score of ${avg.toFixed(1)}/10. ${grade === 'Excellent' ? 'Outstanding performance!' : grade === 'Good' ? 'Good performance overall.' : 'Keep practising to improve your technical depth.'}`,
    strengths: avg >= 5 ? ['Attempted all questions', 'Shows foundational understanding'] : ['Participated in the full interview'],
    improvementAreas: avg < 7 ? ['Provide more detailed technical explanations', 'Use concrete examples'] : ['Deepen knowledge in advanced topics'],
    recommendedTopics: [topic, 'System Design', 'Data Structures & Algorithms'].slice(0, 3),
    readiness: avg >= 7 ? 'You appear ready for entry-level interviews. Keep practising!' : 'Continue studying and mock interviews before applying.',
  };
};

export const processinterviewAI = async (inputData) => {
  return { status: 'processed', inputData };
};