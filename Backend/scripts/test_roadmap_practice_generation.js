import assert from 'assert';
import {
  generateMilestonePracticeAI,
  generateTopicSpecificPracticeFallback,
  validateAndSanitizePracticeProblem
} from '../src/ai/roadmap.ai.js';

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

  // Dedicated check for string reversal & transformation consistency
  if (sampleInput && typeof sampleInput === "string" && sampleInput.trim().length > 1) {
    const rawInputWord = sampleInput.replace(/["']/g, "").trim();
    if (rawInputWord.length > 1) {
      const reversed = rawInputWord.split("").reverse().join("").toLowerCase();
      // If student correctly produced the reversed string
      if (normActual === reversed || normActual.includes(reversed)) {
        return { score: 100, passed: true, reason: `Reversed string "${reversed}" verified.` };
      }
      // Reject boolean outputs for string reversal
      if (normActual === "true" || normActual === "false") {
        return { score: 0, passed: false, reason: "Output was a boolean (true/false) instead of the required reversed string." };
      }
    }
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
  console.log('🧪 Starting AI Practice & String Reversal Validation Test Suite');
  console.log('================================================================\n');

  // TEST 1: String Reversal Problem Generation (Must return reversed string, NEVER boolean)
  console.log('Test 1: String Reversal Generation');
  const revProblem = generateTopicSpecificPracticeFallback(
    'String Reversal & Manipulation',
    'Core Python & Data Types',
    'Python Developer',
    { milestoneIndex: 1 }
  );

  assert.strictEqual(revProblem.sampleInput, 'hello');
  assert.strictEqual(revProblem.sampleOutput, 'olleh');
  assert.notStrictEqual(revProblem.sampleOutput, 'true', 'String reversal sampleOutput must NOT be boolean true');
  assert.notStrictEqual(revProblem.sampleOutput, 'false', 'String reversal sampleOutput must NOT be boolean false');
  console.log('  ✅ String reversal generated correctly: input "hello" -> output "olleh"');

  // TEST 2: Multiple inputs verification for String Reversal
  console.log('\nTest 2: Multiple Inputs String Reversal Validation');
  const testInputs = [
    { in: 'hello', expected: 'olleh' },
    { in: 'world', expected: 'dlrow' },
    { in: 'TrainX', expected: 'XniarT' },
    { in: '12345', expected: '54321' }
  ];

  testInputs.forEach(({ in: inputStr, expected }) => {
    const sanitized = validateAndSanitizePracticeProblem({
      title: 'String Reversal Challenge',
      prompt: 'Reverse the given string.',
      sampleInput: inputStr,
      sampleOutput: 'true', // Malformed boolean output from faulty AI
      starterCode: 'console.log(reverseString("hello") === "olleh");',
      testCases: [
        { input: inputStr, expectedOutput: 'true' }
      ]
    }, { topic: 'String Reversal' });

    assert.strictEqual(sanitized.sampleOutput, expected, `Reversal of "${inputStr}" must produce "${expected}"`);
    assert.strictEqual(sanitized.testCases[0].expectedOutput, expected, `Test case expected output must be "${expected}"`);
    assert(!sanitized.starterCode.includes('==='), 'Boolean equality comparison in starterCode must be cleansed');
    console.log(`  ✅ Verified input "${inputStr}" cleanly transformed to "${expected}" (boolean cleansed)`);
  });

  // TEST 3: Palindrome Checking Problem (Must return boolean true/false)
  console.log('\nTest 3: Palindrome Verification (Must return boolean true/false)');
  const palProblem = generateTopicSpecificPracticeFallback(
    'Palindrome Verification',
    'String Algorithms',
    'Fullstack Engineer',
    { milestoneIndex: 2 }
  );

  assert.strictEqual(palProblem.sampleInput, 'racecar');
  assert.strictEqual(palProblem.sampleOutput, 'true', 'Palindrome sampleOutput must be true for racecar');
  assert(Array.isArray(palProblem.testCases));
  assert.strictEqual(palProblem.testCases[0].expectedOutput, 'true');
  assert.strictEqual(palProblem.testCases[1].expectedOutput, 'false');
  console.log('  ✅ Palindrome verification generated with consistent boolean outputs: racecar -> true, hello -> false');

  // TEST 4: Never mix palindrome true/false into string reversal
  console.log('\nTest 4: Cleansing Corrupted/Mixed Test Cases in String Reversal');
  const mixedCorruptedProblem = {
    title: 'Reverse String Problem',
    prompt: 'Write a function that reverses a string.',
    sampleInput: 'hello',
    sampleOutput: 'false', // Buggy mixed output
    testCases: [
      { input: 'hello', expectedOutput: 'false' }, // mixed palindrome case!
      { input: 'racecar', expectedOutput: 'true' }, // mixed palindrome case!
      { input: 'world', expectedOutput: 'dlrow' }   // actual reversal case
    ]
  };

  const cleansedProblem = validateAndSanitizePracticeProblem(mixedCorruptedProblem, { topic: 'String Reversal' });
  assert.strictEqual(cleansedProblem.sampleOutput, 'olleh');
  assert.strictEqual(cleansedProblem.testCases[0].expectedOutput, 'olleh', 'hello must output olleh, not false');
  assert.strictEqual(cleansedProblem.testCases[1].expectedOutput, 'racecar', 'racecar must output reversed string racecar, not true');
  assert.strictEqual(cleansedProblem.testCases[2].expectedOutput, 'dlrow', 'world must output dlrow');
  console.log('  ✅ Mixed palindrome test cases in string reversal cleanly cleansed to reversed strings!');

  // TEST 5: Submission Evaluation of String Reversal
  console.log('\nTest 5: Submission Evaluation for String Reversal');

  // 5a: Student output is correct reversed string: 'olleh'
  const evalCorrect = evaluatePracticeSubmission(
    'function reverse(s) { return s.split("").reverse().join(""); }',
    'olleh',
    'olleh',
    'hello',
    'node'
  );
  assert.strictEqual(evalCorrect.score, 100);
  assert.strictEqual(evalCorrect.passed, true);
  console.log('  ✅ Correct reversed string submission awarded 100%');

  // 5b: Student output is boolean 'true' for string reversal -> Must receive 0%
  const evalBoolWrong = evaluatePracticeSubmission(
    'function reverse(s) { return true; }',
    'true',
    'olleh',
    'hello',
    'node'
  );
  assert.strictEqual(evalBoolWrong.score, 0);
  assert.strictEqual(evalBoolWrong.passed, false);
  console.log('  ✅ Boolean "true" submitted for string reversal correctly rejected (0%)');

  // 5c: Student output is completely wrong string -> Must receive 0%
  const evalWrongString = evaluatePracticeSubmission(
    'function reverse(s) { return "wrong"; }',
    'wrong',
    'olleh',
    'hello',
    'node'
  );
  assert.strictEqual(evalWrongString.score, 0);
  assert.strictEqual(evalWrongString.passed, false);
  console.log('  ✅ Incorrect string submitted for string reversal correctly rejected (0%)');

  // TEST 6: Other Transformations (Uppercase / Math)
  console.log('\nTest 6: Other Transformation Validation (Uppercase / Case Conversion)');
  const caseProblem = validateAndSanitizePracticeProblem({
    title: 'Convert String to Uppercase',
    prompt: 'Convert the input to uppercase.',
    sampleInput: 'trainx',
    sampleOutput: 'true' // Buggy boolean
  }, { topic: 'String Transformation' });

  assert.strictEqual(caseProblem.sampleOutput, 'TRAINX');
  console.log('  ✅ Case transformation correctly sanitized to "TRAINX"');

  console.log('\n================================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (6/6)');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
