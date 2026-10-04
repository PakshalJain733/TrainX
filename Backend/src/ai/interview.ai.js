import { generateText, generateJSON, describeProvider } from './aiClient.js';
import { retrieveContext } from '../services/rag/rag.service.js';

export async function callGemini(prompt, { temperature = 0.7, timeoutMs = 15000 } = {}) {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), timeoutMs)
    );
    return await Promise.race([
      generateText(prompt, { temperature, maxTokens: 2048 }),
      timeoutPromise,
    ]);
  } catch (err) {
    console.warn('[Interview AI] callGemini timeout/fallback:', err.message);
    return null;
  }
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
    { question: 'Explain the difference between var, let, and const in JavaScript. When would you use each?', topic: 'Variable Declarations', hint: 'Consider hoisting and block scope.' },
    { question: 'What is the event loop in JavaScript and how does it handle asynchronous operations?', topic: 'Event Loop', hint: 'Think about call stack, task queue, and microtask queue.' },
    { question: 'Explain closures in JavaScript with a practical real-world example.', topic: 'Closures', hint: 'Think about a function returning another function that accesses outer scope.' },
    { question: 'What is the difference between double equals and triple equals in JavaScript?', topic: 'Type Coercion', hint: 'Consider type coercion versus strict value and type equality.' },
    { question: 'Explain Promises and async await in JavaScript. How do they improve over callbacks?', topic: 'Async Programming', hint: 'Mention error handling, chaining, and readability.' },
    { question: 'What is prototypal inheritance in JavaScript? How does it differ from classical OOP inheritance?', topic: 'Prototypes', hint: 'Think about the prototype chain and Object.create().' },
    { question: 'Explain the concept of the this keyword in JavaScript. How does it behave in arrow functions versus regular functions?', topic: 'Context & this', hint: 'Consider lexical scoping versus dynamic runtime binding.' },
    { question: 'What are higher-order functions in JavaScript? Give examples such as map, filter, and reduce.', topic: 'Functional Programming', hint: 'Functions that take or return other functions.' },
    { question: 'What is debouncing versus throttling in JavaScript? When would you use each?', topic: 'Performance', hint: 'Consider rate limiting user actions like search input vs scroll events.' },
    { question: 'Explain the difference between deep copy and shallow copy in JavaScript. How do you perform each?', topic: 'Objects & Copying', hint: 'Think about spread operator versus structuredClone or JSON parsing.' },
    { question: 'What are generators in JavaScript? How do they differ from regular functions?', topic: 'Generators', hint: 'Think about the yield keyword and lazy evaluation.' },
    { question: 'How does garbage collection work in JavaScript?', topic: 'Memory Management', hint: 'Think about mark-and-sweep, reference counting.' },
  ],
  Python: [
    { question: 'Explain list comprehensions in Python with an example. How do they differ from map and filter?', topic: 'List Comprehensions', hint: 'Consider readability, performance, and filtering.' },
    { question: 'What are Python decorators? How do you write a simple decorator that logs function calls?', topic: 'Decorators', hint: 'Decorators are higher-order functions that wrap other functions.' },
    { question: 'Explain the difference between the init and new methods in Python classes.', topic: 'OOP', hint: 'new creates the instance, init initializes it.' },
    { question: 'What are Python generators? How do they differ from regular functions?', topic: 'Generators', hint: 'Think about the yield keyword and memory efficiency.' },
    { question: 'Explain Python\'s Global Interpreter Lock (GIL) and its implications for multithreaded programs.', topic: 'Concurrency', hint: 'GIL prevents true parallel execution of Python bytecode.' },
    { question: 'What is the difference between mutable and immutable types in Python? Give examples.', topic: 'Data Types', hint: 'Lists are mutable, tuples and strings are immutable.' },
    { question: 'Explain Python\'s context managers and the with statement.', topic: 'Context Managers', hint: 'Think about enter and exit dunder methods.' },
    { question: 'What are positional args and keyword kwargs in Python? When would you use them?', topic: 'Function Arguments', hint: 'args for positional, kwargs for keyword arguments.' },
  ],
  React: [
    { question: 'Explain the difference between controlled and uncontrolled components in React.', topic: 'Components', hint: 'Controlled components use state; uncontrolled use refs.' },
    { question: 'What is the Virtual DOM and how does React use it for efficient rendering?', topic: 'Virtual DOM', hint: 'Think about diffing and reconciliation.' },
    { question: 'Explain React hooks. What problem do useState and useEffect solve?', topic: 'React Hooks', hint: 'State and side effects in functional components.' },
    { question: 'What is the difference between useMemo and useCallback in React?', topic: 'Performance', hint: 'Both memoize — useMemo for values, useCallback for functions.' },
    { question: 'Explain the Context API in React. When would you use it over prop drilling?', topic: 'State Management', hint: 'Context avoids passing props through many component levels.' },
    { question: 'What is React.memo and when should you use it to optimize re-renders?', topic: 'Performance', hint: 'Prevents re-renders when props have not changed.' },
    { question: 'Explain the concept of lifting state up in React.', topic: 'State Management', hint: 'Move shared state to the closest common ancestor.' },
    { question: 'What are React keys and why are they important when rendering lists?', topic: 'Keys', hint: 'Keys help React identify which items have changed, added, or removed.' },
  ],
  'Node.js': [
    { question: 'Explain the Node.js event-driven architecture. How does it differ from multi-threaded servers?', topic: 'Architecture', hint: 'Single-threaded non-blocking I/O vs thread-per-request.' },
    { question: 'What is middleware in Express.js? Explain how an authentication middleware works.', topic: 'Middleware', hint: 'Functions with request, response, next signature.' },
    { question: 'Explain streams in Node.js. What are the four main types?', topic: 'Streams', hint: 'Readable, Writable, Duplex, Transform.' },
    { question: 'What is the difference between process.nextTick and setImmediate in Node.js?', topic: 'Event Loop', hint: 'nextTick runs before I/O; setImmediate runs after I/O.' },
    { question: 'How does Node.js handle CPU-intensive tasks without blocking the event loop?', topic: 'Performance', hint: 'Child processes, worker threads, or offloading to external services.' },
    { question: 'What is clustering in Node.js? How does it help scale application performance?', topic: 'Scaling', hint: 'Fork multiple processes to use all CPU cores.' },
  ],
  'SQL / Databases': [
    { question: 'Explain the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN with real-world examples.', topic: 'SQL Joins', hint: 'INNER returns matches; LEFT includes all from left table.' },
    { question: 'What is database normalization? Explain 1NF, 2NF, and 3NF.', topic: 'Normalization', hint: 'Each normal form eliminates a specific type of data redundancy.' },
    { question: 'What are database indexes? How do they improve query performance, and what are the trade-offs?', topic: 'Indexing', hint: 'Indexes speed reads but slow writes and use extra storage.' },
    { question: 'Explain ACID properties in database transactions.', topic: 'Transactions', hint: 'Atomicity, Consistency, Isolation, Durability.' },
    { question: 'What is the difference between SQL and NoSQL databases? When would you choose each?', topic: 'Database Types', hint: 'Consider schema flexibility, scalability, and consistency needs.' },
    { question: 'Explain what a query execution plan is and how you would use it to optimize slow database queries.', topic: 'Query Optimization', hint: 'Analyze execution trees to identify missing indexes or table scans.' },
  ],
  'Data Structures & Algorithms': [
    { question: 'Explain the difference between Breadth-First Search and Depth-First Search. When would you use each?', topic: 'Graph Traversal', hint: 'BFS uses a queue; DFS uses a stack or recursion.' },
    { question: 'What is dynamic programming? Explain the core concepts of memoization and tabulation.', topic: 'Dynamic Programming', hint: 'Top-down with cache versus bottom-up table building.' },
    { question: 'Explain binary search. What is its time complexity and under what condition can it be applied?', topic: 'Binary Search', hint: 'Array must be sorted. O(log n) time complexity.' },
    { question: 'What are hash tables? How do they handle collisions?', topic: 'Hash Tables', hint: 'Chaining vs open addressing for collision resolution.' },
    { question: 'Explain the difference between a stack and a queue. Give real-world software examples.', topic: 'Data Structures', hint: 'Stack: LIFO (function calls). Queue: FIFO (print queue).' },
    { question: 'What is the time complexity of quicksort in best, average, and worst cases?', topic: 'Sorting', hint: 'O(n log n) average, O(n²) worst case with bad pivot choice.' },
  ],
  Java: [
    { question: 'Explain the four pillars of Object-Oriented Programming in Java with practical examples.', topic: 'OOP', hint: 'Encapsulation, Inheritance, Polymorphism, Abstraction.' },
    { question: 'What is the difference between an interface and an abstract class in Java?', topic: 'Interfaces', hint: 'Interfaces define contracts; abstract classes share partial implementation.' },
    { question: 'Explain Java generics and their benefits for type safety.', topic: 'Generics', hint: 'Type safety at compile time, eliminates casting.' },
    { question: 'What is the Java memory model? Explain heap memory, stack memory, and garbage collection.', topic: 'Memory Management', hint: 'Stack for method frames; heap for objects; GC reclaims unused objects.' },
    { question: 'Explain the difference between ArrayList and LinkedList in Java.', topic: 'Collections', hint: 'ArrayList: O(1) random access; LinkedList: O(1) insertion/deletion.' },
    { question: 'What are Java streams? How do they differ from standard collections?', topic: 'Streams API', hint: 'Streams are lazy and functional; collections are eager data structures.' },
  ],
  'System Design Basics': [
    { question: 'How would you design a URL shortener like bit.ly? Walk me through your high-level architecture.', topic: 'System Design', hint: 'Consider hashing, redirection, database storage, and scaling.' },
    { question: 'Explain the CAP theorem. Can you give examples of distributed systems that favor CP vs AP?', topic: 'Distributed Systems', hint: 'Consistency, Availability, Partition Tolerance — pick 2.' },
    { question: 'What is horizontal scaling versus vertical scaling? When would you use each?', topic: 'Scalability', hint: 'Horizontal: more machines. Vertical: bigger machine.' },
    { question: 'Explain the role of a load balancer in a distributed system.', topic: 'Load Balancing', hint: 'Distribute traffic, provide failover, enable horizontal scaling.' },
    { question: 'What is caching? Explain common cache invalidation strategies.', topic: 'Caching', hint: 'TTL, write-through, write-back, cache-aside patterns.' },
    { question: 'How would you design a real-time notification system that handles millions of users?', topic: 'System Design', hint: 'Consider message queues, push vs pull, fan-out patterns.' },
  ],
};

const GENERIC_QUESTIONS = [
  { question: 'Describe a challenging technical problem you solved recently. What was your approach?', topic: 'Problem Solving', hint: 'Use the STAR method: Situation, Task, Action, Result.' },
  { question: 'How do you stay updated with the latest developments in software engineering?', topic: 'Learning', hint: 'Mention technical publications, open source, and hands-on practice.' },
  { question: 'Explain the concept of clean code. What principles do you follow?', topic: 'Code Quality', hint: 'Think SOLID, DRY, and KISS principles.' },
  { question: 'How do you approach debugging a complex production issue you have never seen before?', topic: 'Debugging', hint: 'Mention log analysis, monitoring metrics, reproducing, and bisecting.' },
  { question: 'What is the difference between unit testing, integration testing, and end-to-end testing?', topic: 'Testing', hint: 'Scope, execution speed, and isolation level.' },
  { question: 'Explain what REST is. What makes an API RESTful?', topic: 'API Design', hint: 'Statelessness, resource-based URIs, and standard HTTP verbs.' },
  { question: 'How do you handle technical debt in a codebase?', topic: 'Engineering Practices', hint: 'Prioritization, refactoring, documentation, and team alignment.' },
  { question: 'What is microservices architecture? What are its primary advantages and trade-offs?', topic: 'Architecture', hint: 'Independent deployability, fault isolation, network complexity.' },
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
    const q = generic[0];
    return { source: 'fallback', ...q, question: (q.question || '').replace(/`/g, '') };
  }
  const q = state.pool[state.used];
  state.used += 1;
  return { source: 'fallback', ...q, question: (q.question || '').replace(/`/g, '') };
}

/**
 * Generate the FIRST interview question dynamically.
 * MUST always greet the candidate, ask them to introduce themselves,
 * and ask them to share one project they feel most confident in.
 * Strictly plain English, no code blocks or backticks.
 */
export const generateOpeningQuestion = async ({ role, topic, difficulty, owner, candidateName = 'Candidate', sessionId = 'default' }) => {
  const knowledge = await buildKnowledgeContext(`${role} ${topic} introduction`, owner);
  const prompt = `You are a senior technical interviewer opening a live voice mock interview for a candidate targeting the role: "${role}" (topic: "${topic}").

Generate the FIRST introductory question for the interview.
STRICT MANDATORY REQUIREMENTS:
1. Greet the candidate professionally for their "${role}" interview in "${topic}".
2. Ask them to INTRODUCE THEMSELVES and TELL YOU ABOUT ONE PROJECT they have built or feel most confident about.
3. NO CODE BLOCKS OR CODE SNIPPETS: Do NOT include backticks (\`\` \` \`\`), code blocks, syntax symbols, or code snippets. Write purely in clean, natural, spoken plain English suitable for voice text-to-speech.

Respond ONLY with valid JSON:
{
  "question": "The spoken introductory question asking for self-introduction and their best project",
  "topic": "Introduction & Project Overview",
  "hint": "Give a concise 60-90 second introduction covering your background, role focus, and a project you feel confident in."
}`;

  const raw = await callGemini(prompt, { temperature: 0.7, timeoutMs: 2000 });
  const parsed = parseAIJson(raw);
  if (parsed && parsed.question) {
    const cleanQuestion = String(parsed.question).replace(/```[\s\S]*?```/g, '').replace(/`/g, '').trim();
    return {
      source: 'ai-live',
      ...parsed,
      question: cleanQuestion || parsed.question,
    };
  }

  // Fallback opening
  return {
    source: 'fallback',
    question: `Welcome to your ${role} interview focusing on ${topic}. To get started, please introduce yourself and tell me about one project you have built or feel most confident about.`,
    topic: 'Introduction & Project Overview',
    hint: 'Briefly state your background, role focus, and describe a project you built.',
  };
};

/**
 * Generate a follow-up question given conversation history.
 * Adaptively increases or decreases difficulty based on candidate score & confidence.
 * Strictly plain English, no code blocks or backticks.
 */
export const generateFollowUpQuestion = async ({
  role,
  topic,
  difficulty,
  owner,
  priorQa = [],
  evaluationHistory = [],
  askedTopics = [],
  sessionId = 'default'
}) => {
  const evals = evaluationHistory && evaluationHistory.length > 0
    ? evaluationHistory
    : priorQa.map(q => ({ question: q.question, answer: q.answer, score: q.score }));

  const lastEval = evals.length > 0 ? evals[evals.length - 1] : null;
  const lastScore = lastEval ? (lastEval.score ?? 5) : 5;

  let adaptiveStrategy = "";
  if (lastScore >= 8) {
    adaptiveStrategy = `ADAPTIVE DIFFICULTY: HIGH / ADVANCED.
The candidate gave a strong, accurate, and confident answer to the previous question (scored ${lastScore}/10).
INCREASE THE TOUGHNESS & DEPTH for this next question. Ask about advanced internals, edge cases, system architecture, performance optimization, or complex trade-offs within "${topic}".`;
  } else if (lastScore >= 5) {
    adaptiveStrategy = `ADAPTIVE DIFFICULTY: INTERMEDIATE.
The candidate gave a satisfactory answer (scored ${lastScore}/10).
Maintain a solid intermediate level with a practical scenario-based follow-up question in "${topic}".`;
  } else {
    adaptiveStrategy = `ADAPTIVE DIFFICULTY: FOUNDATIONAL.
The candidate struggled with the previous question (scored ${lastScore}/10).
Ask a clearer, fundamental concept question related to "${topic}" to assess core understanding before advancing.`;
  }

  const lastQaSummary = evals.slice(-3).map(
    (e, i) => `Q${i + 1}: ${e.question}\nCandidate Answer: ${e.answer || '(no answer)'}\nEvaluation Score: ${e.score ?? 'N/A'}/10`
  ).join('\n\n');

  const usedTopics = askedTopics.filter(Boolean).map((t) => `"${t}"`).join(', ');
  const knowledge = await buildKnowledgeContext(`${role} ${topic} next question`, owner);

  const prompt = `You are a senior technical interviewer continuing a live voice mock interview for role "${role}" (topic: "${topic}").

${adaptiveStrategy}

Knowledge base context:
${knowledge || 'No knowledge base provided.'}

Recent candidate answers:
${lastQaSummary || 'No prior questions yet.'}

Topics/questions already covered (do NOT repeat these): ${usedTopics || 'None'}

STRICT FORMATTING AND ADAPTIVE RULES:
1. NO CODE BLOCKS OR CODE SNIPPETS: Do NOT include backticks (\`\` \` \`\`), code blocks, syntax symbols, or programming code snippets in the question. Write purely in clean, natural, spoken plain English that can be read out loud easily.
2. ADAPTIVE TOUGHNESS: Match the adaptive difficulty strategy specified above based on how well the candidate answered previous questions.
3. TOPIC RELEVANCE: The question MUST be 100% relevant to "${topic}".
4. VERBAL ANSWERABLE: Must be answerable conceptually in ~90 seconds verbally.

Respond ONLY with valid JSON:
{
  "question": "The full plain-text spoken question without any code blocks or backticks",
  "topic": "a concise topic label",
  "hint": "a one-line guiding hint"
}`;

  const raw = await callGemini(prompt, { temperature: 0.7, timeoutMs: 2200 });
  const parsed = parseAIJson(raw);
  if (parsed && parsed.question) {
    const cleanQuestion = String(parsed.question).replace(/```[\s\S]*?```/g, '').replace(/`/g, '').trim();
    return {
      source: 'ai-live',
      ...parsed,
      question: cleanQuestion || parsed.question,
    };
  }

  // Gemini unavailable — use fallback question bank
  console.info(`[Interview AI] Gemini unavailable — using fallback question for topic: ${topic}`);
  const fallback = pickFallbackQuestion(sessionId, topic, askedTopics);
  if (fallback && fallback.question) {
    fallback.question = String(fallback.question).replace(/`/g, '');
  }
  return fallback;
};

/**
 * Evaluate a candidate answer and produce per-question feedback + score.
 * Enforces strict zero-score policy for incorrect, fake, off-topic, or gibberish answers.
 */
export const evaluateAnswer = async ({ role, topic, question, answer, owner, difficulty }) => {
  const knowledge = await buildKnowledgeContext(`${topic} ${question}`, owner);
  const prompt = `You are an uncompromising senior technical interviewer evaluating a candidate's answer for role "${role}" (topic: "${topic}", difficulty: ${difficulty}).

QUESTION ASKED:
${question}

CANDIDATE ANSWER:
${answer || '(Candidate did not provide an answer)'}

Reference knowledge context:
${knowledge || 'No reference knowledge provided.'}

STRICT UNCOMPROMISING EVALUATION RULES:
1. QUESTION ECHOING / CIRCULAR / VAGUE ANSWERS ARE FAILING (0-2 MARKS):
   - Merely repeating words from the question (e.g. repeating "garbage collection in JavaScript") WITHOUT explaining the actual working mechanisms, algorithms, syntax, or concepts MUST BE SCORED 0 OR AT MOST 2 OUT OF 10.
   - Do NOT give 6-10 marks for vague, circular, or hand-wavy filler sentences like "it takes default values and maintains it properly".

2. STRICT ZERO SCORE FOR WRONG / FAKE / GIBBERISH / OFF-TOPIC ANSWERS:
   - If the candidate's answer is wrong, factually incorrect, fake, off-topic, gibberish, filler text (e.g., "asdf", "test", "idk", "blah blah", random words), or fails to provide technically accurate facts:
     YOU MUST SCORE 0 OUT OF 10.
   - Do NOT award partial credit or participation points for word count alone if the technical content is wrong, fake, or vague!

3. ACCURATE TECHNICAL ANSWERS ONLY:
   - ONLY award good marks (7-10) if the candidate provided verified, precise, and correct technical facts directly answering "${question}".
   - 0-2: Wrong, fake, gibberish, circular, question-echoing, or vague filler answer.
   - 3-5: Partially correct attempt with noticeable technical gaps.
   - 6-8: Solid, correct technical answer explaining core mechanisms.
   - 9-10: Complete, precise, and highly accurate technical answer.

Respond ONLY with valid JSON:
{
  "score": <number 0-10>,
  "technical": <number 0-10>,
  "communication": <number 0-10>,
  "confidence": <number 0-10>,
  "feedback": "Explicit 2-3 sentence technical critique explaining why the answer was correct or why it received low/0 marks.",
  "modelAnswer": "3-4 concise technical key points the candidate should cover for THIS specific question. DO NOT repeat or quote the question.",
  "isCorrectDirection": true|false
}`;

  const raw = await callGemini(prompt, { temperature: 0.2 });
  const parsed = parseAIJson(raw);

  if (parsed && typeof parsed.score === 'number') {
    // Extra safety: force 0 scores if Gemini set score to 0 or marked non-directional
    const isZero = parsed.score === 0 || (!parsed.isCorrectDirection && parsed.score <= 2);
    let cleanModelAns = (parsed.modelAnswer || '').trim();
    if (question && cleanModelAns.includes(question)) {
      cleanModelAns = cleanModelAns.replace(question, '').replace(/["“”'']/g, '').trim();
    }
    cleanModelAns = cleanModelAns
      .replace(/^a\s+(proper|technical|correct|gold-standard)\s+answer\s+to\s+.*?\s+covering/i, 'Key concepts:')
      .replace(/^a\s+(proper|technical|correct|gold-standard)\s+response\s+should\s+explain/i, 'Key concepts:')
      .replace(/^a\s+proper\s+technical\s+answer\s+to\b/i, 'Key concepts:')
      .trim();

    return {
      source: 'ai-live',
      score: isZero ? 0 : Math.min(10, Math.max(0, parsed.score)),
      technical: isZero ? 0 : (parsed.technical ?? parsed.score),
      communication: isZero ? 0 : (parsed.communication ?? parsed.score),
      confidence: isZero ? 0 : (parsed.confidence ?? parsed.score),
      feedback: parsed.feedback || (isZero ? "Incorrect or invalid answer. 0 marks awarded." : "Answer evaluated."),
      modelAnswer: cleanModelAns || `Core concepts in ${topic}, key principles, and practical application.`,
      isCorrectDirection: !isZero && Boolean(parsed.isCorrectDirection),
    };
  }

  // Fallback: strict semantic heuristic validation
  const cleanAns = (answer || '').trim().toLowerCase();
  const words = cleanAns.split(/\s+/).filter(Boolean);
  const cleanText = cleanAns.replace(/[^a-z0-9\s]/g, '');

  const fakePatterns = [
    /^(asdf|qwerty|zxcv|test|abc|xyz|123|bla|blah|idk|dont know|don't know|fake|fake answer|no idea|random|whatever|hello)+$/i,
    /^(.)\1{3,}$/i,
  ];

  const isFakeOrShort = words.length < 5 || fakePatterns.some((p) => p.test(cleanAns));

  if (isFakeOrShort) {
    return {
      source: 'fallback',
      score: 0,
      technical: 0,
      communication: 0,
      confidence: 0,
      feedback: 'Incorrect / Invalid Answer: No valid technical response was provided. 0 marks awarded.',
      modelAnswer: `Key concepts for "${question || topic}": Explain core architecture, exact execution mechanism, relevant methods/APIs, and production best practices.`,
      isCorrectDirection: false,
    };
  }

  // Build question stop-words to eliminate echo matching
  const stopWords = new Set(['explain', 'what', 'how', 'does', 'difference', 'between', 'with', 'example', 'when', 'would', 'using', 'concept', 'about', 'tell', 'your', 'self', 'the', 'and', 'for', 'work', 'in', 'is', 'are', 'a', 'an']);
  const questionWords = new Set(
    `${topic || ''} ${question || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );

  // Extract candidate answer words that are NOT merely repeating the question prompt
  const answerWords = cleanText.split(/\s+/).filter((w) => w.length >= 4 && !stopWords.has(w));
  const newTechnicalWords = answerWords.filter((w) => !questionWords.has(w));

  // If candidate answer provides NO new technical terms outside the question prompt, score 0 or 1
  if (newTechnicalWords.length < 2 && words.length < 25) {
    const qSnippet = (question || topic || 'this question').trim();
    return {
      source: 'fallback',
      score: 0,
      technical: 0,
      communication: 0,
      confidence: 0,
      feedback: `Incorrect / Vague Answer: The response for "${qSnippet}" merely repeated question terms without introducing valid technical explanation. 0 marks awarded.`,
      modelAnswer: `Key concepts for "${qSnippet}": Explain the core architecture, exact execution mechanism, relevant methods/APIs, and production best practices.`,
      isCorrectDirection: false,
    };
  }

  const baseScore = newTechnicalWords.length >= 6 ? 7 : newTechnicalWords.length >= 3 ? 4 : 2;
  const qSnippet = (question || topic || 'this question').trim();

  return {
    source: 'fallback',
    score: baseScore,
    technical: baseScore,
    communication: baseScore > 0 ? Math.min(10, baseScore + 1) : 0,
    confidence: baseScore,
    feedback: baseScore >= 7
      ? `Solid response answering "${qSnippet}". The explanation introduces genuine technical terms and concepts well.`
      : baseScore >= 4
      ? `Partial answer for "${qSnippet}". Essential terms were mentioned but lacked full technical depth and exact mechanisms.`
      : `Vague or incomplete answer for "${qSnippet}". The response lacks accurate technical details. ${baseScore} marks awarded.`,
    modelAnswer: `Key concepts for "${qSnippet}": Explain the core architecture, exact execution mechanism, relevant methods/APIs, and production best practices.`,
    isCorrectDirection: baseScore >= 5,
  };
};

/**
 * Generate the final scorecard + improvement plan including Confidence Level.
 * Enforces zero overall score if candidate provided wrong/fake answers.
 */
export const generateScorecard = async ({ role, topic, evaluationHistory }) => {
  if (!evaluationHistory || evaluationHistory.length === 0) {
    return {
      source: 'computed',
      overallScore: 0,
      technical: 0,
      problemSolving: 0,
      communication: 0,
      confidence: 0,
      confidenceLevel: 'Low Confidence (0%)',
      grade: 'Needs Improvement',
      feedback: 'You did not answer any questions. Please participate to receive an evaluation.',
      strengths: ['None'],
      improvementAreas: ['Attempt all questions in the interview'],
      recommendedTopics: [topic],
      readiness: 'Not ready'
    };
  }

  const transcript = evaluationHistory
    .map((e, i) => `Q${i + 1} [${e.topic}]: ${e.question}\nA: ${e.answer}\nScore: ${e.score}/10\nConfidence: ${e.confidence ?? e.score}/10\nFeedback: ${e.feedback}`)
    .join('\n\n');

  const prompt = `You are a strict interview panel lead producing the final report for a mock interview for role "${role}" (scope "${topic}").

PER-QUESTION EVALUATIONS:
${transcript}

STRICT SCORECARD MANDATE:
- overallScore MUST be the exact average of individual question scores × 10.
- If all or most question scores are 0 (due to wrong/fake/invalid answers), overallScore MUST BE 0%, technical MUST BE 0%, confidence MUST BE 0%, grade MUST BE "Needs Improvement", and strengths MUST BE ["None - Incorrect or invalid technical responses provided"].
- Do NOT inflate scores or give courtesy marks for incorrect/fake answers.

Compute the final scorecard and respond ONLY with valid JSON:
{
  "overallScore": <number 0-100>,
  "technical": <number 0-100>,
  "problemSolving": <number 0-100>,
  "communication": <number 0-100>,
  "confidence": <number 0-100>,
  "confidenceLevel": "High Confidence|Moderate Confidence|Needs Work",
  "grade": "Excellent|Good|Average|Needs Improvement",
  "feedback": "overall 3-4 sentence evaluation, be specific about what went wrong",
  "strengths": ["...", "..."],
  "improvementAreas": ["...", "..."],
  "recommendedTopics": ["...", "..."],
  "readiness": "Interview Readiness Summary text"
}`;

  const raw = await callGemini(prompt, { temperature: 0.3 });
  const parsed = parseAIJson(raw);

  if (parsed && typeof parsed.overallScore === 'number') {
    const avg = evaluationHistory.reduce((a, e) => a + (e.score || 0), 0) / evaluationHistory.length;
    const isZeroAll = avg === 0;
    return {
      source: 'ai-live',
      overallScore: isZeroAll ? 0 : parsed.overallScore,
      technical: isZeroAll ? 0 : parsed.technical,
      communication: isZeroAll ? 0 : parsed.communication,
      problemSolving: isZeroAll ? 0 : parsed.problemSolving,
      confidence: isZeroAll ? 0 : (typeof parsed.confidence === 'number' ? parsed.confidence : parsed.overallScore),
      confidenceLevel: isZeroAll ? 'Low Confidence (0%)' : parsed.confidenceLevel,
      grade: isZeroAll ? 'Needs Improvement' : parsed.grade,
      strengths: isZeroAll ? ['None - Incorrect or invalid responses provided'] : parsed.strengths,
      improvementAreas: parsed.improvementAreas || [topic],
      recommendedTopics: parsed.recommendedTopics || [topic],
      feedback: parsed.feedback,
      readiness: isZeroAll ? 'Not Ready - 0% score awarded due to incorrect or fake answers.' : parsed.readiness,
    };
  }

  // Fallback computed scorecard
  const avg = evaluationHistory.reduce((a, e) => a + (e.score || 0), 0) / evaluationHistory.length;
  const overallScore = Math.round(avg * 10);
  const confidence = overallScore === 0 ? 0 : Math.min(100, Math.round((avg * 9) + 10));
  const confidenceLevel = confidence >= 75 ? 'High Confidence' : confidence >= 50 ? 'Moderate Confidence' : 'Low Confidence (0%)';
  const grade = avg >= 8 ? 'Excellent' : avg >= 6 ? 'Good' : avg >= 4 ? 'Average' : 'Needs Improvement';

  return {
    source: 'fallback',
    overallScore,
    technical: overallScore,
    communication: overallScore === 0 ? 0 : Math.min(100, overallScore + 5),
    problemSolving: overallScore === 0 ? 0 : Math.max(0, overallScore - 5),
    confidence,
    confidenceLevel,
    grade,
    feedback: overallScore === 0
      ? `Evaluation Failed: All ${evaluationHistory.length} answers provided were incorrect or invalid. 0 marks awarded.`
      : `You answered ${evaluationHistory.length} question${evaluationHistory.length !== 1 ? 's' : ''} with an average score of ${avg.toFixed(1)}/10. ${grade === 'Excellent' ? 'Outstanding performance!' : grade === 'Good' ? 'Good performance overall.' : 'Keep practising to improve your technical depth.'}`,
    strengths: overallScore === 0 ? ['None - Incorrect or invalid technical responses provided'] : avg >= 5 ? ['Attempted questions', 'Shows foundational understanding'] : ['Participated in interview'],
    improvementAreas: overallScore === 0 ? [`Study core concepts in ${topic}`, 'Provide accurate technical explanations', 'Avoid entering fake or random answers'] : avg < 7 ? ['Provide more detailed technical explanations', 'Use concrete examples'] : ['Deepen knowledge in advanced topics'],
    recommendedTopics: [topic, 'System Design Basics', 'Data Structures & Algorithms'].slice(0, 3),
    readiness: overallScore === 0 ? 'Not Ready - 0% score awarded due to incorrect or fake answers.' : avg >= 7 ? 'You appear ready for entry-level interviews. Keep practising!' : 'Continue studying and mock interviews before applying.',
  };
};

export const processinterviewAI = async (inputData) => {
  return { status: 'processed', inputData };
};

