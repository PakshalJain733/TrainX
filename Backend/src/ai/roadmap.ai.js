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
/**
 * Validates and sanitizes generated practice problems and test cases for strict logical consistency.
 * Prevents mixing of problem types (e.g. palindrome true/false outputs on string-reversal problems).
 */
export function validateAndSanitizePracticeProblem(problem, context = {}) {
  if (!problem || typeof problem !== 'object') return problem;

  const combinedText = `${problem.title || ''} ${problem.prompt || ''} ${problem.description || ''} ${context.topic || ''} ${context.title || ''}`.toLowerCase();
  
  const isPalindromeProblem = combinedText.includes('palindrome');
  const isStringReversalProblem = (combinedText.includes('reverse') || combinedText.includes('reversal')) && !isPalindromeProblem;
  const isCaseConversionProblem = (combinedText.includes('uppercase') || combinedText.includes('lowercase') || combinedText.includes('capitalize')) && !isPalindromeProblem;

  // 1. STRING REVERSAL SANITIZATION
  if (isStringReversalProblem) {
    let currentInput = String(problem.sampleInput || 'hello').trim();
    const cleanedInputMatch = currentInput.match(/["']?([a-zA-Z0-9_\s!@#$%^&*()-]+)["']?/);
    const cleanWord = (cleanedInputMatch && cleanedInputMatch[1]) ? cleanedInputMatch[1].trim() : 'hello';
    const reversedWord = cleanWord.split('').reverse().join('');

    const outputStr = String(problem.sampleOutput || '').trim().toLowerCase();
    // If output is boolean (true/false) or does not contain the reversed string, replace with actual reversed string
    if (outputStr === 'true' || outputStr === 'false' || outputStr === 'boolean' || (!outputStr.includes(reversedWord.toLowerCase()) && (outputStr.includes('true') || outputStr.includes('false')))) {
      problem.sampleInput = cleanWord;
      problem.sampleOutput = reversedWord;
    }

    // Fix starterCode if it has boolean comparison e.g. console.log(reverseString("hello") === "olleh")
    if (problem.starterCode) {
      problem.starterCode = problem.starterCode
        .replace(/console\.log\(\s*([a-zA-Z0-9_]+)\(([^)]+)\)\s*===?\s*[^)]+\)/g, 'console.log($1($2))')
        .replace(/print\(\s*([a-zA-Z0-9_]+)\(([^)]+)\)\s*==\s*[^)]+\)/g, 'print($1($2))');
    }

    // Sanitize test cases: ensure each expectedOutput is the actual reversed string of its input
    const fallbackWords = ['hello', 'world', 'TrainX', '12345'];
    if (Array.isArray(problem.testCases) && problem.testCases.length > 0) {
      problem.testCases = problem.testCases.map((tc, idx) => {
        let tcInput = String(tc.input || '').trim();
        const tcMatch = tcInput.match(/["']?([a-zA-Z0-9_\s!@#$%^&*()-]+)["']?/);
        const tcWord = (tcMatch && tcMatch[1]) ? tcMatch[1].trim() : (tcInput || fallbackWords[idx % fallbackWords.length]);
        const tcReversed = tcWord.split('').reverse().join('');
        return {
          id: tc.id || idx + 1,
          input: `"${tcWord}"`,
          output: tcReversed,
          expected_output: tcReversed,
          expectedOutput: tcReversed,
          is_hidden: idx >= 2,
          isHidden: idx >= 2,
          description: `Reverses "${tcWord}" to "${tcReversed}"`
        };
      });
      while (problem.testCases.length < 4) {
        const idx = problem.testCases.length;
        const w = fallbackWords[idx % fallbackWords.length];
        const rev = w.split('').reverse().join('');
        problem.testCases.push({
          id: idx + 1,
          input: `"${w}"`,
          output: rev,
          expected_output: rev,
          expectedOutput: rev,
          is_hidden: true,
          isHidden: true,
          description: `Reverses "${w}" to "${rev}"`
        });
      }
    } else {
      problem.testCases = fallbackWords.map((w, idx) => ({
        id: idx + 1,
        input: `"${w}"`,
        output: w.split('').reverse().join(''),
        expected_output: w.split('').reverse().join(''),
        expectedOutput: w.split('').reverse().join(''),
        is_hidden: idx >= 2,
        isHidden: idx >= 2,
      }));
    }
  }

  // 2. PALINDROME PROBLEM SANITIZATION
  if (isPalindromeProblem) {
    let currentInput = String(problem.sampleInput || 'racecar').trim();
    const cleanWord = currentInput.replace(/["']/g, '').trim() || 'racecar';
    const cleanAlphanum = cleanWord.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isPal = cleanAlphanum === cleanAlphanum.split('').reverse().join('');
    const outputStr = String(problem.sampleOutput || '').trim().toLowerCase();

    // Palindrome check MUST return boolean true or false
    if (!outputStr.includes('true') && !outputStr.includes('false')) {
      problem.sampleInput = cleanWord;
      problem.sampleOutput = String(isPal);
    }

    // Sanitize test cases to be strictly boolean
    const palWords = [
      { word: 'racecar', isPal: true },
      { word: 'hello', isPal: false },
      { word: 'A man, a plan, a canal: Panama', isPal: true },
      { word: 'TrainX', isPal: false },
    ];
    if (Array.isArray(problem.testCases) && problem.testCases.length > 0) {
      problem.testCases = problem.testCases.map((tc, idx) => {
        const fallback = palWords[idx % palWords.length];
        const tcWord = String(tc.input || fallback.word).replace(/["']/g, '').trim();
        const tcClean = tcWord.toLowerCase().replace(/[^a-z0-9]/g, '');
        const tcIsPal = tcClean === tcClean.split('').reverse().join('');
        return {
          id: tc.id || idx + 1,
          input: `"${tcWord}"`,
          output: String(tcIsPal),
          expected_output: String(tcIsPal),
          expectedOutput: String(tcIsPal),
          is_hidden: idx >= 2,
          isHidden: idx >= 2,
          description: `Checks whether "${tcWord}" is a palindrome (${tcIsPal})`
        };
      });
      while (problem.testCases.length < 4) {
        const idx = problem.testCases.length;
        const item = palWords[idx % palWords.length];
        problem.testCases.push({
          id: idx + 1,
          input: `"${item.word}"`,
          output: String(item.isPal),
          expected_output: String(item.isPal),
          expectedOutput: String(item.isPal),
          is_hidden: true,
          isHidden: true,
          description: `Checks whether "${item.word}" is a palindrome (${item.isPal})`
        });
      }
    } else {
      problem.testCases = palWords.map((item, idx) => ({
        id: idx + 1,
        input: `"${item.word}"`,
        output: String(item.isPal),
        expected_output: String(item.isPal),
        expectedOutput: String(item.isPal),
        is_hidden: idx >= 2,
        isHidden: idx >= 2,
        description: `Checks whether "${item.word}" is a palindrome (${item.isPal})`
      }));
    }
  }

  // 3. CASE CONVERSION SANITIZATION
  if (isCaseConversionProblem) {
    let currentInput = String(problem.sampleInput || 'hello world').trim();
    const cleanWord = currentInput.replace(/["']/g, '').trim();
    const outputStr = String(problem.sampleOutput || '').trim().toLowerCase();
    if (outputStr === 'true' || outputStr === 'false') {
      if (combinedText.includes('uppercase')) {
        problem.sampleOutput = cleanWord.toUpperCase();
      } else if (combinedText.includes('lowercase')) {
        problem.sampleOutput = cleanWord.toLowerCase();
      }
    }
  }

  // 4. UNIFIED LEETCODE COMPILER METADATA (Function Signatures & Test Cases)
  if (!problem.function_name) {
    if (isStringReversalProblem) problem.function_name = 'reverseString';
    else if (isPalindromeProblem) problem.function_name = 'isPalindrome';
    else if (isCaseConversionProblem) problem.function_name = 'convertCase';
    else {
      const fnMatch = String(problem.starterCode || '').match(/(?:function|def)\s+([a-zA-Z0-9_]+)/);
      problem.function_name = fnMatch ? fnMatch[1] : 'solve';
    }
  }

  const fnName = problem.function_name;

  if (!problem.starter_templates) {
    problem.starter_templates = {
      node: `// Implement the function\nfunction ${fnName}(input) {\n  // Write your code here\n  \n}\n`,
      python: `# Implement the function\ndef ${fnName}(input):\n    # Write your code here\n    pass\n`,
      java: `class Solution {\n    public String ${fnName}(String input) {\n        // Write your code here\n        return "";\n    }\n}\n`,
      cpp: `class Solution {\npublic:\n    string ${fnName}(string input) {\n        // Write your code here\n        return "";\n    }\n};\n`
    };
  }

  // Ensure testCases has at least 4 test cases (2 visible + 2 hidden)
  if (!Array.isArray(problem.testCases) || problem.testCases.length < 4) {
    const sIn = problem.sampleInput || 'sample';
    const sOut = problem.sampleOutput || 'sample';
    const existing = Array.isArray(problem.testCases) ? problem.testCases : [];
    const baseCases = [
      ...existing,
      { input: `"${sIn}"`, output: sOut, expected_output: sOut, is_hidden: false },
      { input: `"${sIn} 2"`, output: `${sOut} 2`, expected_output: `${sOut} 2`, is_hidden: false },
      { input: `"${sIn} hidden 1"`, output: `${sOut} hidden 1`, expected_output: `${sOut} hidden 1`, is_hidden: true },
      { input: `"${sIn} hidden 2"`, output: `${sOut} hidden 2`, expected_output: `${sOut} hidden 2`, is_hidden: true },
    ].slice(0, 4);

    problem.testCases = baseCases.map((tc, idx) => ({
      id: tc.id || idx + 1,
      input: tc.input,
      output: tc.output || tc.expected_output,
      expected_output: tc.expected_output || tc.output,
      expectedOutput: tc.expected_output || tc.output,
      is_hidden: idx >= 2,
      isHidden: idx >= 2,
    }));
  }

  return problem;
}

export const generateMilestonePracticeAI = async (milestoneTitle, targetRole = '', topic = '', options = {}) => {
  const cleanTitle = String(milestoneTitle || '').replace(/^Milestone\s*\d+\s*:\s*/i, '').trim();
  const cleanRole = String(targetRole || '').trim() || 'Software Engineering';
  const cleanTopic = String(topic || cleanTitle).trim();
  const { milestoneIndex = 1, difficulty: customDifficulty, topics = [], description = '' } = options || {};
  const mIdx = Math.max(1, parseInt(milestoneIndex, 10) || 1);

  const difficultyMap = {
    1: 'Beginner (Syntax, Variables, Basic Conditionals & Fundamentals)',
    2: 'Elementary (Functions, Loops, Control Flow & Basic Data Collections)',
    3: 'Intermediate (Data Structures, Object-Oriented Principles & Component State)',
    4: 'Advanced (Algorithms, Asynchronous Logic, APIs & Relational Integrity)',
    5: 'Expert (Architecture, Optimizations, Resiliency & Production Systems)',
  };
  const difficulty = customDifficulty || difficultyMap[mIdx] || (mIdx > 5 ? 'Expert' : 'Intermediate');

  const topicsList = Array.isArray(topics) && topics.length > 0
    ? topics.map(t => typeof t === 'string' ? t : (t.title || JSON.stringify(t))).join('; ')
    : cleanTopic;

  const prompt = `You are a Principal Coding Instructor and Technical Curriculum Architect.
Create a highly specific, authentic, hands-on coding challenge strictly focused on Milestone ${mIdx}: "${cleanTopic}" (from module: "${cleanTitle}") tailored for a student aspiring to become a "${cleanRole}".

CRITICAL REQUIREMENTS:
1. STRICT MILESTONE CONFINEMENT & DIFFICULTY CALIBRATION:
   - Target Milestone Level: Milestone ${mIdx} (Difficulty: ${difficulty}).
   ${description ? `- Milestone Scope / Objectives: "${description}"` : ''}
   ${topicsList ? `- Milestone Topic Outline: ${topicsList}` : ''}
   - The challenge MUST strictly and exclusively focus on concepts covered within Milestone ${mIdx} ("${cleanTitle}").
   - DO NOT introduce, test, or mix topics from other milestones or advanced tiers.

2. DOMAIN & LANGUAGE ALIGNMENT:
   - The challenge MUST directly test practical implementation of "${cleanTopic}" at the Milestone ${mIdx} difficulty tier.
   - NEVER provide a generic "iterate through numbers array" problem.
   - If topic relates to React / State / Hooks: Ask to write a functional React component calibrated to milestone level. Language: "react".
   - If topic relates to HTML5 / CSS3 / Flexbox: Ask to build a modern responsive layout or UI element. Language: "html".
   - If topic relates to SQL / Relational Databases: Ask to write a SQL query (selection/filtering for early milestones, JOINs/aggregations for later milestones). Language: "sql" or "node".
   - If topic relates to Python / Data / AI: Ask to solve a Python data processing challenge with variables/arithmetic for M1, functions/loops for M2, dictionaries/OOP for M3, algorithms for M4+. Language: "python".
   - If topic relates to Java / OOP: Ask to implement a class or method matching the milestone difficulty. Language: "java".
   - If topic relates to Data Structures & Algorithms: Ask to solve a canonical problem matching the milestone tier. Language: "node", "python", "cpp", or "java".
   - If topic relates to Backend / APIs / Node.js: Ask to implement a request handler, middleware, or data validation logic. Language: "node".

3. REALISTIC PROBLEM STATEMENT:
   - Provide a clear, engaging 2-3 sentence problem description with requirements and constraints strictly matching Milestone ${mIdx}.

4. STRICT PROBLEM-TYPE AND EXPECTED OUTPUT CONSISTENCY:
   - Every sampleInput and expected sampleOutput MUST strictly match the exact problem statement.
   - STRING REVERSAL: If the problem asks to reverse a string (e.g. reverseString("hello")), the expected output MUST ALWAYS be the reversed string ("olleh"), NEVER a boolean true/false!
     * Example: Input "hello" -> Output "olleh". Input "world" -> Output "dlrow". Input "TrainX" -> Output "XniarT".
   - PALINDROME CHECK: If the problem asks to check whether a string is a palindrome (e.g. isPalindrome("racecar")), the output MUST be boolean true/false.
   - NEVER MIX EXAMPLES, TEST CASES, OR EXPECTED OUTPUTS FROM DIFFERENT PROBLEM TYPES. A string reversal challenge must NEVER contain palindrome true/false outputs.
   - TRANSFORMATION PROBLEMS: For any transformation, formatting, or math (case conversion, sorting, calculating totals), the expected output must be the transformed result itself, NEVER boolean validation flags.
   - The starterCode test invocation must print the actual return value (e.g. console.log(reverseString("hello"))), NEVER a boolean comparison assertion like console.log(reverseString("hello") === "olleh").

5. WORKING STARTER CODE & SOLUTION CODE:
   - Provide boilerplate code with function signature, helpful inline comments, and a runnable test invocation at the bottom so clicking "Run Code" produces clean console output immediately.
   - Solution code must be complete, correct, and directly solve the challenge.

Output ONLY valid JSON strictly matching this schema without markdown backticks:
{
  "title": "Hands-on Challenge: Specific Topic Title for ${cleanTopic}",
  "prompt": "Detailed challenge statement explaining what function/component to build...",
  "sampleInput": "Concrete input data...",
  "sampleOutput": "Concrete expected output matching the problem requirements...",
  "starterCode": "// Starter code with instructions\\nfunction solve() {\\n  // Your implementation\\n}\\n",
  "solutionCode": "// Reference solution...",
  "language": "node",
  "milestoneIndex": ${mIdx},
  "difficulty": "${difficulty}"
}`;

  try {
    const parsed = await generateJSON(prompt, {
      system: 'You are an AI coding exercise generator. Output valid JSON strictly matching the practice challenge schema with 100% topic, milestone difficulty, and expected output consistency.',
      temperature: 0.7,
      maxTokens: 3000,
      timeoutMs: 45000,
    });

    if (parsed && parsed.title && parsed.prompt) {
      return validateAndSanitizePracticeProblem(parsed, { topic: cleanTopic, title: cleanTitle });
    }
  } catch (err) {
    console.warn(`[AI Engine] Practice generation warning for Milestone ${mIdx} ("${cleanTopic}"): ${err.message}`);
  }

  const fallback = generateTopicSpecificPracticeFallback(cleanTopic, cleanTitle, cleanRole, { milestoneIndex: mIdx, difficulty });
  return validateAndSanitizePracticeProblem(fallback, { topic: cleanTopic, title: cleanTitle });
};

export function generateTopicSpecificPracticeFallback(cleanTopic, cleanTitle, cleanRole, options = {}) {
  const mIdx = Math.max(1, parseInt(options?.milestoneIndex, 10) || 1);
  const lower = `${cleanTopic} ${cleanTitle} ${cleanRole}`.toLowerCase();

  // 1. String Manipulation / Reversal / Palindrome
  if (lower.includes("string") || lower.includes("reverse") || lower.includes("reversal") || lower.includes("palindrome")) {
    const isPal = lower.includes("palindrome");
    if (isPal) {
      return {
        title: `Hands-on Challenge: Palindrome Verification (${cleanTopic})`,
        prompt: `Write a function isPalindrome(str) that checks whether a given string reads the same backwards as forwards. Return true if it is a palindrome, and false otherwise. Ignore non-alphanumeric characters and case. For example, "racecar" returns true, and "hello" returns false.`,
        sampleInput: `racecar`,
        sampleOutput: `true`,
        starterCode: `// Palindrome Verification for: ${cleanTopic}
function isPalindrome(str) {
  if (typeof str !== "string") return false;
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === clean.split("").reverse().join("");
}

// Test execution:
console.log(isPalindrome("racecar"));
`,
        solutionCode: `// Complete Palindrome solution`,
        language: "node",
        milestoneIndex: mIdx,
        difficulty: mIdx === 1 ? "Beginner" : "Elementary",
        testCases: [
          { input: "racecar", expectedOutput: "true", isHidden: false, description: "Standard palindrome" },
          { input: "hello", expectedOutput: "false", isHidden: false, description: "Non-palindrome" },
          { input: "madam", expectedOutput: "true", isHidden: true, description: "Word palindrome" }
        ]
      };
    }

    // String Reversal: Strictly return reversed string, NEVER boolean
    return {
      title: `Hands-on Challenge: String Reversal (${cleanTopic})`,
      prompt: `Write a function reverseString(str) that takes a string input and returns the reversed string. For example, reversing "hello" must produce "olleh", and reversing "world" must produce "dlrow". Do not return boolean validation values; return the actual reversed string.`,
      sampleInput: `hello`,
      sampleOutput: `olleh`,
      starterCode: `// String Reversal for: ${cleanTopic}
function reverseString(str) {
  if (typeof str !== "string") return "";
  return str.split("").reverse().join("");
}

// Test execution:
const result = reverseString("hello");
console.log(result);
`,
      solutionCode: `// Complete String Reversal solution`,
      language: "node",
      milestoneIndex: mIdx,
      difficulty: mIdx === 1 ? "Beginner" : "Elementary",
      testCases: [
        { input: "hello", expectedOutput: "olleh", isHidden: false, description: "Reverse hello" },
        { input: "world", expectedOutput: "dlrow", isHidden: false, description: "Reverse world" },
        { input: "TrainX", expectedOutput: "XniarT", isHidden: true, description: "Reverse TrainX" }
      ]
    };
  }

  // 1. React / Frontend Hooks & UI
  if (lower.includes("react") || lower.includes("hook") || lower.includes("state") || lower.includes("component")) {
    if (mIdx === 1) {
      return {
        title: `Hands-on React Challenge: Milestone 1 Component Basics (${cleanTopic})`,
        prompt: `Create a clean, functional React component for ${cleanTopic} that displays a user greeting card with a name, role badge, and active status. Verify your component renders properly in the Live Preview pane.`,
        sampleInput: `Props: { name: 'Alex Johnson', role: '${cleanRole}', status: 'Active' }`,
        sampleOutput: `Live Web Preview: Renders styled greeting card with user information and badge`,
        starterCode: `// React Milestone 1: Component Fundamentals for: ${cleanTopic}
import React from 'react';

export default function UserCard() {
  const user = {
    name: "Alex Johnson",
    role: "${cleanRole}",
    status: "Active"
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', maxWidth: '380px', margin: '20px auto', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Milestone 1 • Fundamentals</span>
      <h3 style={{ margin: '8px 0 4px', color: '#1e293b' }}>{user.name}</h3>
      <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '14px' }}>Target Role: <strong>{user.role}</strong></p>
      <div style={{ display: 'inline-block', padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
        Status: {user.status}
      </div>
    </div>
  );
}`,
        solutionCode: `// Complete Milestone 1 React Component`,
        language: "react",
        milestoneIndex: 1,
        difficulty: "Beginner"
      };
    }

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
      language: "react",
      milestoneIndex: mIdx,
      difficulty: mIdx === 2 ? "Elementary" : mIdx === 3 ? "Intermediate" : "Advanced"
    };
  }

  // 2. HTML / CSS / Responsive Layouts
  if (lower.includes("html") || lower.includes("css") || lower.includes("flexbox") || lower.includes("grid") || lower.includes("layout")) {
    return {
      title: `Hands-on Web Design Challenge: Milestone ${mIdx} Layout (${cleanTopic})`,
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
    <span class="badge">MILESTONE ${mIdx}</span>
    <h2>${cleanTopic}</h2>
    <p>Semantic HTML5 and CSS3 styling demonstration for ${cleanRole}. Flexbox provides flexible alignment across viewport sizes.</p>
    <a href="#" class="btn">Explore Module</a>
  </article>
</body>
</html>`,
      solutionCode: `<!-- Solution code for HTML/CSS flexbox -->`,
      language: "html",
      milestoneIndex: mIdx,
      difficulty: mIdx === 1 ? "Beginner" : "Elementary"
    };
  }

  // 3. SQL / Database
  if (lower.includes("sql") || lower.includes("database") || lower.includes("query") || lower.includes("join") || lower.includes("table")) {
    if (mIdx === 1) {
      return {
        title: `Hands-on SQL Challenge: Milestone 1 Basic Filtering (${cleanTopic})`,
        prompt: `Write a basic database query logic for ${cleanTopic}. Filter all active records from a collection and project only id, name, and role.`,
        sampleInput: `users = [{id: 1, name: 'Alice', active: true, role: 'Developer'}, {id: 2, name: 'Bob', active: false, role: 'Designer'}]`,
        sampleOutput: `Expected: [{ id: 1, name: 'Alice', role: 'Developer' }]`,
        starterCode: `// SQL Milestone 1: Basic Selection & Projection for: ${cleanTopic}

function queryActiveUsers(users) {
  if (!Array.isArray(users)) return [];
  return users
    .filter(u => u.active === true)
    .map(u => ({ id: u.id, name: u.name, role: u.role }));
}

// Sample Test Data
const sampleUsers = [
  { id: 1, name: "Alice", active: true, role: "Developer" },
  { id: 2, name: "Bob", active: false, role: "Designer" },
  { id: 3, name: "Charlie", active: true, role: "QA Engineer" }
];

console.log("Executing Milestone 1 Query for: ${cleanTopic}...");
const result = queryActiveUsers(sampleUsers);
console.log("Query Result:", JSON.stringify(result));
`,
        solutionCode: `// Milestone 1 SQL solution`,
        language: "node",
        milestoneIndex: 1,
        difficulty: "Beginner"
      };
    }

    return {
      title: `Hands-on SQL Challenge: Queries & Joins for ${cleanTopic}`,
      prompt: `Write a database query or data manipulation function for ${cleanTopic}. The function should take records from two related datasets (e.g., users and orders) and perform an inner join, computing the total transaction value per user.`,
      sampleInput: `users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}], orders = [{userId: 1, amount: 250}, {userId: 1, amount: 150}, {userId: 2, amount: 400}]`,
      sampleOutput: `Expected: [{ userId: 1, name: 'Alice', totalSpent: 400 }, { userId: 2, name: 'Bob', totalSpent: 400 }]`,
      starterCode: `// SQL / Relational Data Processing Challenge: ${cleanTopic}

function executeRelationalJoin(users, orders) {
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
      language: "node",
      milestoneIndex: mIdx,
      difficulty: mIdx <= 2 ? "Elementary" : "Intermediate"
    };
  }

  // 4. Python / AI / Data Processing
  if (lower.includes("python") || lower.includes("ai") || lower.includes("data") || lower.includes("ml")) {
    if (mIdx === 1) {
      return {
        title: `Hands-on Python Challenge: Milestone 1 Basics & Variables (${cleanTopic})`,
        prompt: `Write a beginner Python program for ${cleanTopic}. Calculate the total price of items including sales tax (8%). Define unit_price and quantity, compute subtotal and total, and print a formatted summary.`,
        sampleInput: `price = 20.0, quantity = 2, tax_rate = 0.08`,
        sampleOutput: `Bill Summary: {'subtotal': 40.0, 'tax': 3.2, 'total': 43.2, 'status': 'CALCULATED'}`,
        starterCode: `# Python Milestone 1: Beginner Fundamentals for: ${cleanTopic}
def calculate_bill(price: float, quantity: int, tax_rate: float = 0.08) -> dict:
    subtotal = round(price * quantity, 2)
    tax = round(subtotal * tax_rate, 2)
    total = round(subtotal + tax, 2)
    return {
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "status": "CALCULATED"
    }

# Test execution:
result = calculate_bill(20.0, 2)
print("Bill Summary:", result)
`,
        solutionCode: `# Complete Milestone 1 solution`,
        language: "python",
        milestoneIndex: 1,
        difficulty: "Beginner"
      };
    }

    if (mIdx === 2) {
      return {
        title: `Hands-on Python Challenge: Milestone 2 Functions & Loops (${cleanTopic})`,
        prompt: `Write a Python function for ${cleanTopic} that filters numbers above a given threshold from a list and computes their average.`,
        sampleInput: `numbers = [10, 25, 40, 15, 60], threshold = 20`,
        sampleOutput: `Filtered Summary: {'filtered_count': 3, 'average': 41.67, 'status': 'PROCESSED'}`,
        starterCode: `# Python Milestone 2: Functions & Iterations for: ${cleanTopic}
from typing import List, Dict, Any

def filter_and_average(numbers: List[float], threshold: float) -> Dict[str, Any]:
    filtered = [n for n in numbers if n > threshold]
    if not filtered:
        return {"filtered_count": 0, "average": 0.0, "status": "EMPTY"}
    avg = round(sum(filtered) / len(filtered), 2)
    return {
        "filtered_count": len(filtered),
        "average": avg,
        "status": "PROCESSED"
    }

# Test execution:
test_nums = [10, 25, 40, 15, 60]
result = filter_and_average(test_nums, 20)
print("Filtered Summary:", result)
`,
        solutionCode: `# Milestone 2 solution`,
        language: "python",
        milestoneIndex: 2,
        difficulty: "Elementary"
      };
    }

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
      language: "python",
      milestoneIndex: mIdx,
      difficulty: mIdx === 3 ? "Intermediate" : "Advanced"
    };
  }

  // 5. Default Specialized Engineering Challenge
  if (mIdx === 1) {
    return {
      title: `Hands-on Challenge: Milestone 1 Fundamentals (${cleanTopic})`,
      prompt: `Write a foundational JavaScript function for ${cleanTopic} that checks whether a numerical test score meets the passing threshold (>= 60) and returns a structured evaluation object.`,
      sampleInput: `score = 75`,
      sampleOutput: `Evaluation Result: {"score":75,"status":"PASSED","verdict":"Requirement Met"}`,
      starterCode: `// Milestone 1: Beginner Fundamentals for: ${cleanTopic}
// Role: ${cleanRole}

function evaluateScore(score) {
  const isPassing = typeof score === "number" && score >= 60;
  return {
    score: score,
    status: isPassing ? "PASSED" : "FAILED",
    verdict: isPassing ? "Requirement Met" : "Needs Retake"
  };
}

// Sample test run
const testScore = 75;
console.log("Executing Milestone 1 task for ${cleanTopic}...");
const output = evaluateScore(testScore);
console.log("Evaluation Result:", JSON.stringify(output));
`,
      solutionCode: `// Milestone 1 solution`,
      language: "node",
      milestoneIndex: 1,
      difficulty: "Beginner"
    };
  }

  if (mIdx === 2) {
    return {
      title: `Hands-on Challenge: Milestone 2 Logic & Functions (${cleanTopic})`,
      prompt: `Write a JavaScript function for ${cleanTopic} that iterates through a list of transactions, filters transactions above a given amount, and computes the total sum.`,
      sampleInput: `transactions = [50, 120, 30, 200, 80], threshold = 100`,
      sampleOutput: `Summary: {"count":2,"total":320,"status":"PROCESSED"}`,
      starterCode: `// Milestone 2: Elementary Logic for: ${cleanTopic}
// Role: ${cleanRole}

function summarizeHighValueTransactions(transactions, threshold) {
  if (!Array.isArray(transactions)) return { count: 0, total: 0 };
  const filtered = transactions.filter(t => t > threshold);
  const total = filtered.reduce((acc, curr) => acc + curr, 0);
  return {
    count: filtered.length,
    total: total,
    status: "PROCESSED"
  };
}

// Sample test run
const sampleTransactions = [50, 120, 30, 200, 80];
console.log("Executing Milestone 2 task for ${cleanTopic}...");
const output = summarizeHighValueTransactions(sampleTransactions, 100);
console.log("Summary:", JSON.stringify(output));
`,
      solutionCode: `// Milestone 2 solution`,
      language: "node",
      milestoneIndex: 2,
      difficulty: "Elementary"
    };
  }

  return {
    title: `Hands-on Challenge: Milestone ${mIdx} Algorithm (${cleanTopic})`,
    prompt: `Develop a solution applying the principles of ${cleanTopic} for ${cleanRole}. Your function should accept input parameters, handle edge cases, and return the processed result with clean console output.`,
    sampleInput: `Input: [12, 45, 7, 23, 56, 89, 34]`,
    sampleOutput: `Expected: { topic: "${cleanTopic}", processedCount: 7, maxValue: 89, minValue: 7, sorted: [7, 12, 23, 34, 45, 56, 89] }`,
    starterCode: `// Algorithmic Challenge for: ${cleanTopic}
// Role: ${cleanRole} (Milestone ${mIdx})

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
    language: "node",
    milestoneIndex: mIdx,
    difficulty: mIdx >= 4 ? "Advanced" : "Intermediate"
  };
}

/**
 * Generates deep, crystal-clear, informative technical educational theory for a milestone topic using AI
 */
export const generateMilestoneTheoryAI = async (milestoneTitle, targetRole = '') => {
  const cleanTitle = String(milestoneTitle || '').replace(/^Milestone\s*\d+\s*:\s*/i, '').trim();
  const cleanRole = String(targetRole || '').trim() || 'Software Engineering';

  const prompt = `You are a Principal Software Engineer and Computer Science Professor.
Generate an in-depth, strictly informative, and technically authoritative curriculum guide for the topic: "${cleanTitle}" tailored for the role: "${cleanRole}".

CRITICAL EDUCATIONAL REQUIREMENTS:
- Strictly INFORMATIVE and TECHNICAL content. Explain the actual concepts, specifications, browser/runtime architectures, and workflows directly.
- STRICTLY FORBIDDEN: Do NOT use childish, fluffy, or unrelated everyday analogies (NO comparisons to kitchen timers, theater stages, houses, cakes, recipe books, or restaurant waiters). Keep every explanation professional, rigorous, and directly on-topic.
- SYNTAX REQUIREMENT: The codeExample must contain ONLY pure, clean, idiomatic SYNTAX for "${cleanTitle}". Do NOT wrap the code in generic dummy classes (e.g. NO "class ProductionModule"). Do NOT output lengthy comment intros or file headers. Show only the clean, essential syntax directly illustrating the topic.

MANDATORY 4-LEVEL STRUCTURE (Strictly in this order):
1. Level 1: Core Technical Foundations & Architecture
   - "level": "Level 1: Core Technical Foundations & Architecture"
   - "levelBadge": "Foundations"
   - "title": Technical definition and architectural role of "${cleanTitle}"
   - "explanation": 3-4 sentence technically accurate explanation defining what the technology is, its governing specifications (W3C, WHATWG, ECMAScript, Git DAG), and why it is indispensable in modern software architecture.
   - "points": 4 bullet points formatted as:
     * "**Technical Definition:** [Clear, standard-based definition of ${cleanTitle}]"
     * "**Architectural Purpose:** [The exact technical problem it solves in software systems]"
     * "**Core Specifications:** [Standards, protocols, or fundamental design specifications]"
     * "**Ecosystem Integration:** [How it interfaces with other layers of the modern technology stack]"
   - "takeaway": Authoritative engineering principle.

2. Level 2: Working Mechanics & Execution Flow
   - "level": "Level 2: Working Mechanics & Execution Flow"
   - "levelBadge": "Mechanics"
   - "title": Lifecycle, operational mechanics, and step-by-step workflow of "${cleanTitle}"
   - "explanation": Step-by-step technical breakdown of how the browser engine, runtime, or CLI parses, builds, and executes it.
   - "points": 4 bullet points:
     * "**Parsing & Execution Pipeline:** [Sequence of operations from source parsing to execution/rendering]"
     * "**Core Building Blocks:** [Essential syntax constructs, keywords, APIs, or commands]"
     * "**State & Data Flow:** [How data, events, or state changes propagate through the system]"
     * "**Standard Implementation Patterns:** [Idiomatic architectural patterns used in modern production code]"
   - "takeaway": Practical rule for clean, robust implementation.

3. Level 3: Deep Core Internals & Runtime Engine
   - "level": "Level 3: Deep Core Internals & Runtime Engine"
   - "levelBadge": "Core Internals"
   - "title": Underlying runtime engine, memory management, and performance mechanics of "${cleanTitle}"
   - "explanation": Under-the-hood analysis of the browser rendering engine (DOM/CSSOM/Render Tree), JS execution context/event loop, or Git content-addressable object store (Blobs, Trees, Commits).
   - "points": 4 bullet points:
     * "**Under-the-Hood Engine:** [How the runtime, VM, or storage engine processes this]"
     * "**Memory & Resource Management:** [Heap, stack, node references, or disk object allocations]"
     * "**Performance & Complexity Bounds:** [Time/space complexity, reflow/repaint triggers, or I/O efficiency]"
     * "**Guarantees & Consistency:** [Immutability, task queue ordering, or ACID/history integrity]"
   - "takeaway": Deep performance optimization principle.

4. Level 4: Common Pitfalls & Senior Best Practices
   - "level": "Level 4: Common Pitfalls & Senior Best Practices"
   - "levelBadge": "Senior Practices"
   - "title": Edge cases, security anti-patterns, and production engineering standards for "${cleanTitle}"
   - "explanation": Detailed analysis of common developer mistakes, edge cases, security hazards, and senior production verification standards.
   - "points": 4 bullet points:
     * "**Common Anti-Pattern & Fix:** [Specific technical error, why it fails, and the direct solution]"
     * "**Security & Defensive Handling:** [Vulnerabilities (e.g. XSS, secret leaks) and defense mechanisms]"
     * "**Performance Bottlenecks:** [Critical performance pitfall and the mitigation strategy]"
     * "**Production Readiness Checklist:** [Verification criteria for shipping to production]"
   - "takeaway": Production engineering golden rule.

Output ONLY valid JSON strictly matching this schema without markdown fences:
{
  "title": "Technical Curriculum Guide: ${cleanTitle}",
  "overview": "Comprehensive 2-3 paragraph technical overview explaining ${cleanTitle}, its foundational standards, architectural importance for ${cleanRole}, and core competencies covered.",
  "difficultyProgression": "1. Technical Foundations ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
  "sections": [
    {
      "level": "Level 1: Core Technical Foundations & Architecture",
      "levelBadge": "Foundations",
      "title": "Technical definition and architectural role of ${cleanTitle}",
      "explanation": "...",
      "points": [
        "**Technical Definition:** ...",
        "**Architectural Purpose:** ...",
        "**Core Specifications:** ...",
        "**Ecosystem Integration:** ..."
      ],
      "takeaway": "..."
    },
    {
      "level": "Level 2: Working Mechanics & Execution Flow",
      "levelBadge": "Mechanics",
      "title": "Operational lifecycle and workflow of ${cleanTitle}",
      "explanation": "...",
      "points": [
        "**Parsing & Execution Pipeline:** ...",
        "**Core Building Blocks:** ...",
        "**State & Data Flow:** ...",
        "**Standard Implementation Patterns:** ..."
      ],
      "takeaway": "..."
    },
    {
      "level": "Level 3: Deep Core Internals & Runtime Engine",
      "levelBadge": "Core Internals",
      "title": "Under the hood: Runtime engine and resource mechanics of ${cleanTitle}",
      "explanation": "...",
      "points": [
        "**Under-the-Hood Engine:** ...",
        "**Memory & Resource Management:** ...",
        "**Performance & Complexity Bounds:** ...",
        "**Guarantees & Consistency:** ..."
      ],
      "takeaway": "..."
    },
    {
      "level": "Level 4: Common Pitfalls & Senior Best Practices",
      "levelBadge": "Senior Practices",
      "title": "Production pitfalls, security, and standards for ${cleanTitle}",
      "explanation": "...",
      "points": [
        "**Common Anti-Pattern & Fix:** ...",
        "**Security & Defensive Handling:** ...",
        "**Performance Bottlenecks:** ...",
        "**Production Readiness Checklist:** ..."
      ],
      "takeaway": "..."
    }
  ],
  "codeExample": "// Pure syntax demonstrating ${cleanTitle}...",
  "bestPractices": [
    "Specific production rule 1...",
    "Specific production rule 2...",
    "Specific production rule 3...",
    "Specific production rule 4..."
  ]
}`;

  try {
    const parsed = await generateJSON(prompt, {
      system: 'You are a Principal Software Engineer and Computer Science Professor. Output valid JSON strictly matching the 4-tier educational theory schema. Provide rigorous, highly informative, technical explanations without childish analogies. The codeExample must be pure syntax.',
      temperature: 0.5,
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

  // 1. Web Fundamentals: HTML5, CSS3, JavaScript & Git
  if (lower.includes("html") || lower.includes("css") || lower.includes("web") || (lower.includes("javascript") && lower.includes("git"))) {
    return {
      title: `Technical Curriculum Guide: ${cleanTitle}`,
      overview: `${cleanTitle} constitutes the foundational layer of web client engineering and distributed source code management. HTML5 provides semantic element trees, CSS3 enforces styling rules and cascade layout engines, ECMAScript (JavaScript) manages dynamic asynchronous runtime logic, and Git tracks repository state via directed acyclic graphs (DAGs). Mastering these core technologies is essential for building scalable applications.`,
      difficultyProgression: "1. Technical Foundations ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
      sections: [
        {
          level: "Level 1: Core Technical Foundations & Architecture",
          levelBadge: "Foundations",
          title: `Architectural Foundation & Technical Standards of ${cleanTitle}`,
          explanation: `Modern web architecture relies on a strict separation of concerns between document structure (HTML5), visual presentation (CSS3), dynamic behavior (ECMAScript), and versioned state persistence (Git). Each component adheres to W3C, WHATWG, and ECMA specifications.`,
          points: [
            `**Technical Definition:** A standardized technology stack comprising HTML5 for DOM tree structuring, CSS3 for cascade and layout computation, ECMAScript for event-driven logic, and Git for distributed version control.`,
            `**Architectural Purpose:** Enforces separation of concerns, guarantees cross-browser standard compliance, and enables deterministic team collaboration through cryptographically hashed commit graphs.`,
            `**Core Specifications:** W3C HTML5 Semantic Standards, CSS Cascading and Inheritance Level 3/4, ECMAScript 2023 language specification, and Git SHA-1/SHA-256 object store model.`,
            `**Ecosystem Integration:** HTML and CSS feed the browser rendering pipeline (DOM/CSSOM), JavaScript binds to browser Web APIs, and Git hooks into automated CI/CD deployment pipelines.`
          ],
          takeaway: "Build on semantic markup and standard specifications to guarantee cross-platform accessibility, SEO indexability, and maintainable architectures."
        },
        {
          level: "Level 2: Working Mechanics & Execution Flow",
          levelBadge: "Mechanics",
          title: `Parsing Pipeline, DOM/CSSOM Trees & Git Directed Acyclic Graph`,
          explanation: `When a browser parses an HTML document, it tokenizes bytes into tokens, builds DOM nodes, computes the CSSOM, constructs the render tree, and computes layout coordinates before painting pixels. Git simultaneously manages file state across working tree, staging index, and object database.`,
          points: [
            `**Parsing & Execution Pipeline:** HTML bytes ➔ Tokens ➔ DOM Nodes ➔ CSSOM Tree calculation ➔ Render Tree construction ➔ Layout reflow calculation ➔ Raster painting.`,
            `**Core Building Blocks:** Semantic tags (<main>, <nav>, <article>), CSS selectors and Flexbox/Grid properties, JavaScript event listeners, and Git CLI primitives (status, add, commit, push).`,
            `**State & Data Flow:** User actions dispatch DOM events through capture and bubbling phases, triggering asynchronous JavaScript handlers that update element attributes or fetch remote payloads.`,
            `**Standard Implementation Patterns:** Use semantic HTML for accessibility (a11y), responsive modern CSS Flexbox/Grid without fragile absolute coordinates, and atomic feature-branch Git workflows.`
          ],
          takeaway: "Minimize DOM reflows and repaints by batching style mutations, and keep Git commits atomic with descriptive imperative commit headers."
        },
        {
          level: "Level 3: Deep Core Internals & Runtime Engine",
          levelBadge: "Core Internals",
          title: `Browser Rendering Engine, V8 Event Loop & Git Content-Addressable Storage`,
          explanation: `Browser engines (e.g. Blink, Gecko) maintain multi-threaded pipelines separating the compositor thread from the main UI thread. JavaScript executes on a single thread using the V8 engine, coordinating microtasks (Promises) and macrotasks (timers) via the Event Loop. Git stores all repository files as immutable SHA-hashed blobs, trees, and commit nodes.`,
          points: [
            `**Under-the-Hood Engine:** The browser's C++ rendering engine handles layout and rasterization on GPU layers, while the V8 runtime compiles JavaScript to native machine instructions via ignition interpreter and Turbofan JIT compiler.`,
            `**Memory & Resource Management:** DOM nodes are managed C++ objects bridged to the JavaScript garbage collector. Orphaned element references prevent memory reclamation.`,
            `**Performance & Complexity Bounds:** CSS selector matching occurs right-to-left. Deep nesting increases matching complexity. Git commit lookups and branch pointer adjustments are O(1) constant-time operations.`,
            `**Guarantees & Consistency:** Git's cryptographic SHA hashing guarantees complete repository immutability: history cannot be rewritten without altering all downstream commit hashes.`
          ],
          takeaway: "Understand the single-threaded nature of the JavaScript event loop: long-running synchronous code freezes the browser compositor thread."
        },
        {
          level: "Level 4: Common Pitfalls & Senior Best Practices",
          levelBadge: "Senior Practices",
          title: `Production Pitfalls, Security Standards & Verification for ${cleanTitle}`,
          explanation: `Production web applications must defend against Cross-Site Scripting (XSS), eliminate accidental credential commits in Git, and prevent layout thrashing.`,
          points: [
            `**Common Anti-Pattern & Fix:** Directly setting element.innerHTML with untrusted user input causes XSS vulnerabilities. Fix: Always use element.textContent or sanitized templates.`,
            `**Security & Defensive Handling:** Never commit .env secrets or private SSH keys to Git repositories. Configure robust .gitignore files and commit verification hooks (pre-commit).`,
            `**Performance Bottlenecks:** Layout thrashing caused by reading DOM layout geometry (e.g. offsetWidth) immediately after writing styles. Fix: Batch all reads before executing writes.`,
            `**Production Readiness Checklist:** Ensure semantic HTML passes accessibility audits (WCAG AA), responsive styles adapt across viewports, and branch protection rules enforce code reviews.`
          ],
          takeaway: "Never use innerHTML with dynamic content; sanitize all inputs, configure strict .gitignore rules, and profile layout rendering in browser DevTools."
        }
      ],
      codeExample: `<!-- 1. HTML5 Semantic Syntax -->
<header>
  <nav aria-label="Main Navigation">
    <a href="#dashboard">Dashboard</a>
  </nav>
</header>
<main class="content-container">
  <article>
    <h1>System Status</h1>
    <button id="refreshBtn" type="button">Refresh Metrics</button>
  </article>
</main>

/* 2. Modern CSS3 Responsive Syntax */
.content-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 960px;
  margin: 0 auto;
}

// 3. JavaScript DOM Event & Async Syntax
const refreshBtn = document.getElementById('refreshBtn');
refreshBtn?.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/metrics');
    const data = await res.json();
    console.log('Metrics loaded:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
});

# 4. Essential Git Terminal Syntax
git init
git checkout -b feature/metrics-dashboard
git add .
git commit -m "feat(dashboard): integrate metrics refresh endpoint"
git push -u origin feature/metrics-dashboard`,
      bestPractices: [
        "Enforce strict separation between HTML semantic structure, CSS styling, and JavaScript logic.",
        "Use modern CSS Flexbox and Grid layouts; avoid brittle absolute positioning and inline styles.",
        "Prevent XSS security vulnerabilities by never assigning unsanitized user inputs to innerHTML.",
        "Always maintain an up-to-date .gitignore file to prevent secrets and build artifacts from entering Git history."
      ]
    };
  }

  // 2. React / Frontend Hooks & State
  if (lower.includes("hook") || lower.includes("state") || lower.includes("react") || lower.includes("component")) {
    return {
      title: `Technical Curriculum Guide: ${cleanTitle}`,
      overview: `${cleanTitle} is a core foundation of React component state architecture. React components declare state hooks to bind reactive data to the user interface, scheduling reconciliation passes whenever state updates occur. Understanding hook execution lifecycles, closure captures, and Fiber reconciliation is critical for writing robust frontend code.`,
      difficultyProgression: "1. Technical Foundations ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
      sections: [
        {
          level: "Level 1: Core Technical Foundations & Architecture",
          levelBadge: "Foundations",
          title: `Understanding ${cleanTitle}: Declarative State & Component Architecture`,
          explanation: `In React's declarative paradigm, the user interface is a pure function of component state: UI = f(state). State hooks instruct the React runtime to preserve and track values across consecutive render passes.`,
          points: [
            `**Technical Definition:** A declarative state management API that preserves values across component re-render lifecycles without requiring class instances.`,
            `**Architectural Purpose:** Eliminates direct imperative DOM mutation by making UI components declarative reflections of reactive state snapshots.`,
            `**Core Specifications:** React Hooks specification, immutable state transitions, and deterministic render contracts.`,
            `**Ecosystem Integration:** Integrates with React Fiber reconciliation, Context API, and state machines (e.g. Redux, Zustand).`
          ],
          takeaway: "Always treat state as strictly read-only snapshots; schedule state transitions using immutable updates."
        },
        {
          level: "Level 2: Working Mechanics & Execution Flow",
          levelBadge: "Mechanics",
          title: `How ${cleanTitle} Works: Lifecycle, Re-renders & State Transitions`,
          explanation: `When a state setter is invoked, React enqueues the state update, schedules a component re-render, re-executes the component function, and reconciles the new output with the browser DOM.`,
          points: [
            `**Parsing & Execution Pipeline:** 1. User event triggers setter ➔ 2. Update enqueued in Fiber work queue ➔ 3. Re-render executed with new snapshot ➔ 4. Virtual DOM diffed ➔ 5. Minimal browser DOM patched.`,
            `**Core Building Blocks:** useState for local state, useReducer for complex state transitions, useEffect for side-effects, and useMemo/useCallback for referential stability.`,
            `**State & Data Flow:** React batches state updates inside event ticks to coalesce renders and prevent UI stutter.`,
            `**Standard Implementation Patterns:** Keep state as local as possible. Lift state up only when siblings must synchronize on shared data.`
          ],
          takeaway: "State updates are scheduled asynchronously; always use functional updates setVal(prev => prev + 1) when depending on current state."
        },
        {
          level: "Level 3: Deep Core Internals & Runtime Engine",
          levelBadge: "Core Internals",
          title: `Under the Hood: React Fiber Tree, Hook Linked-Lists & Reconciliation`,
          explanation: `React stores hook state in a singly linked list attached to the component Fiber node. The sequence of hook calls is the single source of truth for matching state to hook invocations.`,
          points: [
            `**Under-the-Hood Engine:** Each component instance is represented by a Fiber object in memory. Hook records are linked sequentially (hook.next).`,
            `**Memory & Resource Management:** Unmounted Fibers are garbage-collected; uncleaned subscriptions cause retained memory leaks.`,
            `**Performance & Complexity Bounds:** React's heuristic diffing algorithm executes in O(N) linear time by comparing component types and keys.`,
            `**Guarantees & Consistency:** Hook call order must remain 100% deterministic between every render cycle (Rules of Hooks).`
          ],
          takeaway: "Never call hooks conditionally or inside loops to guarantee deterministic Fiber linked-list traversals."
        },
        {
          level: "Level 4: Common Pitfalls & Senior Best Practices",
          levelBadge: "Senior Practices",
          title: `Mistakes to Avoid & Senior Best Practices for ${cleanTitle}`,
          explanation: `Mastering state requires avoiding direct mutations, stale closures in effect hooks, and unnecessary re-render waterfalls.`,
          points: [
            `**Common Anti-Pattern & Fix:** Mutating state objects directly (state.items.push(x)) bypasses React change detection. Fix: Always return a new reference ([...prev, x]).`,
            `**Security & Defensive Handling:** Validate external API payloads before setting them into state to prevent undefined property crashes.`,
            `**Performance Bottlenecks:** Passing inline object or function references down to memoized child components forces redundant re-renders. Fix: Use useCallback and useMemo.`,
            `**Production Readiness Checklist:** Derive calculated values on the fly during render rather than storing synchronized redundant state.`
          ],
          takeaway: "Calculate derived state during render rather than syncing duplicate state variables."
        }
      ],
      codeExample: `// React State & Hook Syntax
import React, { useState, useEffect, useCallback } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  // Synchronize side effects with dependency array
  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  // Functional update prevents stale closure bugs
  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  return (
    <div className="counter-container">
      <p>Current Count: {count}</p>
      <button onClick={increment} type="button">Increment</button>
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

  // 3. SQL & Databases
  if (lower.includes("sql") || lower.includes("database") || lower.includes("query") || lower.includes("join") || lower.includes("mongo")) {
    return {
      title: `Technical Curriculum Guide: ${cleanTitle}`,
      overview: `${cleanTitle} forms the data persistence and query layer of modern software architecture. Relational databases manage structured schemas, indexes, and relations while enforcing ACID transaction guarantees (Atomicity, Consistency, Isolation, Durability) to ensure data reliability under concurrent load.`,
      difficultyProgression: "1. Technical Foundations ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
      sections: [
        {
          level: "Level 1: Core Technical Foundations & Architecture",
          levelBadge: "Foundations",
          title: `Understanding ${cleanTitle}: Relational Schemas & ACID Guarantees`,
          explanation: `Relational databases organize information into strongly typed tables with primary and foreign key constraints, guaranteeing integrity and ACID transactional compliance.`,
          points: [
            `**Technical Definition:** A declarative query and management system for structured data providing ACID guarantees.`,
            `**Architectural Purpose:** Eliminates data corruption, prevents race conditions during concurrent mutations, and enables high-speed indexing.`,
            `**Core Specifications:** ANSI SQL standard, Relational Algebra, and relational constraint specifications.`,
            `**Ecosystem Integration:** Interfaces with backend ORMs, database connection pools, and migration pipelines.`
          ],
          takeaway: "Design schemas around relational integrity and normalization first before applying query micro-optimizations."
        },
        {
          level: "Level 2: Working Mechanics & Execution Flow",
          levelBadge: "Mechanics",
          title: `How ${cleanTitle} Works: Query Parsing, Execution Plans & Joins`,
          explanation: `When a client sends a SQL query, the database server parses syntax, compiles an optimized cost-based execution plan, retrieves data pages from buffer pools, and returns filtered rows.`,
          points: [
            `**Parsing & Execution Pipeline:** Query receipt ➔ Lexical and syntactic parse ➔ Query Optimizer evaluates index statistics ➔ Storage Engine reads disk/buffer pages ➔ Result set filtered and returned.`,
            `**Core Building Blocks:** Primary Keys, Foreign Keys, Index constraints, INNER/LEFT JOINs, and GROUP BY aggregations.`,
            `**State & Data Flow:** Write-Ahead Logging (WAL) writes disk change logs sequentially before updating data pages in memory.`,
            `**Standard Implementation Patterns:** Always use parameterized queries and explicit transaction boundaries (BEGIN ... COMMIT).`
          ],
          takeaway: "Inspect slow queries with EXPLAIN ANALYZE to verify index lookups instead of sequential full-table scans."
        },
        {
          level: "Level 3: Deep Core Internals & Runtime Engine",
          levelBadge: "Core Internals",
          title: `Under the Hood: B-Tree Indexes, Write-Ahead Logs (WAL) & Buffer Pools`,
          explanation: `Relational engines use B+Tree disk data structures for O(log N) searches and Multi-Version Concurrency Control (MVCC) for non-blocking reads.`,
          points: [
            `**Under-the-Hood Engine:** Storage engines (e.g. InnoDB) read and write fixed-size 16KB disk pages cached in the buffer pool.`,
            `**Memory & Resource Management:** B+Trees balance leaf nodes containing sorted row pointers or clustered primary index data.`,
            `**Performance & Complexity Bounds:** Index lookups run in O(log N) time; full table scans run in O(N) time.`,
            `**Guarantees & Consistency:** MVCC ensures concurrent readers do not block writers and writers do not block readers.`
          ],
          takeaway: "Balance indexes carefully: excessive indexes speed up SELECTs but degrade INSERT, UPDATE, and DELETE throughput."
        },
        {
          level: "Level 4: Common Pitfalls & Senior Best Practices",
          levelBadge: "Senior Practices",
          title: `Mistakes to Avoid & Senior Best Practices for ${cleanTitle}`,
          explanation: `Preventing N+1 query patterns, SQL injection, and database connection exhaustion are vital production disciplines.`,
          points: [
            `**Common Anti-Pattern & Fix:** The N+1 query problem executes individual queries in loops. Fix: Use single JOINs or batched IN queries.`,
            `**Security & Defensive Handling:** Concatenating raw user inputs into queries creates SQL injection vulnerabilities. Fix: Always use prepared statements.`,
            `**Performance Bottlenecks:** Unindexed columns in WHERE, ORDER BY, or JOIN clauses force expensive full-table scans.`,
            `**Production Readiness Checklist:** Enforce connection pooling limits and pagination (LIMIT / OFFSET) on public APIs.`
          ],
          takeaway: "Never concatenate raw inputs into SQL queries; always use parameterized statements to eliminate injection vulnerabilities."
        }
      ],
      codeExample: `-- Relational Schema Definition Syntax
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_status (status)
);

-- Parameterized Query Syntax
SELECT id, name, email, created_at
FROM users
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 20;`,
      bestPractices: [
        "Always use parameterized queries / prepared statements to completely eliminate SQL injection risks.",
        "Add indexes to columns used frequently in WHERE clauses, JOIN conditions, and ORDER BY fields.",
        "Prevent N+1 query anti-patterns by utilizing eager JOINs or batched IN queries in your backend API.",
        "Wrap all multi-table business mutations inside explicit database transactions with rollback handlers."
      ]
    };
  }

  // 4. Git, Version Control & DevOps
  if (lower.includes("git") || lower.includes("github") || lower.includes("docker") || lower.includes("devops") || lower.includes("ci/cd")) {
    return {
      title: `Technical Curriculum Guide: ${cleanTitle}`,
      overview: `${cleanTitle} provides distributed version control, cryptographic revision tracking, and automated deployment pipelines for modern software engineering teams.`,
      difficultyProgression: "1. Technical Foundations ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
      sections: [
        {
          level: "Level 1: Core Technical Foundations & Architecture",
          levelBadge: "Foundations",
          title: `Understanding ${cleanTitle}: Distributed Version Control & DAG Architecture`,
          explanation: `Git is a content-addressable key-value store that tracks snapshots of a project over time. Every commit is linked in a directed acyclic graph (DAG).`,
          points: [
            `**Technical Definition:** A distributed version control system where every client retains a full mirror of the repository repository and history.`,
            `**Architectural Purpose:** Enables non-linear, branch-based team development and cryptographically verified audit trails.`,
            `**Core Specifications:** Git Object Model (Blobs, Trees, Commits, Annotated Tags), SHA-1/SHA-256 hash trees.`,
            `**Ecosystem Integration:** Interfaces with remote hosting services (GitHub, GitLab) and CI/CD pipelines.`
          ],
          takeaway: "Structure work into small, atomic commits with clear, descriptive imperative commit messages."
        },
        {
          level: "Level 2: Working Mechanics & Execution Flow",
          levelBadge: "Mechanics",
          title: `How ${cleanTitle} Works: Branching, Merging & Pull Requests`,
          explanation: `Developers branch off the main line, stage changes in the index, commit snapshots to the local database, and push to remotes for review.`,
          points: [
            `**Parsing & Execution Pipeline:** Working Directory ➔ git add stages to Index ➔ git commit writes objects ➔ git push synchronizes with remote.`,
            `**Core Building Blocks:** Branches (movable 41-byte pointers to commits), HEAD pointer, Fast-forward and 3-way Merges.`,
            `**State & Data Flow:** Merge conflicts trigger when concurrent branches edit identical file lines, requiring manual conflict resolution.`,
            `**Standard Implementation Patterns:** Adopt Conventional Commits (feat:, fix:, docs:) and short-lived feature branches.`
          ],
          takeaway: "Pull the latest changes from main before opening a Pull Request to resolve merge conflicts early."
        },
        {
          level: "Level 3: Deep Core Internals & Runtime Engine",
          levelBadge: "Core Internals",
          title: `Under the Hood: Git Directed Acyclic Graph (DAG) & Content-Addressable Storage`,
          explanation: `Git objects are stored compressed in .git/objects/ named by their SHA hash. Branches are simply text files pointing to a 40-character commit hash.`,
          points: [
            `**Under-the-Hood Engine:** 4 core object types: Blobs (contents), Trees (directories), Commits (metadata + tree pointer), Tags.`,
            `**Memory & Resource Management:** Branch creation is instantaneous (O(1) time and 41 bytes of storage).`,
            `**Performance & Complexity Bounds:** History traversal operates over the commit DAG in O(V + E) time.`,
            `**Guarantees & Consistency:** Commit hashes guarantee complete cryptographic integrity of all prior parent commits.`
          ],
          takeaway: "Because branches are just 41-byte pointer files, branching and switching branches is practically free."
        },
        {
          level: "Level 4: Common Pitfalls & Senior Best Practices",
          levelBadge: "Senior Practices",
          title: `Mistakes to Avoid & Senior Best Practices for ${cleanTitle}`,
          explanation: `Careless Git workflows can leak API keys, clobber shared histories, or break automated continuous deployment pipelines.`,
          points: [
            `**Common Anti-Pattern & Fix:** Committing .env secrets to public repositories. Fix: Configure .gitignore before the first commit.`,
            `**Security & Defensive Handling:** Force-pushing (git push -f) on shared branches overwrites teammate work. Fix: Enable branch protection rules.`,
            `**Performance Bottlenecks:** Storing large binary files in Git bloats repository clone sizes. Fix: Use Git LFS for binaries.`,
            `**Production Readiness Checklist:** Ensure atomic commits, rebase or squash feature branches before merging, and enforce CI pass requirements.`
          ],
          takeaway: "Never commit API keys or credentials; always verify .gitignore before staging files."
        }
      ],
      codeExample: `# Core Git Workflow Syntax
git checkout main
git pull origin main
git checkout -b feature/auth-service
git add src/auth/
git commit -m "feat(auth): add JWT token validation middleware"
git push -u origin feature/auth-service`,
      bestPractices: [
        "Configure .gitignore immediately to prevent secret credentials and node_modules from being tracked.",
        "Keep commits atomic: each commit should represent a single cohesive, working change.",
        "Never run git push --force on main or shared branches; use branch protection rules.",
        "Write meaningful commit messages following Conventional Commits (e.g. feat:, fix:, refactor:)."
      ]
    };
  }

  // 5. Default General Technical Fallback
  return {
    title: `Technical Curriculum Guide: ${cleanTitle}`,
    overview: `Comprehensive technical curriculum for ${cleanTitle} tailored specifically for ${cleanRole}. This guide systematically breaks down foundational architecture, core standards, operational workflows, runtime execution mechanics, and senior production verification standards.`,
    difficultyProgression: "1. Technical Foundations ➔ 2. Working Mechanics ➔ 3. Deep Internals ➔ 4. Senior Best Practices",
    sections: [
      {
        level: "Level 1: Core Technical Foundations & Architecture",
        levelBadge: "Foundations",
        title: `Technical Architecture & Core Principles of ${cleanTitle}`,
        explanation: `${cleanTitle} is a foundational construct in modern software engineering. Understanding its architectural specifications and standard models is essential for building scalable applications.`,
        points: [
          `**Technical Definition:** A core architectural construct and standard methodology utilized within ${cleanRole} systems.`,
          `**Architectural Purpose:** Solves domain problems systematically by providing structured execution, modularity, and operational predictability.`,
          `**Core Specifications:** Governed by established technical standards, interface contracts, and architectural protocols.`,
          `**Ecosystem Integration:** Interfaces cleanly with surrounding application components, APIs, and runtime pipelines.`
        ],
        takeaway: "Master core architectural principles and standard contracts before implementing complex variations."
      },
      {
        level: "Level 2: Working Mechanics & Execution Flow",
        levelBadge: "Mechanics",
        title: `Operational Lifecycle & Step-by-Step Execution of ${cleanTitle}`,
        explanation: `In operational environments, ${cleanTitle} executes through structured sequential phases, transforming inputs into validated outputs.`,
        points: [
          `**Parsing & Execution Pipeline:** 1. Initialization ➔ 2. Input validation ➔ 3. Core execution logic ➔ 4. Verification ➔ 5. Output delivery.`,
          `**Core Building Blocks:** Standard syntax constructs, configuration parameters, and execution hooks.`,
          `**State & Data Flow:** How data is parsed, passed across execution boundaries, and managed in memory.`,
          `**Standard Implementation Patterns:** Industry-standard idioms that ensure modularity, high cohesion, and low coupling.`
        ],
        takeaway: "Structure operational workflows into small, deterministic steps with explicit validation checks."
      },
      {
        level: "Level 3: Deep Core Internals & Runtime Engine",
        levelBadge: "Core Internals",
        title: `Under the Hood: Engine Architecture & Resource Management`,
        explanation: `Under the surface, ${cleanTitle} relies on resource management models, runtime allocation structures, and throughput pipelines.`,
        points: [
          `**Under-the-Hood Engine:** The underlying execution runtime and structural mechanics driving system operations.`,
          `**Memory & Resource Management:** How memory handles, connections, or system resources are allocated and reclaimed.`,
          `**Performance & Complexity Bounds:** Algorithmic efficiency bounds, time/space trade-offs, and throughput scalability.`,
          `**Guarantees & Consistency:** Concurrency guarantees, fault isolation boundaries, and fail-safe recovery mechanisms.`
        ],
        takeaway: "Design for scale by profiling resource allocation and memory usage under production load conditions."
      },
      {
        level: "Level 4: Common Pitfalls & Senior Best Practices",
        levelBadge: "Senior Practices",
        title: `Production Pitfalls & Senior Engineering Standards for ${cleanTitle}`,
        explanation: `Real-world production environments require defensive error boundaries, boundary validation, and proactive risk mitigation.`,
        points: [
          `**Common Anti-Pattern & Fix:** Neglecting perimeter input validation causes cascading runtime exceptions. Fix: Validate inputs upfront.`,
          `**Security & Defensive Handling:** Defensive boundary checks, sanitized parameter handling, and strict type verification.`,
          `**Performance Bottlenecks:** Unnecessary resource allocations and synchronous blocking on critical execution paths.`,
          `**Production Readiness Checklist:** Clean code conventions, automated test coverage, and comprehensive telemetry/logging.`
        ],
        takeaway: "Defensively validate all inputs at the perimeter and profile under realistic load."
      }
    ],
    codeExample: `// Syntax & Core Execution Pattern for: ${cleanTitle}

// 1. Module Definition & Parameter Validation
export function executeOperation(config = {}) {
  const { enabled = true, options = {} } = config;
  if (!enabled) return { status: "SKIPPED" };

  // 2. Core Operational Logic
  const result = {
    module: "${cleanTitle}",
    timestamp: new Date().toISOString(),
    status: "SUCCESS"
  };

  return result;
}

// 3. Invocation Syntax
const outcome = executeOperation({ enabled: true });
console.log(outcome);`,
    bestPractices: [
      "Master fundamental technical contracts and definitions before implementing advanced features.",
      "Defensively validate inputs and boundaries to catch errors early and gracefully.",
      "Structure workflows into modular, reusable components with single responsibilities.",
      "Profile performance and resource allocations under real production load conditions."
    ]
  };
}
