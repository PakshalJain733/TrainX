const fetch = require('node-fetch') || globalThis.fetch;

async function createProblem() {
  const payload = {
    title: 'Two Sum (Beginner)',
    category: 'Arrays & Hashing',
    difficulty: 'Easy',
    points: 20,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

**Example:**
Input:
4
2 7 11 15
9

Output:
0 1

*Explanation:* Because nums[0] + nums[1] == 9, we return 0 and 1.

**Input Format for Test Cases:**
Line 1: N (number of elements)
Line 2: N space-separated integers
Line 3: Target sum

**Output Format:**
Space-separated indices i and j (i < j)`,
    test_cases: [
      {
        input: '4\n2 7 11 15\n9',
        expected_output: '0 1',
        is_hidden: false
      },
      {
        input: '3\n3 2 4\n6',
        expected_output: '1 2',
        is_hidden: false
      },
      {
        input: '2\n3 3\n6',
        expected_output: '0 1',
        is_hidden: true
      }
    ]
  };

  try {
    const res = await fetch('http://localhost:5000/api/v1/shared-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'coding',
        title: payload.title,
        description: payload.description,
        batch_name: 'All Batches',
        status: 'Active',
        data: {
          difficulty: payload.difficulty,
          category: payload.category,
          points: payload.points,
          sampleInput: payload.test_cases[0].input,
          sampleOutput: payload.test_cases[0].expected_output,
          testCases: payload.test_cases,
          batch: 'All Batches'
        }
      })
    });
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}

createProblem();
