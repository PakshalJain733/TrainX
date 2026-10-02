import { generateJSON, describeProvider } from './aiClient.js';

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
