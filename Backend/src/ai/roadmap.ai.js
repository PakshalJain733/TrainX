import { config } from '../config/env.js';

/**
 * Pure AI Roadmap Engine powered by Google Gemini AI.
 * Dynamically designs customized technical learning milestones for any role or career path.
 * When Google Gemini is unavailable (missing/invalid API key or service outage), a
 * legitimate rule-based curriculum engine generates a real, personalized roadmap
 * so students always receive a valid roadmap instead of a silent failure.
 */

const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

/**
 * Live Google Gemini generation. Returns { source, modelUsed, milestones } on success,
 * throws on complete failure so the caller can fall back to the rule-based engine.
 */
const generateViaGemini = async ({ targetRole, prompt, apiKey, configuredModel }) => {
  const modelsToTry = Array.from(
    new Set([configuredModel, ...FALLBACK_MODELS].filter(Boolean))
  );

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Google Gemini AI] Requesting live curriculum generation for "${targetRole}" via ${model}...`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.warn(`[Google Gemini AI] Model ${model} returned status ${response.status}. ${errorBody.slice(0, 100)}`);
        lastError = new Error(`Gemini AI (${model}) error ${response.status}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        lastError = new Error(`Google Gemini (${model}) returned an empty candidate text.`);
        continue;
      }

      // Clean JSON delimiters if returned
      const cleanJsonText = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanJsonText);
      } catch (parseErr) {
        const jsonMatch = cleanJsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          lastError = new Error(`JSON parse failure from ${model}: ${parseErr.message}`);
          continue;
        }
      }

      if (!parsed || !Array.isArray(parsed.milestones) || parsed.milestones.length === 0) {
        lastError = new Error(`Invalid milestones array from ${model}`);
        continue;
      }

      const sanitizedMilestones = parsed.milestones.map((m, index) => ({
        id: index + 1,
        title: m.title || `Milestone ${index + 1}: ${targetRole} Module`,
        desc: m.desc || `Core learning concepts for ${targetRole}`,
        status: m.status || (index === 0 ? 'in-progress' : 'locked'),
        progress: typeof m.progress === 'number' ? m.progress : (index === 0 ? 40 : 0),
        tags: Array.isArray(m.tags) ? m.tags : [targetRole],
        quizzes: typeof m.quizzes === 'number' ? m.quizzes : 3,
        exercises: typeof m.exercises === 'number' ? m.exercises : 8,
      }));

      console.log(`[Google Gemini AI] Successfully generated ${sanitizedMilestones.length} live AI milestones for "${targetRole}" via ${model}!`);

      return {
        source: 'gemini-ai',
        modelUsed: model,
        milestones: sanitizedMilestones,
      };
    } catch (err) {
      lastError = err;
      console.warn(`[Google Gemini AI] Connection error with model ${model}: ${err.message}`);
    }
  }

  throw (lastError || new Error('Failed to generate roadmap from Google Gemini AI.'));
};

/**
 * Curated curriculum tracks for common career goals. Each track is 6 ordered
 * milestones that progress from fundamentals through real-world capstone work.
 */
const KNOWN_TRACKS = {
  java: [
    { title: 'Java Fundamentals & OOP', desc: 'Master Java syntax, JVM execution model, object-oriented design, exception handling, and standard build tooling with Maven/Gradle.', tags: ['Java', 'OOP', 'JVM', 'Maven'] },
    { title: 'Core Java APIs & Data Structures', desc: 'Deep-dive into Collections, Streams, Generics, concurrency, and memory management with practical coding drills.', tags: ['Java', 'Collections', 'Streams', 'Concurrency'] },
    { title: 'Spring Boot & REST APIs', desc: 'Build production-grade RESTful services with Spring Boot, dependency injection, validation, and layered architecture.', tags: ['Spring Boot', 'REST', 'Microservices'] },
    { title: 'Databases & ORM (JPA/Hibernate)', desc: 'Model relational schemas and persist data using SQL, JPA, Hibernate, caching, and transaction management.', tags: ['SQL', 'JPA', 'Hibernate', 'MySQL'] },
    { title: 'Testing, CI/CD & Best Practices', desc: 'Write unit and integration tests with JUnit and Mockito, then wire up CI/CD pipelines and containerized deploys.', tags: ['JUnit', 'Mockito', 'CI/CD', 'Docker'] },
    { title: 'Capstone: Microservices Portfolio', desc: 'Design and ship an end-to-end microservices project with Java, Spring Cloud, message queues, and monitoring.', tags: ['Capstone', 'Microservices', 'Portfolio', 'Docker'] },
  ],
  python: [
    { title: 'Python Fundamentals & Environment', desc: 'Set up Python, virtual environments, git workflows, and idiomatic Python syntax, data types, and control flow.', tags: ['Python', 'Virtualenv', 'Git', 'Fundamentals'] },
    { title: 'Core Language & Data Structures', desc: 'Build mastery over functions, classes, modules, generators, decorators, and built-in data structures with practice drills.', tags: ['Python', 'OOP', 'Data Structures', 'Decorators'] },
    { title: 'Web Development (Flask/Django)', desc: 'Develop RESTful web applications with Flask or Django, including routing, templates, forms, and authentication.', tags: ['Flask', 'Django', 'REST', 'Authentication'] },
    { title: 'Databases, Testing & Logging', desc: 'Persist data with SQL and ORMs, add pytest coverage, and instrument production-ready logging and error handling.', tags: ['SQL', 'pytest', 'ORM', 'Logging'] },
    { title: 'Advanced Python & Automation', desc: 'Explore async programming, scripting, package design, and automation pipelines that scale to real workloads.', tags: ['Async', 'Automation', 'Scripting'] },
    { title: 'Capstone + Interview Prep', desc: 'Ship a portfolio-ready Python application and sharpen coding-interview problem-solving skills.', tags: ['Capstone', 'Portfolio', 'Interviews', 'Python'] },
  ],
  frontend: [
    { title: 'HTML, CSS & Responsive Layout', desc: 'Master semantic HTML, modern CSS, Flexbox/Grid, and responsive design fundamentals for any screen size.', tags: ['HTML', 'CSS', 'Responsive', 'Flexbox'] },
    { title: 'JavaScript Deep Dive (ES6+)', desc: 'Solidify JavaScript fundamentals: scoping, closures, promises, async/await, and browser DOM APIs.', tags: ['JavaScript', 'ES6', 'DOM', 'Async'] },
    { title: 'React & Component Architecture', desc: 'Build interactive UIs with React, hooks, state management, and reusable component design.', tags: ['React', 'Hooks', 'State', 'Components'] },
    { title: 'Tooling, Bundlers & Testing', desc: 'Configure Vite/Webpack, linting, and Vitest/Jest while applying performance and accessibility best practices.', tags: ['Vite', 'Webpack', 'Testing', 'Accessibility'] },
    { title: 'Interviews, TypeScript & Advanced Patterns', desc: 'Level-up with TypeScript, advanced rendering patterns, and hands-on frontend interview preparation.', tags: ['TypeScript', 'Interviews', 'Patterns'] },
    { title: 'Capstone: Production Frontend', desc: 'Design and deploy a polished, production-grade frontend application backed by real APIs.', tags: ['Capstone', 'Deployment', 'Portfolio'] },
  ],
  backend: [
    { title: 'Backend Foundations & APIs', desc: 'Understand HTTP, REST design, server architecture, and request lifecycle for backend services.', tags: ['HTTP', 'REST', 'APIs', 'Fundamentals'] },
    { title: 'Programming & Data Modeling', desc: 'Strengthen server-side language fundamentals and design relational data models with integrity constraints.', tags: ['Programming', 'SQL', 'Data Modeling'] },
    { title: 'Frameworks & Authentication', desc: 'Build secure endpoints with a backend framework, including JWT/OAuth authentication and role-based access control.', tags: ['Frameworks', 'JWT', 'OAuth', 'Security'] },
    { title: 'Caching, Queues & Scaling', desc: 'Add caching, background jobs, and message queues to build services that scale under load.', tags: ['Caching', 'Queues', 'Redis', 'Scaling'] },
    { title: 'Testing, Monitoring & Deployment', desc: 'Write integration tests, add logging/metrics, and deploy with containers and CI/CD pipelines.', tags: ['Testing', 'CI/CD', 'Docker', 'Monitoring'] },
    { title: 'Capstone: Scalable Backend', desc: 'Ship an end-to-end backend system with clean architecture, documentation, and production hardening.', tags: ['Capstone', 'Architecture', 'Portfolio'] },
  ],
  'full stack': [
    { title: 'Full Stack Foundations', desc: 'Master the full-stack toolchain: HTML/CSS, JavaScript fundamentals, HTTP, and version control with Git.', tags: ['JavaScript', 'HTML', 'CSS', 'Git'] },
    { title: 'Frontend Frameworks', desc: 'Build responsive interactive interfaces with React and modern component-driven development.', tags: ['React', 'Components', 'Hooks', 'Frontend'] },
    { title: 'Backend APIs & Databases', desc: 'Design RESTful APIs and model data with SQL plus an ORM, wired into the frontend.', tags: ['REST', 'SQL', 'ORM', 'Node.js'] },
    { title: 'Authentication, Security & State', desc: 'Implement secure auth, role-based access, and robust client/server state management.', tags: ['Auth', 'Security', 'State', 'JWT'] },
    { title: 'Deployment, Testing & DevOps', desc: 'Test the application end-to-end, containerize services, and deploy to the cloud with CI/CD.', tags: ['Testing', 'Docker', 'CI/CD', 'Deployment'] },
    { title: 'Capstone: Full Stack Product', desc: 'Deliver a complete, production-quality full-stack web application ready for your portfolio.', tags: ['Capstone', 'Portfolio', 'Full Stack'] },
  ],
  mern: [
    { title: 'MERN Foundations & JavaScript', desc: 'Master modern JavaScript, Node runtime, and the MongoDB document model that power the MERN stack.', tags: ['JavaScript', 'Node.js', 'MongoDB'] },
    { title: 'React Frontend & State', desc: 'Build interactive UIs with React, hooks, and client-side state management.', tags: ['React', 'Hooks', 'State'] },
    { title: 'Express Backend & REST APIs', desc: 'Create robust RESTful APIs with Express including middleware, validation, and error handling.', tags: ['Express', 'REST', 'APIs'] },
    { title: 'MongoDB Data Modeling', desc: 'Design schemas with Mongoose, master aggregation pipelines, and optimize queries.', tags: ['MongoDB', 'Mongoose', 'Aggregation'] },
    { title: 'Auth, Security & Deployment', desc: 'Add JWT auth, input sanitization, and deploy the full stack to the cloud.', tags: ['JWT', 'Security', 'Deployment'] },
    { title: 'Capstone: MERN Product', desc: 'Ship a complete MERN application with end-to-end features and a polished portfolio presentation.', tags: ['Capstone', 'MERN', 'Portfolio'] },
  ],
  cyber: [
    { title: 'Cybersecurity Fundamentals', desc: 'Learn networking basics, the CIA triad, threat models, and security hygiene for any environment.', tags: ['Networking', 'Threats', 'Fundamentals'] },
    { title: 'Networking & OS Hardening', desc: 'Harden operating systems and networks, configure firewalls, and understand protocols like TCP/IP and DNS.', tags: ['Networking', 'Hardening', 'Firewalls', 'OS'] },
    { title: 'Web & Application Security', desc: 'Identify and mitigate OWASP Top 10 vulnerabilities including injection, XSS, and broken auth.', tags: ['OWASP', 'XSS', 'Injection', 'Web Security'] },
    { title: 'Cryptography & Identity', desc: 'Apply symmetric/asymmetric crypto, TLS, hashing, and identity/access management in real systems.', tags: ['Cryptography', 'TLS', 'IAM', 'Identity'] },
    { title: 'Incident Response & Monitoring', desc: 'Detect intrusions with SIEM tools, respond to incidents, and perform digital forensics workflows.', tags: ['SIEM', 'Incident Response', 'Forensics'] },
    { title: 'Capstone: Security Assessment', desc: 'Run a structured security assessment, write findings, and present remediation plans for a real scenario.', tags: ['Capstone', 'Penetration Test', 'Reporting'] },
  ],
  flutter: [
    { title: 'Dart & Flutter Fundamentals', desc: 'Learn Dart syntax, Flutter widgets, and the rendering pipeline for cross-platform apps.', tags: ['Dart', 'Flutter', 'Widgets'] },
    { title: 'UI Systems & State Management', desc: 'Build polished UIs with layouts, themes, animations, and Provider/Riverpod state management.', tags: ['UI', 'State', 'Riverpod', 'Animations'] },
    { title: 'Data, Networking & Storage', desc: 'Consume REST APIs, persist data with SQLite/local storage, and handle offline scenarios.', tags: ['REST', 'SQLite', 'Networking'] },
    { title: 'Platform Integration & Testing', desc: 'Use platform channels, device features, and write unit/widget tests for reliability.', tags: ['Platform', 'Testing', 'Plugins'] },
    { title: 'Release & App Store Readiness', desc: 'Configure signing, CI/CD, performance profiling, and publish to the Play Store/App Store.', tags: ['CI/CD', 'Release', 'Performance'] },
    { title: 'Capstone: Flutter App', desc: 'Ship a full-featured, production-ready Flutter application for your portfolio.', tags: ['Capstone', 'Portfolio', 'Flutter'] },
  ],
  'data science': [
    { title: 'Statistics & Python Foundations', desc: 'Master the statistical concepts and Python skills that underpin all data science work.', tags: ['Python', 'Statistics', 'NumPy'] },
    { title: 'Data Wrangling & Cleaning', desc: 'Clean, transform, and combine messy datasets with Pandas to prepare them for analysis.', tags: ['Pandas', 'Data Wrangling', 'Cleaning'] },
    { title: 'Visualization & Exploratory Analysis', desc: 'Explore and communicate patterns with Matplotlib, Seaborn, and structured EDA workflows.', tags: ['Matplotlib', 'Seaborn', 'EDA'] },
    { title: 'Machine Learning Fundamentals', desc: 'Train, validate, and tune core supervised/unsupervised models with scikit-learn.', tags: ['Machine Learning', 'scikit-learn', 'Models'] },
    { title: 'Advanced ML & Model Deployment', desc: 'Dive into feature engineering, hyperparameter tuning, and deploying models as services.', tags: ['Feature Engineering', 'MLOps', 'Deployment'] },
    { title: 'Capstone: Data Science Project', desc: 'Complete an end-to-end data science project: problem framing, modeling, and impactful storytelling.', tags: ['Capstone', 'Portfolio', 'Storytelling'] },
  ],
  devops: [
    { title: 'Linux, Scripting & Cloud', desc: 'Master Linux CLI, shell scripting, and core cloud concepts as the DevOps foundation.', tags: ['Linux', 'Bash', 'Cloud'] },
    { title: 'Git, CI/CD & Automation', desc: 'Automate builds and deployments with Git workflows, GitHub Actions, and Jenkins pipelines.', tags: ['Git', 'CI/CD', 'GitHub Actions'] },
    { title: 'Containerization & Orchestration', desc: 'Package and orchestrate applications with Docker, Kubernetes, and Helm.', tags: ['Docker', 'Kubernetes', 'Helm'] },
    { title: 'Infrastructure as Code', desc: 'Provision and manage infrastructure declaratively with Terraform and Ansible.', tags: ['Terraform', 'Ansible', 'IaC'] },
    { title: 'Monitoring, Logging & Security', desc: 'Operate production systems with Prometheus, Grafana, ELK, and DevSecOps practices.', tags: ['Prometheus', 'Grafana', 'ELK', 'DevSecOps'] },
    { title: 'Capstone: DevOps Pipeline', desc: 'Design and build a full, secure, observable CI/CD platform for a real application.', tags: ['Capstone', 'Pipeline', 'Portfolio'] },
  ],
  'data analyst': [
    { title: 'Analytics Fundamentals & Excel', desc: 'Build a data-driven mindset and master Excel analytics including pivot tables and functions.', tags: ['Excel', 'Analytics', 'Fundamentals'] },
    { title: 'SQL for Analysts', desc: 'Query, aggregate, and join datasets with SQL to extract business insights.', tags: ['SQL', 'Queries', 'Joins'] },
    { title: 'Python & Pandas Essentials', desc: 'Automate analysis and exploration with Python, Pandas, and NumPy.', tags: ['Python', 'Pandas', 'NumPy'] },
    { title: 'Statistics & Dashboarding', desc: 'Communicate insights with statistical summaries, A/B testing, and Power BI/Tableau dashboards.', tags: ['Statistics', 'Power BI', 'Tableau', 'A/B Testing'] },
    { title: 'Storytelling & Business Case Work', desc: 'Frame business questions, structure analyses, and present actionable recommendations.', tags: ['Storytelling', 'Business Cases', 'Reporting'] },
    { title: 'Capstone: Analyst Portfolio', desc: 'Deliver a full analytics project from raw data to an executive-ready insight deck.', tags: ['Capstone', 'Portfolio', 'Insights'] },
  ],
  'software engineer': [
    { title: 'Computer Science Fundamentals', desc: 'Strengthen core CS foundations: data structures, algorithms, and complexity analysis.', tags: ['DSA', 'Algorithms', 'Fundamentals'] },
    { title: 'Software Design & Architecture', desc: 'Apply SOLID principles, design patterns, and clean architecture to real codebases.', tags: ['SOLID', 'Design Patterns', 'Architecture'] },
    { title: 'Backend & API Engineering', desc: 'Build maintainable services and APIs with strong typing, testing, and documentation.', tags: ['APIs', 'Testing', 'Backend'] },
    { title: 'Databases, Caching & Performance', desc: 'Design efficient schemas, use indexes/caching, and profile performance under load.', tags: ['SQL', 'Caching', 'Performance'] },
    { title: 'Distributed Systems & DevOps', desc: 'Understand distributed system trade-offs and operate code with CI/CD and containers.', tags: ['Distributed Systems', 'CI/CD', 'Docker'] },
    { title: 'Capstone & Interview Preparation', desc: 'Ship a senior-quality project and prepare thoroughly for system design and coding interviews.', tags: ['Capstone', 'System Design', 'Interviews'] },
  ],
};

/**
 * Rule-based curriculum engine: builds a real, ordered 6-milestone roadmap for any
 * target role, personalized with mastered skills and recorded weak skill areas.
 * The selected goal is always the primary focus of the roadmap.
 */
function buildRuleBasedRoadmap({ targetRole, currentSkills = [], weakSkills = [] }) {
  const role = (targetRole || 'Software Engineer').trim();
  const lowerRole = role.toLowerCase();

  let baseMilestones = [];

  const trackKey =
    (lowerRole.includes('java') && 'java') ||
    (lowerRole.includes('python') && 'python') ||
    (lowerRole.includes('flutter') && 'flutter') ||
    (lowerRole.includes('cyber') && 'cyber') ||
    (lowerRole.includes('data science') && 'data science') ||
    (lowerRole.includes('data analyst') && 'data analyst') ||
    (lowerRole.includes('devops') && 'devops') ||
    (lowerRole.includes('mern') && 'mern') ||
    (lowerRole.includes('full stack') && 'full stack') ||
    (lowerRole.includes('frontend') && 'frontend') ||
    (lowerRole.includes('front end') && 'frontend') ||
    (lowerRole.includes('backend') && 'backend') ||
    (lowerRole.includes('back end') && 'backend') ||
    (lowerRole.includes('software engineer') && 'software engineer');

  if (trackKey && KNOWN_TRACKS[trackKey]) {
    baseMilestones = KNOWN_TRACKS[trackKey].map((m, i) => ({
      id: i + 1,
      ...m,
      status: 'locked',
      progress: 0,
      quizzes: 2 + (i % 2 === 0 ? 1 : 2),
      exercises: 6 + i,
    }));
  } else {
    baseMilestones = genericRoadmapForRole(role);
  }

  return applyPersonalization(baseMilestones, { targetRole: role, currentSkills, weakSkills });
}

/** Generic 6-milestone curriculum template used for any unlisted career goal. */
function genericRoadmapForRole(role) {
  const stages = [
    { title: `${role} Foundations & Core Concepts`, desc: `Build a solid conceptual and practical foundation for a ${role}, covering core terminology, essential tools, and fundamental workflows.`, tags: [role, 'Fundamentals', 'Dev Setup'] },
    { title: `${role} Core Technologies & Tools`, desc: `Master the primary technologies, frameworks, and development tools used by a ${role}, including version control, build tooling, and environment automation.`, tags: [role, 'Core Stack', 'Tooling'] },
    { title: `${role} Intermediate Projects & Best Practices`, desc: `Implement realistic intermediate-level projects for a ${role}, applying industry best practices, code review standards, and debugging techniques.`, tags: [role, 'Projects', 'Best Practices'] },
    { title: `${role} Advanced Topics & Optimization`, desc: `Explore advanced ${role} topics such as performance optimization, security hardening, and scalability patterns that differentiate senior practitioners.`, tags: [role, 'Advanced', 'Optimization'] },
    { title: `${role} Capstone & Real-World Application`, desc: `Design and deliver an end-to-end ${role} capstone project that integrates all prior milestones into a production-quality, portfolio-ready deliverable.`, tags: [role, 'Capstone', 'Portfolio'] },
    { title: `${role} Interview Prep & Career Readiness`, desc: `Reinforce ${role} knowledge with mock interviews, design questions, and a polished portfolio to prepare for real job opportunities.`, tags: [role, 'Interviews', 'Resume'] },
  ];

  return stages.map((s, i) => ({
    id: i + 1,
    ...s,
    status: 'locked',
    progress: 0,
    quizzes: 2 + (i % 2 === 0 ? 1 : 2),
    exercises: 6 + i,
  }));
}

/**
 * Mark mastered milestones as completed, prioritize weak skill areas as in-progress,
 * and ensure at least one actionable in-progress milestone exists.
 */
function applyPersonalization(milestones, { targetRole, currentSkills, weakSkills }) {
  const mastered = (Array.isArray(currentSkills) ? currentSkills : []).map((s) => String(s).toLowerCase());
  const weak = (Array.isArray(weakSkills) ? weakSkills : []).map((s) => String(s).toLowerCase()).filter(Boolean);

  const result = milestones.map((m) => {
    const tagStr = (m.tags || []).map(String).join(' ');
    const mText = `${m.title} ${tagStr} ${targetRole}`.toLowerCase();

    const masteredMatch = mastered.some((s) => s && mText.includes(s));
    const weakMatch = weak.some((s) => s && mText.includes(s));

    let status;
    let progress;
    if (masteredMatch) {
      status = 'completed';
      progress = 100;
    } else if (weakMatch) {
      status = 'in-progress';
      progress = 40;
    } else {
      status = 'locked';
      progress = 0;
    }

    return { ...m, status, progress };
  });

  const firstUncompleted = result.findIndex((m) => m.status !== 'completed');
  if (firstUncompleted >= 0) {
    const m = result[firstUncompleted];
    result[firstUncompleted] = {
      ...m,
      status: 'in-progress',
      progress: Math.max(m.progress, 35),
    };
  } else if (result.length > 0) {
    const last = result.length - 1;
    result[last] = { ...result[last], status: 'in-progress', progress: 35 };
  }

  return result.map((m) =>
    m.status === 'completed' && !m.title.includes('Mastered')
      ? { ...m, title: `${m.title} (Mastered ✓)` }
      : m
  );
}

/**
 * Pure AI Roadmap Engine entrypoint.
 * Always returns a complete roadmap: live Gemini when available, otherwise a
 * legitimate rule-based curriculum for the exact requested target role.
 */
export const processroadmapAI = async (inputData) => {
  const {
    targetRole = 'Software Engineer',
    studentProfile = {},
    currentSkills = [],
    assessmentScores = {},
    weakSkills = [],
  } = inputData;

  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const configuredModel = config.ai?.model || 'gemini-3.1-flash-lite';
  const role = String(targetRole || 'Software Engineer').trim();
  const skillsListStr = Array.isArray(currentSkills) ? currentSkills.join(', ') : currentSkills;
  const weakSkillsStr = Array.isArray(weakSkills) ? weakSkills.join(', ') : weakSkills;

  const assessmentSummary = Object.keys(assessmentScores || {}).length > 0
    ? Object.entries(assessmentScores)
        .map(([topic, score]) => `${topic}: ${score}%`)
        .join(', ')
    : 'None recorded yet';

  const prompt = `You are a high-level Curriculum Architect AI. Design a detailed, progressive 5 to 6 milestone technical learning roadmap for a student targeting the following goal:

TARGET CAREER ROLE / TOPIC: "${role}"

STUDENT PROFILE & CONFIRMED SKILLS:
- Department / Semester: ${studentProfile.department || 'Engineering'}, ${studentProfile.semester || 'Semester 6'}, CGPA: ${studentProfile.cgpa || '8.5'}
- Confirmed Mastered Skills: [${skillsListStr || 'None specified'}]
- Assessment Scores by Topic: ${assessmentSummary}
- Recorded Weak Skill Areas: [${weakSkillsStr || 'None identified'}]

RULES:
1. Generate exactly 5 to 6 ordered milestones starting from foundational knowledge through advanced real-world capstones.
2. If any prerequisite skill is already in the student's confirmed mastered skills ([${skillsListStr}]), mark that milestone with status: "completed", progress: 100, and append "(Mastered ✓)" to the title.
3. If the student has recorded weak skill areas ([${weakSkillsStr}]), prioritize the earliest milestone(s) covering those weak areas with status: "in-progress" and progress: 35-50, and explicitly reference the topic in the milestone title/desc.
4. The next uncompleted milestone should have status: "in-progress" and progress: 35-50. Remaining milestones should have status: "locked" and progress: 0.
5. Each milestone must include: id (number 1 to 6), title (string), desc (string describing concepts and technologies), status ("completed" | "in-progress" | "locked"), progress (number 0 to 100), tags (array of 3-5 strings), quizzes (number between 2 and 5), exercises (number between 5 and 15).
6. Output ONLY valid JSON matching this exact structure without any markdown formatting or explanations:
{
  "milestones": [
    {
      "id": 1,
      "title": "Milestone 1: ...",
      "desc": "...",
      "status": "completed",
      "progress": 100,
      "tags": ["Tag1", "Tag2", "Tag3"],
      "quizzes": 3,
      "exercises": 8
    }
  ]
}`;

  if (apiKey) {
    try {
      return await generateViaGemini({ targetRole: role, prompt, apiKey, configuredModel });
    } catch (err) {
      console.warn(`[Roadmap AI] Google Gemini unavailable (${err.message}). Falling back to rule-based curriculum engine.`);
    }
  } else {
    console.warn('[Roadmap AI] Google AI API Key not configured. Using rule-based curriculum engine.');
  }

  const fallbackMilestones = buildRuleBasedRoadmap({ targetRole: role, currentSkills, weakSkills });

  console.log(`[Roadmap AI] Rule-based engine generated ${fallbackMilestones.length} curriculum milestones for "${role}".`);

  return {
    source: 'rule-based-engine',
    modelUsed: null,
    milestones: fallbackMilestones,
  };
};