import { config } from '../config/env.js';

/**
 * Pure AI Roadmap Engine with Google Gemini AI integration & Intelligent Dynamic Curriculum Engine
 * Dynamically designs customized technical and domain learning milestones for any role or career path.
 */
export const processroadmapAI = async (inputData) => {
  const {
    targetRole = 'Full Stack Developer',
    studentProfile = {},
    currentSkills = [],
  } = inputData;

  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
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
      "progress": 40,
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

  const groqApiKey = process.env.Groq_AI_API_KEY || (apiKey && apiKey.startsWith('gsk_') ? apiKey : '');
  const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

  // 1. Try Groq AI Provider first if Groq API key is present
  if (groqApiKey && groqApiKey.startsWith('gsk_')) {
    for (const model of groqModels) {
      try {
        console.log(`[Groq AI] Requesting live curriculum generation for "${targetRole}" via ${model}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are a world-class AI Career & Curriculum Architect. Output valid JSON strictly matching the requested roadmap schema.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.choices?.[0]?.message?.content;
          if (rawText) {
            const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            if (parsed && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
              const sanitized = parsed.milestones.map((m, index) => ({
                id: index + 1,
                title: m.title || `Milestone ${index + 1}: ${targetRole} Module`,
                desc: m.desc || `Core learning concepts and practical skills for ${targetRole}`,
                status: m.status || (index === 0 ? 'in-progress' : 'locked'),
                progress: typeof m.progress === 'number' ? m.progress : (index === 0 ? 40 : 0),
                tags: Array.isArray(m.tags) ? m.tags : [targetRole],
                topics: Array.isArray(m.topics) && m.topics.length > 0 ? m.topics : generateRoleSpecificTopics(targetRole, m.title, index + 1, currentSkills),
                quizzes: typeof m.quizzes === 'number' ? m.quizzes : 3,
                exercises: typeof m.exercises === 'number' ? m.exercises : 8,
              }));

              console.log(`[Groq AI] Successfully generated ${sanitized.length} live AI milestones for "${targetRole}" via ${model}!`);
              return {
                source: 'groq-ai-live',
                modelUsed: model,
                milestones: sanitized,
              };
            }
          }
        } else {
          const errText = await response.text().catch(() => '');
          console.warn(`[Groq AI] Model ${model} status ${response.status}: ${errText.slice(0, 150)}`);
        }
      } catch (err) {
        console.warn(`[Groq AI] Error with model ${model}: ${err.message}`);
      }
    }
  }

  // 2. Try Google Gemini AI Provider if Gemini API key is present
  const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  const geminiKey = apiKey && !apiKey.startsWith('gsk_') && apiKey !== 'your_ai_api_key' ? apiKey : '';

  if (geminiKey) {
    for (const model of geminiModels) {
      try {
        console.log(`[Google Gemini AI] Requesting live curriculum generation for "${targetRole}" via ${model}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, topK: 40, topP: 0.95 },
            }),
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            if (parsed && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
              const sanitized = parsed.milestones.map((m, index) => ({
                id: index + 1,
                title: m.title || `Milestone ${index + 1}: ${targetRole} Module`,
                desc: m.desc || `Core learning concepts and practical skills for ${targetRole}`,
                status: m.status || (index === 0 ? 'in-progress' : 'locked'),
                progress: typeof m.progress === 'number' ? m.progress : (index === 0 ? 40 : 0),
                tags: Array.isArray(m.tags) ? m.tags : [targetRole],
                topics: Array.isArray(m.topics) && m.topics.length > 0 ? m.topics : generateRoleSpecificTopics(targetRole, m.title, index + 1, currentSkills),
                syllabus: milestoneSyllabus,
                resources: milestoneResources,
                quizzes: typeof m.quizzes === 'number' ? m.quizzes : 3,
                exercises: typeof m.exercises === 'number' ? m.exercises : 8,
              }));

              console.log(`[Google Gemini AI] Successfully generated ${sanitized.length} live AI milestones for "${targetRole}" via ${model}!`);
              return {
                source: 'gemini-ai-live',
                modelUsed: model,
                milestones: sanitized,
              };
            }
          }
        }
      } catch (err) {
        console.warn(`[Google Gemini AI] Warning for model ${model}: ${err.message}`);
      }
    }
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
  const roleLower = (targetRole || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();

  // Frontend / React / Web
  if (roleLower.includes('frontend') || roleLower.includes('react') || roleLower.includes('web')) {
    if (step === 1) return [
      "Semantic HTML5 elements & Modern CSS flexbox/grid responsive layouts",
      "JavaScript ES6+ fundamentals: Promises, Async/Await, Arrow functions & DOM API",
      "Git version control workflows & browser developer tools debugging",
      "Building a responsive portfolio landing page project",
    ];
    if (step === 2) return [
      "React Component Architecture: Functional components, Hooks (useState, useEffect, useContext)",
      "Single-Page Application Routing with React Router v6 & Navigation Guards",
      "Asynchronous REST API Integration using Axios with error boundary handling",
      "Form validation with React Hook Form & Zod schema validation",
    ];
    if (step === 3) return [
      "State Management Patterns: Redux Toolkit / Zustand global state stores",
      "TypeScript integration: Type interfaces, Generics & Component props typing",
      "UI Component Libraries: Radix UI, Shadcn UI & Tailwind CSS custom design systems",
      "Web Performance Optimization: Code splitting, Lazy loading & Lighthouse audits",
    ];
    if (step === 4) return [
      "Next.js App Router: Server-Side Rendering (SSR) & Static Site Generation (SSG)",
      "Server Actions, API Routes & Database Connection with Prisma ORM",
      "Unit & Component Testing with Jest and React Testing Library",
      "End-to-End E-Commerce web application capstone project build",
    ];
    return [
      "Web Accessibility (a11y) & Cross-Browser Compatibility Standards",
      "CI/CD Automated Deployment to Vercel/Netlify with GitHub Actions",
      "Real-time WebSockets & WebRTC live data streaming implementation",
      "Production Performance Monitoring & Error Tracking with Sentry",
    ];
  }

  // Java / Backend / Spring Boot
  if (roleLower.includes('java') || roleLower.includes('backend') || roleLower.includes('spring')) {
    if (step === 1) return [
      "Core Java 17+ Syntax: OOP Concepts, Inheritance, Interfaces & Collections Framework",
      "Java Streams API, Lambda Expressions & Exception Handling Best Practices",
      "Relational Database Design & Complex SQL Queries in PostgreSQL/MySQL",
      "Maven / Gradle Build Tools & JUnit 5 Testing Basics",
    ];
    if (step === 2) return [
      "Spring Boot Core Architecture: Dependency Injection, Inversion of Control & Beans",
      "Building RESTful Web Services with Spring MVC (@RestController, Request Mapping)",
      "Object-Relational Mapping (ORM) with Hibernate & Spring Data JPA Repositories",
      "Input Validation, DTO Pattern & Global Exception Handling Advice",
    ];
    if (step === 3) return [
      "Spring Security Configuration, JWT Authentication & Role-Based Access Control",
      "Caching Strategies with Redis & In-Memory Data Structures",
      "Asynchronous Messaging with RabbitMQ / Apache Kafka Event Streams",
      "Database Migrations with Flyway / Liquibase",
    ];
    if (step === 4) return [
      "Spring Cloud Microservices: Eureka Service Discovery & API Gateway Routing",
      "Docker Containerization of Spring Boot Applications & Multi-Stage Builds",
      "Integration Testing with Testcontainers & Mockito Unit Tests",
      "Distributed Tracing & Centralized Logging with OpenTelemetry and Zipkin",
    ];
    return [
      "Production Deployment on Cloud Platforms (AWS ECS / Kubernetes Cluster)",
      "Database Query Optimization, Indexing Strategies & Connection Pooling",
      "Enterprise Banking/E-Commerce Microservices Capstone System Build",
      "CI/CD Automated Build & Deployment Pipeline via Jenkins/GitHub Actions",
    ];
  }

  // Python / Data Science / AI
  if (roleLower.includes('python') || roleLower.includes('data') || roleLower.includes('ai') || roleLower.includes('machine learning')) {
    if (step === 1) return [
      "Python 3 Advanced Syntax: Data Structures, List Comprehensions & OOP Patterns",
      "Numerical Computing & Data Manipulation using NumPy & Pandas",
      "Exploratory Data Analysis (EDA) & Data Visualization with Matplotlib & Seaborn",
      "SQL Data Extraction & Query Optimization for Data Analysts",
    ];
    if (step === 2) return [
      "Machine Learning Algorithms: Supervised Regression, Classification & Decision Trees",
      "Feature Engineering, Feature Scaling & Missing Value Imputation",
      "Model Evaluation Metrics: Confusion Matrix, ROC-AUC, Precision, Recall & F1-Score",
      "Scikit-Learn Machine Learning Pipeline Construction",
    ];
    if (step === 3) return [
      "Deep Learning Foundations: Artificial Neural Networks (ANNs) in PyTorch / TensorFlow",
      "Convolutional Neural Networks (CNNs) for Computer Vision & Image Classification",
      "Recurrent Neural Networks (RNNs) & Transformer Architectures for NLP",
      "Model Hyperparameter Tuning with Optuna & Grid Search",
    ];
    if (step === 4) return [
      "Large Language Models (LLMs), Prompt Engineering & Fine-Tuning Techniques",
      "Retrieval-Augmented Generation (RAG) Systems with Vector Databases (Pinecone/ChromaDB)",
      "Building Interactive AI Web Apps with FastAPI & Streamlit",
      "MLOps Pipelines: Model Versioning with MLflow & Docker Containerization",
    ];
    return [
      "End-to-End Enterprise Predictive AI System Capstone Project",
      "Model Monitoring for Data Drift & Concept Drift in Production",
      "Cloud AI Deployment on AWS SageMaker / GCP Vertex AI",
      "AI Ethics, Bias Detection & Model Explainability (SHAP/LIME)",
    ];
  }

  // Cyber Security
  if (roleLower.includes('security') || roleLower.includes('cyber') || roleLower.includes('ethical')) {
    if (step === 1) return [
      "Computer Networking Protocols: TCP/IP, OSI Model, Subnetting, DNS & HTTP/S",
      "Linux System Administration, Terminal Commands & Shell Scripting for Security",
      "Cryptography Essentials: Symmetric/Asymmetric Encryption, Hashing & PKI",
      "Information Gathering & Reconnaissance using Nmap, Dig & Whois",
    ];
    if (step === 2) return [
      "Web Application Security: OWASP Top 10 Vulnerabilities (SQLi, XSS, CSRF, IDOR)",
      "Vulnerability Scanning & Assessment using Burp Suite & Nessus",
      "Network Packet Analysis & Traffic Inspection with Wireshark",
      "Metasploit Framework Penetration Testing Fundamentals",
    ];
    if (step === 3) return [
      "Ethical Hacking Methodologies: Exploitation & Privilege Escalation (Linux & Windows)",
      "Malware Analysis Basics: Static vs Dynamic Analysis & Reverse Engineering Tools",
      "Wireless Network Security Audit & WPA2/WPA3 Password Cracking",
      "Active Directory Hacking & Lateral Movement Techniques",
    ];
    return [
      "Security Information and Event Management (SIEM) with Splunk & ELK Stack",
      "Incident Response & Threat Hunting Protocols",
      "Capston Ethical Hacking Audit Report & Security Remediation Recommendations",
      "CompTIA Security+ / CEH Exam Preparation & Industry Standards",
    ];
  }

  // DevOps & Cloud
  if (roleLower.includes('devops') || roleLower.includes('cloud')) {
    if (step === 1) return [
      "Linux Shell Scripting & Git Advanced Branching/Merging Strategies",
      "Docker Containerization: Dockerfiles, Multi-Stage Builds & Docker Compose",
      "Cloud Infrastructure Basics: AWS EC2, S3, VPC Networking & Security Groups",
      "CI/CD Pipeline Automation using GitHub Actions & GitLab CI",
    ];
    if (step === 2) return [
      "Infrastructure as Code (IaC): Terraform State Management & HCL Syntax",
      "Kubernetes Container Orchestration: Pods, Deployments, Services & Ingress",
      "Configuration Management with Ansible Playbooks & Roles",
      "Helm Package Manager for Kubernetes App Deployments",
    ];
    return [
      "Monitoring & Alerting with Prometheus and Grafana Dashboards",
      "Zero-Downtime Deployment Strategies: Blue-Green & Canary Deployments",
      "Capston Multi-Region Kubernetes Cloud Deployment Project",
      "Cloud Security Compliance, IAM Policies & Cost Optimization",
    ];
  }

  // Generic Role Specific Topics Fallback
  return [
    `Foundational principles, core methodology & industry standard tools for ${targetRole}`,
    `Hands-on technical implementation & domain-specific practical skill execution`,
    `Advanced problem solving, workflow optimization & quality control for ${targetRole}`,
    `Real-world capstone project build, portfolio documentation & professional assessment`,
  ];
}

/**
 * Generates detailed syllabus modules for a given role and step
 */
export function generateRoleSpecificSyllabus(targetRole, title, step, currentSkills = []) {
  const cleanRole = targetRole || 'Specialized Role';
  const roleLower = cleanRole.toLowerCase();

  if (roleLower.includes('frontend') || roleLower.includes('react') || roleLower.includes('web')) {
    if (step === 1) return [
      {
        moduleTitle: "Unit 1.1: Web Fundamentals & Semantic HTML5",
        duration: "Week 1 · 10 Hours",
        concepts: ["HTML5 Semantic Elements (nav, section, article, header, footer)", "DOM Hierarchy & ARIA Accessibility attributes", "Form Controls & Input Type Validation"],
        practicalOutcome: "Build a responsive accessible multi-page personal portfolio landing page"
      },
      {
        moduleTitle: "Unit 1.2: Modern Responsive Layouts & CSS Grid/Flexbox",
        duration: "Week 2 · 12 Hours",
        concepts: ["CSS Box Model, Positioning & Stacking Context", "Flexbox Alignment, Distribution & Container Properties", "CSS Grid Layout Systems & Dynamic Auto-Fit/Fill Templates"],
        practicalOutcome: "Develop a responsive product pricing dashboard with dark mode support"
      }
    ];
    if (step === 2) return [
      {
        moduleTitle: "Unit 2.1: React Component Lifecycle & Hooks Deep Dive",
        duration: "Week 3 · 14 Hours",
        concepts: ["JSX Compilation & Virtual DOM Reconciliation", "State vs Props & Immutability Rules", "useState, useEffect, useRef & Custom Hooks Design"],
        practicalOutcome: "Build a real-time interactive search and filtering portal"
      },
      {
        moduleTitle: "Unit 2.2: SPA Routing & Form Handling",
        duration: "Week 4 · 12 Hours",
        concepts: ["React Router v6 Nested Routes & Dynamic Parameters", "Protected Route Guards & Auth Redirects", "Controlled Forms with React Hook Form & Zod Validation"],
        practicalOutcome: "Build a multi-step user registration & profile management workflow"
      }
    ];
  }

  if (roleLower.includes('java') || roleLower.includes('backend') || roleLower.includes('spring')) {
    if (step === 1) return [
      {
        moduleTitle: "Unit 1.1: Core Java 17+ OOP & Data Structures",
        duration: "Week 1 · 14 Hours",
        concepts: ["Encapsulation, Inheritance, Interfaces & Abstract Classes", "Java Collections Framework (ArrayList, HashMap, HashSet performance)", "Exception Handling Architecture & Custom Exception Design"],
        practicalOutcome: "Build an object-oriented CLI inventory management application"
      },
      {
        moduleTitle: "Unit 1.2: Java Streams API & PostgreSQL Queries",
        duration: "Week 2 · 14 Hours",
        concepts: ["Functional Interfaces, Lambda Expressions & Stream API Pipelines", "Database Normalization & Indexing Strategies", "Complex SQL Joins, Subqueries & Aggregations"],
        practicalOutcome: "Construct a JDBC/PostgreSQL database connector and data processing engine"
      }
    ];
    if (step === 2) return [
      {
        moduleTitle: "Unit 2.1: Spring Boot Dependency Injection & REST Controller",
        duration: "Week 3 · 16 Hours",
        concepts: ["Spring IoC Container, Bean Scopes & @Autowired", "Building RESTful APIs with @RestController, @PathVariable, @RequestBody", "DTO Pattern & Spring Validation Annotations"],
        practicalOutcome: "Build a REST API service for an e-commerce catalog"
      },
      {
        moduleTitle: "Unit 2.2: Object-Relational Mapping with Spring Data JPA",
        duration: "Week 4 · 14 Hours",
        concepts: ["Hibernate Entities, Relationships (@OneToMany, @ManyToMany)", "Spring Data JPA Repository Interfaces & Derived Queries", "Transaction Management (@Transactional) & Lazy Loading"],
        practicalOutcome: "Implement full persistence layer for orders and customer entities"
      }
    ];
  }

  if (roleLower.includes('python') || roleLower.includes('data') || roleLower.includes('ai') || roleLower.includes('machine learning')) {
    if (step === 1) return [
      {
        moduleTitle: "Unit 1.1: Advanced Python Syntax & Data Analysis",
        duration: "Week 1 · 12 Hours",
        concepts: ["Python Data Structures, Dict Comprehensions & Generators", "NumPy N-Dimensional Array Operations & Vectorization", "Pandas DataFrames, Merging, GroupBy & Time-Series Data"],
        practicalOutcome: "Conduct EDA on a financial transaction dataset with Seaborn visualizations"
      },
      {
        moduleTitle: "Unit 1.2: Statistical Analysis & Feature Engineering",
        duration: "Week 2 · 14 Hours",
        concepts: ["Probability Distributions, Hypothesis Testing & Correlation", "Handling Missing Data, Outliers & One-Hot Encoding", "Feature Scaling (StandardScaler, MinMaxScaler)"],
        practicalOutcome: "Prepare a clean ML-ready dataset pipeline"
      }
    ];
  }

  // Universal Fallback Syllabus
  return [
    {
      moduleTitle: `Unit ${step}.1: Foundational Framework & Core Principles of ${cleanRole}`,
      duration: `Week 1-2 · 12 Hours`,
      concepts: [
        `Core theoretical framework and architectural setup for ${cleanRole}`,
        `Essential tooling, environment configuration, and syntax standards`,
        `Industry best practices and standard operating procedures`
      ],
      practicalOutcome: `Set up dev environment and build initial foundational module for ${cleanRole}`
    },
    {
      moduleTitle: `Unit ${step}.2: Practical Execution & Applied Skills`,
      duration: `Week 3-4 · 16 Hours`,
      concepts: [
        `Real-world implementation scenarios and hands-on lab exercises`,
        `Diagnostic workflows, testing strategies, and performance tuning`,
        `System integration, security standards, and code quality checks`
      ],
      practicalOutcome: `Deliver a fully verified capstone module for ${cleanRole}`
    }
  ];
}

/**
 * Generates curated reference links for a given role and step
 */
export function generateRoleSpecificResources(targetRole, title, step) {
  const cleanRole = targetRole || 'Specialized Role';
  const roleLower = cleanRole.toLowerCase();

  if (roleLower.includes('frontend') || roleLower.includes('react') || roleLower.includes('web')) {
    return [
      {
        title: "MDN Web Docs - JavaScript & Web APIs",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
        type: "Documentation",
        provider: "MDN Web Docs"
      },
      {
        title: "React Official Interactive Learning Guide",
        url: "https://react.dev/learn",
        type: "Documentation",
        provider: "React Official"
      },
      {
        title: "freeCodeCamp Responsive Web Design & React",
        url: "https://www.freecodecamp.org/learn/",
        type: "Practice Portal",
        provider: "freeCodeCamp"
      },
      {
        title: "GeeksforGeeks React JS Developer Tutorials",
        url: "https://www.geeksforgeeks.org/react-js-tutorials/",
        type: "Tutorial",
        provider: "GeeksforGeeks"
      }
    ];
  }

  if (roleLower.includes('java') || roleLower.includes('backend') || roleLower.includes('spring')) {
    return [
      {
        title: "Oracle Java SE 17 Official Documentation",
        url: "https://docs.oracle.com/en/java/",
        type: "Documentation",
        provider: "Oracle"
      },
      {
        title: "Baeldung Spring Boot & Microservices Tutorials",
        url: "https://www.baeldung.com/spring-boot",
        type: "Tutorial",
        provider: "Baeldung"
      },
      {
        title: "Spring.io Official Getting Started Guides",
        url: "https://spring.io/guides",
        type: "Documentation",
        provider: "Spring Framework"
      },
      {
        title: "GeeksforGeeks Java Programming Hub",
        url: "https://www.geeksforgeeks.org/java/",
        type: "Guide",
        provider: "GeeksforGeeks"
      }
    ];
  }

  if (roleLower.includes('python') || roleLower.includes('data') || roleLower.includes('ai') || roleLower.includes('machine learning')) {
    return [
      {
        title: "Python 3 Official Language Tutorial",
        url: "https://docs.python.org/3/tutorial/",
        type: "Documentation",
        provider: "Python Docs"
      },
      {
        title: "Scikit-Learn Machine Learning User Guide",
        url: "https://scikit-learn.org/stable/user_guide.html",
        type: "Documentation",
        provider: "Scikit-Learn"
      },
      {
        title: "Kaggle Learn - Interactive Data Science Courses",
        url: "https://www.kaggle.com/learn",
        type: "Practice Portal",
        provider: "Kaggle"
      },
      {
        title: "PyTorch Deep Learning Official Tutorials",
        url: "https://pytorch.org/tutorials/",
        type: "Tutorial",
        provider: "PyTorch"
      }
    ];
  }

  if (roleLower.includes('security') || roleLower.includes('cyber') || roleLower.includes('ethical')) {
    return [
      {
        title: "OWASP Top 10 Web Application Security Risks",
        url: "https://owasp.org/www-project-top-ten/",
        type: "Documentation",
        provider: "OWASP Foundation"
      },
      {
        title: "PortSwigger Web Security Academy",
        url: "https://portswigger.net/web-security",
        type: "Practice Portal",
        provider: "PortSwigger"
      },
      {
        title: "Cybrary Free Cyber Security & Ethical Hacking",
        url: "https://www.cybrary.it/",
        type: "Tutorial",
        provider: "Cybrary"
      }
    ];
  }

  if (roleLower.includes('devops') || roleLower.includes('cloud')) {
    return [
      {
        title: "Docker Official Getting Started Guide",
        url: "https://docs.docker.com/get-started/",
        type: "Documentation",
        provider: "Docker Docs"
      },
      {
        title: "Kubernetes Tutorials & Architecture Concepts",
        url: "https://kubernetes.io/docs/tutorials/",
        type: "Practice Portal",
        provider: "Kubernetes"
      },
      {
        title: "AWS Cloud Architecture & Hands-on Labs",
        url: "https://aws.amazon.com/getting-started/",
        type: "Guide",
        provider: "AWS"
      }
    ];
  }

  // Universal Fallback Resources
  return [
    {
      title: `GeeksforGeeks Technical Guides for ${cleanRole}`,
      url: "https://www.geeksforgeeks.org/",
      type: "Tutorial",
      provider: "GeeksforGeeks"
    },
    {
      title: "freeCodeCamp Open Curriculum & Labs",
      url: "https://www.freecodecamp.org/",
      type: "Practice Portal",
      provider: "freeCodeCamp"
    },
    {
      title: "W3Schools Reference Documentation",
      url: "https://www.w3schools.com/",
      type: "Guide",
      provider: "W3Schools"
    },
    {
      title: "Roadmap.sh - Developer Roadmaps",
      url: "https://roadmap.sh/",
      type: "Documentation",
      provider: "Roadmap.sh"
    }
  ];
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

    return {
      id: step,
      title: titles[step - 1],
      desc: descs[step - 1],
      status: step === 1 ? 'in-progress' : 'locked',
      progress: step === 1 ? 40 : 0,
      tags: [`${cleanRole} Step ${step}`, 'Foundations', 'Practical Labs'],
      topics: generateRoleSpecificTopics(cleanRole, titles[step - 1], step, currentSkills),
      syllabus: generateRoleSpecificSyllabus(cleanRole, titles[step - 1], step, currentSkills),
      resources: generateRoleSpecificResources(cleanRole, titles[step - 1], step),
      quizzes: 3 + (step % 2),
      exercises: 6 + step * 2,
    };
  });
}
