import { config } from '../config/env.js';

/**
 * Pure AI Roadmap Engine with Google Gemini AI integration & Intelligent Dynamic Curriculum Engine
 * Dynamically designs customized technical learning milestones for any role or career path.
 */
export const processroadmapAI = async (inputData) => {
  const {
    targetRole = 'Full Stack Developer',
    studentProfile = {},
    currentSkills = [],
  } = inputData;

  const apiKey = config.ai?.apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const configuredModel = config.ai?.model || 'gemini-1.5-flash';
  const skillsListStr = Array.isArray(currentSkills) ? currentSkills.join(', ') : currentSkills;

  // Active real Google Gemini models in Generative Language API
  const modelsToTry = Array.from(
    new Set([configuredModel, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'])
  );

  const prompt = `You are a high-level Curriculum Architect AI. Design a detailed, progressive 5 to 6 milestone technical learning roadmap for a student targeting the following goal:

TARGET CAREER ROLE / TOPIC: "${targetRole}"

STUDENT PROFILE & CONFIRMED SKILLS:
- Department / Semester: ${studentProfile.department || 'Computer Engineering'}, ${studentProfile.semester || 'Semester 6'}, CGPA: ${studentProfile.cgpa || '8.5'}
- Confirmed Mastered Skills: [${skillsListStr || 'None specified'}]

RULES:
1. Generate exactly 5 to 6 ordered milestones starting from foundational knowledge through advanced real-world capstones.
2. If any prerequisite skill is already in the student's confirmed mastered skills ([${skillsListStr}]), mark that milestone with status: "completed", progress: 100, and append "(Mastered ✓)" to the title.
3. The next uncompleted milestone should have status: "in-progress" and progress: 35-50. Remaining milestones should have status: "locked" and progress: 0.
4. Each milestone must include: id (number 1 to 6), title (string), desc (string describing concepts and technologies), status ("completed" | "in-progress" | "locked"), progress (number 0 to 100), tags (array of 3-5 strings), quizzes (number between 2 and 5), exercises (number between 5 and 15).
5. Output ONLY valid JSON matching this exact structure without any markdown formatting or explanations:
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

  if (apiKey && apiKey !== 'your_ai_api_key') {
    for (const model of modelsToTry) {
      try {
        console.log(`[Google Gemini AI] Requesting live curriculum generation for "${targetRole}" via ${model}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
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
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          console.warn(`[Google Gemini AI] Model ${model} returned status ${response.status}: ${errorBody.slice(0, 150)}`);
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) continue;

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
            continue;
          }
        }

        if (parsed && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
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
        }
      } catch (err) {
        console.warn(`[Google Gemini AI] Connection warning for model ${model}: ${err.message}`);
      }
    }
  }

  // Graceful Fallback: Build structured dynamic curriculum for the target role & skills
  console.log(`[Curriculum Engine] Generating tailored milestone roadmap for "${targetRole}"...`);
  const dynamicMilestones = buildDynamicMilestones(targetRole, studentProfile, currentSkills);

  return {
    source: 'curriculum-engine',
    modelUsed: 'rule-based-adaptive',
    milestones: dynamicMilestones,
  };
};

/**
 * Intelligent Dynamic Roadmap Generator (Zero-crash fallback)
 */
function buildDynamicMilestones(role, profile, currentSkills) {
  const normalizedRole = (role || '').toLowerCase();
  const rawSkills = Array.isArray(currentSkills)
    ? currentSkills
    : (typeof currentSkills === 'string' ? currentSkills.split(',') : []);
  const skills = rawSkills.map(s => String(s).trim().toLowerCase()).filter(Boolean);

  const hasSkill = (...names) => names.some(n => skills.some(s => s.includes(n.toLowerCase())));

  // Detect domain
  let milestoneTemplates = [];

  if (normalizedRole.includes('full stack') || normalizedRole.includes('web')) {
    milestoneTemplates = [
      {
        title: 'Milestone 1: Web Architecture & Core Frontend Mastery',
        desc: 'Master semantic HTML5, modern CSS3 layout systems (Flexbox, CSS Grid), asynchronous JavaScript ES6+, DOM manipulation, and responsive UX design.',
        tags: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Web APIs'],
        matched: hasSkill('html', 'css', 'javascript', 'js'),
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Modern Frontend Frameworks & State Management',
        desc: 'Build scalable reactive user interfaces using React, Next.js or Vue. Implement state management, custom hooks, component composition, and Tailwind CSS.',
        tags: ['React.js', 'State Management', 'Tailwind CSS', 'Vite'],
        matched: hasSkill('react', 'vue', 'next'),
        quizzes: 4,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Backend API Architecture & Database Engineering',
        desc: 'Design production-grade RESTful and GraphQL APIs with Node.js/Express or Python. Implement schema modeling, indexing, and ORM/ODM integration in PostgreSQL/MongoDB.',
        tags: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST APIs'],
        matched: hasSkill('node', 'express', 'sql', 'postgres', 'mongo', 'mysql'),
        quizzes: 3,
        exercises: 14,
      },
      {
        title: 'Milestone 4: Security, Authentication & Microservices',
        desc: 'Implement OAuth2.0, JWT authentication, RBAC authorization, secure caching with Redis, message queues, and API rate limiting.',
        tags: ['JWT / OAuth2', 'Redis', 'Security', 'WebSockets'],
        matched: hasSkill('security', 'redis', 'jwt'),
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Cloud DevOps, Dockerization & Capstone Deployment',
        desc: 'Containerize multi-tier web applications with Docker, build CI/CD pipelines via GitHub Actions, and deploy to AWS / GCP with monitoring and automated tests.',
        tags: ['Docker', 'CI/CD', 'AWS / Cloud', 'System Testing'],
        matched: hasSkill('docker', 'git', 'aws', 'ci/cd'),
        quizzes: 3,
        exercises: 9,
      },
    ];
  } else if (normalizedRole.includes('ai') || normalizedRole.includes('machine learning') || normalizedRole.includes('data science')) {
    milestoneTemplates = [
      {
        title: 'Milestone 1: Mathematical Foundations & Python for Data Science',
        desc: 'Comprehensive mastery of Linear Algebra, Multivariable Calculus, Probability & Statistics, and vectorized computation with NumPy, Pandas, and SciPy.',
        tags: ['Python', 'NumPy', 'Pandas', 'Linear Algebra', 'Statistics'],
        matched: hasSkill('python', 'numpy', 'pandas', 'math'),
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Classical Machine Learning & Predictive Modeling',
        desc: 'Build, tune, and evaluate Supervised & Unsupervised algorithms using Scikit-Learn. Implement feature engineering, cross-validation, and hyperparameter optimization.',
        tags: ['Scikit-Learn', 'Regression', 'Classification', 'Clustering'],
        matched: hasSkill('machine learning', 'scikit', 'ml'),
        quizzes: 4,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Deep Learning Architectures & Neural Networks',
        desc: 'Construct Deep Neural Networks, CNNs for computer vision, and RNNs/Transformers for sequence modeling using PyTorch and TensorFlow.',
        tags: ['PyTorch', 'TensorFlow', 'CNN', 'Transformers', 'Deep Learning'],
        matched: hasSkill('deep learning', 'pytorch', 'tensorflow'),
        quizzes: 3,
        exercises: 11,
      },
      {
        title: 'Milestone 4: Large Language Models, RAG & Generative AI',
        desc: 'Implement Generative AI workflows with LangChain, LlamaIndex, Vector Databases (Pinecone/ChromaDB), prompt engineering, and fine-tuning techniques.',
        tags: ['LLMs', 'RAG Pipelines', 'Vector DB', 'LangChain'],
        matched: hasSkill('llm', 'generative ai', 'nlp'),
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: MLOps, Model Serving & Scalable Deployment',
        desc: 'Deploy high-throughput inference APIs with FastAPI, track experiments with MLflow, containerize with Docker, and monitor model drift in production.',
        tags: ['FastAPI', 'MLOps', 'Docker', 'Model Monitoring'],
        matched: hasSkill('docker', 'fastapi', 'mlops'),
        quizzes: 3,
        exercises: 9,
      },
    ];
  } else if (normalizedRole.includes('devops') || normalizedRole.includes('cloud')) {
    milestoneTemplates = [
      {
        title: 'Milestone 1: Linux System Administration & Networking Essentials',
        desc: 'Master Linux kernel fundamentals, shell scripting (Bash), DNS, HTTP/HTTPS, TCP/IP networking, SSH security, and system diagnostics.',
        tags: ['Linux', 'Bash Scripting', 'Networking', 'Security'],
        matched: hasSkill('linux', 'bash', 'networking'),
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Containerization & Microservices with Docker',
        desc: 'Build multi-stage production Docker images, configure volumes, networks, compose multi-service environments, and optimize container resource footprints.',
        tags: ['Docker', 'Containers', 'Docker Compose', 'Security Scanning'],
        matched: hasSkill('docker', 'containers'),
        quizzes: 4,
        exercises: 10,
      },
      {
        title: 'Milestone 3: Infrastructure as Code (IaC) & Cloud Architecture',
        desc: 'Automate reproducible cloud infrastructure provisioning across AWS/Azure using Terraform and Ansible with state locking and modular designs.',
        tags: ['Terraform', 'AWS / Azure', 'IaC', 'Ansible'],
        matched: hasSkill('aws', 'terraform', 'cloud'),
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 4: Continuous Integration & Automated Delivery (CI/CD)',
        desc: 'Design enterprise-grade automated CI/CD pipelines using GitHub Actions, GitLab CI, automated test suites, artifact registries, and zero-downtime blue/green rollouts.',
        tags: ['GitHub Actions', 'CI/CD Pipelines', 'ArgoCD', 'GitOps'],
        matched: hasSkill('git', 'ci/cd', 'github'),
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Kubernetes Orchestration & Production Observability',
        desc: 'Deploy, scale, and manage Kubernetes clusters (Pods, Deployments, Ingress, Services) with full observability using Prometheus, Grafana, and ELK stack.',
        tags: ['Kubernetes (K8s)', 'Prometheus', 'Grafana', 'Helm Charts'],
        matched: hasSkill('kubernetes', 'k8s', 'monitoring'),
        quizzes: 3,
        exercises: 9,
      },
    ];
  } else if (normalizedRole.includes('cyber') || normalizedRole.includes('security')) {
    milestoneTemplates = [
      {
        title: 'Milestone 1: Network Protocols & Security Architecture Fundamentals',
        desc: 'Understand packet analysis with Wireshark, OSI layer attacks, firewalls, cryptographic algorithms (AES, RSA, ECC), and PKI infrastructure.',
        tags: ['Networking', 'Cryptography', 'Wireshark', 'PKI'],
        matched: hasSkill('networking', 'security', 'c'),
        quizzes: 4,
        exercises: 12,
      },
      {
        title: 'Milestone 2: Web Application Security & OWASP Top 10',
        desc: 'Identify, exploit, and remediate vulnerabilities including SQLi, XSS, CSRF, SSRF, IDOR, and authentication bypasses using Burp Suite.',
        tags: ['OWASP Top 10', 'Burp Suite', 'Web Penetration Testing', 'XSS/SQLi'],
        matched: hasSkill('web', 'sql', 'security'),
        quizzes: 4,
        exercises: 10,
      },
      {
        title: 'Milestone 3: System Security, Privilege Escalation & Linux/Windows Hardening',
        desc: 'Conduct vulnerability assessments, exploit misconfigurations, audit system logs, and implement OS-level access control lists and policy hardening.',
        tags: ['Linux Hardening', 'Privilege Escalation', 'Metasploit', 'Nmap'],
        matched: hasSkill('linux', 'python'),
        quizzes: 3,
        exercises: 10,
      },
      {
        title: 'Milestone 4: SOC Operations, Threat Intelligence & Incident Response',
        desc: 'SIEM management with Splunk/Elastic SIEM, intrusion detection with Snort/Suricata, log correlation, malware analysis, and MITRE ATT&CK mapping.',
        tags: ['SIEM (Splunk)', 'MITRE ATT&CK', 'Incident Response', 'Threat Hunting'],
        matched: hasSkill('monitoring', 'logs', 'siem'),
        quizzes: 3,
        exercises: 8,
      },
      {
        title: 'Milestone 5: Cloud Security, DevSecOps & Enterprise Capstone Audit',
        desc: 'Secure cloud environments (AWS IAM, GuardDuty), integrate automated SAST/DAST security scanning in CI/CD, and conduct full compliance audits.',
        tags: ['Cloud Security', 'DevSecOps', 'SAST / DAST', 'Compliance & Auditing'],
        matched: hasSkill('cloud', 'aws', 'ci/cd'),
        quizzes: 3,
        exercises: 9,
      },
    ];
  } else {
    // General / Custom Role Dynamic Milestones
    const cleanRoleTitle = role || 'Software Engineering';
    milestoneTemplates = [
      {
        title: `Milestone 1: Foundations & Core Principles of ${cleanRoleTitle}`,
        desc: `Master core computational logic, foundational syntax, system architecture, data structures, and problem-solving methodologies for ${cleanRoleTitle}.`,
        tags: ['Core Syntax', 'Data Structures', 'Algorithms', 'Logic Design'],
        matched: hasSkill('dsa', 'data structures', 'c++', 'java', 'python'),
        quizzes: 4,
        exercises: 12,
      },
      {
        title: `Milestone 2: Frameworks, Tooling & Design Patterns in ${cleanRoleTitle}`,
        desc: `Build modular components, apply Object-Oriented and Functional design patterns, configure development environments, and utilize industry toolchains.`,
        tags: ['Design Patterns', 'Frameworks', 'Code Architecture', 'Git'],
        matched: hasSkill('git', 'design pattern', 'oop'),
        quizzes: 4,
        exercises: 10,
      },
      {
        title: `Milestone 3: Data Management, Persistence & API Integration`,
        desc: `Architect data storage models, implement efficient queries, handle asynchronous concurrency, and integrate external services and protocols.`,
        tags: ['Databases', 'API Integration', 'Data Persistence', 'Async Concurrency'],
        matched: hasSkill('sql', 'database', 'api', 'rest'),
        quizzes: 3,
        exercises: 10,
      },
      {
        title: `Milestone 4: Production Quality, Automated Testing & Optimization`,
        desc: `Write comprehensive unit and integration tests, optimize runtime complexity and memory footprints, and implement automated verification suites.`,
        tags: ['Unit Testing', 'Profiling', 'Optimization', 'CI Pipelines'],
        matched: hasSkill('testing', 'jest', 'qa'),
        quizzes: 3,
        exercises: 8,
      },
      {
        title: `Milestone 5: Enterprise Capstone Project & Technical Readiness`,
        desc: `Construct an end-to-end production-grade portfolio project exhibiting scalable architecture, comprehensive documentation, and interview preparation.`,
        tags: ['Capstone Project', 'System Design', 'Production Deployment', 'Portfolio'],
        matched: false,
        quizzes: 3,
        exercises: 9,
      },
    ];
  }

  // Format milestone objects with smart progression status
  let hasFoundInProgress = false;

  return milestoneTemplates.map((item, index) => {
    let status = 'locked';
    let progress = 0;
    let title = item.title;

    if (item.matched) {
      status = 'completed';
      progress = 100;
      if (!title.includes('✓')) {
        title += ' (Mastered ✓)';
      }
    } else if (!hasFoundInProgress) {
      status = 'in-progress';
      progress = 45;
      hasFoundInProgress = true;
    }

    return {
      id: index + 1,
      title,
      desc: item.desc,
      status,
      progress,
      tags: item.tags,
      quizzes: item.quizzes,
      exercises: item.exercises,
    };
  });
}
