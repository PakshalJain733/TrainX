import { query } from './src/config/db.js';

const run = async () => {
  try {
    // 1. Clear existing problems
    await query("DELETE FROM practice_problems");
    await query("DELETE FROM coding_problems");
    await query("DELETE FROM coding_test_cases");
    
    const problems = [
      {
        id: 101,
        title: 'Multiply Two Numbers',
        description: 'Write a program that takes two integers as input and returns their product.\n\nInput: Two space-separated integers.\nOutput: A single integer representing their product.',
        difficulty: 'Easy',
        category: 'Math',
        tags: 'math, basics',
        points: 10,
        cases: [
          { input: '2 3', expected_output: '6', is_hidden: false },
          { input: '-1 5', expected_output: '-5', is_hidden: false },
          { input: '10 10', expected_output: '100', is_hidden: true },
          { input: '0 5', expected_output: '0', is_hidden: true }
        ]
      },
      {
        id: 102,
        title: 'Check Even or Odd',
        description: 'Write a program that takes a single integer and checks whether it is even or odd.\n\nInput: A single integer.\nOutput: "Even" if the number is even, "Odd" if the number is odd.',
        difficulty: 'Easy',
        category: 'Basics',
        tags: 'logic, basics',
        points: 15,
        cases: [
          { input: '4', expected_output: 'Even', is_hidden: false },
          { input: '7', expected_output: 'Odd', is_hidden: false },
          { input: '0', expected_output: 'Even', is_hidden: true },
          { input: '-3', expected_output: 'Odd', is_hidden: true }
        ]
      },
      {
        id: 103,
        title: 'Return First Element',
        description: 'Write a program that returns the first element of a given array.\n\nInput: Line 1 = n (length of array). Line 2 = n space-separated integers.\nOutput: A single integer representing the first element.',
        difficulty: 'Easy',
        category: 'Arrays',
        tags: 'arrays',
        points: 10,
        cases: [
          { input: '3\n5 1 2', expected_output: '5', is_hidden: false },
          { input: '1\n9', expected_output: '9', is_hidden: false },
          { input: '5\n-1 -2 -3 -4 -5', expected_output: '-1', is_hidden: true },
          { input: '2\n42 24', expected_output: '42', is_hidden: true }
        ]
      }
    ];

    for (const p of problems) {
      // Insert into practice_problems
      await query(
        'INSERT INTO practice_problems (id, college_id, batch_name, title, description, difficulty, category, tags, points) VALUES (?, 1, "All Batches", ?, ?, ?, ?, ?, ?)',
        [p.id, p.title, p.description, p.difficulty, p.category, p.tags, p.points]
      );

      // Insert into coding_problems
      await query(
        'INSERT INTO coding_problems (id, title, description, difficulty, category, total_marks) VALUES (?, ?, ?, ?, ?, ?)',
        [p.id, p.title, p.description, p.difficulty, p.category, p.points]
      );

      // Insert test cases
      for (const tc of p.cases) {
        await query(
          'INSERT INTO coding_test_cases (problem_id, input, expected_output, is_hidden, weightage) VALUES (?, ?, ?, ?, ?)',
          [p.id, tc.input, tc.expected_output, tc.is_hidden ? 1 : 0, 25]
        );
      }
    }
    console.log('Successfully wiped old problems and seeded 3 new fully-functional easy problems.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
