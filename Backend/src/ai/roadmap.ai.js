import { generateJSON, describeProvider } from './aiClient.js';
import { searchYouTubeVideos } from '../services/youtube.service.js';


export const processroadmapAI = async (inputData) => {
  const {
    targetRole = 'Full Stack Developer',
    studentProfile = {},
    currentSkills = [],
  } = inputData;

  const skillsListStr = Array.isArray(currentSkills) ? currentSkills.join(', ') : currentSkills;

  const prompt = `You are a world-class AI Career & Curriculum Architect. Design a detailed, highly progressive 5 to 6 milestone learning roadmap strictly tailored for a user targeting the following career role / topic:

TARGET CAREER ROLE: "${targetRole}"

USER PROFILE & CONTEXT:
- Academic Department / Background: ${studentProfile.department || 'General'}
- Current Semester / Stage: ${studentProfile.semester || 'N/A'}
- User's Confirmed Mastered Skills: [${skillsListStr || 'None specified'}]

CRITICAL REQUIREMENTS FOR DYNAMIC, SKILL-TAILORED ROADMAP:
1. DOMAIN SPECIFICITY:
   - The roadmap MUST be 100% focused on "${targetRole}".
   - If "${targetRole}" is a non-software role (e.g., Accountant, Banker, Civil Engineer, Murti Making, Graphic Designer, HR Specialist, Legal Advisor, Marketing Specialist), generate milestones and topics purely for that profession. DO NOT include software or coding concepts unless "${targetRole}" explicitly calls for software/IT.
2. TAILORED PROGRESSION BASED ON EXISTING SKILLS:
   - Analyze user's confirmed skills [${skillsListStr}]. If they already master basic prerequisites of "${targetRole}", skip redundant beginner lessons or mark Milestone 1 as "completed" (progress: 100), and start the next milestone with status "in-progress".
   - If they have skill gaps, specifically target those gaps in the milestones and key learning topics!
3. DYNAMIC & DETAILED TOPICS / OBJECTIVES (CRITICAL):
   - For EVERY milestone, provide a "topics" array containing 4 to 6 SPECIFIC, ACTIONABLE key learning topics, sub-modules, tools, algorithms, or practical project objectives.
   - ABSOLUTE RULE: DO NOT use generic placeholders like "Core syntax & architectural patterns", "Hands-on lab project implementation", "Fundamentals of Milestone 1", or "Assessment quiz & code review". EVERY topic string MUST name concrete tools, technologies, concepts, or real-world project tasks specific to "${targetRole}".
4. MILESTONE SCHEMA:
   Each milestone object must contain:
   - "id": number (1 to 6)
   - "title": string (descriptive milestone title, e.g. "Milestone 1: HTML5, CSS3 Layouts & Responsive Web Design")
   - "desc": string (2-3 sentences overview)
   - "status": "completed" | "in-progress" | "locked"
   - "progress": number (0 to 100)
   - "tags": array of 3-5 technology/skill strings
   - "topics": array of 4 to 6 specific learning topics/objectives
   - "syllabus": array of 2-3 detailed syllabus modules, each with { "moduleTitle": string, "duration": string, "concepts": string[], "practicalOutcome": string }
   - "videos": array of 2-4 video tutorial objects, each with { "title": string, "channel": string, "duration": string, "searchQuery": string }
   - "resources": array of 3-4 reference links/learning resources, each with { "title": string, "url": string, "type": "Documentation" | "Tutorial" | "Practice Portal" | "Guide", "provider": string }
   - "quizzes": number (2 to 5)
   - "exercises": number (5 to 15)

Output ONLY valid JSON matching this exact structure without markdown backticks:
{
  "milestones": [
    {
      "id": 1,
      "title": "...",
      "desc": "...",
      "status": "in-progress",
      "progress": 0,
      "tags": ["Tag1", "Tag2"],
      "topics": [
        "Specific Topic 1 for ${targetRole}",
        "Specific Topic 2 with tool/framework"
      ],
      "syllabus": [
        {
          "moduleTitle": "Unit 1: Foundations & Environment Setup",
          "duration": "10 Hours",
          "concepts": ["Syntax & Architecture", "Tooling & Best Practices"],
          "practicalOutcome": "Build foundation lab project"
        }
      ],
      "videos": [
        {
          "title": "Topic 1 Tutorial & Masterclass",
          "channel": "Tech Academy",
          "duration": "25 mins",
          "searchQuery": "Topic 1 tutorial ${targetRole}"
        }
      ],
      "resources": [
        {
          "title": "Official MDN / Technical Documentation",
          "url": "https://developer.mozilla.org",
          "type": "Documentation",
          "provider": "MDN Web Docs"
        }
      ],
      "quizzes": 3,
      "exercises": 8
    }
  ]
}`;

  // Live AI generation through the configured provider (NVIDIA / Gemini / Groq).
  const parsed = await generateJSON(prompt, {
    system: 'You are a world-class AI Career & Curriculum Architect. Output valid JSON strictly matching the requested roadmap schema.',
    temperature: 0.7,
    maxTokens: 8000,
    timeoutMs: 180000,
  });

  if (parsed && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
    const sanitized = parsed.milestones.map((m, index) => {
      const milestoneTopics = Array.isArray(m.topics) && m.topics.length > 0
        ? m.topics
        : generateRoleSpecificTopics(targetRole, m.title, index + 1, currentSkills);

      const milestoneVideos = Array.isArray(m.videos) && m.videos.length > 0
        ? m.videos.map((v, vIdx) => ({
            id: `v-ai-${index + 1}-${vIdx + 1}`,
            title: v.title || `${milestoneTopics[vIdx] || targetRole} - Video Tutorial`,
            channel: v.channel || 'Official Tutorial',
            duration: v.duration || '20 mins',
            videoId: v.videoId || null,
            searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(v.searchQuery || v.title || milestoneTopics[vIdx] || targetRole)}`,
            embedUrl: v.videoId 
              ? `https://www.youtube.com/embed/${v.videoId}?rel=0` 
              : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent((v.searchQuery || v.title || milestoneTopics[vIdx] || targetRole) + ' tutorial')}`,
            topicsCovered: v.title || milestoneTopics[vIdx] || targetRole,
          }))
        : generateRoleSpecificVideos(targetRole, m.title, milestoneTopics, index + 1);

      return {
        id: index + 1,
        title: m.title || `Milestone ${index + 1}: ${targetRole} Module`,
        desc: m.desc || `Core learning concepts and practical skills for ${targetRole}`,
        status: m.status || (index === 0 ? 'in-progress' : 'locked'),
        progress: typeof m.progress === 'number' ? m.progress : 0,
        tags: Array.isArray(m.tags) ? m.tags : [targetRole],
        topics: milestoneTopics,
        syllabus: Array.isArray(m.syllabus) && m.syllabus.length > 0 ? m.syllabus : generateRoleSpecificSyllabus(targetRole, m.title, index + 1, currentSkills),
        videos: milestoneVideos,
        resources: Array.isArray(m.resources) && m.resources.length > 0 ? m.resources : generateRoleSpecificResources(targetRole, m.title, index + 1),
        quizzes: typeof m.quizzes === 'number' ? m.quizzes : 3,
        exercises: typeof m.exercises === 'number' ? m.exercises : 8,
      };
    });

    console.log(`[AI Engine] Generated ${sanitized.length} live AI milestones for "${targetRole}" via ${describeProvider()}!`);
    return {
      source: 'ai-live',
      modelUsed: describeProvider(),
      milestones: sanitized,
    };
  }

  // Fallback to Role-and-Skill-Tailored Dynamic Generator
  console.log(`[AI Engine Fallback] Generating role-tailored dynamic roadmap for "${targetRole}"...`);
  const generatedMilestones = generateDynamicMilestones(targetRole, currentSkills);

  return {
    source: 'ai-dynamic-curriculum',
    modelUsed: 'role-tailored-engine',
    milestones: generatedMilestones,
  };
};

/**
 * Generates role and step specific detailed learning topics
 */
export function generateRoleSpecificTopics(targetRole, title, step, currentSkills = []) {
  const cleanRole = targetRole || 'Specialized Track';
  const cleanTitle = (title || `Step ${step}`).replace(/^Milestone\s*\d+\s*:\s*/i, '');

  return [
    `Foundational concepts, principles & environment setup for ${cleanTitle}`,
    `Core mechanics, practical syntax & workflow execution in ${cleanRole}`,
    `Advanced patterns, diagnostic testing & best practices for ${cleanTitle}`,
    `Real-world lab implementation & capstone project build for ${cleanRole}`
  ];
}

/**
 * Generates detailed syllabus modules for a given role and step
 */
export function generateRoleSpecificSyllabus(targetRole, title, step, currentSkills = []) {
  const cleanRole = targetRole || 'Specialized Track';
  const cleanTitle = (title || `Step ${step}`).replace(/^Milestone\s*\d+\s*:\s*/i, '');

  return [
    {
      moduleTitle: `Unit ${step}.1: Foundations & Core Mechanics of ${cleanTitle}`,
      duration: `Week 1-2 · 12 Hours`,
      concepts: [
        `Theoretical concepts, syntax & architectural principles for ${cleanTitle}`,
        `Environment setup, tooling & standard operating procedures`,
        `Core data structures & fundamental execution patterns`
      ],
      practicalOutcome: `Set up workspace & build initial lab module for ${cleanTitle}`
    },
    {
      moduleTitle: `Unit ${step}.2: Applied Engineering & Capstone Execution`,
      duration: `Week 3-4 · 16 Hours`,
      concepts: [
        `Real-world implementation scenarios & practical exercises`,
        `Testing strategies, performance tuning & diagnostic workflows`,
        `Production deployment & code quality validation for ${cleanRole}`
      ],
      practicalOutcome: `Deliver a fully verified capstone module for ${cleanTitle}`
    }
  ];
}

/**
 * Generates curated reference links for a given role and step
 */
export function generateRoleSpecificResources(targetRole, title, step) {
  const cleanRole = targetRole || 'Specialized Track';
  const cleanTitle = (title || cleanRole).replace(/^Milestone\s*\d+\s*:\s*/i, '');

  return [
    {
      title: `Official Technical Documentation for ${cleanTitle}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(cleanTitle + " official documentation")}`,
      type: "Documentation",
      provider: "Official Docs"
    },
    {
      title: `GeeksforGeeks ${cleanRole} Learning Hub`,
      url: `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(cleanTitle)}`,
      type: "Tutorial",
      provider: "GeeksforGeeks"
    },
    {
      title: `freeCodeCamp ${cleanRole} Open Curriculum`,
      url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(cleanTitle)}`,
      type: "Practice Portal",
      provider: "freeCodeCamp"
    },
    {
      title: `Roadmap.sh ${cleanRole} Career Path`,
      url: "https://roadmap.sh/",
      type: "Guide",
      provider: "Roadmap.sh"
    }
  ];
}

/**
 * Generates dynamic video resources tailored to topics and role
 */
export function generateRoleSpecificVideos(targetRole, title = '', topics = [], step = 1) {
  const cleanRole = targetRole || 'Specialized Role';
  const topicList = Array.isArray(topics) && topics.length > 0 ? topics : [title || cleanRole];

  return topicList.slice(0, 4).map((t, idx) => {
    const cleanTopic = typeof t === 'string' ? t : t?.title || cleanRole;
    const query = `${cleanTopic} tutorial ${cleanRole}`;
    return {
      id: `v-dyn-${step}-${idx + 1}`,
      title: `${cleanTopic} - Video Tutorial`,
      channel: 'YouTube Technical Search',
      duration: '20 mins',
      videoId: null,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      embedUrl: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`,
      topicsCovered: cleanTopic,
    };
  });
}

/**
 * Generates a complete 5-milestone dynamic roadmap structure
 */
function generateDynamicMilestones(targetRole, currentSkills = []) {
  const cleanRole = targetRole || 'Specialized Role';

  return [1, 2, 3, 4, 5].map((step) => {
    const titles = [
      `Milestone 1: Fundamentals & Core Tools of ${cleanRole}`,
      `Milestone 2: Intermediate Architecture & Practical Execution`,
      `Milestone 3: Advanced Optimization & Industry Standards`,
      `Milestone 4: Automation, Testing & System Integration`,
      `Milestone 5: Production Capstone Project & Portfolio Mastery`
    ];

    const descs = [
      `Master basic principles, foundational concepts, essential tools, and core practices required for ${cleanRole}.`,
      `Develop hands-on technical proficiency, structural patterns, and execution skills specific to ${cleanRole}.`,
      `Master intricate techniques, advanced workflows, quality assurance, and high-performance practices for ${cleanRole}.`,
      `Learn integration standards, automated testing methods, durability testing, and industry compliance.`,
      `Create an end-to-end master masterpiece project, building a professional portfolio and presentation for ${cleanRole}.`
    ];

    const stepTopics = generateRoleSpecificTopics(cleanRole, titles[step - 1], step, currentSkills);

    return {
      id: step,
      title: titles[step - 1],
      desc: descs[step - 1],
      status: step === 1 ? 'in-progress' : 'locked',
      progress: 0,
      tags: [`${cleanRole} Step ${step}`, 'Foundations', 'Practical Labs'],
      topics: stepTopics,
      syllabus: generateRoleSpecificSyllabus(cleanRole, titles[step - 1], step, currentSkills),
      videos: generateRoleSpecificVideos(cleanRole, titles[step - 1], stepTopics, step),
      resources: generateRoleSpecificResources(cleanRole, titles[step - 1], step),
      quizzes: 3 + (step % 2),
      exercises: 6 + step * 2,
    };
  });
}

export const generateTopicQuizAI = async (topicTitle, targetRole = '') => {
  const cleanTopic = String(topicTitle || '').trim();
  if (!cleanTopic) {
    throw new Error('Topic title is required for AI quiz generation.');
  }

  const prompt = `You are a senior technical examiner and domain expert. Generate a 5-question multiple choice quiz specifically on the following topic for a student targeting "${targetRole || 'Software Engineering'}":

TOPIC: "${cleanTopic}"

REQUIREMENTS:
1. Generate EXACTLY 5 questions directly related to "${cleanTopic}".
2. Questions should be clear, technical, practical, and test deep understanding.
3. Each question must have 4 distinct options.
4. "correctAnswerIndex": integer (0 to 3) pointing to the correct option in options array.
5. "explanation": 1-2 sentence detailed explanation of why the correct answer is right.

Output ONLY valid JSON matching this exact structure without markdown backticks:
{
  "topic": "${cleanTopic}",
  "questions": [
    {
      "id": 1,
      "question": "Clear technical question about ${cleanTopic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation of why Option A is correct."
    },
    {
      "id": 2,
      "question": "Second technical question about ${cleanTopic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 1,
      "explanation": "Detailed explanation."
    },
    {
      "id": 3,
      "question": "Third technical question about ${cleanTopic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 2,
      "explanation": "Detailed explanation."
    },
    {
      "id": 4,
      "question": "Fourth technical question about ${cleanTopic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation."
    },
    {
      "id": 5,
      "question": "Fifth technical question about ${cleanTopic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 3,
      "explanation": "Detailed explanation."
    }
  ]
}`;

  const parsed = await generateJSON(prompt, {
    system: 'You are an AI assessment generator. Output valid JSON strictly matching the 5-question quiz schema.',
    temperature: 0.7,
    maxTokens: 3000,
    timeoutMs: 45000,
  });

  if (parsed && Array.isArray(parsed.questions) && parsed.questions.length >= 5) {
    return {
      topic: cleanTopic,
      questions: parsed.questions.slice(0, 5)
    };
  }

  throw new Error(`Failed to generate 5 valid AI quiz questions for "${cleanTopic}". Please try again.`);
};

/**
 * Generates an in-depth, hands-on practice coding challenge for a milestone topic using AI
 */
export const generateMilestonePracticeAI = async (milestoneTitle, targetRole = '', topic = '') => {
  const cleanTitle = String(milestoneTitle || '').replace(/^Milestone\s*\d+\s*:\s*/i, '').trim();
  const cleanRole = String(targetRole || '').trim() || 'Software Engineering';
  const cleanTopic = String(topic || cleanTitle).trim();

  const prompt = `You are a Principal Technical Architect & Coding Instructor. Create a highly specific, practical, real-world coding challenge for a student on the topic: "${cleanTopic}" (from module: "${cleanTitle}") preparing for a career in "${cleanRole}".

CRITICAL REQUIREMENTS:
1. SPECIFIC CHALLENGE:
   - The challenge MUST directly test real-world application of "${cleanTopic}".
   - DO NOT provide a generic "iterate through an array" template.
   - Example: if topic is "SQL Joins", ask to write a JOIN query. If topic is "React Hooks", ask to implement a custom hook or toggle component. If topic is "Node.js Streams", ask to pipe data.
2. CLEAR PROMPT:
   - Provide a 2-3 sentence problem statement, requirements, and constraints.
3. REALISTIC I/O:
   - Provide concrete sample input and sample expected output.
4. STARTER CODE:
   - Provide functional boilerplate starter code with comments showing where the student writes code.
5. LANGUAGE:
   - Set "language" to one of: "node", "python", "java", "react", "html", "sql", "cpp".

Output ONLY valid JSON strictly matching this schema without markdown backticks:
{
  "title": "Hands-on Challenge: Specific Title for ${cleanTopic}",
  "prompt": "Detailed challenge problem statement...",
  "sampleInput": "Concrete sample input data...",
  "sampleOutput": "Concrete expected output...",
  "starterCode": "// Starter code with instructions\\nfunction solve() {\\n  // Your implementation\\n}\\n",
  "solutionCode": "// Reference solution...",
  "language": "node"
}`;

  try {
    const parsed = await generateJSON(prompt, {
      system: 'You are an AI coding exercise generator. Output valid JSON strictly matching the requested practice challenge schema.',
      temperature: 0.7,
      maxTokens: 3000,
      timeoutMs: 45000,
    });

    if (parsed && parsed.title && parsed.prompt) {
      return parsed;
    }
  } catch (err) {
    console.warn(`[AI Engine] Practice generation warning for "${cleanTopic}": ${err.message}`);
  }

  return {
    title: `Hands-on Practice: ${cleanTopic}`,
    prompt: `Implement a modular, production-ready solution applying the core mechanics of ${cleanTopic} for ${cleanRole}. Handle edge cases and validate your output.`,
    sampleInput: `Input: Dataset for ${cleanTopic}`,
    sampleOutput: `Expected Output: Processed verified result for ${cleanTopic}`,
    starterCode: `// Practice Exercise for: ${cleanTopic}\n// Target Role: ${cleanRole}\n\nfunction solution(input) {\n  // TODO: Implement solution for ${cleanTopic}\n  console.log("Processing input:", input);\n  return input;\n}\n\n// Sample execution:\nsolution("Test Input");\n`,
    solutionCode: `// Sample verified solution for ${cleanTopic}`,
    language: 'node'
  };
};

/**
 * Generates deep technical theory for a milestone topic using AI
 */
export const generateMilestoneTheoryAI = async (milestoneTitle, targetRole = '') => {
  const cleanTitle = String(milestoneTitle || '').replace(/^Milestone\s*\d+\s*:\s*/i, '').trim();
  const cleanRole = String(targetRole || '').trim() || 'Software Engineering';

  const prompt = `You are a Distinguished Principal Software Engineer, Computer Science Professor, and Curriculum Architect.
Write an authentic, deeply technical, exhaustive theory guide specifically for the topic: "${cleanTitle}" tailored for the role: "${cleanRole}".

CRITICAL RULE AGAINST PLACEHOLDERS & TEMPLATES:
- The user demands 100% genuine, deeply technical, AI-generated curriculum specifically crafted for "${cleanTitle}".
- DO NOT use generic sample phrasing or plug-in templates.
- DO NOT use generic titles like "Elementary Foundations of ${cleanTitle}", "Operational Execution Flow", "Memory Architecture", or "Enterprise Optimization".
- Every section title MUST name the specific mechanisms, language constructs, data structures, or runtime engine subsystems of "${cleanTitle}".
  * Example for React: "Declarative JSX, React.createElement & Synthetic Event Delegation", "Fiber WorkLoop, Reconciliation Diffing & Commit Phase", etc.
  * Example for Java: "Bytecode Disassembly, ClassLoader Delegation & HotSpot JIT Compilation", "G1 Garbage Collector Region Partitioning & Memory Barriers", etc.
  * Example for SQL: "B-Tree Storage Pages, WAL (Write-Ahead Logging) & Buffer Pool Management", "Query Execution Plans, Nested Loop Joins vs Hash Joins & Index SARGability", etc.

MANDATORY 4-LEVEL PEDAGOGICAL STRUCTURE (Strictly in this order):
1. SECTION 1 [Level 1: Foundational Basics & Core Mental Model]
   - "level": "Level 1: Foundational Basics"
   - "levelBadge": "Basics"
   - "title": Specific technical title for beginner foundation of "${cleanTitle}"
   - "explanation": In-depth explanation of what "${cleanTitle}" is, why it was created, its core mental model, and elementary syntax.
   - "points": 4-5 bullet points starting with bold tags (e.g. "**Core Definition:** ...", "**Why It Exists:** ...", "**Basic Syntax:** ...", "**Mental Model:** ...")
   - "takeaway": High-impact foundational rule to remember.

2. SECTION 2 [Level 2: Working Mechanics & Operational Lifecycle]
   - "level": "Level 2: Working Mechanics & Lifecycle"
   - "levelBadge": "Mechanics"
   - "title": Specific technical title for runtime flow and API lifecycle of "${cleanTitle}"
   - "explanation": Step-by-step lifecycle, parameter passing, return semantics, state transformations, and idiomatic daily patterns.
   - "points": 4-5 bullet points starting with bold tags (e.g. "**Execution Lifecycle:** ...", "**Parameter Passing & Contracts:** ...", "**Idiomatic Patterns:** ...", "**Boundary Validation:** ...")
   - "takeaway": Practical rule for writing clean, maintainable code with "${cleanTitle}".

3. SECTION 3 [Level 3: Deep Core Internals & Architecture]
   - "level": "Level 3: Deep Core Internals & Architecture"
   - "levelBadge": "Core Internals"
   - "title": Specific technical title naming the exact engine, memory, or architectural internals of "${cleanTitle}"
   - "explanation": Under-the-hood low-level deep dive into Stack vs Heap memory layout, compiler/interpreter/VM execution steps, Big-O Time & Space complexity, and concurrency/thread-safety mechanics.
   - "points": 4-5 bullet points starting with bold tags (e.g. "**Memory Allocation & Heap Mechanics:** ...", "**Runtime Engine & VM Dispatch:** ...", "**Big-O Complexity Analysis:** ...", "**Concurrency & Thread-Safety:** ...")
   - "takeaway": Low-level optimization rule to minimize latency and memory bloat.

4. SECTION 4 [Level 4: Advanced Production Standards & Anti-Patterns]
   - "level": "Level 4: Advanced Production Standards & Anti-Patterns"
   - "levelBadge": "Advanced Mastery"
   - "title": Specific technical title covering enterprise optimization and critical anti-patterns for "${cleanTitle}"
   - "explanation": Enterprise deployment best practices, high-throughput tuning, memory leak vectors, edge cases, and critical anti-patterns.
   - "points": 4-5 bullet points starting with bold tags (e.g. "**Performance Optimization:** ...", "**Critical Anti-Patterns to Avoid:** ...", "**Edge Cases & Resiliency:** ...", "**Production Observability:** ...")
   - "takeaway": Enterprise checklist rule for mission-critical deployments.

CODE EXAMPLE REQUIREMENT:
- "codeExample": Provide a REAL, fully functional code snippet demonstrating "${cleanTitle}".
  * Show basic usage first, then advance into an optimized production-grade pattern.
  * Must be 100% relevant to "${cleanTitle}". NEVER use generic "reduce array" or "executeWorkflow" templates.

Output ONLY valid JSON strictly matching this schema without markdown fences:
{
  "title": "Comprehensive Technical Theory Guide: ${cleanTitle}",
  "overview": "Detailed 2-3 paragraph architectural overview explaining ${cleanTitle} from foundations to core internals...",
  "difficultyProgression": "Foundations (Basic) ➔ Working Mechanics (Intermediate) ➔ Core Internals (Deep Dive) ➔ Production Mastery (Advanced)",
  "sections": [
    {
      "level": "Level 1: Foundational Basics",
      "levelBadge": "Basics",
      "title": "Specific Technical Name for Level 1",
      "explanation": "Detailed explanation...",
      "points": [
        "**Core Definition:** Exact explanation...",
        "**Problem Solved:** Exact problem addressed...",
        "**Elementary Syntax:** Exact code or construct usage...",
        "**Mental Model:** Intuitive conceptual model..."
      ],
      "takeaway": "Actionable takeaway..."
    },
    {
      "level": "Level 2: Working Mechanics & Lifecycle",
      "levelBadge": "Mechanics",
      "title": "Specific Technical Name for Level 2",
      "explanation": "Detailed explanation...",
      "points": [
        "**Execution Flow:** Step-by-step lifecycle...",
        "**Parameter Mechanics:** How arguments and state are handled...",
        "**Standard Patterns:** Idiomatic usage...",
        "**Error Handling:** Validation checks..."
      ],
      "takeaway": "Actionable takeaway..."
    },
    {
      "level": "Level 3: Deep Core Internals & Architecture",
      "levelBadge": "Core Internals",
      "title": "Specific Technical Name for Level 3",
      "explanation": "Detailed low-level explanation...",
      "points": [
        "**Memory Layout:** Stack vs Heap allocations...",
        "**Engine Internals:** VM bytecode, JIT, or event loop dispatch...",
        "**Asymptotic Complexity:** Big-O Time and Space bounds...",
        "**Concurrency:** Thread safety and synchronization..."
      ],
      "takeaway": "Actionable takeaway..."
    },
    {
      "level": "Level 4: Advanced Production Standards & Anti-Patterns",
      "levelBadge": "Advanced Mastery",
      "title": "Specific Technical Name for Level 4",
      "explanation": "Detailed production explanation...",
      "points": [
        "**Performance Tuning:** Cache optimization and pooling...",
        "**Dangerous Anti-Patterns:** Specific pitfalls and memory leak causes...",
        "**Edge-Case Handling:** Defensive resilience...",
        "**Production Standards:** Deployment checklist..."
      ],
      "takeaway": "Actionable takeaway..."
    }
  ],
  "codeExample": "// Real working code specifically for ${cleanTitle}...",
  "bestPractices": [
    "Specific production rule 1...",
    "Specific production rule 2...",
    "Specific production rule 3...",
    "Specific production rule 4..."
  ]
}`;

  try {
    const parsed = await generateJSON(prompt, {
      system: 'You are a Principal Curriculum Architect. Output valid JSON strictly matching the requested 4-tier basic to core theory schema.',
      temperature: 0.7,
      maxTokens: 4000,
      timeoutMs: 60000,
    });

    if (parsed && parsed.title && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn(`[AI Engine] Theory generation warning for "${cleanTitle}": ${err.message}. Using dynamic fallback.`);
  }

  return generateRoleSpecificTheoryFallback(cleanTitle, cleanRole);
};

function generateRoleSpecificTheoryFallback(cleanTitle, cleanRole) {
  const lower = `${cleanTitle} ${cleanRole}`.toLowerCase();

  let overview = "";
  let sections = [];
  let codeExample = "";

  if (lower.includes("java") || lower.includes("oop") || lower.includes("backend") || lower.includes("spring")) {
    overview = `Exhaustive technical curriculum for ${cleanTitle} in Java Enterprise Architecture. This guide progresses step-by-step from foundational Object-Oriented principles to low-level JVM memory management, bytecode execution, and enterprise production resilience.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Core Concept, Mental Model & Syntax for ${cleanTitle}`,
        explanation: `${cleanTitle} establishes the foundational structural building blocks in Java. Java enforces strong type safety, structured class definitions, and object encapsulation to prevent invalid program states.`,
        points: [
          `Core Definition: Understand the fundamental purpose and role of ${cleanTitle} within Java programs.`,
          `Syntax & Primitives: How variables, access modifiers, and method definitions are declared.`,
          `Mental Model: Objects represent state (fields) and behavior (methods) modeled after real-world domain entities.`,
          `Type Safety: The Java compiler verifies static types at compile time before generating bytecode.`
        ],
        takeaway: "Master fundamental syntax and access modifiers (private, protected, public) before designing complex class hierarchies."
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `Operational Execution Flow, Method Dispatch & Lifecycle`,
        explanation: `When a Java program executes, class definitions are loaded dynamically, instances are created via constructors, and methods execute via virtual method invocation.`,
        points: [
          `Constructor Execution: Memory is reserved, default fields initialized, and constructor chains (super) execute sequentially.`,
          `Pass-by-Value Semantics: Java passes all arguments strictly by value (passing copies of primitive values or copies of object references).`,
          `Polymorphic Method Dispatch: The JVM resolves virtual methods at runtime via the vtable based on the actual object instance.`,
          `Interface Contracts: Decouple client code from concrete implementations using interface contracts.`
        ],
        takeaway: "Favor Interface-based programming and Composition over deep, fragile class inheritance."
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `JVM Memory Model: Heap, Stack, Bytecode & GC Algorithms`,
        explanation: `The JVM manages execution across distinct memory regions: Stack frames for thread execution and Heap spaces for dynamic object allocation.`,
        points: [
          `Stack vs Heap: Local primitive variables live in fast thread-specific Stack frames; object instances live in the JVM Heap.`,
          `Generational Garbage Collection: Young Generation (Eden, Survivor spaces) reclaims short-lived instances; Old Generation handles persistent data.`,
          `JIT Compilation: The HotSpot JIT compiler profiles execution and compiles hot bytecode methods directly into native machine code.`,
          `Time & Space Bounds: Standard array and reference access operates in O(1) time; dynamic allocations introduce GC tracking overhead.`
        ],
        takeaway: "Minimize premature object creation inside high-frequency execution loops to reduce Garbage Collector pause times."
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Enterprise Optimization, Critical Anti-Patterns & Resilience`,
        explanation: `Production Java applications require thread safety, proper connection pooling, defensive input handling, and rigorous memory leak prevention.`,
        points: [
          `Memory Leak Prevention: Prevent hidden memory leaks caused by static collections, unclosed streams, or lingering thread locals.`,
          `Concurrency & Immutability: Use immutable classes (e.g. Java Records) and concurrent collections (ConcurrentHashMap) for thread safety.`,
          `Anti-Pattern to Avoid: Never swallow generic Throwable or Exception; catch specific exceptions and preserve the original cause.`,
          `Performance Tuning: Monitor heap allocation rates with JFR (Java Flight Recorder) and tune GC ergonomics for low-latency throughput.`
        ],
        takeaway: "Catch specific exception types explicitly, close resources via try-with-resources, and profile heap usage under production load."
      }
    ];
    codeExample = `// Progressive Java Implementation: ${cleanTitle}
import java.util.*;

public class ProductionModule {
    // Level 1: Encapsulated State
    private final String moduleName;
    private final List<Integer> metrics;

    public ProductionModule(String moduleName) {
        if (moduleName == null || moduleName.isBlank()) {
            throw new IllegalArgumentException("Module name cannot be blank.");
        }
        this.moduleName = moduleName;
        this.metrics = new ArrayList<>();
    }

    // Level 2: Controlled Operational Mechanics
    public synchronized void recordMetric(int value) {
        this.metrics.add(value);
    }

    // Level 3 & 4: Core Optimization & Defensive Processing
    public Map<String, Object> computeSummary() {
        if (metrics.isEmpty()) {
            return Map.of("module", moduleName, "status", "EMPTY", "count", 0);
        }
        
        // Stream reduction with O(N) complexity
        long sum = 0;
        for (int v : metrics) {
            sum += v;
        }
        double average = (double) sum / metrics.size();

        return Map.of(
            "module", moduleName,
            "count", metrics.size(),
            "sum", sum,
            "average", average,
            "status", "OPTIMIZED"
        );
    }

    public static void main(String[] args) {
        ProductionModule module = new ProductionModule("${cleanTitle}");
        module.recordMetric(10);
        module.recordMetric(25);
        module.recordMetric(40);
        System.out.println("✅ Processed: " + module.computeSummary());
    }
}`;
  } else if (lower.includes("python") || lower.includes("ai") || lower.includes("data") || lower.includes("ml")) {
    overview = `Exhaustive technical curriculum for ${cleanTitle} in Python. This guide systematically progresses from beginner syntax and core idioms up to CPython Virtual Machine internals, memory reference counts, GIL dynamics, and enterprise data pipeline optimization.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Core Concept, Mental Model & Syntax for ${cleanTitle}`,
        explanation: `${cleanTitle} provides readable, expressive abstractions in Python. Everything in Python is an object, with consistent duck-typing and dynamic evaluation.`,
        points: [
          `Core Definition: Understand the fundamental purpose and role of ${cleanTitle} in Python programs.`,
          `Syntax & Types: Dynamic variable assignment, built-in primitive types, and indentation-driven code blocks.`,
          `Mental Model: Names are pointers to objects stored in heap memory rather than fixed memory storage cells.`,
          `Object Identity: Differentiate between value equality (==) and identity checking (is) for object references.`
        ],
        takeaway: "Understand that Python variables are references bound to objects in memory, not rigid storage boxes."
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `Operational Execution Flow, Data Structures & Idioms`,
        explanation: `Python scripts compile dynamically into bytecode, executing through the interpreter with rich built-in data structures and comprehension mechanics.`,
        points: [
          `List Comprehensions & Generators: Vectorized iterations evaluate at C-speed, reducing interpreter loop overhead.`,
          `Hash Table Lookups: Python dictionaries use open-addressed hash tables offering average O(1) key search time.`,
          `Scope Resolution (LEGB): Names resolve sequentially through Local, Enclosing, Global, and Built-in namespaces.`,
          `Context Managers: Use 'with' statements to guarantee deterministic resource reclamation for files and sockets.`
        ],
        takeaway: "Prefer generator expressions over massive list comprehensions when streaming large datasets to conserve RAM."
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `CPython Engine: Bytecode, Reference Counting, GC & GIL`,
        explanation: `Under the hood, CPython translates source into .pyc bytecode executed by a stack-based evaluation loop with dual memory management.`,
        points: [
          `Reference Counting: Every PyObject tracks ob_refcnt; memory is immediately deallocated when ref count drops to zero.`,
          `Cyclic Garbage Collector: A generational GC periodically detects and reclaims circular references that reference counting misses.`,
          `Global Interpreter Lock (GIL): Mutex that prevents multiple native threads from executing bytecode concurrently in CPython.`,
          `Time & Space Bounds: List appends amortize to O(1); dictionary resizing rehashes entries when load factor reaches 2/3.`
        ],
        takeaway: "Deploy asyncio for I/O-bound workflows and multiprocessing or native C extensions to bypass GIL bottlenecks for CPU-bound tasks."
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Enterprise Optimization, Anti-Patterns & Production Resilience`,
        explanation: `Production Python applications require strict type hinting, memory profiling, resilient exception chains, and clean modular boundaries.`,
        points: [
          `Memory Optimization with __slots__: Use __slots__ in data classes to eliminate __dict__ overhead and save up to 40% RAM per instance.`,
          `Anti-Pattern to Avoid: Never use mutable default arguments (e.g. def func(arr=[])); use None as sentinel value instead.`,
          `Defensive Validation: Validate external inputs using Pydantic or type annotations to catch invalid schema boundaries early.`,
          `Production Profiling: Profile execution bottlenecks using cProfile and trace memory allocations with tracemalloc.`
        ],
        takeaway: "Annotate functions with explicit type hints, use None sentinels for default arguments, and profile memory under peak load."
      }
    ];
    codeExample = `# Progressive Python Implementation: ${cleanTitle}
from typing import List, Dict, Any, Optional

class ProductionModule:
    """Level 1 & 2: Encapsulated class with explicit type hints."""
    __slots__ = ("module_name", "_records")  # Level 4: Memory optimization

    def __init__(self, module_name: str) -> None:
        if not module_name.strip():
            raise ValueError("Module name cannot be empty.")
        self.module_name = module_name
        self._records: List[int] = []

    def record_entry(self, val: int) -> None:
        self._records.append(val)

    def process_pipeline(self) -> Dict[str, Any]:
        """Level 3 & 4: Generator-based processing with O(N) complexity."""
        if not self._records:
            return {"module": self.module_name, "status": "EMPTY", "count": 0}

        # Vectorized generator expression avoids large temporary allocations
        total_sum = sum(x for x in self._records if x > 0)
        avg = total_sum / len(self._records)

        return {
            "module": self.module_name,
            "count": len(self._records),
            "sum": total_sum,
            "average": round(avg, 2),
            "status": "OPTIMIZED"
        }

if __name__ == "__main__":
    mod = ProductionModule("${cleanTitle}")
    for item in [10, 20, 30, 40, 50]:
        mod.record_entry(item)
    print("✅ Pipeline Result:", mod.process_pipeline())`;
  } else if (lower.includes("react") || lower.includes("frontend") || lower.includes("web") || lower.includes("javascript") || lower.includes("css") || lower.includes("html")) {
    overview = `Exhaustive technical curriculum for ${cleanTitle} in Modern Web Engineering. This guide systematically progresses from fundamental DOM and declarative component models up to browser rendering pipelines, Virtual DOM Fiber diffing, and enterprise performance optimization.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Core Concept, Mental Model & Declarative Syntax for ${cleanTitle}`,
        explanation: `${cleanTitle} provides declarative UI patterns for building responsive web applications. Instead of imperative DOM manipulation, components describe what the UI should look like for a given state.`,
        points: [
          `Core Definition: Understand the role of ${cleanTitle} in structuring interactive, scalable web interfaces.`,
          `Declarative vs Imperative: Write predictable UI code driven by state rather than manually mutating browser DOM nodes.`,
          `Component Mental Model: Components are pure functions that accept inputs (props) and return renderable UI hierarchies (JSX/HTML).`,
          `Unidirectional Data Flow: Data flows cleanly top-down from parent components to child components.`
        ],
        takeaway: "Master declarative state representation and keep component boundaries clean and focused on a single responsibility."
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `Operational Execution Flow, Reactive Hooks & Event Dispatch`,
        explanation: `When state changes, the component function executes, computing new outputs. Hooks manage local state, subscriptions, and memoized values across render cycles.`,
        points: [
          `State Updates & Re-renders: Calling state setters schedules a re-render; state values remain stable within the current execution frame.`,
          `Effect Synchronization: useEffect runs after DOM mutations, handling side-effects like network calls, timers, and cleanup listeners.`,
          `Event Dispatch Mechanics: Synthetic events pool browser events and dispatch them through React's root listener delegator.`,
          `Lifting State Up: Share state across sibling components by hoisting state to their closest common ancestor.`
        ],
        takeaway: "Keep state localized, lifting it up only when required by sibling components to avoid unnecessary re-render cascades."
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `Virtual DOM, Fiber Reconciliation & Browser Render Pipeline`,
        explanation: `Under the hood, React builds a lightweight Virtual DOM Fiber tree. When updates occur, the Fiber reconciler calculates minimal DOM patches.`,
        points: [
          `Fiber Diffing Algorithm: React reconciles trees in O(N) heuristic time by comparing element types and unique keys.`,
          `Browser Critical Rendering Path: Minimizes costly layout reflows and repaints by batching multiple DOM updates in a single tick.`,
          `Event Loop & Microtasks: State updates queue microtasks, ensuring all synchronous code finishes before browser paint occurs.`,
          `Memory Layout & Closures: Stale closures occur when effect hooks capture old state references without proper dependency declarations.`
        ],
        takeaway: "Supply unique, stable keys when rendering dynamic element lists to optimize Fiber reconciliation and prevent state corruption."
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Enterprise Optimization, Anti-Patterns & Bundle Tuning`,
        explanation: `Production web applications require code splitting, memoization, layout shift prevention, and defensive error boundaries.`,
        points: [
          `Performance Memoization: Use useMemo and useCallback strategically for expensive calculations and stable callback references.`,
          `Anti-Pattern to Avoid: Never mutate state directly (e.g. state.items.push()); always produce new immutable references.`,
          `Code Splitting: Deploy dynamic imports (React.lazy / Suspense) to split bundles and achieve fast First Contentful Paint (FCP).`,
          `Error Boundaries: Wrap feature trees in Error Boundaries to gracefully catch rendering errors without crashing the entire app.`
        ],
        takeaway: "Treat state as strictly immutable, audit dependency arrays in hooks, and split route bundles for optimal Core Web Vitals."
      }
    ];
    codeExample = `// Progressive Web Component: ${cleanTitle}
import React, { useState, useMemo, useCallback } from 'react';

export default function ProductionComponent() {
  // Level 1: Declarative State
  const [items, setItems] = useState([10, 20, 30, 40, 50]);
  const [inputValue, setInputValue] = useState('');

  // Level 2: Controlled Event Handler
  const handleAddItem = useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      // Level 4: Immutable state update
      setItems(prev => [...prev, parsed]);
      setInputValue('');
    }
  }, [inputValue]);

  // Level 3: Memoized computation (O(N) time)
  const stats = useMemo(() => {
    const sum = items.reduce((acc, x) => acc + x, 0);
    return { count: items.length, sum, average: sum / (items.length || 1) };
  }, [items]);

  return (
    <div className="p-4 border rounded-xl bg-slate-900 text-white shadow-lg">
      <h3 className="text-lg font-bold text-indigo-400">${cleanTitle}</h3>
      <p className="text-sm text-slate-400 mt-1">
        Processed {stats.count} elements. Sum: {stats.sum} (Avg: {stats.average.toFixed(1)})
      </p>

      <div className="flex gap-2 mt-4">
        <input
          type="number"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Enter value..."
          className="px-3 py-1.5 rounded bg-slate-800 text-sm border border-slate-700"
        />
        <button
          onClick={handleAddItem}
          className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 font-bold text-sm"
        >
          Add Item
        </button>
      </div>
    </div>
  );
}`;
  } else {
    overview = `Comprehensive curriculum for ${cleanTitle} in ${cleanRole}. This professional guide progresses step-by-step from fundamental principles and core mental models to operational execution, low-level mechanics, and enterprise production standards.`;
    sections = [
      {
        level: "Level 1: Foundational Basics",
        levelBadge: "Basics",
        title: `Foundational Principles & Mental Model of ${cleanTitle}`,
        explanation: `${cleanTitle} establishes the foundational bedrock within ${cleanRole}. Understanding what it represents and the problem it solves creates a clear mental model.`,
        points: [
          `Core Concept: Understand the fundamental definition and scope of ${cleanTitle}.`,
          `Problem Addressed: The key challenges and inefficiencies that ${cleanTitle} solves.`,
          `Elementary Standards: Initial steps, essential tools, and terminology used in practice.`,
          `Mental Model: An intuitive framework for reasoning about ${cleanTitle} reliably.`
        ],
        takeaway: "Build a rock-solid grasp of core definitions and purpose before advancing to complex workflows."
      },
      {
        level: "Level 2: Working Mechanics & Lifecycle",
        levelBadge: "Mechanics",
        title: `Operational Execution Workflow & Daily Patterns`,
        explanation: `Examine how ${cleanTitle} is applied step-by-step in professional practice, including input validation, lifecycle stages, and standardized procedures.`,
        points: [
          `Workflow Sequence: Step-by-step procedures followed from initiation to completion.`,
          `Input Processing: Validating parameters, requirements, and domain criteria.`,
          `Standard Methods: Daily best practices and industry-accepted patterns.`,
          `Quality Gates: Verification milestones to ensure accuracy throughout the lifecycle.`
        ],
        takeaway: "Follow structured operational sequences and validate requirements at every milestone."
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `Deep Structural Mechanics, Resource Dynamics & Standards`,
        explanation: `A deep-dive into the underlying architecture, resource allocation models, latency considerations, and structural dependencies governing ${cleanTitle}.`,
        points: [
          `Structural Architecture: Underlying mechanisms and structural dependencies.`,
          `Resource Allocation: Managing capacity, throughput, and operational efficiency.`,
          `Bottleneck Analysis: Identifying performance choke points and friction factors.`,
          `Systemic Governance: Industry compliance standards and regulatory frameworks.`
        ],
        takeaway: "Master the underlying architectural mechanisms to anticipate bottlenecks and optimize system performance."
      },
      {
        level: "Level 4: Advanced Production Standards & Anti-Patterns",
        levelBadge: "Advanced Mastery",
        title: `Enterprise Optimization, Critical Anti-Patterns & Risk Mitigation`,
        explanation: `Mastering enterprise deployment standards, identifying high-risk anti-patterns, and implementing fault-tolerant safeguards for ${cleanTitle}.`,
        points: [
          `High-Impact Optimization: Advanced techniques to achieve maximum throughput and quality.`,
          `Critical Anti-Patterns: Common operational missteps, shortcuts, and systemic risks to avoid.`,
          `Defensive Contingency: Fault tolerance and emergency recovery protocols.`,
          `Production Checklist: Verification criteria for mission-critical releases.`
        ],
        takeaway: "Implement proactive risk controls, avoid dangerous anti-patterns, and enforce rigorous quality checks."
      }
    ];
    codeExample = `// Enterprise Implementation Pattern: ${cleanTitle}
function executeWorkflow() {
  console.log("Executing structured workflow for: ${cleanTitle}");
  const dataset = [10, 25, 40, 60, 85];
  
  // O(N) Processing Pipeline
  const total = dataset.reduce((acc, val) => acc + val, 0);
  const average = total / dataset.length;

  console.log(\`✅ Workflow Complete for \${cleanTitle}: Processed \${dataset.length} items. Total: \${total}, Avg: \${average}\`);
}

executeWorkflow();`;
  }

  return {
    title: `Comprehensive Theory & Core Guide: ${cleanTitle}`,
    overview,
    difficultyProgression: "Foundations (Basic) ➔ Working Mechanics (Intermediate) ➔ Core Internals (Deep Dive) ➔ Production Mastery (Advanced)",
    sections,
    codeExample,
    bestPractices: [
      `Master core fundamentals before implementing advanced structural designs.`,
      `Implement defensive validation to catch invalid inputs at system boundaries.`,
      `Profile memory, runtime complexity, and resource allocation under heavy workloads.`,
      `Avoid common anti-patterns by strictly adhering to modern industry standards.`
    ]
  };
}
