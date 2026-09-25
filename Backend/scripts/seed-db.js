import { query } from './Backend/src/config/db.js';

const payload = {
  title: 'Two Sum (Beginner)',
  category: 'Arrays & Hashing',
  difficulty: 'Easy',
  points: 20,
  description: 'Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.\n\nExample:\nInput:\n4\n2 7 11 15\n9\n\nOutput:\n0 1\n\nExplanation: Because nums[0] + nums[1] == 9, we return 0 and 1.\n\nInput Format for Test Cases:\nLine 1: N (number of elements)\nLine 2: N space-separated integers\nLine 3: Target sum\n\nOutput Format:\nSpace-separated indices i and j (i < j)',
  test_cases: [
    { input: '4\n2 7 11 15\n9', expected_output: '0 1', is_hidden: false },
    { input: '3\n3 2 4\n6', expected_output: '1 2', is_hidden: false },
    { input: '2\n3 3\n6', expected_output: '0 1', is_hidden: true }
  ]
};

const data = {
  difficulty: payload.difficulty,
  category: payload.category,
  points: payload.points,
  sampleInput: payload.test_cases[0].input,
  sampleOutput: payload.test_cases[0].expected_output,
  testCases: payload.test_cases,
  batch: 'All Batches'
};

const sql = `
  INSERT INTO shared_content (type, title, description, batch_name, status, data)
  VALUES (?, ?, ?, ?, ?, ?)
`;

async function seed() {
  try {
    await query(sql, [
      'coding',
      payload.title,
      payload.description,
      'All Batches',
      'Active',
      JSON.stringify(data)
    ]);
    console.log("Practice problem seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed:", error);
    process.exit(1);
  }
}

seed();
