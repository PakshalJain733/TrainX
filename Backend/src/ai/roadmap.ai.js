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
 * Generates deep technical theory for a milestone topic using AI
 */
export const generateMilestoneTheoryAI = async (milestoneTitle, targetRole = '') => {
  const cleanTitle = String(milestoneTitle || '').replace(/^Milestone\s*\d+\s*:\s*/i, '').trim();
  const cleanRole = String(targetRole || '').trim() || 'Software Engineering';

  const prompt = `You are a Principal Curriculum Architect & Educator. Write a comprehensive, highly professional, detailed domain theory guide for the topic: "${cleanTitle}" in the context of "${cleanRole}".

CRITICAL INSTRUCTIONS:
1. Provide a deep, 3-4 sentence overview of "${cleanTitle}" tailored strictly to "${cleanRole}".
2. Provide EXACTLY 3 to 4 detailed domain sections.
   - ABSOLUTE RULE: DO NOT use generic section titles like "Concept 1", "Concept 2", "Concept 3", "Topic 1", or "Section A".
   - EVERY section title MUST be a specific, meaningful subhead naming exact mechanisms, principles, frameworks, or workflows specific to "${cleanRole}".
   - If "${cleanRole}" is a non-software role (e.g. Graphic Designer, HR Specialist, Accountant, Civil Engineer, Murti Making, Marketing, Legal, Doctor), write theory purely for that domain without software/coding concepts.
3. For each section, provide:
   - "title": Specific domain subhead name
   - "explanation": 3-4 sentence deep explanation paragraph detailing core principles and execution lifecycle.
   - "takeaway": Concrete industry takeaway or practical tip.
4. Provide a practical code snippet OR structured domain case study workflow ("codeExample") for "${cleanTitle}".
5. Provide 3-4 professional industry best practices ("bestPractices").

Output ONLY valid JSON strictly matching this schema without markdown backticks:
{
  "title": "Comprehensive Theory & Domain Guide: ${cleanTitle}",
  "overview": "Deep technical/domain overview paragraph...",
  "sections": [
    {
      "title": "Specific Technical or Domain Subhead Name",
      "explanation": "Detailed explanation paragraph...",
      "takeaway": "Industry takeaway..."
    }
  ],
  "codeExample": "// Real working code example OR Domain Workflow Case Study\\n...",
  "bestPractices": [
    "Industry best practice 1...",
    "Industry best practice 2..."
  ]
}`;

  try {
    const parsed = await generateJSON(prompt, {
      system: 'You are a Principal Technical Educator. Output valid JSON strictly matching the requested theory guide schema.',
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

  if (lower.includes("java") || lower.includes("oop") || lower.includes("backend")) {
    overview = `${cleanTitle} forms a fundamental cornerstone in Java Enterprise Architecture and Object-Oriented System Design. Java code compiles into platform-independent bytecode executed by the Java Virtual Machine (JVM), enforcing strong type safety, encapsulation, and structured memory allocation.`;
    sections = [
      {
        title: "JVM Memory Model: Heap vs Stack Allocation & Garbage Collection",
        explanation: "Java manages execution across Stack frames and Heap regions. Local primitive variables and method references reside in short-lived Stack frames, while Object instances are instantiated dynamically on the Heap. The JVM Garbage Collector periodically identifies unreferenced heap objects and reclaims memory automatically.",
        takeaway: "Minimize premature object creation inside high-frequency execution loops to reduce Garbage Collector pause times."
      },
      {
        title: "Object Encapsulation, Abstraction & Polymorphism Mechanics",
        explanation: "Encapsulation protects class member state using access modifiers and controlled accessor methods. Abstraction hides concrete implementation details behind interface contracts, enabling dynamic method dispatch and runtime polymorphism.",
        takeaway: "Favor Interface-based programming and Composition over deep class inheritance hierarchies."
      },
      {
        title: "Exception Hierarchy & Structured Error Recovery (Checked vs Unchecked)",
        explanation: "Java enforces a strict Exception hierarchy. Checked exceptions represent recoverable conditions that must be handled at compile time, whereas Unchecked RuntimeExceptions represent programmer logic flaws or invalid state assertions.",
        takeaway: "Catch specific exception types explicitly rather than swallowing generic Throwable or Exception objects."
      }
    ];
    codeExample = `// Enterprise Java Pattern for: ${cleanTitle}
public class ExecutionHandler {
    private final String moduleName;

    public ExecutionHandler(String moduleName) {
        this.moduleName = moduleName;
    }

    public void executeProcess(int[] dataset) throws IllegalArgumentException {
        if (dataset == null || dataset.length == 0) {
            throw new IllegalArgumentException("Dataset cannot be null or empty.");
        }
        
        int totalSum = 0;
        for (int value : dataset) {
            totalSum += value;
        }
        System.out.println("✅ Processed " + dataset.length + " elements for " + moduleName + ". Sum: " + totalSum);
    }

    public static void main(String[] args) {
        ExecutionHandler handler = new ExecutionHandler("${cleanTitle}");
        handler.executeProcess(new int[]{10, 20, 30, 40, 50});
    }
}`;
  } else if (lower.includes("python") || lower.includes("ai") || lower.includes("data")) {
    overview = `${cleanTitle} in Python provides high-level abstractions designed for rapid development, clean readability, and modular extensibility. Python code executes through the CPython Virtual Machine, translating dynamic syntax into bytecode instructions.`;
    sections = [
      {
        title: "CPython Object Model, Mutability & Memory Allocation",
        explanation: "In Python, all data structures are first-class objects. Types are strictly divided into Immutable (integers, strings, tuples) and Mutable (lists, dictionaries, sets). Modifying an immutable instance instantiates a distinct object in memory.",
        takeaway: "Use tuple structures for fixed lookup tables to optimize memory allocation and iteration speed."
      },
      {
        title: "List Comprehensions, Generator Expressions & Iteration Mechanics",
        explanation: "Python list comprehensions and generator expressions evaluate sequence transformations at C-level speed inside CPython, bypassing interpreter loop overhead and reducing RAM consumption for large data pipelines.",
        takeaway: "Prefer generator expressions over massive list comprehensions when streaming large data batches."
      },
      {
        title: "Global Interpreter Lock (GIL) & Asynchronous Event Loops",
        explanation: "CPython uses the Global Interpreter Lock (GIL) to prevent multiple native threads from executing bytecode simultaneously. For CPU-bound parallel workloads, multiprocessing or native C extensions bypass GIL bottlenecks.",
        takeaway: "Utilize asyncio for non-blocking I/O operations and multiprocessing for CPU-intensive tasks."
      }
    ];
    codeExample = `# Python Execution Module for: ${cleanTitle}
from typing import List, Dict, Any

def process_pipeline(data_batch: List[int]) -> Dict[str, Any]:
    """Processes input dataset and computes summary metrics."""
    if not data_batch:
        raise ValueError("Data batch cannot be empty.")
        
    filtered = [x for x in data_batch if x > 0]
    total_sum = sum(filtered)
    
    return {
        "topic": "${cleanTitle}",
        "count": len(filtered),
        "total": total_sum,
        "status": "SUCCESS"
    }

if __name__ == "__main__":
    result = process_pipeline([10, 20, 30, 40, 50])
    print(f"✅ Pipeline Result: {result}")
`;
  } else if (lower.includes("react") || lower.includes("frontend") || lower.includes("web") || lower.includes("html") || lower.includes("css")) {
    overview = `${cleanTitle} in Modern Web Engineering is centered around declarative UI architecture, reactive state synchronization, Virtual DOM reconciliation, and component composition.`;
    sections = [
      {
        title: "Virtual DOM Reconciliation & Fiber Diffing Algorithm",
        explanation: "React maintains a dynamic Virtual DOM tree representation of the UI. When state updates occur, Fiber reconciliation computes minimal DOM mutations and efficiently patches dirty nodes in the browser DOM.",
        takeaway: "Supply unique, stable keys when rendering dynamic element lists to optimize Fiber reconciliation."
      },
      {
        title: "Component State Lifecycle & Hook Execution Mechanics",
        explanation: "React Hooks (useState, useEffect, useMemo) allow functional components to manage local state, lifecycle subscriptions, and memoized compute caches cleanly without writing legacy ES6 class syntax.",
        takeaway: "Maintain hook execution order by placing calls strictly at the top level of component functions."
      },
      {
        title: "Unidirectional Data Flow & State Lifting Patterns",
        explanation: "Data propagates strictly top-down from parent components to children via props. State updates trigger reactive re-render cycles, keeping user interfaces automatically synchronized with application data.",
        takeaway: "Keep component state localized, lifting state up only when required by sibling components."
      }
    ];
    codeExample = `// Modern Component Pattern for: ${cleanTitle}
import React, { useState, useMemo } from 'react';

export default function ModuleComponent() {
  const [data, setData] = useState([10, 20, 30, 40, 50]);

  const summary = useMemo(() => {
    return data.reduce((acc, val) => acc + val, 0);
  }, [data]);

  return (
    <div className="module-card">
      <h3>${cleanTitle}</h3>
      <p>Processed {data.length} items. Total: {summary}</p>
    </div>
  );
}
`;
  } else {
    overview = `${cleanTitle} represents a fundamental technical module in ${cleanRole}. Mastering this concept establishes strong domain fundamentals, operational mechanics, memory layout understanding, and production-grade implementation capabilities.`;
    sections = [
      {
        title: "Foundational Execution Mechanics & Operational Model",
        explanation: `Understand how ${cleanTitle} processes inputs, executes internal algorithms, manages memory scopes, and returns structured outputs within ${cleanRole} applications.`,
        takeaway: "Follow modular design principles to build maintainable, scalable software solutions."
      },
      {
        title: "State Scoping, Variable Lifecycles & Context Passing",
        explanation: `Examine how variables pass across function boundaries, event loops, and execution contexts without introducing memory leaks, race conditions, or state pollution.`,
        takeaway: "Keep variable boundaries tightly scoped to ensure predictable runtime execution."
      },
      {
        title: "Diagnostic Workflows, Boundary Validations & Error Recovery",
        explanation: `Implement comprehensive input validation assertions and error handling to ensure ${cleanTitle} recovers gracefully when handling unexpected or edge-case inputs.`,
        takeaway: "Thoroughly test boundary conditions before releasing code to production environments."
      }
    ];
    codeExample = `// Execution Pattern for: ${cleanTitle}
function executeModule() {
  console.log("Executing module for: ${cleanTitle}");
  const dataset = [10, 20, 30, 40, 50];
  const result = dataset.reduce((acc, x) => acc + x, 0);
  console.log(\`✅ Result: Processed \${dataset.length} items. Total: \${result}\`);
}

executeModule();
`;
  }

  return {
    title: `Comprehensive Theory & Architectural Guide: ${cleanTitle}`,
    overview,
    sections,
    codeExample,
    bestPractices: [
      `Write clean, self-documenting code with descriptive variable and method names.`,
      `Implement robust input validation and handle specific exception types explicitly.`,
      `Optimize runtime time and space complexity before releasing code.`,
      `Consistently practice hands-on coding challenges after reviewing theoretical concepts.`
    ]
  };
}
