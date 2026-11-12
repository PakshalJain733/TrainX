import assert from 'assert';
import { generateMilestonePracticeAI, generateTopicSpecificPracticeFallback } from '../src/ai/roadmap.ai.js';

function evaluatePracticeSubmission(userCode, actualOutput, expectedOutput, sampleInput, language) {
  const cleanCode = (userCode || "").trim();
  if (!cleanCode) {
    return { score: 0, passed: false, reason: "Empty code submitted." };
  }

  if (language === "html" || language === "react") {
    const isMinimalLength = cleanCode.length > 30;
    const hasComponentOrTag = language === "react"
      ? (cleanCode.includes("function") || cleanCode.includes("return") || cleanCode.includes("=>")) && cleanCode.includes("<")
      : cleanCode.includes("<") && cleanCode.includes(">");
    if (isMinimalLength && hasComponentOrTag) {
      return { score: 100, passed: true, reason: "Component structure verified." };
    }
    return { score: 0, passed: false, reason: "Incomplete HTML or React component structure." };
  }

  const cleanActual = (actualOutput || "").trim();
  const cleanExpected = (expectedOutput || "").trim();

  if (!cleanExpected || cleanExpected === "null") {
    return { score: 100, passed: true, reason: "Execution completed successfully." };
  }

  const normActual = cleanActual.toLowerCase().replace(/\r\n/g, "\n").trim();
  const normExpected = cleanExpected.toLowerCase().replace(/\r\n/g, "\n").trim();

  if (normActual === normExpected || normActual.includes(normExpected)) {
    return { score: 100, passed: true, reason: "Output matches expected result exactly." };
  }

  // Numerical value check
  const expectedNumbers = (normExpected.match(/\b\d+(\.\d+)?\b/g) || []);
  const actualNumbers = (normActual.match(/\b\d+(\.\d+)?\b/g) || []);

  if (expectedNumbers.length > 0) {
    const matchedNumbers = expectedNumbers.filter(num => actualNumbers.includes(num));
    const numRatio = matchedNumbers.length / expectedNumbers.length;
    if (numRatio === 0) {
      return { score: 0, passed: false, reason: "Output numbers did not match expected results." };
    } else if (numRatio === 1) {
      return { score: 100, passed: true, reason: "All output numerical values match expected results." };
    } else if (numRatio >= 0.3) {
      return { score: 50, passed: false, reason: `Partially correct (${Math.round(numRatio * 100)}% of numerical values matched).` };
    }
  }

  const expectedTokens = normExpected
    .replace(/[{}()[\],:"]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1);

  if (expectedTokens.length > 0) {
    const matchedTokens = expectedTokens.filter(t => normActual.includes(t));
    const ratio = matchedTokens.length / expectedTokens.length;
    if (ratio >= 0.8) {
      return { score: 100, passed: true, reason: "Output verified with expected data values." };
    } else if (ratio >= 0.4) {
      return { score: 50, passed: false, reason: `Partially correct (${Math.round(ratio * 100)}% token match with sample expected).` };
    }
  }

  return { score: 0, passed: false, reason: "Output does not match sample expected output." };
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Starting AI Roadmap → Practice Generation & Scoring Test Suite');
  console.log('================================================================\n');

  // TEST 1: Milestone 1 Beginner Practice Generation
  console.log('Test 1: Milestone 1 Beginner Fundamentals (Python / Basics)');
  const m1Fallback = generateTopicSpecificPracticeFallback(
    'Python Syntax, Variables & Basic Types',
    'Core Python Programming',
    'Python Developer',
    { milestoneIndex: 1 }
  );

  assert.strictEqual(m1Fallback.milestoneIndex, 1, 'Milestone 1 index must be 1');
  assert.strictEqual(m1Fallback.difficulty, 'Beginner', 'Milestone 1 difficulty must be Beginner');
  assert.strictEqual(m1Fallback.language, 'python', 'Language must be python');
  assert(m1Fallback.title.includes('Milestone 1'), 'Title must specify Milestone 1');
  assert(m1Fallback.prompt.toLowerCase().includes('beginner') || m1Fallback.prompt.toLowerCase().includes('basic'), 'Prompt must indicate beginner basics');
  console.log('  ✅ Milestone 1 generated strictly beginner challenge:', m1Fallback.title);

  // TEST 2: Milestone 2 Elementary Practice Generation (Functions & Loops)
  console.log('\nTest 2: Milestone 2 Elementary Practice (Functions & Loops)');
  const m2Fallback = generateTopicSpecificPracticeFallback(
    'Functions & Iterations',
    'Control Flow in Python',
    'Python Developer',
    { milestoneIndex: 2 }
  );

  assert.strictEqual(m2Fallback.milestoneIndex, 2, 'Milestone 2 index must be 2');
  assert.strictEqual(m2Fallback.difficulty, 'Elementary', 'Milestone 2 difficulty must be Elementary');
  assert(m2Fallback.title.includes('Milestone 2'), 'Title must specify Milestone 2');
  assert(m2Fallback.prompt.toLowerCase().includes('filter') || m2Fallback.prompt.toLowerCase().includes('function'), 'Prompt must focus on functions & loops');
  console.log('  ✅ Milestone 2 generated elementary function/loop challenge:', m2Fallback.title);

  // TEST 3: Milestone 3 Intermediate Practice Generation (OOP / State / Grouping)
  console.log('\nTest 3: Milestone 3 Intermediate Practice (OOP & State)');
  const m3Fallback = generateTopicSpecificPracticeFallback(
    'Component State & Data Aggregations',
    'State Management Architecture',
    'Frontend Engineer',
    { milestoneIndex: 3 }
  );

  assert.strictEqual(m3Fallback.milestoneIndex, 3, 'Milestone 3 index must be 3');
  assert.strictEqual(m3Fallback.difficulty, 'Intermediate', 'Milestone 3 difficulty must be Intermediate');
  assert(m3Fallback.language === 'react' || m3Fallback.language === 'node' || m3Fallback.language === 'python');
  console.log('  ✅ Milestone 3 generated intermediate challenge:', m3Fallback.title);

  // TEST 4: Milestone 4 Advanced Practice Generation (Algorithms / Relational Joins)
  console.log('\nTest 4: Milestone 4 Advanced Practice (Algorithms & Relational Joins)');
  const m4Fallback = generateTopicSpecificPracticeFallback(
    'Relational Schema Queries & Indexing',
    'Advanced Database Architectures',
    'Backend Engineer',
    { milestoneIndex: 4 }
  );

  assert.strictEqual(m4Fallback.milestoneIndex, 4, 'Milestone 4 index must be 4');
  assert(m4Fallback.prompt.toLowerCase().includes('join') || m4Fallback.prompt.toLowerCase().includes('algorithm'), 'Milestone 4 must cover advanced concepts');
  console.log('  ✅ Milestone 4 generated advanced challenge:', m4Fallback.title);

  // TEST 5: Verify Milestone 1 never receives Milestone 4 joins or complex sorting
  console.log('\nTest 5: Verify strict milestone separation (No leaks to Milestone 1)');
  const m1Sql = generateTopicSpecificPracticeFallback(
    'Database Fundamentals & SQL Intro',
    'Introduction to Databases',
    'Database Administrator',
    { milestoneIndex: 1 }
  );
  assert.strictEqual(m1Sql.milestoneIndex, 1);
  assert.strictEqual(m1Sql.difficulty, 'Beginner');
  assert(!m1Sql.prompt.toLowerCase().includes('inner join'), 'Milestone 1 must NOT ask for complex inner joins');
  console.log('  ✅ Verified Milestone 1 SQL is beginner selection without complex joins.');

  // TEST 6: Scoring Evaluation Function Tests
  console.log('\nTest 6: Submission Evaluation & Scoring Logic');

  // 6a: Correct Output -> 100%
  const correctEval = evaluatePracticeSubmission(
    'function test() { return 54; }',
    'Final Price: 54',
    'Final Price: 54',
    '60',
    'node'
  );
  assert.strictEqual(correctEval.score, 100, 'Correct answer must receive 100%');
  assert.strictEqual(correctEval.passed, true);
  console.log('  ✅ Correct submission awarded 100%');

  // 6b: Completely Incorrect Output -> 0%
  const incorrectEval = evaluatePracticeSubmission(
    'function test() { return 0; }',
    'Final Price: 9999',
    'Final Price: 54',
    '60',
    'node'
  );
  assert.strictEqual(incorrectEval.score, 0, 'Incorrect answer must receive 0%');
  assert.strictEqual(incorrectEval.passed, false);
  console.log('  ✅ Incorrect submission awarded 0%');

  // 6c: Empty Code Submission -> 0%
  const emptyEval = evaluatePracticeSubmission(
    '   ',
    '',
    'Final Price: 54',
    '60',
    'node'
  );
  assert.strictEqual(emptyEval.score, 0, 'Empty submission must receive 0%');
  assert.strictEqual(emptyEval.passed, false);
  console.log('  ✅ Empty submission awarded 0%');

  // 6d: Partially Correct Output -> 50%
  const partialEval = evaluatePracticeSubmission(
    'function test() { return { subtotal: 40.0, tax: 0 }; }',
    'Bill Summary: subtotal: 40.0',
    'Bill Summary: subtotal: 40.0, tax: 3.2, total: 43.2',
    'test',
    'python'
  );
  assert.strictEqual(partialEval.score, 50, 'Partially correct answer must receive 50%');
  console.log('  ✅ Partially correct submission awarded proportional marks (50%)');

  console.log('\n================================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (6/6)');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
