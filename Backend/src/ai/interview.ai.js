import { generateText, generateJSON, describeProvider } from './aiClient.js';
import { retrieveContext } from '../services/rag/rag.service.js';

export async function callGemini(prompt, { temperature = 0.7, timeoutMs = 20000, maxTokens = 450 } = {}) {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timeout')), timeoutMs)
    );
    return await Promise.race([
      generateText(prompt, { temperature, maxTokens }),
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

export function pickFallbackQuestion(sessionId, topic, askedTopics) {
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
 * Live time of day greeting helper (India IST / client local hour).
 * Good morning: 04:00 - 11:59
 * Good afternoon: 12:00 - 16:59
 * Good evening: 17:00 - 03:59
 */
export function getLiveTimeGreeting(clientHour = null) {
  let hour = typeof clientHour === 'number' && !isNaN(clientHour) ? clientHour : null;
  if (hour === null) {
    try {
      const now = new Date();
      hour = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours();
    } catch {
      hour = new Date().getHours();
    }
  }

  if (hour >= 4 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Generate the FIRST interview question dynamically.
 * MUST always greet the candidate using the live time greeting (Good morning/afternoon/evening),
 * ask them to introduce themselves, and ask them to share one project they feel most confident in.
 * Strictly plain English, no code blocks or backticks.
 */
export const generateOpeningQuestion = async ({ role, topic, difficulty, owner, candidateName = 'Candidate', sessionId = 'default', clientHour = null }) => {
  const timeGreeting = getLiveTimeGreeting(clientHour);
  const knowledge = await buildKnowledgeContext(`${role} ${topic} introduction`, owner);
  const prompt = `You are a senior technical interviewer opening a live voice mock interview for a candidate targeting the role: "${role}" (topic: "${topic}").

Generate the FIRST introductory question for the interview.
STRICT MANDATORY REQUIREMENTS:
1. LIVE TIME GREETING: You MUST start your opening greeting strictly with "${timeGreeting}!" (e.g. "${timeGreeting}! Welcome to your ${role} interview in ${topic}..."). DO NOT say any other time greeting (e.g. NEVER say "Good morning" if current greeting is "${timeGreeting}").
2. Ask them to INTRODUCE THEMSELVES and TELL YOU ABOUT ONE PROJECT they have built or feel most confident about.
3. NO CODE BLOCKS OR CODE SNIPPETS: Do NOT include backticks (\`\` \` \`\`), code blocks, syntax symbols, or code snippets. Write purely in clean, natural, spoken plain English suitable for voice text-to-speech.

Respond ONLY with valid JSON:
{
  "question": "${timeGreeting}! Welcome to your ${role} interview focusing on ${topic}. To get started, please introduce yourself and tell me about one project you have built or feel most confident about.",
  "topic": "Introduction & Project Overview",
  "hint": "Give a concise 60-90 second introduction covering your background, role focus, and a project you feel confident in."
}`;

  try {
    const raw = await callGemini(prompt, { temperature: 0.6, timeoutMs: 8000 });
    const parsed = parseAIJson(raw);
    if (parsed && parsed.question) {
      let cleanQuestion = String(parsed.question).replace(/```[\s\S]*?```/g, '').replace(/`/g, '').trim();
      // Enforce live dynamic time greeting strictly on the returned text
      cleanQuestion = cleanQuestion.replace(/^(good\s+(morning|afternoon|evening|day)[!,.]?\s*)/i, `${timeGreeting}! `);
      if (!cleanQuestion.toLowerCase().startsWith('good')) {
        cleanQuestion = `${timeGreeting}! ${cleanQuestion}`;
      }
      return {
        source: 'ai-live',
        ...parsed,
        question: cleanQuestion || parsed.question,
      };
    }
  } catch (err) {
    console.warn('[Interview AI] generateOpeningQuestion error:', err.message);
  }

  // Fallback opening strictly honoring current time of day
  return {
    source: 'fallback',
    question: `${timeGreeting}! Welcome to your ${role} interview focusing on ${topic}. To get started, please introduce yourself and tell me about one project you have built or feel most confident about.`,
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

  try {
    const raw = await callGemini(prompt, { temperature: 0.7, timeoutMs: 8000 });
    const parsed = parseAIJson(raw);
    if (parsed && parsed.question) {
      const cleanQuestion = String(parsed.question).replace(/```[\s\S]*?```/g, '').replace(/`/g, '').trim();
      return {
        source: 'ai-live',
        ...parsed,
        question: cleanQuestion || parsed.question,
      };
    }
  } catch (err) {
    console.warn('[Interview AI] generateFollowUpQuestion error:', err.message);
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
  const prompt = `You are a strict, top-tier technical interviewer (Staff Software Engineer level) evaluating a candidate's answer for role "${role}" (topic: "${topic}", difficulty: ${difficulty}).

QUESTION ASKED:
${question}

CANDIDATE ANSWER:
${answer || '(Candidate did not provide an answer)'}

Reference knowledge context:
${knowledge || 'No reference knowledge provided.'}

STRICT, UNCOMPROMISING EVALUATION POLICY:
1. ABSOLUTE ZERO MARKS (0/10) FOR VAGUE, WRONG, OR CIRCULAR RESPONSES:
   - "I don't know", "I am not sure", "I forgot", blank responses, personal comments, chit-chat, or random filler: SCORE 0/10.
   - Statements that are factually wrong, confusing fundamental concepts, or describing an unrelated technology: SCORE 0/10.
   - VAGUE, SUPERFICIAL, BUZZWORD-HEAVY, OR REPEATING THE QUESTION: SCORE 0/10 (at most 1/10).
   - Example of VAGUE/BUZZWORD answers that MUST RECEIVE 0 MARKS:
     * "It is used in website development to make code fast and components easy." -> SCORE 0/10.
     * "It helps to build apps and manage data cleanly in project." -> SCORE 0/10.
     * "It is a very good feature that everyone uses for optimization." -> SCORE 0/10.
2. GENUINE ANSWERS ONLY GET PASSING MARKS (>= 5/10):
   - You MUST ONLY award passing marks (5 or above) if the candidate explicitly explains the real internal mechanics, syntax, lifecycle, algorithms, or architectural implementation.
   - If the answer has minor technical substance but is mostly vague: SCORE 1 or 2/10.
3. SCORING RUBRIC (0-10):
   - 0: Completely wrong, vague, marketing buzzwords, evasive, circular, prompt-repeating, or empty answer.
   - 1-2: Barely attempted, superficial, major technical misconceptions.
   - 3-4: Very surface-level, significant technical gaps, or confused terminology.
   - 5-6: Acceptable foundational answer covering basics with minor omissions.
   - 7-8: Solid, technically accurate answer clearly explaining working mechanisms.
   - 9-10: Complete, precise, in-depth architectural or engineering response.
4. FEEDBACK:
   - Must be a direct, sharp, professional 2-3 sentence technical critique explaining precisely WHAT was missing, WHAT was incorrect, and why it received 0/low marks.

Respond ONLY with valid JSON:
{
  "score": <number 0-10>,
  "technical": <number 0-10>,
  "communication": <number 0-10>,
  "confidence": <number 0-10>,
  "feedback": "Explicit 2-3 sentence technical critique explaining why the answer was correct or why it received 0/low marks.",
  "modelAnswer": "3-4 concise technical key points the candidate should cover for THIS specific question. DO NOT repeat or quote the question.",
  "isCorrectDirection": true|false
}`;

  try {
    const raw = await callGemini(prompt, { temperature: 0.15, timeoutMs: 20000 });
    const parsed = parseAIJson(raw);

    if (parsed && typeof parsed.score === 'number') {
      const isIncorrectOrVague = !parsed.isCorrectDirection || parsed.score <= 2 || (parsed.technical ?? parsed.score) <= 2;
      const finalScore = isIncorrectOrVague ? Math.min(1, parsed.score) : Math.min(10, Math.max(0, parsed.score));
      const rawModelAnswer = Array.isArray(parsed.modelAnswer)
        ? parsed.modelAnswer.join('. ')
        : String(parsed.modelAnswer || '');
      let cleanModelAns = rawModelAnswer.trim();
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
        score: finalScore,
        technical: isIncorrectOrVague ? 0 : (parsed.technical ?? finalScore),
        communication: isIncorrectOrVague ? Math.min(2, parsed.communication ?? 1) : (parsed.communication ?? finalScore),
        confidence: isIncorrectOrVague ? Math.min(2, parsed.confidence ?? 1) : (parsed.confidence ?? finalScore),
        feedback: parsed.feedback || (isIncorrectOrVague ? "Vague / Incorrect: Answer lacks required technical depth or is factually inaccurate. 0 marks awarded." : "Answer evaluated."),
        modelAnswer: cleanModelAns || `Core concepts in ${topic}, key principles, and practical application.`,
        isCorrectDirection: !isIncorrectOrVague,
      };
    }
  } catch (err) {
    console.warn('[Interview AI] evaluateAnswer AI call failed, falling back to heuristic evaluation:', err.message);
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
      feedback: 'Incorrect / Incomplete: No valid technical response provided. 0 marks awarded.',
      modelAnswer: `Key concepts for "${question || topic}": Explain core architecture, exact execution mechanism, relevant methods/APIs, and production best practices.`,
      isCorrectDirection: false,
    };
  }

  // Build question stop-words to eliminate echo matching
  const stopWords = new Set(['explain', 'what', 'how', 'does', 'difference', 'between', 'with', 'example', 'when', 'would', 'using', 'concept', 'about', 'tell', 'your', 'self', 'the', 'and', 'for', 'work', 'in', 'is', 'are', 'a', 'an', 'to', 'of', 'it', 'used', 'make', 'fast', 'easy']);
  const questionWords = new Set(
    `${topic || ''} ${question || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );

  const answerWords = cleanText.split(/\s+/).filter((w) => w.length >= 4 && !stopWords.has(w));
  const newTechnicalWords = answerWords.filter((w) => !questionWords.has(w));

  const qSnippet = (question || topic || 'this question').trim();

  // If candidate answer provides very few new technical terms outside the question prompt, score strictly 0
  if (newTechnicalWords.length < 5 || words.length < 15) {
    return {
      source: 'fallback',
      score: 0,
      technical: 0,
      communication: 1,
      confidence: 1,
      feedback: `Vague / Superficial: The response for "${qSnippet}" lacked essential technical mechanics, syntax, and accuracy. 0 marks awarded.`,
      modelAnswer: `Key concepts for "${qSnippet}": Explain the core architecture, exact execution mechanism, relevant methods/APIs, and production best practices.`,
      isCorrectDirection: false,
    };
  }

  // Only award solid marks if there is genuine length AND multiple domain keywords
  const baseScore = newTechnicalWords.length >= 10 && words.length >= 35 ? 6 : newTechnicalWords.length >= 6 ? 4 : 2;

  return {
    source: 'fallback',
    score: baseScore,
    technical: baseScore,
    communication: Math.min(10, baseScore + 1),
    confidence: baseScore,
    feedback: baseScore >= 5
      ? `Partially acceptable response for "${qSnippet}". Essential terms were mentioned, but deeper architectural explanation is needed.`
      : `Incomplete / Weak answer for "${qSnippet}". The response lacks technical specifics. ${baseScore} marks awarded.`,
    modelAnswer: `Key concepts for "${qSnippet}": Explain the core architecture, exact execution mechanism, relevant methods/APIs, and production best practices.`,
    isCorrectDirection: baseScore >= 5,
  };
};

/**
 * Generate the final scorecard + improvement plan including Confidence Level.
 * Strictly reflects candidate answers and avoids grade inflation.
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
      feedback: 'You did not answer any questions in this interview session. Please participate to receive an evaluation.',
      strengths: ['None - No questions attempted'],
      improvementAreas: ['Attempt all technical questions in the mock interview'],
      recommendedTopics: [topic],
      readiness: 'Not Ready - No evaluation data available.',
    };
  }

  const avg = evaluationHistory.reduce((a, e) => a + (e.score || 0), 0) / evaluationHistory.length;
  const trueOverall = Math.round(avg * 10);
  const isFailing = trueOverall < 50;

  const transcript = evaluationHistory
    .map((e, i) => `Q${i + 1} [${e.topic || topic}]: ${e.question}\nA: ${e.answer || '(no answer)'}\nScore: ${e.score}/10\nFeedback: ${e.feedback}`)
    .join('\n\n');

  const prompt = `You are a strict technical interview panel lead producing the final performance scorecard for role "${role}" (scope: "${topic}").

PER-QUESTION EVALUATIONS:
${transcript}

MANDATORY GRADING RULES:
1. OVERALL SCORE STRICTNESS:
   - The overall score MUST be exactly ${trueOverall}% (the mathematical average of question scores × 10). Do NOT inflate this score!
2. HONEST EVALUATION:
   - If the candidate scored poorly (<50%):
     - Grade MUST BE "Needs Improvement".
     - Strengths MUST NOT invent praise or claim they demonstrated mastery! If all answers were weak, strengths MUST be ["Attempted interview drill session"].
     - Areas to improve MUST explicitly call out the specific technical shortcomings from the questions above.
     - Feedback MUST be a direct, constructive 3-4 sentence critique explaining where they fell short and what must be studied.
   - If candidate scored 70%+:
     - Grade can be "Good" (70-84%) or "Excellent" (85%+).

Compute the final scorecard and respond ONLY with valid JSON:
{
  "overallScore": ${trueOverall},
  "technical": <number 0-100>,
  "problemSolving": <number 0-100>,
  "communication": <number 0-100>,
  "confidence": <number 0-100>,
  "confidenceLevel": "High Confidence|Moderate Confidence|Needs Work",
  "grade": "${isFailing ? 'Needs Improvement' : trueOverall >= 80 ? 'Excellent' : 'Good'}",
  "feedback": "Honest 3-4 sentence technical assessment detailing performance and gaps",
  "strengths": ["...", "..."],
  "improvementAreas": ["...", "..."],
  "recommendedTopics": ["...", "..."],
  "readiness": "Specific readiness summary"
}`;

  try {
    const raw = await callGemini(prompt, { temperature: 0.2, timeoutMs: 25000 });
    const parsed = parseAIJson(raw);

    if (parsed && typeof parsed.overallScore === 'number') {
      return {
        source: 'ai-live',
        overallScore: trueOverall,
        technical: isFailing ? Math.min(trueOverall, parsed.technical ?? trueOverall) : (parsed.technical ?? trueOverall),
        communication: isFailing ? Math.min(50, parsed.communication ?? trueOverall) : (parsed.communication ?? trueOverall),
        problemSolving: isFailing ? Math.min(trueOverall, parsed.problemSolving ?? trueOverall) : (parsed.problemSolving ?? trueOverall),
        confidence: isFailing ? Math.min(40, parsed.confidence ?? trueOverall) : (parsed.confidence ?? trueOverall),
        confidenceLevel: trueOverall >= 75 ? 'High Confidence' : trueOverall >= 50 ? 'Moderate Confidence' : 'Needs Work (Low)',
        grade: isFailing ? 'Needs Improvement' : (parsed.grade || (trueOverall >= 80 ? 'Excellent' : 'Good')),
        strengths: isFailing
          ? (trueOverall === 0 ? ['None - Answers provided were incorrect or invalid'] : ['Attempted interview drill session'])
          : (parsed.strengths && parsed.strengths.length > 0 ? parsed.strengths : ['Solid foundational understanding']),
        improvementAreas: parsed.improvementAreas || [`Review core principles in ${topic}`, 'Provide deeper technical explanations with syntax'],
        recommendedTopics: parsed.recommendedTopics || [topic, 'System Design Basics', 'Data Structures & Algorithms'].slice(0, 3),
        feedback: parsed.feedback || `Candidate scored ${trueOverall}%. Technical answers lacked required depth in ${topic}.`,
        readiness: isFailing
          ? `Not Interview Ready (${trueOverall}% score). Deep technical preparation required before attending live industry interviews.`
          : (parsed.readiness || 'Ready for entry-level technical interviews. Continue practicing.'),
      };
    }
  } catch (err) {
    console.warn('[Interview AI] generateScorecard AI call failed, using fallback scorecard:', err.message);
  }

  // Fallback computed scorecard
  return {
    source: 'fallback',
    overallScore: trueOverall,
    technical: trueOverall,
    communication: trueOverall === 0 ? 0 : Math.min(100, trueOverall + 5),
    problemSolving: trueOverall === 0 ? 0 : Math.max(0, trueOverall - 5),
    confidence: trueOverall === 0 ? 0 : Math.min(100, Math.round((avg * 9) + 5)),
    confidenceLevel: trueOverall >= 75 ? 'High Confidence' : trueOverall >= 50 ? 'Moderate Confidence' : 'Needs Work (Low)',
    grade: isFailing ? 'Needs Improvement' : trueOverall >= 80 ? 'Excellent' : 'Good',
    feedback: isFailing
      ? `Performance Assessment: You answered ${evaluationHistory.length} question${evaluationHistory.length !== 1 ? 's' : ''} with an average score of ${avg.toFixed(1)}/10 (${trueOverall}% overall). Answers lacked technical precision and depth. Significant study of ${topic} fundamentals is required.`
      : `Performance Assessment: You answered ${evaluationHistory.length} question${evaluationHistory.length !== 1 ? 's' : ''} with an average score of ${avg.toFixed(1)}/10. Solid demonstration of technical knowledge in ${topic}.`,
    strengths: isFailing
      ? (trueOverall === 0 ? ['None - Answers provided were incorrect or invalid'] : ['Attempted interview session'])
      : ['Good conceptual clarity', 'Appropriate technical vocabulary'],
    improvementAreas: isFailing
      ? [`Master fundamental syntax and mechanics in ${topic}`, 'Explain execution flow and core principles clearly', 'Avoid vague or circular responses']
      : ['Deepen knowledge in edge cases and performance optimization'],
    recommendedTopics: [topic, 'System Design Basics', 'Data Structures & Algorithms'].slice(0, 3),
    readiness: isFailing
      ? `Not Interview Ready (${trueOverall}% score). Continue thorough revision and mock practice before company drives.`
      : 'Interview Ready for entry-level positions.',
  };
};

export const processinterviewAI = async (inputData) => {
  return { status: 'processed', inputData };
};

