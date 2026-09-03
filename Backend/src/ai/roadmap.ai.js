import { config } from '../config/env.js';

/**
 * Universal Granular Technical Catalog
 * 20+ specialized career paths covering exact languages, frameworks, and job roles
 */
const TECHNICAL_DOMAIN_CATALOG = {
  // 1. JAVA
  java: {
    role: 'Java Developer',
    milestones: [
      {
        title: 'Milestone 1: Java Core Syntax & Object-Oriented Foundations',
        desc: 'Master Java syntax, Primitive vs Reference types, OOP principles (Encapsulation, Inheritance, Polymorphism), and Interfaces.',
        tags: ['Java', 'OOP', 'Interfaces', 'Classes & Objects'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Java Collections Framework & Memory Management',
        desc: 'Deep dive into List, Set, Map, HashMap internals, Generics, Memory Heap/Stack, and Garbage Collection (GC).',
        tags: ['Java Collections', 'Generics', 'JVM Memory', 'Garbage Collection'],
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Database Integration with JDBC, Hibernate & Spring Data JPA',
        desc: 'Design relational schemas, execute SQL queries, ORM mapping, Entity relationships, and Spring Data Repositories.',
        tags: ['SQL & Databases', 'Hibernate', 'Spring Data JPA', 'PostgreSQL'],
        quizzes: 3,
        exercises: 9,
      },
      {
        title: 'Milestone 4: Enterprise Web APIs with Spring Boot & Security',
        desc: 'Build RESTful microservices using Spring Boot, Controller validation, Spring Security, and JWT Authentication.',
        tags: ['Spring Boot', 'REST APIs', 'Spring Security', 'JWT Auth'],
        quizzes: 4,
        exercises: 10,
      },
      {
        title: 'Milestone 5: Multi-threading, Concurrency & Microservices Architecture',
        desc: 'ExecutorService, CompletableFuture, Concurrent Data Structures, Microservice discovery, and Kafka event streaming.',
        tags: ['Multithreading', 'Concurrency', 'Microservices', 'Apache Kafka'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 6: Docker Containerization & Cloud Deployment',
        desc: 'Containerize Spring Boot applications using Docker, Kubernetes deployments, and CI/CD pipelines.',
        tags: ['Docker & Containers', 'Kubernetes', 'CI/CD Pipelines', 'AWS Deployment'],
        quizzes: 2,
        exercises: 5,
      },
    ],
  },

  // 2. PYTHON
  python: {
    role: 'Python Developer',
    milestones: [
      {
        title: 'Milestone 1: Python Fundamentals & Data Structures',
        desc: 'Master syntax, object typing, functions, list comprehensions, and memory management.',
        tags: ['Python', 'Syntax & Types', 'Functions', 'Data Structures'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Object-Oriented Programming & Clean Code',
        desc: 'Build modular apps using classes, inheritance, SOLID principles, and design patterns.',
        tags: ['OOP', 'Inheritance', 'SOLID Principles', 'Design Patterns'],
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Relational Databases & SQL Optimization',
        desc: 'Design schemas, write complex JOIN queries, indexes, transactions, and ORM integrations.',
        tags: ['SQL & Databases', 'PostgreSQL', 'Joins & Indexes', 'SQL Optimization'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 4: RESTful API Development with FastAPI & Express',
        desc: 'Build high-performance web APIs with Pydantic validation, JWT authentication, and Swagger.',
        tags: ['REST APIs', 'FastAPI', 'JWT Auth', 'Swagger/OpenAPI'],
        quizzes: 3,
        exercises: 9,
      },
      {
        title: 'Milestone 5: System Design & Microservice Scalability',
        desc: 'Learn caching (Redis), message queues (RabbitMQ/Kafka), rate limiting, and scalability.',
        tags: ['System Design', 'Redis Caching', 'Message Queues', 'Microservices'],
        quizzes: 2,
        exercises: 5,
      },
      {
        title: 'Milestone 6: Capstone Backend Project & Cloud Deployment',
        desc: 'Build an end-to-end scalable backend system, containerize with Docker, and deploy to AWS.',
        tags: ['Docker & Containers', 'AWS/GCP', 'CI/CD Pipelines', 'Production Monitoring'],
        quizzes: 1,
        exercises: 4,
      },
    ],
  },

  // 3. C++
  cpp: {
    role: 'C++ Developer',
    milestones: [
      {
        title: 'Milestone 1: C++ Syntax, Memory Pointers & References',
        desc: 'Pointers, References, Dynamic Memory Allocation (new/delete), Stack vs Heap memory.',
        tags: ['C++', 'Pointers', 'Memory Allocation', 'References'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Object-Oriented C++ & Smart Pointers (RAII)',
        desc: 'Classes, Copy/Move constructors, Operator Overloading, std::unique_ptr, std::shared_ptr.',
        tags: ['OOP C++', 'RAII', 'Smart Pointers', 'Constructors'],
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Standard Template Library (STL) Containers & Algorithms',
        desc: 'std::vector, std::map, std::set, Iterators, Lambda expressions, and STL sorting algorithms.',
        tags: ['C++ STL', 'Vectors & Maps', 'Iterators', 'Algorithms'],
        quizzes: 4,
        exercises: 11,
      },
      {
        title: 'Milestone 4: Multithreading & Concurrent Programming in C++',
        desc: 'std::thread, std::mutex, std::lock_guard, Condition variables, and Atomic operations.',
        tags: ['Multithreading', 'Mutex', 'Concurrency', 'Atomics'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Systems Design, Network Sockets & Low-Level Optimization',
        desc: 'TCP/UDP Socket Programming, Profiling memory leaks with Valgrind, CMake build automation.',
        tags: ['Socket Programming', 'CMake', 'Valgrind', 'Low-Level Systems'],
        quizzes: 2,
        exercises: 6,
      },
    ],
  },

  // 4. C# / .NET
  csharp: {
    role: '.NET & C# Developer',
    milestones: [
      {
        title: 'Milestone 1: C# Language Fundamentals & Object-Oriented Principles',
        desc: 'Master C# syntax, type system, classes, structs, interfaces, LINQ, and CLR memory lifecycle.',
        tags: ['C#', 'LINQ', 'OOP', 'CLR'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: ASP.NET Core Web API & Dependency Injection',
        desc: 'Build high-performance REST APIs with ASP.NET Core, middleware pipelines, and dependency injection.',
        tags: ['ASP.NET Core', 'REST APIs', 'Dependency Injection', 'Swagger'],
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Database Persistence with Entity Framework Core & SQL Server',
        desc: 'Code-first migrations, DbContext configuration, LINQ to Entities, transactions, and indexing.',
        tags: ['EF Core', 'SQL Server', 'LINQ', 'Migrations'],
        quizzes: 3,
        exercises: 9,
      },
      {
        title: 'Milestone 4: Asynchronous Programming & Clean Architecture',
        desc: 'Async/await task parallelism, CQRS pattern with MediatR, and repository patterns.',
        tags: ['Async/Await', 'CQRS', 'Clean Architecture', 'MediatR'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Microservices, Azure Cloud & CI/CD Deployment',
        desc: 'Docker containerization, Azure App Services, Azure DevOps pipelines, and API Gateway.',
        tags: ['Docker', 'Azure', 'Microservices', 'CI/CD'],
        quizzes: 2,
        exercises: 5,
      },
    ],
  },

  // 5. NODE.JS / JAVASCRIPT BACKEND
  node: {
    role: 'Node.js Backend Developer',
    milestones: [
      {
        title: 'Milestone 1: Node.js Runtime, Event Loop & Asynchronous I/O',
        desc: 'Master Node.js architecture, non-blocking I/O, Event Loop phases, Streams, and Buffer handling.',
        tags: ['Node.js', 'Event Loop', 'Async/Await', 'Streams'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: RESTful API Engineering with Express.js',
        desc: 'Route handlers, custom middleware, error handling, rate limiting, and request validation (Joi/Zod).',
        tags: ['Express.js', 'REST APIs', 'Middleware', 'Zod Validation'],
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Database Integration (MongoDB & PostgreSQL)',
        desc: 'Mongoose ODM, Prisma ORM, relational indexing, aggregation pipelines, and ACID transactions.',
        tags: ['MongoDB', 'PostgreSQL', 'Prisma', 'Transactions'],
        quizzes: 3,
        exercises: 9,
      },
      {
        title: 'Milestone 4: Authentication, Security & Real-Time WebSockets',
        desc: 'JWT authentication, OAuth2, Bcrypt password hashing, Helmet security, and Socket.io.',
        tags: ['JWT Auth', 'WebSockets', 'Socket.io', 'API Security'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Microservices, Redis Caching & Cloud Deployment',
        desc: 'Redis caching, BullMQ background queues, Docker containerization, and AWS/Render deployment.',
        tags: ['Redis', 'Message Queues', 'Docker', 'Cloud Hosting'],
        quizzes: 2,
        exercises: 5,
      },
    ],
  },

  // 6. REACT / FRONTEND
  react: {
    role: 'React Frontend Developer',
    milestones: [
      {
        title: 'Milestone 1: HTML5, Modern CSS & Responsive Layouts',
        desc: 'Master Flexbox, Grid, CSS Variables, glassmorphism, responsive UI design, and accessibility.',
        tags: ['HTML5 & CSS3', 'CSS Grid & Flexbox', 'Responsive Design'],
        quizzes: 4,
        exercises: 10,
      },
      {
        title: 'Milestone 2: Modern JavaScript (ES6+) Core',
        desc: 'Promises, Async/Await, ES Modules, Destructuring, and DOM Manipulation.',
        tags: ['JavaScript', 'Async/Await', 'Fetch API', 'Event Loop'],
        quizzes: 5,
        exercises: 14,
      },
      {
        title: 'Milestone 3: React Core & Component Architecture',
        desc: 'JSX, Props, State, Component Lifecycle, Event Handling, and Hooks (useState, useEffect).',
        tags: ['React.js', 'State & Props', 'Hooks', 'Virtual DOM'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 4: State Management & Client Routing',
        desc: 'Master React Router v6, Context API, Redux Toolkit, and Query/Zustand.',
        tags: ['React Router', 'Context API', 'Redux Toolkit', 'TanStack Query'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Advanced UI & Render Performance',
        desc: 'Optimize render cycles, code splitting, Framer Motion animations, and Lighthouse score tuning.',
        tags: ['Performance Optimization', 'Code Splitting', 'Framer Motion'],
        quizzes: 2,
        exercises: 6,
      },
    ],
  },

  // 7. FULL STACK
  fullstack: {
    role: 'Full Stack Engineer',
    milestones: [
      {
        title: 'Milestone 1: Full Stack Web Foundations & JavaScript/TypeScript Core',
        desc: 'Master JavaScript/TypeScript, DOM manipulation, asynchronous programming, and web standards.',
        tags: ['TypeScript', 'JavaScript', 'Web Standards', 'ES6+'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Frontend Engineering with React & Tailwind CSS',
        desc: 'Component architecture, interactive UI states, hooks, routing, and modern styling.',
        tags: ['React.js', 'Tailwind CSS', 'State Management', 'React Router'],
        quizzes: 4,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Backend RESTful API & Server Engineering',
        desc: 'Build scalable APIs with Express.js/FastAPI, request validation, authentication, and error handling.',
        tags: ['Express/FastAPI', 'REST APIs', 'JWT Auth', 'Server Architecture'],
        quizzes: 3,
        exercises: 9,
      },
      {
        title: 'Milestone 4: Database Architecture & End-to-End Data Flow',
        desc: 'Design relational & NoSQL databases (PostgreSQL/MongoDB), ORM integration, and query optimization.',
        tags: ['PostgreSQL', 'MongoDB', 'Prisma/ORM', 'Data Modeling'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Full Stack Deployment, Containerization & CI/CD',
        desc: 'Containerize full stack apps with Docker Compose, configure NGINX, and deploy to AWS/Vercel.',
        tags: ['Docker Compose', 'CI/CD Pipelines', 'AWS / Vercel', 'Production Monitoring'],
        quizzes: 2,
        exercises: 5,
      },
    ],
  },

  // 8. DATA SCIENCE & AI
  data: {
    role: 'Data Science & AI Engineer',
    milestones: [
      {
        title: 'Milestone 1: Python for Data Science & Mathematical Foundations',
        desc: 'NumPy multidimensional arrays, Pandas dataframes, Linear Algebra, and Statistical hypothesis testing.',
        tags: ['Python', 'NumPy', 'Pandas', 'Linear Algebra', 'Statistics'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Exploratory Data Analysis & Visualization',
        desc: 'Data cleaning, feature engineering, Matplotlib, Seaborn, and Plotly interactive analytical dashboards.',
        tags: ['EDA', 'Data Cleaning', 'Matplotlib & Seaborn', 'Feature Engineering'],
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Machine Learning Algorithms & Model Tuning',
        desc: 'Supervised vs unsupervised learning, Regression, Classification, Clustering, and Scikit-Learn pipelines.',
        tags: ['Supervised Learning', 'Classification', 'Scikit-Learn', 'Cross-Validation'],
        quizzes: 4,
        exercises: 10,
      },
      {
        title: 'Milestone 4: Deep Learning & Neural Networks with PyTorch',
        desc: 'Neural Network architectures, Backpropagation, CNNs for computer vision, and Transformer models.',
        tags: ['Deep Learning', 'PyTorch', 'Neural Networks', 'Transformers'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Generative AI, RAG & LLM Application Engineering',
        desc: 'Building production AI agents with Gemini/OpenAI API, Vector Databases (Pinecone/Chroma), and LangChain.',
        tags: ['Generative AI', 'LLM Integration', 'RAG Vector Search', 'LangChain'],
        quizzes: 3,
        exercises: 6,
      },
    ],
  },

  // 9. DEVOPS & CLOUD
  devops: {
    role: 'Cloud & DevOps Specialist',
    milestones: [
      {
        title: 'Milestone 1: Linux Administration, Bash & System Automation',
        desc: 'Linux command line, file permissions, process management, systemd, and Bash scripting.',
        tags: ['Linux CLI', 'Bash Scripting', 'System Administration', 'Networking'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Cloud Foundations & AWS Architecture',
        desc: 'AWS EC2, S3, VPC networking, IAM security policies, security groups, and Route 53.',
        tags: ['AWS', 'VPC & Subnets', 'IAM Security', 'EC2 & S3'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 3: Containerization with Docker & Container Security',
        desc: 'Dockerfiles, multi-stage image builds, Docker Compose networks, and container vulnerability scanning.',
        tags: ['Docker', 'Dockerfile', 'Docker Compose', 'Container Security'],
        quizzes: 3,
        exercises: 9,
      },
      {
        title: 'Milestone 4: Infrastructure as Code (Terraform)',
        desc: 'Declarative cloud provisioning with Terraform modules, remote state locking, and resource planning.',
        tags: ['Terraform', 'IaC', 'Cloud Provisioning', 'State Locking'],
        quizzes: 3,
        exercises: 7,
      },
      {
        title: 'Milestone 5: CI/CD Automation & Kubernetes Cluster Orchestration',
        desc: 'GitHub Actions automated build & test pipelines, Kubernetes Pods, Deployments, Services, & Helm.',
        tags: ['GitHub Actions', 'Kubernetes', 'Helm Charts', 'Prometheus & Grafana'],
        quizzes: 2,
        exercises: 5,
      },
    ],
  },

  // 10. CYBERSECURITY
  cyber: {
    role: 'Cybersecurity Analyst & Ethical Hacker',
    milestones: [
      {
        title: 'Milestone 1: Networking Fundamentals & Packet Analysis',
        desc: 'TCP/IP, OSI layers, Wireshark packet capture, DNS, HTTP/HTTPS, and Nmap port scanning.',
        tags: ['Networking', 'Wireshark', 'TCP/IP', 'Port Scanning'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Linux Security Hardening & Privilege Management',
        desc: 'User permissions, SSH key hardening, iptables firewall configurations, and auditing scripts.',
        tags: ['Linux Security', 'Privilege Escalation', 'Firewalls', 'Bash'],
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Web Application Security & OWASP Top 10 Vulnerabilities',
        desc: 'SQL Injection, XSS, CSRF, SSRF, IDOR, and authentication bypass vulnerability testing using Burp Suite.',
        tags: ['OWASP Top 10', 'SQLi', 'XSS', 'Burp Suite', 'Web Security'],
        quizzes: 4,
        exercises: 10,
      },
      {
        title: 'Milestone 4: Cryptography, PKI & Secure Communications',
        desc: 'Symmetric vs Asymmetric encryption (AES, RSA), Hashing (SHA-256), SSL/TLS, and JWT tokens.',
        tags: ['Cryptography', 'AES & RSA', 'SSL/TLS', 'Public Key Infrastructure'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Penetration Testing, SIEM & Incident Response',
        desc: 'Metasploit exploit frameworks, network reconnaissance, log monitoring (Splunk/ELK), and threat mitigation.',
        tags: ['Pen Testing', 'Metasploit', 'SIEM / Splunk', 'Incident Response'],
        quizzes: 2,
        exercises: 6,
      },
    ],
  },

  // 11. MOBILE / FLUTTER / ANDROID
  mobile: {
    role: 'Mobile App Developer',
    milestones: [
      {
        title: 'Milestone 1: Mobile UI Architecture & Widget Systems',
        desc: 'Layout hierarchies, screen transitions, responsive mobile styling, and design systems.',
        tags: ['Mobile UI', 'Widgets', 'Layout Design', 'Components'],
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: State Management & Reactive UI Streams',
        desc: 'Handling global application state, asynchronous event streams, and cached data flow.',
        tags: ['State Management', 'Async Streams', 'Reactive UI', 'Data Flow'],
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 3: RESTful API Integration & Offline Local Storage',
        desc: 'Connecting to backend endpoints, token authentication, SQLite/Hive local storage, and offline sync.',
        tags: ['REST APIs', 'Local Storage', 'SQLite', 'Offline Sync'],
        quizzes: 3,
        exercises: 9,
      },
      {
        title: 'Milestone 4: Native Device Features & Push Notifications',
        desc: 'Camera access, GPS Geolocation, Firebase Cloud Messaging, biometric auth, and background services.',
        tags: ['Device APIs', 'Push Notifications', 'Firebase', 'Biometrics'],
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Production Build, Testing & App Store Publishing',
        desc: 'Automated UI testing, app bundle signing, Proguard obfuscation, Play Store & App Store deployment.',
        tags: ['App Store Release', 'Testing', 'Security Obfuscation', 'CI/CD'],
        quizzes: 2,
        exercises: 5,
      },
    ],
  },
};

/**
 * Universal Dynamic Generator for any unlisted custom search term (e.g. Blockchain, Rust, Embedded, Salesforce)
 */
const generateDynamicCustomCurriculum = (roleTitle) => {
  const clean = roleTitle.trim();
  return [
    {
      title: `Milestone 1: ${clean} Core Foundations & Environment Setup`,
      desc: `Master core syntax, development tooling, package managers, and foundational architecture for ${clean}.`,
      tags: [clean, 'Core Syntax', 'Foundations', 'Tooling'],
      quizzes: 4,
      exercises: 12,
    },
    {
      title: `Milestone 2: Key Architecture, Modules & Hands-on Coding Patterns`,
      desc: `Build modular components and working services using best practices and industry design patterns in ${clean}.`,
      tags: ['Architecture', 'Design Patterns', 'Practical Drills'],
      quizzes: 3,
      exercises: 10,
    },
    {
      title: `Milestone 3: Data Persistence, Database & API Integration`,
      desc: `Integrate databases, handle data flows, write query operations, and connect third-party APIs.`,
      tags: ['Database Integration', 'REST APIs', 'Data Flow'],
      quizzes: 3,
      exercises: 9,
    },
    {
      title: `Milestone 4: Advanced Features, Concurrency & Security Hardening`,
      desc: `Master advanced framework features, memory efficiency, asynchronous operations, and security protocols.`,
      tags: ['Advanced Topics', 'Performance', 'Security Hardening'],
      quizzes: 3,
      exercises: 8,
    },
    {
      title: `Milestone 5: Production Testing, CI/CD & Capstone Deployment`,
      desc: `Automate unit testing, containerize with Docker, build deployment pipelines, and deploy your ${clean} project.`,
      tags: ['Automated Testing', 'CI/CD', 'Production Deployment', 'Capstone Project'],
      quizzes: 2,
      exercises: 5,
    },
  ];
};

/**
 * Main AI function to generate dynamic personalized roadmap based on student inputs
 */
export const processroadmapAI = async (inputData) => {
  const {
    targetRole = 'Backend Developer',
    studentProfile = {},
    currentSkills = [],
  } = inputData;

  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const skillsListStr = Array.isArray(currentSkills) ? currentSkills.join(', ') : currentSkills;

  // 1. Try Google Gemini API if API key is configured
  if (apiKey) {
    try {
      console.log(`[AI Roadmap Engine] Requesting Gemini AI model for: "${targetRole}" with mastered profile skills: [${skillsListStr}]...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.ai?.model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a specialized AI Curriculum Architect model trained exclusively to design step-by-step technical learning roadmaps for technical job roles.

TARGET ROLE / GOAL SEARCHED BY STUDENT: "${targetRole}"

STUDENT PROFILE & CONFIRMED SKILLS:
- Student Department/Semester: ${studentProfile.department || 'ECS/CS'}, ${studentProfile.semester || 'Semester 6'}, CGPA: ${studentProfile.cgpa || '8.75'}
- Confirmed Mastered Skills Saved in Profile: [${skillsListStr}]

CRITICAL RULE FOR SKILL PRUNING & RE-TEACHING:
1. The student ALREADY knows and has mastered these confirmed skills: [${skillsListStr}].
2. DO NOT create introductory/beginner milestones to teach these already-known skills from scratch.
3. If a foundational skill (e.g., Java, Python, JavaScript, HTML, SQL) is already listed in the student's confirmed skills, either:
   a) Mark that prerequisite milestone as ALREADY COMPLETED (status: "completed", progress: 100) with title ending in "(Mastered ✓)", OR
   b) Skip basic lessons for that skill and advance straight to advanced topics, frameworks, and UNKNOWN skills needed specifically for "${targetRole}".

Generate exactly 5-6 ordered milestones tailored specifically to "${targetRole}". Return ONLY valid JSON matching this exact structure with no Markdown wrappers:
{
  "milestones": [
    {
      "id": 1,
      "title": "Milestone 1: <Topic for ${targetRole}>",
      "desc": "<Description of concepts taught>",
      "status": "completed",
      "progress": 100,
      "tags": ["Tag1", "Tag2"],
      "quizzes": 3,
      "exercises": 8
    }
  ]
}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJsonText);
          if (parsed && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
            console.log(`[AI Roadmap Engine] Dedicated Gemini AI roadmap generated successfully for "${targetRole}"!`);
            return {
              source: 'gemini-ai',
              milestones: parsed.milestones,
            };
          }
        }
      }
    } catch (err) {
      console.warn(`[AI Roadmap Engine Warning] Gemini API call failed (${err.message}). Using dynamic role-matching engine.`);
    }
  }

  // 2. High-Precision Domain Matching Engine
  console.log(`[AI Roadmap Engine] Generating domain-specific curriculum for searched term: "${targetRole}"`);
  
  const q = targetRole.toLowerCase().trim();
  let baseTemplate = null;

  if (q.includes('java') && !q.includes('script')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.java.milestones;
  } else if (q.includes('c++') || q.includes('cpp')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.cpp.milestones;
  } else if (q.includes('c#') || q.includes('.net') || q.includes('dotnet') || q.includes('csharp')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.csharp.milestones;
  } else if (q.includes('node') || q.includes('express') || q.includes('javascript backend') || q.includes('js backend')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.node.milestones;
  } else if (q.includes('python')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.python.milestones;
  } else if (q.includes('react') || q.includes('frontend') || q.includes('ui developer') || q.includes('web design') || q.includes('html')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.react.milestones;
  } else if (q.includes('full stack') || q.includes('fullstack') || q.includes('mern') || q.includes('mean')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.fullstack.milestones;
  } else if (q.includes('data') || q.includes('ai') || q.includes('machine learning') || q.includes('deep learning') || q.includes('nlp')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.data.milestones;
  } else if (q.includes('devops') || q.includes('cloud') || q.includes('aws') || q.includes('azure') || q.includes('docker') || q.includes('kubernetes')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.devops.milestones;
  } else if (q.includes('cyber') || q.includes('security') || q.includes('ethical hack') || q.includes('penetration') || q.includes('infosec')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.cyber.milestones;
  } else if (q.includes('flutter') || q.includes('android') || q.includes('ios') || q.includes('mobile') || q.includes('react native') || q.includes('swift') || q.includes('kotlin')) {
    baseTemplate = TECHNICAL_DOMAIN_CATALOG.mobile.milestones;
  } else if (q.includes('backend') || q.includes('back-end') || q.includes('api developer')) {
    // Generic backend: if java is in profile, use Java; if node in profile, use Node; otherwise Python
    if (skillsListStr.toLowerCase().includes('java')) {
      baseTemplate = TECHNICAL_DOMAIN_CATALOG.java.milestones;
    } else if (skillsListStr.toLowerCase().includes('node') || skillsListStr.toLowerCase().includes('javascript')) {
      baseTemplate = TECHNICAL_DOMAIN_CATALOG.node.milestones;
    } else {
      baseTemplate = TECHNICAL_DOMAIN_CATALOG.python.milestones;
    }
  } else {
    // Dynamic Custom Generator for any novel custom term
    baseTemplate = generateDynamicCustomCurriculum(targetRole);
  }

  const knownSkillsLower = (Array.isArray(currentSkills) ? currentSkills : [])
    .map((s) => s.toLowerCase().trim());

  let hasFoundIncomplete = false;

  const milestones = baseTemplate.map((m, idx) => {
    // Check if milestone tags match any mastered skill in profile
    const isMasteredSkill = m.tags.some((tag) =>
      knownSkillsLower.some((k) => tag.toLowerCase().includes(k) || k.includes(tag.toLowerCase()))
    );

    // If student already knows this skill in Milestone 1/2, mark it as Mastered & Completed!
    if (isMasteredSkill && idx < 2) {
      return {
        id: idx + 1,
        ...m,
        title: m.title.includes('Mastered') ? m.title : `${m.title} (Mastered ✓)`,
        desc: `${m.desc} (Prerequisite basics skipped because skill is saved in your profile).`,
        status: 'completed',
        progress: 100,
      };
    }

    if (!hasFoundIncomplete && idx > 0) {
      hasFoundIncomplete = true;
      return {
        id: idx + 1,
        ...m,
        status: 'in-progress',
        progress: 40,
      };
    }

    return {
      id: idx + 1,
      ...m,
      status: idx === 0 ? 'completed' : 'locked',
      progress: idx === 0 ? 100 : 0,
    };
  });

  return {
    source: 'role-curriculum-ai',
    milestones,
  };
};
