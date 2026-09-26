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
        "Specific Topic 2 with tool/framework",
        "Specific Topic 3 practical project task",
        "Specific Topic 4 domain objective"
      ],
      "quizzes": 3,
      "exercises": 8
    }
  ]
}`;

  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.7-flash',
    'gemini-flash-latest',
  ];

  if (apiKey && apiKey !== 'your_ai_api_key' && apiKey !== 'YOUR_GEMINI_API_KEY') {
    for (const model of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Google Gemini AI] Requesting live curriculum generation for "${targetRole}" via ${model} (Attempt ${attempt})...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000);

          let response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
              },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                },
              }),
            }
          );

          if (response.status === 401) {
            response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
              {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                },
                signal: controller.signal,
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.7,
                  },
                }),
              }
            );
          }

          clearTimeout(timeoutId);

          if (response.status === 503 || response.status === 429) {
            console.warn(`[Google Gemini AI] Model ${model} rate-limited (${response.status}). Trying next available model...`);
            break;
          }

          if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            console.warn(`[Google Gemini AI] Model ${model} returned status ${response.status}: ${errorBody.slice(0, 150)}`);
            break;
          }

          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!rawText) break;

          const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          let parsed;
          try {
            parsed = JSON.parse(cleanJsonText);
          } catch (parseErr) {
            const jsonMatch = cleanJsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
            else break;
          }

          if (parsed && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
            const sanitizedMilestones = parsed.milestones.map((m, index) => {
              let milestoneTopics = Array.isArray(m.topics) ? m.topics.filter(Boolean) : [];
              if (milestoneTopics.length === 0) {
                milestoneTopics = generateRoleSpecificTopics(targetRole, m.title, index + 1, currentSkills);
              }

              return {
                id: index + 1,
                title: m.title || `Milestone ${index + 1}: ${targetRole} Module`,
                desc: m.desc || `Core learning concepts and practical skills for ${targetRole}`,
                status: m.status || (index === 0 ? 'in-progress' : 'locked'),
                progress: typeof m.progress === 'number' ? m.progress : (index === 0 ? 40 : 0),
                tags: Array.isArray(m.tags) ? m.tags : [targetRole],
                topics: milestoneTopics,
                quizzes: typeof m.quizzes === 'number' ? m.quizzes : 3,
                exercises: typeof m.exercises === 'number' ? m.exercises : 8,
              };
            });

            console.log(`[Google Gemini AI] Successfully generated ${sanitizedMilestones.length} live AI milestones for "${targetRole}" via ${model}!`);
            return {
              source: 'gemini-ai-live',
              modelUsed: model,
              milestones: sanitizedMilestones,
            };
          }
        } catch (err) {
          console.warn(`[Google Gemini AI] Connection warning for model ${model}: ${err.message}`);
        }
      }
    }
  }

  // Fallback to Role-and-Skill-Tailored Dynamic Generator
  console.log(`[AI Engine Fallback] Generating role-tailored dynamic roadmap for "${targetRole}"...`);
  const generatedMilestones = generateDynamicMilestones(targetRole, currentSkills);

  return {
    source: 'gemini-ai-dynamic',
    modelUsed: 'gemini-ai-fallback',
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
 * Generates a complete 5-milestone dynamic roadmap structure
 */

function generateDynamicMilestones(targetRole, currentSkills = []) {
  const cleanRole = targetRole || 'Specialized Role';

  return [
    {
      id: 1,
      title: `Milestone 1: Fundamentals & Core Tools of ${cleanRole}`,
      desc: `Master basic principles, foundational concepts, essential tools, and core practices required for ${cleanRole}.`,
      status: 'in-progress',
      progress: 40,
      tags: [`${cleanRole} Basics`, 'Foundations', 'Core Tools', 'Best Practices'],
      topics: generateRoleSpecificTopics(cleanRole, 'Fundamentals', 1, currentSkills),
      quizzes: 4,
      exercises: 10,
    },
    {
      id: 2,
      title: `Milestone 2: Intermediate Architecture & Practical Execution`,
      desc: `Develop hands-on technical proficiency, structural patterns, and execution skills specific to ${cleanRole}.`,
      status: 'locked',
      progress: 0,
      tags: ['Practical Execution', 'Architecture Patterns', 'Skill Development'],
      topics: generateRoleSpecificTopics(cleanRole, 'Intermediate', 2, currentSkills),
      quizzes: 4,
      exercises: 12,
    },
    {
      id: 3,
      title: `Milestone 3: Advanced Optimization & Industry Standards`,
      desc: `Master intricate techniques, advanced workflows, quality assurance, and high-performance practices for ${cleanRole}.`,
      status: 'locked',
      progress: 0,
      tags: ['Advanced Workflows', 'Performance', 'Quality Assurance'],
      topics: generateRoleSpecificTopics(cleanRole, 'Advanced', 3, currentSkills),
      quizzes: 3,
      exercises: 10,
    },
    {
      id: 4,
      title: `Milestone 4: Automation, Testing & System Integration`,
      desc: `Learn integration standards, automated testing methods, durability testing, and industry compliance.`,
      status: 'locked',
      progress: 0,
      tags: ['Integration', 'Automated Testing', 'Compliance'],
      topics: generateRoleSpecificTopics(cleanRole, 'Automation', 4, currentSkills),
      quizzes: 3,
      exercises: 8,
    },
    {
      id: 5,
      title: `Milestone 5: Production Capstone Project & Portfolio Mastery`,
      desc: `Create an end-to-end master masterpiece project, building a professional portfolio and presentation for ${cleanRole}.`,
      status: 'locked',
      progress: 0,
      tags: [`${cleanRole} Capstone`, 'Portfolio Project', 'Production Deployment'],
      topics: generateRoleSpecificTopics(cleanRole, 'Capstone', 5, currentSkills),
      quizzes: 3,
      exercises: 9,
    },
  ];
}
