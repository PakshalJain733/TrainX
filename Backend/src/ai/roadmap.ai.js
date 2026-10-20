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
   - Target the curriculum to bridge student's skill gaps while mastering "${targetRole}".
   - CRITICAL SEQUENTIAL RULE: Every newly generated roadmap must start strictly at Milestone 1. Milestone 1 must ALWAYS have "status": "in-progress" and "progress": 0. ALL subsequent milestones (Milestone 2, 3, 4, 5, etc.) must ALWAYS have "status": "locked" and "progress": 0. DO NOT skip milestones or mark later milestones as in-progress.
3. DYNAMIC & DETAILED TOPICS / OBJECTIVES (CRITICAL):
   - For EVERY milestone, provide a "topics" array containing 4 to 6 SPECIFIC, ACTIONABLE key learning topics, sub-modules, tools, algorithms, or practical project objectives.
   - ABSOLUTE RULE: DO NOT use generic placeholders like "Core syntax & architectural patterns", "Hands-on lab project implementation", "Fundamentals of Milestone 1", or "Assessment quiz & code review". EVERY topic string MUST name concrete tools, technologies, concepts, or real-world project tasks specific to "${targetRole}".
4. MILESTONE SCHEMA:
   Each milestone object must contain:
   - "id": number (1 to 5)
   - "title": string (descriptive milestone title, e.g. "Milestone 1: HTML5, CSS3 Layouts & Responsive Web Design")
   - "desc": string (2-3 sentences overview)
   - "status": "in-progress" (for milestone 1 only) | "locked" (for all subsequent milestones)
   - "progress": 0
   - "tags": array of 3-5 technology/skill strings
   - "topics": array of 4 to 6 concrete, actionable technical topics/objectives

Output ONLY valid JSON matching this exact structure without markdown backticks:
{
  "milestones": [
    {
      "id": 1,
      "title": "Milestone 1: ...",
      "desc": "...",
      "status": "in-progress",
      "progress": 0,
      "tags": ["Tag1", "Tag2"],
      "topics": [
        "Specific Topic 1 for ${targetRole}",
        "Specific Topic 2 with tool/framework",
        "Specific Topic 3 practical lab",
        "Specific Topic 4 capstone project"
      ]
    }
  ]
}`;

  // Live AI generation through the configured provider (NVIDIA / Gemini / Groq).
  const parsed = await generateJSON(prompt, {
    system: 'You are a world-class AI Career & Curriculum Architect. Output valid JSON strictly matching the requested roadmap schema.',
    temperature: 0.6,
    maxTokens: 2400,
    timeoutMs: 45000,
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
        status: index === 0 ? 'in-progress' : 'locked',
        progress: 0,
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
 * Generates a comprehensive, progressive domain-tailored milestone roadmap structure.
 */
function generateDynamicMilestones(targetRole, currentSkills = []) {
  const cleanRole = (targetRole || 'Software Engineering').trim();
  const lowerRole = cleanRole.toLowerCase();

  let milestoneTemplates = null;

  if (lowerRole.includes('java fullstack') || lowerRole.includes('java developer') || (lowerRole.includes('java') && !lowerRole.includes('script'))) {
    milestoneTemplates = [
      {
        title: `Milestone 1: Core Java 17+, OOP & Collections Architecture`,
        desc: `Master modern Java language syntax, memory management, garbage collection, and essential OOP design principles.`,
        tags: ['Core Java', 'OOP', 'Collections', 'Memory Model'],
        topics: [
          'Core Java 17+ Syntax: OOP Concepts, Inheritance, Interfaces & Records',
          'Java Collections Framework: Lists, Sets, Maps & Big-O Complexities',
          'Java Streams API, Functional Interfaces & Lambda Expressions',
          'Exception Handling Hierarchies, Custom Exceptions & Try-with-Resources',
          'JUnit 5 Unit Testing, Assertions & Mockito Mocking'
        ]
      },
      {
        title: `Milestone 2: Relational Databases, SQL & Hibernate ORM`,
        desc: `Design robust normalized relational database schemas, complex SQL queries, and JPA persistence layers.`,
        tags: ['PostgreSQL', 'MySQL', 'Hibernate', 'Spring Data JPA'],
        topics: [
          'Relational Database Modeling, Schema Normalization (3NF) & Indexing',
          'Complex SQL Joins, Aggregations, Transactions & ACID Guarantees',
          'Object-Relational Mapping (ORM) with Hibernate & JPA Entity Lifecycle',
          'Spring Data JPA: Custom Query Methods, Pagination & Specifications',
          'Database Migrations & Version Control using Flyway / Liquibase'
        ]
      },
      {
        title: `Milestone 3: Spring Boot Microservices & RESTful API Engineering`,
        desc: `Build scalable enterprise microservices using Spring Boot, dependency injection, and clean DTO patterns.`,
        tags: ['Spring Boot', 'REST APIs', 'Spring MVC', 'DTO Pattern'],
        topics: [
          'Spring Boot Core: Inversion of Control (IoC), Dependency Injection & Bean Scopes',
          'RESTful API Contract Design (@RestController, RequestMapping, Status Codes)',
          'Input Validation with Jakarta Validation (@Valid, @NotNull, @Size)',
          'Global Exception Handling with @ControllerAdvice & Error Response Standardization',
          'OpenAPI / Swagger API Documentation & Postman Integration'
        ]
      },
      {
        title: `Milestone 4: Security, Authentication & Distributed Caching`,
        desc: `Secure microservices with Spring Security, JWT authentication, and high-performance Redis caching.`,
        tags: ['Spring Security', 'JWT Auth', 'Redis Cache', 'RBAC'],
        topics: [
          'Spring Security Filter Chain & SecurityContext Management',
          'Stateless JWT Token Authentication & Refresh Token Rotation',
          'Role-Based & Permission-Based Authorization (@PreAuthorize)',
          'In-Memory Distributed Caching with Redis (@Cacheable, Cache Eviction)',
          'Asynchronous Messaging & Event-Driven Architecture with RabbitMQ / Kafka'
        ]
      },
      {
        title: `Milestone 5: Frontend Integration with React & Next.js`,
        desc: `Connect enterprise backend APIs with responsive modern React UI components and state management.`,
        tags: ['React', 'TypeScript', 'Axios', 'Tailwind CSS'],
        topics: [
          'React Functional Components, JSX, Props & State Management',
          'Consuming REST APIs via Axios / TanStack Query with Error Interceptors',
          'JWT Token Storage, Protected Routes & Client-Side Authentication Flow',
          'Responsive UI Design with Tailwind CSS & Reusable Component Systems',
          'Form Handling, Client-Side Validation & Asynchronous Submissions'
        ]
      },
      {
        title: `Milestone 6: Cloud Deployment, Docker Containerization & Enterprise Capstone`,
        desc: `Containerize the fullstack application, configure CI/CD pipelines, and deploy to production cloud platforms.`,
        tags: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Deployment'],
        topics: [
          'Multi-Stage Dockerfile Builds for Spring Boot & React Applications',
          'Docker Compose Multi-Container Orchestration (App, DB, Redis, Gateway)',
          'CI/CD Automated Testing & Build Pipelines via GitHub Actions',
          'Cloud Hosting & Production Deployment on AWS ECS / DigitalOcean',
          'End-to-End Enterprise Fullstack Banking / E-Commerce Capstone Project'
        ]
      }
    ];
  } else if (lowerRole.includes('python') || lowerRole.includes('data science') || lowerRole.includes('machine learning') || lowerRole.includes('ai') || lowerRole.includes('spark')) {
    milestoneTemplates = [
      {
        title: `Milestone 1: Python Fundamentals, Syntax & Memory Model`,
        desc: `Master Python 3 core syntax, data structures, variable references, and idiomatic Pythonic conventions.`,
        tags: ['Python 3', 'Syntax', 'Data Types', 'Virtual Environments'],
        topics: [
          'Python 3 Primitives, Variable Scoping & Reference vs Value Semantics',
          'Built-in Data Structures: Lists, Tuples, Dictionaries & Sets',
          'Functions, *args, **kwargs, Lambda Expressions & Comprehensions',
          'Virtual Environments (venv/poetry), pip Package Management & Project Layout',
          'File I/O, Context Managers (with statement) & Custom Exception Handling'
        ]
      },
      {
        title: `Milestone 2: Object-Oriented Python, Generators & Decorators`,
        desc: `Implement advanced Python OOP patterns, decorators, lazy iterators, and clean modular codebases.`,
        tags: ['OOP', 'Decorators', 'Generators', 'Dunder Methods'],
        topics: [
          'Classes, Encapsulation, Inheritance & Dunder Methods (__init__, __str__, __repr__)',
          'Higher-Order Functions & Custom Function/Class Decorators',
          'Iterators, Generators & the yield Keyword for Memory-Efficient Streaming',
          'Static Type Hinting with typing Module & Static Type Checking with mypy',
          'Unit Testing with pytest, Mocking & Test-Driven Development'
        ]
      },
      {
        title: `Milestone 3: Data Analysis, NumPy, Pandas & Data Pipelines`,
        desc: `Process, clean, and analyze complex datasets using vectorized operations and data manipulation tools.`,
        tags: ['NumPy', 'Pandas', 'Data Analysis', 'Vectorization'],
        topics: [
          'NumPy N-Dimensional Arrays, Broadcasting & High-Speed Vectorized Operations',
          'Pandas DataFrames: Filtering, Grouping, Aggregation & Pivot Tables',
          'Data Cleaning, Missing Value Imputation & Feature Transformation',
          'Data Visualization with Matplotlib & Seaborn',
          'Relational SQL Integration: SQLAlchemy ORM & SQLite/PostgreSQL Connectivity'
        ]
      },
      {
        title: `Milestone 4: Backend Web Frameworks (FastAPI / Django) & REST APIs`,
        desc: `Build high-performance asynchronous REST APIs with Pydantic validation and automatic OpenAPI documentation.`,
        tags: ['FastAPI', 'Pydantic', 'AsyncIO', 'REST APIs'],
        topics: [
          'Asynchronous Programming with asyncio, async/await & Event Loops',
          'FastAPI Route Handlers, Query/Path Parameters & Request Lifecycle',
          'Data Validation & Serialization using Pydantic Models',
          'JWT Authentication, Password Hashing (bcrypt) & Dependency Injection',
          'Database Integration with Async SQLAlchemy & Alembic Migrations'
        ]
      },
      {
        title: `Milestone 5: Testing, Performance Optimization & ML/Distributed Analytics`,
        desc: `Apply predictive modeling, optimize Python code execution, and process scalable data streams.`,
        tags: ['Scikit-Learn', 'ML Models', 'cProfile', 'Optimization'],
        topics: [
          'Supervised Machine Learning with Scikit-Learn: Classification & Regression',
          'Model Evaluation Metrics: Confusion Matrix, ROC-AUC, Precision & Recall',
          'Performance Profiling with cProfile & Memory Tracing with tracemalloc',
          'Multiprocessing vs Multithreading: Overcoming CPython GIL Limits',
          'Distributed Analytics & Data Pipelines with PySpark / Celery'
        ]
      },
      {
        title: `Milestone 6: Docker Containerization, Cloud Deployment & Capstone Project`,
        desc: `Package the Python service into optimized container images and deploy live production systems.`,
        tags: ['Docker', 'CI/CD', 'Cloud Deployment', 'Capstone'],
        topics: [
          'Containerizing Python Applications with Docker Multi-Stage Builds',
          'Docker Compose for Python Backend, Database & Redis Services',
          'Automated CI/CD Pipeline Configuration with GitHub Actions',
          'Production Deployment on Cloud (AWS/GCP/Render) with Gunicorn & Uvicorn',
          'End-to-End Capstone Project: Real-time Data Analytics / AI API Service'
        ]
      }
    ];
  } else if (lowerRole.includes('react') || lowerRole.includes('frontend') || lowerRole.includes('ui/ux') || lowerRole.includes('web development')) {
    milestoneTemplates = [
      {
        title: `Milestone 1: Modern JavaScript (ES6+), DOM & Core Web Fundamentals`,
        desc: `Master modern ECMAScript standards, asynchronous promises, closures, and browser execution mechanics.`,
        tags: ['ES6+', 'Async/Await', 'DOM API', 'Closures'],
        topics: [
          'Modern JavaScript Syntax: Arrow Functions, Destructuring, Spread & Rest Operators',
          'Asynchronous Programming: Promises, Async/Await & Event Loop Microtasks',
          'Closures, Lexical Scoping & the "this" Keyword Execution Context',
          'DOM Manipulation, Event Bubbling & Performance Optimization',
          'Fetch API, Axios & HTTP Request / Response Lifecycle'
        ]
      },
      {
        title: `Milestone 2: React Core: JSX, Components, Props & State Management`,
        desc: `Build dynamic, reusable user interfaces using React functional components and declarative rendering.`,
        tags: ['React 18', 'JSX', 'Components', 'Props'],
        topics: [
          'React Mental Model: Declarative UI, Virtual DOM & Reconciliation',
          'Functional Components, JSX Syntax & Conditional Rendering',
          'Props Passing, Prop Drilling & Component Composition Patterns',
          'useState Hook: State Immutability, Batch Updates & Form Handling',
          'Styling Architecture: CSS Modules, Styled Components & Tailwind CSS'
        ]
      },
      {
        title: `Milestone 3: Advanced React Hooks & Lifecycle Effects`,
        desc: `Manage complex side effects, asynchronous data fetching, and component performance memoization.`,
        tags: ['useEffect', 'useMemo', 'useCallback', 'useRef'],
        topics: [
          'useEffect Hook: Dependency Arrays, Cleanup Functions & Race Condition Prevention',
          'useRef Hook: DOM References & Mutable Values Across Re-renders',
          'Performance Optimization: useMemo, useCallback & React.memo',
          'Custom Hooks: Extracting & Sharing Reusable Business Logic',
          'Error Boundaries & Suspense for Asynchronous Component Loading'
        ]
      },
      {
        title: `Milestone 4: Global State Management, Routing & API Integration`,
        desc: `Architect scalable client-side routing, global context stores, and automated server-state caching.`,
        tags: ['React Router', 'Context API', 'Zustand', 'TanStack Query'],
        topics: [
          'Client-Side Routing with React Router v6: Dynamic Routes, Layouts & Loaders',
          'Global State Architecture: React Context API vs Zustand / Redux Toolkit',
          'Server State Management with TanStack Query (React Query): Caching & Invalidation',
          'Form Architecture with React Hook Form & Zod Schema Validation',
          'Authentication Flow: Protected Routes, JWT Interceptors & Session Handling'
        ]
      },
      {
        title: `Milestone 5: Next.js Fullstack Framework & Server-Side Rendering`,
        desc: `Build production-grade hybrid web applications using Next.js App Router, SSR, and Server Components.`,
        tags: ['Next.js', 'App Router', 'SSR / SSG', 'Server Components'],
        topics: [
          'Next.js 14+ App Router: Server Components vs Client Components',
          'Rendering Strategies: Static Site Generation (SSG), SSR & Incremental Static Regeneration',
          'Next.js Route Handlers (API Routes) & Server Actions',
          'Search Engine Optimization (SEO): Metadata API, OpenGraph & Core Web Vitals',
          'Image Optimization with next/image & Font Optimization'
        ]
      },
      {
        title: `Milestone 6: Testing, CI/CD & Production Capstone Project`,
        desc: `Write automated tests with Jest and React Testing Library, and deploy high-performance applications.`,
        tags: ['Jest', 'RTL', 'CI/CD', 'Vercel Deployment'],
        topics: [
          'Unit & Component Testing with Jest and React Testing Library (RTL)',
          'End-to-End Testing Basics with Playwright / Cypress',
          'Accessibility (a11y) Standards: ARIA Roles, Keyboard Navigation & Contrast',
          'Automated CI/CD Pipeline & Deployment on Vercel / Cloudflare Pages',
          'Full-Featured Enterprise SaaS / E-Commerce Production Capstone Project'
        ]
      }
    ];
  } else if (lowerRole.includes('data structure') || lowerRole.includes('algorithm') || lowerRole.includes('dsa') || lowerRole.includes('coding')) {
    milestoneTemplates = [
      {
        title: `Milestone 1: Arrays, Strings, Two Pointers & Sliding Window`,
        desc: `Build foundational problem-solving intuition and master linear data structure algorithmic patterns.`,
        tags: ['Arrays', 'Strings', 'Two Pointers', 'Sliding Window'],
        topics: [
          'Time & Space Complexity Analysis: Asymptotic Big-O Notation',
          'Arrays & Dynamic Arrays: Memory Layout & In-Place Operations',
          'Two Pointer Technique: Opposite-Direction & Same-Direction Pointers',
          'Fixed & Dynamic Sliding Window Patterns for Subarray / Substring Problems',
          'Prefix Sum & Suffix Sum Arrays for Range Query Optimization'
        ]
      },
      {
        title: `Milestone 2: Hash Maps, Stacks, Queues & Linked Lists`,
        desc: `Master amortized constant-time lookup tables, LIFO/FIFO structures, and pointer manipulation.`,
        tags: ['Hash Tables', 'Stacks', 'Queues', 'Linked Lists'],
        topics: [
          'Hash Tables: Collision Resolution (Chaining vs Open Addressing) & Hash Functions',
          'Monotonic Stack & Queue Patterns for Next Greater / Smaller Element',
          'Singly & Doubly Linked Lists: Reversal, Cycle Detection (Floyd Algorithm)',
          'Queue Implementation & Circular Queues',
          'Design Problem: Least Recently Used (LRU) Cache Implementation'
        ]
      },
      {
        title: `Milestone 3: Recursion, Backtracking & Binary Search`,
        desc: `Divide and conquer complex problem spaces and search sorted search spaces in logarithmic time.`,
        tags: ['Binary Search', 'Recursion', 'Backtracking'],
        topics: [
          'Binary Search Algorithm: Exact Match, Lower Bound & Upper Bound Variations',
          'Binary Search on Answer / Solution Space Optimization Problems',
          'Recursion Call Stack Mechanics, Base Cases & Recurrence Relations',
          'Backtracking: Subsets, Permutations, Combinations & N-Queens Problem',
          'Pruning Branching Trees for Optimal Search Efficiency'
        ]
      },
      {
        title: `Milestone 4: Trees, Binary Search Trees & Heaps (Priority Queues)`,
        desc: `Navigate hierarchical tree structures and priority heaps for top-K optimization problems.`,
        tags: ['Binary Trees', 'BST', 'Heaps', 'Tree Traversal'],
        topics: [
          'Binary Tree Traversals: Inorder, Preorder, Postorder & Level-Order (BFS)',
          'Binary Search Tree Properties, Validations & In-Order Successor / Predecessor',
          'Lowest Common Ancestor (LCA) in Binary Trees & BSTs',
          'Max-Heap & Min-Heap Implementations: Heapify, Insert & Extract-Max/Min',
          'Top-K Frequent Elements & K-th Largest Element in an Array'
        ]
      },
      {
        title: `Milestone 5: Graph Algorithms: BFS, DFS, Dijkstra & Topological Sort`,
        desc: `Model interconnected networks and solve shortest path, cycle detection, and connectivity queries.`,
        tags: ['Graphs', 'BFS / DFS', 'Dijkstra', 'Topological Sort'],
        topics: [
          'Graph Representations: Adjacency List vs Adjacency Matrix',
          'Breadth-First Search (BFS) for Shortest Path in Unweighted Graphs',
          'Depth-First Search (DFS) for Connected Components & Cycle Detection',
          'Topological Sort using Kahn Algorithm (BFS) & DFS with In-Degree Arrays',
          'Dijkstra Algorithm for Single-Source Shortest Path in Weighted Graphs'
        ]
      },
      {
        title: `Milestone 6: Dynamic Programming & High-Difficulty Interview Mastery`,
        desc: `Formulate optimal substructure transitions and master 1D/2D memoization and tabulation.`,
        tags: ['Dynamic Programming', 'Memoization', 'Tabulation', 'Interview Prep'],
        topics: [
          'Dynamic Programming Mental Model: Overlapping Subproblems & Optimal Substructure',
          '1D Dynamic Programming: Fibonacci, Climbing Stairs & House Robber Patterns',
          '2D Dynamic Programming: Longest Common Subsequence (LCS) & Edit Distance',
          '0/1 Knapsack & Unbounded Knapsack Problem Variations',
          'Comprehensive Live Technical Coding Interview Mock Simulation'
        ]
      }
    ];
  } else {
    // Custom role track: progressive, concrete 5-milestone structure
    milestoneTemplates = [
      {
        title: `Milestone 1: Fundamentals, Core Tools & Environment for ${cleanRole}`,
        desc: `Establish core foundational principles, essential tools, workflows, and workspace configuration for ${cleanRole}.`,
        tags: [`${cleanRole} Basics`, 'Environment', 'Core Principles'],
        topics: [
          `Fundamental concepts, core terminology and foundational principles for ${cleanRole}`,
          `Tooling setup, standard operating procedures and workflow configuration`,
          `Essential methods, baseline rules and industry standards for ${cleanRole}`,
          `Hands-on introductory lab exercise and competency check`
        ]
      },
      {
        title: `Milestone 2: Applied Architecture & Core Workflows in ${cleanRole}`,
        desc: `Develop practical working mechanics, structural patterns, and execution methodologies specific to ${cleanRole}.`,
        tags: [`${cleanRole} Architecture`, 'Workflows', 'Execution'],
        topics: [
          `Operational execution flow and structural architectural patterns in ${cleanRole}`,
          `Key frameworks, modules and domain mechanisms`,
          `Practical implementation exercises and scenario-based tasks`,
          `Intermediate milestone lab project build`
        ]
      },
      {
        title: `Milestone 3: Advanced Optimization & Industry Standards for ${cleanRole}`,
        desc: `Master intricate techniques, diagnostic workflows, quality standards, and high-performance practices.`,
        tags: [`${cleanRole} Optimization`, 'Best Practices', 'Diagnostics'],
        topics: [
          `Advanced patterns, performance tuning and optimization in ${cleanRole}`,
          `Diagnostic analysis, common failure points and preventive controls`,
          `Quality assurance and adherence to industry best practices`,
          `Comprehensive technical assessment and code/work review`
        ]
      },
      {
        title: `Milestone 4: Automation, Security & Integration in ${cleanRole}`,
        desc: `Learn integration standards, automation methods, security compliance, and resilience testing.`,
        tags: [`${cleanRole} Integration`, 'Automation', 'Compliance'],
        topics: [
          `Integration architectures, interfaces and communication protocols in ${cleanRole}`,
          `Automated workflows, verification testing and reliability standards`,
          `Security controls, risk management and operational compliance`,
          `Multi-module integration project build`
        ]
      },
      {
        title: `Milestone 5: Enterprise Capstone Project & Portfolio Mastery for ${cleanRole}`,
        desc: `Design and deliver an end-to-end production-grade capstone project establishing portfolio-level excellence.`,
        tags: [`${cleanRole} Capstone`, 'Portfolio', 'Production Deployment'],
        topics: [
          `End-to-end enterprise capstone project architecture for ${cleanRole}`,
          `Production validation, performance profiling and final polish`,
          `Documentation, executive presentation and professional portfolio showcase`,
          `Comprehensive career readiness and mock interview drill`
        ]
      }
    ];
  }

  return milestoneTemplates.map((m, idx) => {
    const step = idx + 1;
    const isFirst = step === 1;

    return {
      id: step,
      title: m.title,
      desc: m.desc,
      status: isFirst ? 'in-progress' : 'locked',
      progress: 0,
      tags: m.tags || [`${cleanRole} Step ${step}`],
      topics: m.topics,
      syllabus: generateRoleSpecificSyllabus(cleanRole, m.title, step, currentSkills),
      videos: generateRoleSpecificVideos(cleanRole, m.title, m.topics, step),
      resources: generateRoleSpecificResources(cleanRole, m.title, step),
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

  const prompt = `You are a Principal Coding Instructor and Technical Curriculum Architect.
Create a highly specific, authentic, hands-on coding challenge strictly focused on the topic: "${cleanTopic}" (from module: "${cleanTitle}") tailored for a student aspiring to become a "${cleanRole}".

CRITICAL REQUIREMENTS:
1. STRICT TOPIC RELEVANCE:
   - The challenge MUST directly test practical implementation of "${cleanTopic}".
   - NEVER provide a generic "iterate through numbers array" problem.
   - If topic relates to React / State / Hooks: Ask to write a functional React component with useState/useEffect. Language: "react".
   - If topic relates to HTML5 / CSS3 / Flexbox: Ask to build a modern responsive layout or UI element. Language: "html".
   - If topic relates to SQL / Relational Databases: Ask to write a SQL query (JOINs, aggregations, schema). Language: "sql" or "node".
   - If topic relates to Python / Data / AI: Ask to solve a Python data processing challenge with dictionaries, list comprehensions, or helper functions. Language: "python".
   - If topic relates to Java / OOP: Ask to implement a class with encapsulation, inheritance, or method dispatch. Language: "java".
   - If topic relates to Data Structures & Algorithms: Ask to solve a canonical problem for that structure (e.g. Two Pointers, Binary Search, Stack, Tree traversal). Language: "node", "python", "cpp", or "java".
   - If topic relates to Backend / APIs / Node.js: Ask to implement a request handler, middleware, or data validation logic. Language: "node".

2. REALISTIC PROBLEM STATEMENT:
   - Provide a clear, engaging 2-3 sentence problem description with requirements and constraints.

3. CONCRETE SAMPLE INPUT & EXPECTED OUTPUT:
   - Provide realistic sample input and expected sample output.

4. WORKING STARTER CODE:
   - Provide boilerplate code with function signature, helpful inline comments, and a runnable test invocation at the bottom so clicking "Run Code" produces clean console output immediately.

Output ONLY valid JSON strictly matching this schema without markdown backticks:
{
  "title": "Hands-on Challenge: Specific Topic Title for ${cleanTopic}",
  "prompt": "Detailed challenge statement explaining what function/component to build...",
  "sampleInput": "Concrete input data...",
  "sampleOutput": "Concrete expected output...",
  "starterCode": "// Starter code with instructions\\nfunction solve() {\\n  // Your implementation\\n}\\n",
  "solutionCode": "// Reference solution...",
  "language": "node"
}`;

  try {
    const parsed = await generateJSON(prompt, {
      system: 'You are an AI coding exercise generator. Output valid JSON strictly matching the practice challenge schema with 100% topic relevance.',
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

  return generateTopicSpecificPracticeFallback(cleanTopic, cleanTitle, cleanRole);
};

export function generateTopicSpecificPracticeFallback(cleanTopic, cleanTitle, cleanRole) {
  const lower = `${cleanTopic} ${cleanTitle} ${cleanRole}`.toLowerCase();

  // 1. React / Frontend Hooks & UI
  if (lower.includes("react") || lower.includes("hook") || lower.includes("state") || lower.includes("component")) {
    return {
      title: `Hands-on React Challenge: Build an Interactive Component for ${cleanTopic}`,
      prompt: `Develop a functional React component demonstrating ${cleanTopic}. Implement state management using React hooks, handle user interactions (like increment, decrement, and reset or filtering), and verify the live interactive UI in the Live Preview pane.`,
      sampleInput: `Interactive button clicks & user input state transitions`,
      sampleOutput: `Live Web Preview: Renders responsive styled React component with real-time state feedback`,
      starterCode: `// React Interactive Playground for: ${cleanTopic}
import React, { useState } from 'react';

export default function InteractiveApp() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState([]);

  const handleUpdate = (delta) => {
    const newCount = count + delta;
    setCount(newCount);
    setHistory(prev => [...prev.slice(-4), \`Updated to \${newCount} at \${new Date().toLocaleTimeString()}\`]);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: '400px', margin: '20px auto', background: '#ffffff', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>${cleanTopic}</h3>
      <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px' }}>Current State: <strong style={{ color: '#4f46e5', fontSize: '18px' }}>{count}</strong></p>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => handleUpdate(1)} style={{ padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Increment</button>
        <button onClick={() => handleUpdate(-1)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>- Decrement</button>
        <button onClick={() => { setCount(0); setHistory([]); }} style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Reset</button>
      </div>

      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>STATE EVENT LOG:</span>
        <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '12px', color: '#475569' }}>
          {history.length === 0 ? <li>No actions yet. Click a button!</li> : history.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}`,
      solutionCode: `// Complete solution for React State management`,
      language: "react"
    };
  }

  // 2. HTML / CSS / Responsive Layouts
  if (lower.includes("html") || lower.includes("css") || lower.includes("flexbox") || lower.includes("grid") || lower.includes("layout")) {
    return {
      title: `Hands-on Web Design Challenge: ${cleanTopic}`,
      prompt: `Write modern HTML5 markup and modern CSS3 styles for ${cleanTopic}. Structure the page elements with semantic tags, use Flexbox or Grid for alignment, and preview your layout live in the Live Web Preview pane.`,
      sampleInput: `HTML5 semantic markup with CSS Flexbox styles`,
      sampleOutput: `Live Web Preview: Displays a polished, responsive styled UI card with hover effects`,
      starterCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${cleanTopic} Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      margin: 0;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      max-width: 360px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 30px rgba(79, 70, 229, 0.12);
    }
    .badge {
      display: inline-block;
      background: #eef2ff;
      color: #4f46e5;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    h2 { margin: 0 0 8px; color: #0f172a; font-size: 20px; }
    p { margin: 0 0 16px; color: #64748b; font-size: 14px; line-height: 1.5; }
    .btn {
      display: block;
      width: 100%;
      text-align: center;
      background: #4f46e5;
      color: #ffffff;
      font-weight: 600;
      padding: 10px 0;
      border-radius: 8px;
      text-decoration: none;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <article class="card">
    <span class="badge">TOPIC MODULE</span>
    <h2>${cleanTopic}</h2>
    <p>Semantic HTML5 and CSS3 styling demonstration for ${cleanRole}. Flexbox provides flexible alignment across viewport sizes.</p>
    <a href="#" class="btn">Explore Module</a>
  </article>
</body>
</html>`,
      solutionCode: `<!-- Solution code for HTML/CSS flexbox -->`,
      language: "html"
    };
  }

  // 3. SQL / Database
  if (lower.includes("sql") || lower.includes("database") || lower.includes("query") || lower.includes("join") || lower.includes("table")) {
    return {
      title: `Hands-on SQL Challenge: Queries & Joins for ${cleanTopic}`,
      prompt: `Write a database query or data manipulation function for ${cleanTopic}. The function should take records from two related datasets (e.g., users and orders) and perform an inner join, computing the total transaction value per user.`,
      sampleInput: `users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}], orders = [{userId: 1, amount: 250}, {userId: 1, amount: 150}, {userId: 2, amount: 400}]`,
      sampleOutput: `Expected: [{ userId: 1, name: 'Alice', totalSpent: 400 }, { userId: 2, name: 'Bob', totalSpent: 400 }]`,
      starterCode: `// SQL / Relational Data Processing Challenge: ${cleanTopic}

function executeRelationalJoin(users, orders) {
  // TODO: Perform join on users.id === orders.userId and aggregate totalSpent per user
  const result = [];
  
  for (const user of users) {
    const userOrders = orders.filter(o => o.userId === user.id);
    const totalSpent = userOrders.reduce((sum, o) => sum + o.amount, 0);
    result.push({
      userId: user.id,
      name: user.name,
      orderCount: userOrders.length,
      totalSpent: totalSpent
    });
  }

  return result;
}

// Sample Test Data
const sampleUsers = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" }
];

const sampleOrders = [
  { id: 101, userId: 1, amount: 120 },
  { id: 102, userId: 1, amount: 80 },
  { id: 103, userId: 2, amount: 350 },
  { id: 104, userId: 3, amount: 95 }
];

console.log("Executing Relational Aggregation for: ${cleanTopic}...");
const report = executeRelationalJoin(sampleUsers, sampleOrders);
console.log("Query Result:", JSON.stringify(report, null, 2));
`,
      solutionCode: `// Reference solution`,
      language: "node"
    };
  }

  // 4. Python / AI / Data Processing
  if (lower.includes("python") || lower.includes("ai") || lower.includes("data") || lower.includes("ml")) {
    return {
      title: `Hands-on Python Challenge: ${cleanTopic}`,
      prompt: `Implement a clean Python function that processes data for ${cleanTopic}. Your code should validate input entries, compute statistical aggregations (count, average, top frequency), and return a structured dictionary summary.`,
      sampleInput: `Data records: [15, 22, 15, 45, 22, 15, 60, 30]`,
      sampleOutput: `{'total_count': 8, 'average': 28.0, 'most_frequent': 15, 'status': 'OPTIMIZED'}`,
      starterCode: `# Python Implementation for: ${cleanTopic}
from typing import List, Dict, Any
from collections import Counter

def process_metrics_pipeline(values: List[int]) -> Dict[str, Any]:
    """Processes numeric data pipeline with statistical aggregation."""
    if not values:
        return {"total_count": 0, "average": 0.0, "status": "EMPTY"}

    # Statistical computation
    total = sum(values)
    avg = total / len(values)
    counts = Counter(values)
    most_common_val, _ = counts.most_common(1)[0]

    return {
        "topic": "${cleanTopic}",
        "total_count": len(values),
        "total_sum": total,
        "average": round(avg, 2),
        "most_frequent": most_common_val,
        "status": "SUCCESS"
    }

# Test execution:
test_data = [15, 22, 15, 45, 22, 15, 60, 30]
print("Running Python Pipeline for: ${cleanTopic}...")
result = process_metrics_pipeline(test_data)
print("Result Summary:", result)
`,
      solutionCode: `# Reference solution`,
      language: "python"
    };
  }

  // 5. Default Specialized Engineering Challenge
  return {
    title: `Hands-on Challenge: Implement ${cleanTopic} Algorithm`,
    prompt: `Develop a solution applying the fundamental principles of ${cleanTopic} for ${cleanRole}. Your function should accept input parameters, handle edge cases, and return the processed result with clean console output.`,
    sampleInput: `Input: [12, 45, 7, 23, 56, 89, 34]`,
    sampleOutput: `Expected: { topic: "${cleanTopic}", processedCount: 7, maxValue: 89, minValue: 7, sorted: [7, 12, 23, 34, 45, 56, 89] }`,
    starterCode: `// Algorithmic Challenge for: ${cleanTopic}
// Role: ${cleanRole}

function executeModuleTask(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { status: "EMPTY", items: [] };
  }

  // Process and sort dataset
  const sorted = [...items].sort((a, b) => a - b);
  const minVal = sorted[0];
  const maxVal = sorted[sorted.length - 1];

  return {
    topic: "${cleanTopic}",
    processedCount: items.length,
    minValue: minVal,
    maxValue: maxVal,
    sorted: sorted,
    status: "VERIFIED"
  };
}

// Sample test run
const inputData = [12, 45, 7, 23, 56, 89, 34];
console.log("Executing task for ${cleanTopic}...");
const output = executeModuleTask(inputData);
console.log("Output Result:", JSON.stringify(output, null, 2));
`,
    solutionCode: `// Solution code`,
    language: "node"
  };
}

/**
 * Generates deep, crystal-clear educational theory for a milestone topic using AI
 */
export const generateMilestoneTheoryAI = async (milestoneTitle, targetRole = '') => {
  const cleanTitle = String(milestoneTitle || '').replace(/^Milestone\s*\d+\s*:\s*/i, '').trim();
  const cleanRole = String(targetRole || '').trim() || 'Software Engineering';

  const prompt = `You are an extraordinary Computer Science Educator, Senior Staff Engineer, and Author (in the pedagogy style of top authors and clean-code educators).
Generate a comprehensive, crystal-clear, highly educational theory guide specifically for the topic: "${cleanTitle}" tailored for the role: "${cleanRole}".

CRITICAL PEDAGOGICAL MISSION:
The user is a student or learner reading this guide so they can 100% UNDERSTAND "${cleanTitle}".
When reading this theory, the student must have an "Aha!" moment and be able to clearly explain:
1. What is this topic? (Explain in plain English with a relatable everyday real-world analogy so the concept clicks immediately).
2. Why do we need it? (What real-world problem does it solve in modern applications? What goes wrong without it?).
3. How does it work under the hood? (Step-by-step execution lifecycle, flow of data, components, and mechanics).
4. Practical Code Walkthrough: (A clean, fully functional, realistic code snippet with comments on every important line explaining how it works).
5. Common Mistakes to Avoid: (The top 2-3 traps or bugs beginners create with this topic and the exact fix).
6. Industry Best Practices & Senior Takeaways: (Production rules used by senior engineers at top tech companies).

MANDATORY 4-LEVEL PEDAGOGICAL STRUCTURE (Strictly in this order):
1. SECTION 1 [Level 1: Core Concept & Real-World Intuition]
   - "level": "Level 1: Core Concept & Real-World Intuition"
   - "levelBadge": "Intuition"
   - "title": Engaging title explaining what "${cleanTitle}" is in simple terms
   - "explanation": 3-4 sentence plain-English explanation introducing the concept, why it exists, and an intuitive real-world analogy (e.g. comparing an API to a restaurant waiter, Git to video game save points, CSS Flexbox to arranging items on a conveyor belt, database indexes to book indexes).
   - "points": 4-5 bullet points starting with bold tags:
     * "**What It Is:** [Simple, memorable plain-English definition]"
     * "**Real-World Analogy:** [Relatable everyday analogy that cements the mental model]"
     * "**The Problem It Solves:** [Why we need it and the headaches developers face without it]"
     * "**Core Mental Model:** [How to think about and visualize this concept intuitively]"
   - "takeaway": High-impact foundational rule or mental model to remember forever.

2. SECTION 2 [Level 2: Working Mechanics & Step-by-Step Flow]
   - "level": "Level 2: Working Mechanics & Step-by-Step Flow"
   - "levelBadge": "Mechanics"
   - "title": Specific technical title for the operational lifecycle and workflow of "${cleanTitle}"
   - "explanation": Step-by-step breakdown of how "${cleanTitle}" actually operates when executed, how data moves through it, and the key components involved.
   - "points": 4-5 bullet points starting with bold tags:
     * "**Step-by-Step Execution:** [Clear sequence of actions from start to finish]"
     * "**Key Building Blocks:** [The essential keywords, components, parameters, or methods]"
     * "**Data & State Transitions:** [How inputs transform into outputs]"
     * "**Standard Patterns:** [The idiomatic, clean way developers structure this in real projects]"
   - "takeaway": Practical rule for writing clean, structured code with "${cleanTitle}".

3. SECTION 3 [Level 3: Deep Core Internals & Architecture]
   - "level": "Level 3: Deep Core Internals & Architecture"
   - "levelBadge": "Core Internals"
   - "title": Specific technical title naming the underlying engine, runtime, or architectural mechanics of "${cleanTitle}"
   - "explanation": Under-the-hood explanation of how the engine, runtime, VM, database, or operating system executes this behind the scenes.
   - "points": 4-5 bullet points starting with bold tags:
     * "**Under-the-Hood Engine:** [How the runtime, compiler, or browser processes this]"
     * "**Memory & Resource Mechanics:** [How memory, handles, or system resources are allocated]"
     * "**Performance & Big-O Complexity:** [Time/Space efficiency, latency impact, or throughput]"
     * "**Underlying Guarantees:** [Thread safety, immutability, or consistency mechanics]"
   - "takeaway": Low-level optimization rule to write high-performance code.

4. SECTION 4 [Level 4: Common Pitfalls & Senior Best Practices]
   - "level": "Level 4: Common Pitfalls & Senior Best Practices"
   - "levelBadge": "Advanced Mastery"
   - "title": Specific technical title covering beginner traps, debugging, and production standards for "${cleanTitle}"
   - "explanation": Detailed analysis of common mistakes developers make with "${cleanTitle}", how subtle bugs happen, and how senior engineers build resilient production applications.
   - "points": 4-5 bullet points starting with bold tags:
     * "**Common Beginner Trap #1:** [The mistake, why it happens, and how to fix it]"
     * "**Common Beginner Trap #2:** [Another subtle bug or anti-pattern and the solution]"
     * "**Defensive Edge-Cases:** [How to handle unexpected inputs, nulls, or failures safely]"
     * "**Senior Engineering Checklist:** [Verification criteria for shipping to production]"
   - "takeaway": Golden takeaway rule for writing production-grade code.

CODE EXAMPLE REQUIREMENT:
- "codeExample": Provide a REAL, fully functional, beautifully commented code snippet specifically for "${cleanTitle}".
  * Show basic usage first, then demonstrate an idiomatic, production-grade pattern.
  * Every important line MUST have an inline comment explaining what it does so the student learns by reading the code.
  * Must be 100% relevant to "${cleanTitle}". Never output generic placeholder code.

Output ONLY valid JSON strictly matching this schema without markdown fences:
{
  "title": "Master Guide to ${cleanTitle}: Concept, Mechanics & Production",
  "overview": "Comprehensive 2-3 paragraph educational overview explaining ${cleanTitle} simply, why it is essential for ${cleanRole}, and what the student will master...",
  "difficultyProgression": "1. Intuition & Concept ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
  "sections": [
    {
      "level": "Level 1: Core Concept & Real-World Intuition",
      "levelBadge": "Intuition",
      "title": "Understanding ${cleanTitle}: What It Is & Why It Matters",
      "explanation": "Plain English explanation with real-world analogy...",
      "points": [
        "**What It Is:** Plain English definition...",
        "**Real-World Analogy:** Relatable comparison...",
        "**The Problem It Solves:** Real-world problem addressed...",
        "**Core Mental Model:** How to visualize this concept..."
      ],
      "takeaway": "Actionable foundational takeaway..."
    },
    {
      "level": "Level 2: Working Mechanics & Step-by-Step Flow",
      "levelBadge": "Mechanics",
      "title": "How ${cleanTitle} Works: Lifecycle & Architecture",
      "explanation": "Detailed step-by-step breakdown of how it works...",
      "points": [
        "**Step-by-Step Execution:** Sequential flow...",
        "**Key Building Blocks:** Essential components...",
        "**Data & State Transitions:** Transformations...",
        "**Standard Patterns:** Idiomatic usage..."
      ],
      "takeaway": "Actionable design takeaway..."
    },
    {
      "level": "Level 3: Deep Core Internals & Architecture",
      "levelBadge": "Core Internals",
      "title": "Under the Hood: Engine Internals & Performance of ${cleanTitle}",
      "explanation": "Under the hood deep dive...",
      "points": [
        "**Under-the-Hood Engine:** Runtime mechanics...",
        "**Memory & Resource Mechanics:** Allocations and lifecycle...",
        "**Performance & Big-O Complexity:** Efficiency bounds...",
        "**Underlying Guarantees:** Concurrency or state guarantees..."
      ],
      "takeaway": "Actionable optimization takeaway..."
    },
    {
      "level": "Level 4: Common Pitfalls & Senior Best Practices",
      "levelBadge": "Advanced Mastery",
      "title": "Mistakes to Avoid & Senior Best Practices for ${cleanTitle}",
      "explanation": "Common pitfalls and production standards...",
      "points": [
        "**Common Beginner Trap #1:** The mistake and fix...",
        "**Common Beginner Trap #2:** The anti-pattern and fix...",
        "**Defensive Edge-Cases:** Resilience checks...",
        "**Senior Engineering Checklist:** Production rules..."
      ],
      "takeaway": "Actionable production takeaway..."
    }
  ],
  "codeExample": "// Fully commented working code for ${cleanTitle}...",
  "bestPractices": [
    "Specific production rule 1...",
    "Specific production rule 2...",
    "Specific production rule 3...",
    "Specific production rule 4..."
  ]
}`;

  try {
    const parsed = await generateJSON(prompt, {
      system: 'You are an extraordinary Computer Science Educator and Senior Staff Architect. Output valid JSON strictly matching the 4-tier educational theory schema. Prioritize crystal-clear pedagogical explanations that make the concept click instantly for the student.',
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

export function generateRoleSpecificTheoryFallback(cleanTitle, cleanRole) {
  const lower = `${cleanTitle} ${cleanRole}`.toLowerCase();

  // 1. React / Frontend Hooks & State
  if (lower.includes("hook") || lower.includes("state") || lower.includes("react") || lower.includes("component")) {
    return {
      title: `Master Guide to ${cleanTitle}: Concept, Mechanics & Production`,
      overview: `${cleanTitle} is a cornerstone of modern frontend web engineering in React. In modern user interfaces, components need to remember data—like user inputs, modal toggles, or fetched API responses—and re-render the view whenever that data changes. This guide breaks down how state and lifecycle work from intuitive mental models to Virtual DOM reconciliation and senior production practices.`,
      difficultyProgression: "1. Intuition & Concept ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
      sections: [
        {
          level: "Level 1: Core Concept & Real-World Intuition",
          levelBadge: "Intuition",
          title: `Understanding ${cleanTitle}: What It Is & Why It Matters`,
          explanation: `${cleanTitle} gives React components a memory. In regular JavaScript functions, local variables disappear when the function finishes running. In React, state hooks instruct the React runtime to preserve values across consecutive renders.`,
          points: [
            `**What It Is:** A declarative mechanism that binds reactive data to the user interface, automatically re-rendering when updated.`,
            `**Real-World Analogy:** Think of component state like a digital scoreboard at a basketball match. Whenever points are scored (state update), the scoreboard instantly refreshes without having to rebuild the entire stadium.`,
            `**The Problem It Solves:** In traditional vanilla JS, updating a UI required manually selecting DOM elements and mutating them (document.getElementById.innerText = ...). State makes the UI a direct reflection of data: UI = f(state).`,
            `**Core Mental Model:** Never mutate state directly. Always treat state values as read-only snapshots and call updater functions to schedule transitions.`
          ],
          takeaway: "State represents a snapshot of your component at a single moment in time. When state updates, React re-invokes the component with the new snapshot."
        },
        {
          level: "Level 2: Working Mechanics & Step-by-Step Flow",
          levelBadge: "Mechanics",
          title: `How ${cleanTitle} Works: Lifecycle, Re-renders & State Transitions`,
          explanation: `When a state setter is invoked, React enqueues the update, schedules a re-render, re-executes the component function, and reconciles the new output with the browser DOM.`,
          points: [
            `**Step-by-Step Execution:** 1. User interacts (clicks button) ➔ 2. State setter called with new value ➔ 3. React schedules component re-render ➔ 4. Function re-executes with new state snapshot ➔ 5. Virtual DOM diffed and minimal browser DOM updated.`,
            `**Key Building Blocks:** Declare state with \`const [value, setValue] = useState(initialState)\`, or use \`useReducer\` for complex multi-step state machines.`,
            `**Batching & Asynchronous Updates:** React batches multiple state updates executed inside the same event loop tick to prevent multiple jarring re-renders.`,
            `**Standard Patterns:** Keep state as close as possible to the component that uses it. Lift state up only when sibling components genuinely need to share it.`
          ],
          takeaway: "State updates are scheduled, not applied instantaneously within the current function line. Always use functional updates `setVal(prev => prev + 1)` when depending on prior state."
        },
        {
          level: "Level 3: Deep Core Internals & Architecture",
          levelBadge: "Core Internals",
          title: `Under the Hood: React Fiber Tree, Hook Linked-Lists & Reconciliation`,
          explanation: `React stores hook states in a singly linked list attached to the component's Fiber node. The order of hook calls is the single source of truth for their identity.`,
          points: [
            `**Under-the-Hood Engine:** Each component instance is represented by a Fiber object in memory. Hook records are linked sequentially (hook.next).`,
            `**Why Rules of Hooks Exist:** Because React matches state to hooks strictly by their call order, hooks must NEVER be placed inside conditionals, loops, or nested functions.`,
            `**Fiber Reconciliation Diffing:** React uses an O(N) heuristic diffing algorithm to compare the new virtual tree against the old one, patching only changed browser nodes.`,
            `**Memory & Garbage Collection:** Unmounted component Fibers are detached and reclaimed by the browser's Garbage Collector.`
          ],
          takeaway: "Never call hooks conditionally. Hook call order must remain 100% deterministic between every render cycle."
        },
        {
          level: "Level 4: Common Pitfalls & Senior Best Practices",
          levelBadge: "Advanced Mastery",
          title: `Mistakes to Avoid & Senior Best Practices for ${cleanTitle}`,
          explanation: `Mastering state requires avoiding infinite re-render loops, stale closures in effect hooks, and unnecessary re-render waterfalls.`,
          points: [
            `**Common Beginner Trap #1 (Direct Mutation):** Doing \`state.items.push(newItem)\` mutates the existing reference, so React fails to detect the change. Solution: Always return a new array or object (\`[...prev, newItem]\`).`,
            `**Common Beginner Trap #2 (Stale Closures):** Capturing an old state variable inside a \`setInterval\` or \`useEffect\` without listing it in the dependency array. Solution: Use functional updates (\`setCount(c => c + 1)\`).`,
            `**Defensive Edge-Cases:** Provide sensible initial state values (e.g., empty array \`[]\` instead of \`null\`) to prevent runtime 'Cannot read properties of undefined' errors.`,
            `**Senior Engineering Checklist:** Derive state whenever possible instead of storing redundant state (e.g. calculate \`fullName = firstName + ' ' + lastName\` on the fly rather than keeping a third state).`
          ],
          takeaway: "Don't put values in state if they can be calculated on the fly during render from existing props or state."
        }
      ],
      codeExample: `// Production-Grade React Implementation: ${cleanTitle}
import React, { useState, useCallback, useMemo } from 'react';

export default function InteractiveCounterModule() {
  // Level 1: Declarative state with clean initial primitives
  const [items, setItems] = useState([
    { id: 1, title: 'Master Core Concepts', completed: true },
    { id: 2, title: 'Understand Execution Flow', completed: false }
  ]);
  const [inputValue, setInputValue] = useState('');

  // Level 2: Functional updater to avoid stale state bugs
  const handleToggleItem = useCallback((id) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return; // Defensive validation

    const newItem = {
      id: Date.now(),
      title: inputValue.trim(),
      completed: false
    };

    // Level 4 Best Practice: Immutable state update via spread operator
    setItems((prev) => [...prev, newItem]);
    setInputValue('');
  };

  // Level 3: Memoized computation to avoid wasteful recalculations
  const completedCount = useMemo(() => {
    return items.filter((item) => item.completed).length;
  }, [items]);

  return (
    <div style={{ padding: '20px', background: '#0f172a', color: '#f8fafc', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 10px', color: '#38bdf8' }}>${cleanTitle} - Interactive Demo</h3>
      <p style={{ color: '#94a3b8', fontSize: '14px' }}>
        Progress: {completedCount} of {items.length} completed
      </p>

      <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a new milestone item..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }}
        />
        <button type="submit" style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          Add Item
        </button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item) => (
          <li key={item.id} onClick={() => handleToggleItem(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer', borderBottom: '1px solid #1e293b' }}>
            <span>{item.completed ? '✅' : '⏳'}</span>
            <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#64748b' : '#f8fafc' }}>
              {item.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      bestPractices: [
        "Treat all React state as strictly immutable; always use spread syntax or functional updaters.",
        "Derive values dynamically during rendering instead of keeping duplicate synchronized state.",
        "Keep state as local as possible to prevent wide, expensive component re-render trees.",
        "Never call hooks conditionally or inside loops to guarantee deterministic Fiber linked-list lookups."
      ]
    };
  }

  // 2. SQL & Databases
  if (lower.includes("sql") || lower.includes("database") || lower.includes("query") || lower.includes("join") || lower.includes("mongo")) {
    return {
      title: `Master Guide to ${cleanTitle}: Concept, Mechanics & Production`,
      overview: `${cleanTitle} is a foundational pillar of database management and backend architecture. Whether managing user profiles, transaction logs, or relational entities, understanding how data is organized, queried, indexed, and preserved with ACID guarantees is essential for building scalable applications.`,
      difficultyProgression: "1. Intuition & Concept ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
      sections: [
        {
          level: "Level 1: Core Concept & Real-World Intuition",
          levelBadge: "Intuition",
          title: `Understanding ${cleanTitle}: What It Is & Why It Matters`,
          explanation: `${cleanTitle} allows software systems to store, structure, and retrieve persistent information reliably. Relational databases organize information into strongly typed tables with relationships, guaranteeing integrity.`,
          points: [
            `**What It Is:** A structured system and query language designed to store, manage, and query structured data with transactional guarantees.`,
            `**Real-World Analogy:** Think of a relational database like a massive excel ledger maintained by a strict bank auditor. Every account has an exact schema, and money can never be deducted from one account without successfully being added to another (ACID transactions).`,
            `**The Problem It Solves:** Without structured databases, storing data in raw text or JSON files causes data corruption, race conditions during simultaneous writes, and terrible search performance as datasets grow.`,
            `**Core Mental Model:** Tables represent entities (e.g. Users, Orders). Foreign keys represent relationships. Indexes represent sorted lookups for lightning-fast search.`
          ],
          takeaway: "Design your schema around data integrity and entity relationships first, before attempting query micro-optimizations."
        },
        {
          level: "Level 2: Working Mechanics & Step-by-Step Flow",
          levelBadge: "Mechanics",
          title: `How ${cleanTitle} Works: Query Parsing, Execution Plans & Joins`,
          explanation: `When a client sends a SQL query, the database server parses the syntax, compiles an optimized execution plan using cost-based metrics, reads pages into the buffer pool, and returns the result set.`,
          points: [
            `**Step-by-Step Execution:** 1. Query received ➔ 2. Parser validates syntax & permissions ➔ 3. Query Optimizer evaluates index statistics and plans join order ➔ 4. Storage Engine fetches data pages from RAM buffer or disk ➔ 5. Rows filtered, sorted, and returned to client.`,
            `**Key Building Blocks:** Primary Keys (unique identifier), Foreign Keys (referential integrity), JOIN operations (INNER, LEFT, RIGHT), and Aggregations (GROUP BY, SUM, COUNT).`,
            `**JOIN Mechanics:** INNER JOIN returns records that match in both tables; LEFT JOIN returns all rows from the primary table plus matched rows from the secondary table.`,
            `**Transactions & ACID:** Atomicity (all or nothing), Consistency (valid states), Isolation (concurrent safety), and Durability (persisted to disk).`
          ],
          takeaway: "Always inspect queries with `EXPLAIN` or `EXPLAIN ANALYZE` to ensure queries leverage indexes rather than executing full-table sequential scans."
        },
        {
          level: "Level 3: Deep Core Internals & Architecture",
          levelBadge: "Core Internals",
          title: `Under the Hood: B-Tree Indexes, Write-Ahead Logs (WAL) & Buffer Pools`,
          explanation: `Relational databases use B-Tree and B+Tree disk data structures for logarithmic O(log N) searches and Write-Ahead Logging (WAL) to ensure crash recovery.`,
          points: [
            `**Under-the-Hood Engine:** Data is stored in fixed-size blocks (pages, typically 8KB to 16KB). The database keeps frequent pages cached in memory in the Buffer Pool.`,
            `**B+Tree Indexing:** Intermediate nodes store navigation keys, while leaf nodes store pointers to rows or table clusters linked together sequentially for fast range scans.`,
            `**Write-Ahead Logging (WAL):** Modifications are written sequentially to a crash-recovery log on disk before being applied to data pages in memory, guaranteeing durability at high speed.`,
            `**Locking & Concurrency:** Multi-Version Concurrency Control (MVCC) allows readers to read consistent snapshots without blocking concurrent writers.`
          ],
          takeaway: "Adding too many indexes speeds up reads but slows down INSERT, UPDATE, and DELETE operations because every write must update all related B-Trees."
        },
        {
          level: "Level 4: Common Pitfalls & Senior Best Practices",
          levelBadge: "Advanced Mastery",
          title: `Mistakes to Avoid & Senior Best Practices for ${cleanTitle}`,
          explanation: `Poor database access patterns cause severe application latency bottlenecks. Senior engineers guard against N+1 query problems and SQL injection vulnerabilities.`,
          points: [
            `**Common Beginner Trap #1 (The N+1 Query Problem):** Fetching 50 items and then issuing 50 separate queries inside a loop to fetch their child relations. Fix: Use single JOINs or batching (e.g. \`WHERE id IN (...)\`).`,
            `**Common Beginner Trap #2 (SQL Injection):** Concatenating raw user inputs into query strings. Fix: Always use parameterized queries / prepared statements (e.g. \`db.query('SELECT * FROM users WHERE id = ?', [userId])\`).`,
            `**Defensive Edge-Cases:** Always enforce foreign key cascade constraints cautiously, and wrap multiple interdependent database operations inside a formal transaction (\`BEGIN ... COMMIT\`).`,
            `**Senior Engineering Checklist:** Use pagination (LIMIT / OFFSET or Keyset Cursor) for large datasets; never run unrestricted \`SELECT * FROM table\` in production.`
          ],
          takeaway: "Never concatenate raw user input into SQL queries; always use parameterized statements to prevent catastrophic SQL injection attacks."
        }
      ],
      codeExample: `-- Production SQL Schema & Query Blueprint for: ${cleanTitle}

-- Level 1 & 2: Relational Schema with Constraints
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Level 2: Foreign Key constraint enforces relational integrity
    CONSTRAINT fk_member_dept FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE CASCADE,
        
    -- Level 3: Composite Index for fast filtering and sorting
    INDEX idx_dept_status (department_id, status)
);

-- Level 2 & 4: Optimized Parametric Reporting Query with Joins & Aggregations
-- Explains how to fetch department metrics without N+1 query bottlenecks
SELECT 
    d.id AS department_id,
    d.name AS department_name,
    COUNT(m.id) AS total_active_members,
    COALESCE(AVG(m.salary), 0) AS average_salary
FROM departments d
LEFT JOIN team_members m 
    ON d.id = m.department_id AND m.status = 'active'
GROUP BY d.id, d.name
HAVING COUNT(m.id) > 0
ORDER BY total_active_members DESC;`,
      bestPractices: [
        "Always use prepared statements / parameterized queries to completely eliminate SQL injection risks.",
        "Add indexes to columns used frequently in WHERE clauses, JOIN conditions, and ORDER BY fields.",
        "Prevent N+1 query anti-patterns by utilizing eager JOINs or batched IN queries in your backend API.",
        "Wrap all multi-table business mutations inside explicit database transactions with rollback handlers."
      ]
    };
  }

  // 3. Git, Version Control & DevOps
  if (lower.includes("git") || lower.includes("github") || lower.includes("docker") || lower.includes("devops") || lower.includes("ci/cd")) {
    return {
      title: `Master Guide to ${cleanTitle}: Concept, Mechanics & Production`,
      overview: `${cleanTitle} is an indispensable discipline for professional software engineering. In modern engineering teams, multiple engineers write code concurrently. Understanding version control, branching strategies, automated testing, and deployment pipelines ensures code changes can be tracked, merged, and shipped reliably without breaking production systems.`,
      difficultyProgression: "1. Intuition & Concept ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
      sections: [
        {
          level: "Level 1: Core Concept & Real-World Intuition",
          levelBadge: "Intuition",
          title: `Understanding ${cleanTitle}: What It Is & Why It Matters`,
          explanation: `${cleanTitle} provides a distributed time-machine and collaboration hub for software projects. Every commit captures a snapshot of the codebase at a specific point in history.`,
          points: [
            `**What It Is:** A distributed version control system that tracks file modifications and enables seamless branch-based team collaboration.`,
            `**Real-World Analogy:** Think of Git like a video game save system with parallel universes. Every commit is a checkpoint you can travel back to, and branches are parallel universes where you experiment with new quests without risking your main world.`,
            `**The Problem It Solves:** Before version control, teams shared code by emailing zip files (project_final_v2_new.zip), leading to overwritten code, lost work, and zero audit trails of who made what change.`,
            `**Core Mental Model:** Working Directory (where you edit) ➔ Staging Area (what you prepare to commit) ➔ Local Repository (saved history) ➔ Remote (shared GitHub cloud).`
          ],
          takeaway: "Make small, atomic commits that do one thing well with clear, descriptive commit messages."
        },
        {
          level: "Level 2: Working Mechanics & Step-by-Step Flow",
          levelBadge: "Mechanics",
          title: `How ${cleanTitle} Works: Branching, Merging & Pull Requests`,
          explanation: `In standard feature-branch workflows, developers branch off the main branch, make atomic commits, push to remote repositories, and open Pull Requests for peer review before merging.`,
          points: [
            `**Step-by-Step Execution:** 1. \`git checkout -b feature/auth\` ➔ 2. Make code edits ➔ 3. \`git add .\` to stage changes ➔ 4. \`git commit -m 'feat: implement JWT authentication'\` ➔ 5. \`git push origin feature/auth\` ➔ 6. Open Pull Request on GitHub.`,
            `**Key Building Blocks:** Branches (lightweight movable pointers to commits), HEAD (pointer to currently checked out branch), Merge (combining branch histories), and Rebase (re-applying commits on top of another base).`,
            `**Merge Conflicts:** Occur when two branches modify the exact same line in a file. Git pauses and highlights conflict markers (\`<<<<<<< HEAD\`), requiring the developer to choose the correct final code.`,
            `**Standard Conventions:** Adopt Conventional Commits (\`feat:\`, \`fix:\`, \`docs:\`, \`refactor:\`) to maintain an automated, machine-readable changelog.`
          ],
          takeaway: "Always pull the latest changes from main into your branch before opening a Pull Request to resolve conflicts early."
        },
        {
          level: "Level 3: Deep Core Internals & Architecture",
          levelBadge: "Core Internals",
          title: `Under the Hood: Git Directed Acyclic Graph (DAG) & Content-Addressable Storage`,
          explanation: `Under the hood, Git is a content-addressable key-value store. Git stores all data as immutable objects identified by their SHA-1/SHA-256 hash.`,
          points: [
            `**The 4 Core Git Objects:** Blobs (raw file contents), Trees (directories and file names), Commits (metadata, author, timestamp, parent pointer), and Tags.`,
            `**Directed Acyclic Graph (DAG):** Commits form an immutable directed graph where each commit node points backward to its parent commit(s).`,
            `**Branches are Just Pointers:** A branch in Git is simply a 41-byte text file inside \`.git/refs/heads/\` containing the 40-character SHA hash of the latest commit. Creating a branch is instantaneous (O(1) time).`,
            `**Garbage Collection:** Orphaned commits (unreachable by any branch or tag) are eventually cleaned up by \`git gc\` via the reflog.`
          ],
          takeaway: "Because branches are just lightweight 40-byte pointers, creating and switching branches in Git is practically free in CPU and memory."
        },
        {
          level: "Level 4: Common Pitfalls & Senior Best Practices",
          levelBadge: "Advanced Mastery",
          title: `Mistakes to Avoid & Senior Best Practices for ${cleanTitle}`,
          explanation: `Careless Git habits can leak sensitive secrets, destroy commit histories, or paralyze continuous deployment pipelines.`,
          points: [
            `**Common Beginner Trap #1 (Committing Secrets):** Committing \`.env\` files containing API keys or database passwords to public repositories. Fix: Always configure a robust \`.gitignore\` file before your very first commit.`,
            `**Common Beginner Trap #2 (Force Pushing to Main):** Running \`git push --force\` on shared production branches overwrites your teammates' commits. Fix: Enable Branch Protection Rules in GitHub settings.`,
            `**Defensive Edge-Cases:** Use \`git stash\` to temporarily park uncommitted work when you need to switch branches urgently without creating sloppy half-baked commits.`,
            `**Senior Engineering Checklist:** Squash or rebase messy exploratory commits into clean logical units before merging into production.`
          ],
          takeaway: "Never commit API keys or credentials; always verify your `.gitignore` is properly configured before staging files."
        }
      ],
      codeExample: `# Professional Git & CI/CD Terminal Workflow: ${cleanTitle}

# 1. Start fresh from up-to-date main branch
git checkout main
git pull origin main

# 2. Create and switch to a descriptive feature branch
git checkout -b feature/user-profile-module

# 3. Work on changes, check status and differences
git status
git diff

# 4. Stage specific files (never blindly stage secrets or binaries)
git add src/components/UserProfile.jsx
git add src/styles/UserProfile.css

# 5. Commit with semantic, clear commit message
git commit -m "feat(profile): add responsive user badge and college metadata"

# 6. Rebase on latest main if teammate merged code in the interim
git fetch origin
git rebase origin/main

# 7. Push to GitHub and set upstream tracking
git push -u origin feature/user-profile-module

# 8. If merge conflict happens during rebase, resolve files and continue:
# git status
# (edit conflicted files and remove markers)
# git add src/components/UserProfile.jsx
# git rebase --continue`,
      bestPractices: [
        "Configure `.gitignore` immediately to prevent secret credentials and node_modules from being tracked.",
        "Keep commits atomic: each commit should represent a single cohesive, working change.",
        "Never run `git push --force` on main or shared branches; use branch protection rules.",
        "Write meaningful commit messages following Conventional Commits (e.g. `feat:`, `fix:`, `refactor:`)."
      ]
    };
  }

  // 4. Default Comprehensive & Educational Fallback for Any Role/Topic
  return {
    title: `Master Guide to ${cleanTitle}: Concept, Mechanics & Production`,
    overview: `Comprehensive master curriculum for ${cleanTitle} tailored specifically for ${cleanRole}. This guide systematically guides you from foundational intuition, real-world analogies, and core definitions up to step-by-step operational mechanics, underlying architectural principles, and senior production standards.`,
    difficultyProgression: "1. Intuition & Concept ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
    sections: [
      {
        level: "Level 1: Core Concept & Real-World Intuition",
        levelBadge: "Intuition",
        title: `Understanding ${cleanTitle}: What It Is & Why It Matters`,
        explanation: `${cleanTitle} is a foundational concept essential for mastering ${cleanRole}. Having a clear mental model of what it does and why it was created is the key to mastering its practical application.`,
        points: [
          `**What It Is:** A fundamental methodology and structural construct in ${cleanRole} that organizes workflows, ensures reliability, and solves domain challenges.`,
          `**Real-World Analogy:** Think of ${cleanTitle} like a standardized architectural blueprint in construction. Without blueprints, builders work with conflicting measurements and structural flaws emerge; with blueprints, every artisan coordinates smoothly.`,
          `**The Problem It Solves:** Eliminates chaotic ad-hoc implementations, reduces operational bugs, and establishes a standardized, repeatable approach to solving problems.`,
          `**Core Mental Model:** Understand the inputs required, the transformation that takes place, and the guaranteed output delivered.`
        ],
        takeaway: "Always understand what problem a tool or concept solves before attempting to implement complex advanced variations."
      },
      {
        level: "Level 2: Working Mechanics & Step-by-Step Flow",
        levelBadge: "Mechanics",
        title: `How ${cleanTitle} Works: Operational Lifecycle & Execution`,
        explanation: `In daily practice, ${cleanTitle} operates through structured sequential stages. Following this standardized workflow ensures consistency and peak efficiency.`,
        points: [
          `**Step-by-Step Execution:** 1. Initialization & requirement validation ➔ 2. Core parameter processing ➔ 3. Execution of business logic ➔ 4. Verification and quality assurance ➔ 5. Delivery and output logging.`,
          `**Key Building Blocks:** The core components, standard parameters, and configuration options required to achieve the desired outcome.`,
          `**Data & State Transitions:** How input data is validated, transformed, and packaged for downstream consumption.`,
          `**Standard Patterns:** The industry-accepted patterns and idioms that professionals adhere to in day-to-day work.`
        ],
        takeaway: "Break complex workflows down into small, verifiable operational steps with explicit validation checks."
      },
      {
        level: "Level 3: Deep Core Internals & Architecture",
        levelBadge: "Core Internals",
        title: `Under the Hood: Architecture, Resource Management & Performance`,
        explanation: `Under the surface, ${cleanTitle} relies on specific resource allocation models, throughput pipelines, and execution dependencies that govern its scalability.`,
        points: [
          `**Under-the-Hood Engine:** The underlying architecture and structural dependencies that drive execution.`,
          `**Memory & Resource Lifecycle:** How resources, connections, or state allocations are managed to prevent bottlenecks or leaks.`,
          `**Performance & Big-O Efficiency:** How processing time scales as volume increases, and the architectural levers used to maintain sub-second responsiveness.`,
          `**Systemic Guarantees:** Consistency checks, fail-safe fallbacks, and fault isolation mechanisms.`
        ],
        takeaway: "Anticipate how your system behaves under peak load by designing for asynchronous processing and resource pooling."
      },
      {
        level: "Level 4: Common Pitfalls & Senior Best Practices",
        levelBadge: "Advanced Mastery",
        title: `Mistakes to Avoid & Senior Best Practices for ${cleanTitle}`,
        explanation: `Real-world production environments require defensive planning, clean error boundaries, and proactive risk mitigation.`,
        points: [
          `**Common Beginner Trap #1:** Skipping input validation at system boundaries, leading to cascading runtime failures. Fix: Always sanitize and validate inputs upfront.`,
          `**Common Beginner Trap #2:** Over-engineering simple requirements with unnecessary layers of complexity. Fix: Favor simplicity and readability over premature optimization.`,
          `**Defensive Edge-Cases:** Handle unexpected edge cases, null or empty states, and network timeouts gracefully with clear user feedback.`,
          `**Senior Engineering Checklist:** Follow clean code conventions, maintain comprehensive automated tests, and document non-obvious architecture decisions.`
        ],
        takeaway: "Keep code and architectures simple, defensively validate all inputs at the perimeter, and profile under real-world loads."
      }
    ],
    codeExample: `// Professional Implementation Blueprint for: ${cleanTitle}
/**
 * Role: ${cleanRole}
 * Module: ${cleanTitle}
 * Purpose: Demonstrates clear, robust, production-ready execution with defensive handling
 */

class ProductionModule {
  constructor(name) {
    if (!name || typeof name !== 'string') {
      throw new Error("Invalid module name: A non-empty string is required.");
    }
    this.name = name;
    this.records = [];
  }

  // Level 2: Controlled operational method with input validation
  addRecord(record) {
    if (!record || typeof record !== 'object') {
      console.warn("[Module] Skipped invalid record payload.");
      return false;
    }
    this.records.push({
      ...record,
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // Level 3 & 4: Defensive processing with O(N) efficiency
  executePipeline() {
    if (this.records.length === 0) {
      return { status: "EMPTY", count: 0, items: [] };
    }

    console.log(\`[Pipeline] Processing \${this.records.length} items for \${this.name}...\`);
    
    // Clean transformation without side-effects
    const processed = this.records.map((item, idx) => ({
      index: idx + 1,
      id: item.id || \`rec_\${idx + 1}\`,
      processedAt: item.timestamp
    }));

    return {
      status: "SUCCESS",
      count: processed.length,
      module: this.name,
      items: processed
    };
  }
}

// Example Execution:
const moduleInstance = new ProductionModule("${cleanTitle}");
moduleInstance.addRecord({ id: 101, title: "Foundational Setup" });
moduleInstance.addRecord({ id: 102, title: "Applied Implementation" });
const outcome = moduleInstance.executePipeline();
console.log("✅ Execution Result:", outcome);`,
    bestPractices: [
      "Master fundamental mental models and core definitions before implementing advanced features.",
      "Defensively validate inputs and boundaries to catch errors early and gracefully.",
      "Structure workflows into modular, reusable components with single responsibilities.",
      "Profile performance and resource allocations under real production load conditions."
    ]
  };
}
