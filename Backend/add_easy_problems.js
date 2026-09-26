import { query } from './src/config/db.js';

const run = async () => {
  const problems = [
    {
      college_id: 1,
      batch_id: null,
      batch_name: 'All Batches',
      title: 'Hello World (Very Easy)',
      description: 'Write a program that prints "Hello World".',
      difficulty: 'Easy',
      category: 'Basics',
      tags: 'basics, easy',
      points: 10,
      created_by: null
    },
    {
      college_id: 1,
      batch_id: null,
      batch_name: 'All Batches',
      title: 'Add Two Numbers (Very Easy)',
      description: 'Write a function that takes two numbers and returns their sum.',
      difficulty: 'Easy',
      category: 'Math',
      tags: 'math, easy',
      points: 15,
      created_by: null
    },
    {
      college_id: 1,
      batch_id: null,
      batch_name: 'All Batches',
      title: 'Return True (Very Easy)',
      description: 'Write a function that always returns true.',
      difficulty: 'Easy',
      category: 'Basics',
      tags: 'basics, easy',
      points: 5,
      created_by: null
    }
  ];

  for (const p of problems) {
    await query(
      'INSERT INTO practice_problems (college_id, batch_id, batch_name, title, description, difficulty, category, tags, points, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [p.college_id, p.batch_id, p.batch_name, p.title, p.description, p.difficulty, p.category, p.tags, p.points, p.created_by]
    );
  }
  console.log('Very easy problems added successfully!');
  process.exit(0);
};

run().catch(console.error);
