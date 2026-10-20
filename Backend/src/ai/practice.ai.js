import { generateJSON, describeProvider } from './aiClient.js';

/**
 * Provider-agnostic AI Coding Practice Problem Generator
 * Generates algorithmic / DSA coding challenge definitions with input/output constraints,
 * sample cases, and multiple test cases suitable for database persistence.
 */

export const generateAIPracticeProblem = async ({
  topic = 'Arrays & Hashing',
  difficulty = 'Medium',
  companies = 'TCS, Infosys, Amazon',
} = {}) => {
  const cleanTopic = String(topic || 'Arrays & Hashing').trim();
  const cleanDiff = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';
  const cleanCompanies = Array.isArray(companies) ? companies.join(', ') : String(companies || 'Google, Amazon, TCS');

  const prompt = `You are a Principal Software Engineer and Competitive Programming Problem Setter.
Generate a high quality, production-ready coding challenge on the topic: "${cleanTopic}" with difficulty: "${cleanDiff}".

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Concise & Famous/Realistic Problem Name",
  "category": "${cleanTopic}",
  "difficulty": "${cleanDiff}",
  "points": ${cleanDiff === 'Easy' ? 50 : cleanDiff === 'Medium' ? 100 : 150},
  "tags": "${cleanCompanies}",
  "timeLimit": "1.0s",
  "memoryLimit": "256 MB",
  "description": "Full problem statement explaining the scenario, input specifications, constraints, and output requirements clearly.",
  "sampleInput": "Actual stdin input for example 1",
  "sampleOutput": "Actual stdout expected output for example 1",
  "testCases": [
    {
      "input": "Sample test case 1 input",
      "expectedOutput": "Sample test case 1 output",
      "isHidden": false,
      "description": "Standard sample case"
    },
    {
      "input": "Sample test case 2 input",
      "expectedOutput": "Sample test case 2 output",
      "isHidden": false,
      "description": "Second visible case"
    },
    {
      "input": "Hidden test case 3 input (edge case or boundary)",
      "expectedOutput": "Hidden test case 3 output",
      "isHidden": true,
      "description": "Edge case testing boundary condition"
    },
    {
      "input": "Hidden test case 4 input (large scale or negative)",
      "expectedOutput": "Hidden test case 4 output",
      "isHidden": true,
      "description": "Performance / edge case"
    }
  ]
}

DO NOT include markdown code blocks or backticks. Return the JSON object directly.`;

  try {
    const res = await generateJSON(prompt, {
      system: 'You are an expert competitive programming author. Output strictly valid JSON with no markdown wrapping.',
      temperature: 0.7,
      maxTokens: 2500,
      timeoutMs: 30000,
    });

    if (res && res.title && res.description) {
      return {
        title: String(res.title).trim(),
        category: res.category || cleanTopic,
        topic: res.category || cleanTopic,
        difficulty: cleanDiff,
        points: Number(res.points) || (cleanDiff === 'Easy' ? 50 : cleanDiff === 'Medium' ? 100 : 150),
        xp: Number(res.points) || (cleanDiff === 'Easy' ? 50 : cleanDiff === 'Medium' ? 100 : 150),
        tags: res.tags || cleanCompanies,
        companies: res.tags || cleanCompanies,
        timeLimit: res.timeLimit || '1.0s',
        memoryLimit: res.memoryLimit || '256 MB',
        description: res.description,
        sampleInput: res.sampleInput || (res.testCases?.[0]?.input ?? ''),
        sampleOutput: res.sampleOutput || (res.testCases?.[0]?.expectedOutput ?? ''),
        testCases: Array.isArray(res.testCases) ? res.testCases.map((tc, idx) => ({
          id: `tc-${Date.now()}-${idx}`,
          input: String(tc.input ?? ''),
          output: String(tc.expectedOutput ?? tc.output ?? ''),
          expectedOutput: String(tc.expectedOutput ?? tc.output ?? ''),
          isHidden: Boolean(tc.isHidden),
          description: tc.description || `Test case ${idx + 1}`,
        })) : [],
      };
    }
  } catch (err) {
    console.warn(`[Practice AI] Live AI problem generation warning for "${cleanTopic}": ${err.message}`);
  }

  // Robust Fallback Problem Bank
  return getFallbackPracticeProblem(cleanTopic, cleanDiff, cleanCompanies);
};

function getFallbackPracticeProblem(topic, difficulty, companies) {
  const points = difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 150;
  return {
    title: `${topic}: Optimal Solution Challenge`,
    category: topic,
    topic: topic,
    difficulty: difficulty,
    points: points,
    xp: points,
    tags: companies,
    companies: companies,
    timeLimit: '1.0s',
    memoryLimit: '256 MB',
    description: `Given input data, design and implement an optimal algorithm solving the ${topic} problem within the specified time and space limits.\n\nRead input from standard input (stdin) and print output to standard output (stdout).\n\nConstraints:\n- 1 <= N <= 10^5\n- Elements are within 32-bit signed integer limits\n- Time Complexity: O(N) or O(N log N) expected.`,
    sampleInput: '4\n2 7 11 15\n9',
    sampleOutput: '0 1',
    testCases: [
      {
        id: `tc-${Date.now()}-0`,
        input: '4\n2 7 11 15\n9',
        output: '0 1',
        expectedOutput: '0 1',
        isHidden: false,
        description: 'Standard sample case',
      },
      {
        id: `tc-${Date.now()}-1`,
        input: '3\n3 2 4\n6',
        output: '1 2',
        expectedOutput: '1 2',
        isHidden: false,
        description: 'Visible small case',
      },
      {
        id: `tc-${Date.now()}-2`,
        input: '2\n3 3\n6',
        output: '0 1',
        expectedOutput: '0 1',
        isHidden: true,
        description: 'Hidden duplicate elements case',
      },
      {
        id: `tc-${Date.now()}-3`,
        input: '5\n-1 -2 -3 -4 -5\n-8',
        output: '2 4',
        expectedOutput: '2 4',
        isHidden: true,
        description: 'Hidden negative numbers case',
      },
    ],
  };
}
