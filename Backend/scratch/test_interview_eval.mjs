import dotenv from 'dotenv';
dotenv.config();

import { evaluateAnswer, generateScorecard } from '../src/ai/interview.ai.js';

async function testInterviewAI() {
  console.log('Testing evaluateAnswer with real AI...');
  const t0 = Date.now();
  
  // Test 1: Good answer
  const goodEval = await evaluateAnswer({
    role: 'Full Stack Developer',
    topic: 'JavaScript',
    question: 'Explain the difference between var, let, and const in JavaScript. When would you use each?',
    answer: 'var is function-scoped and hoisted to the top of its scope initialized with undefined. let and const are block-scoped and live in the Temporal Dead Zone (TDZ) until their declaration is evaluated. const must be initialized upon declaration and cannot be reassigned, although objects assigned to const remain mutable. Best practice is to use const by default, let when reassignment is needed, and avoid var in modern ES6+ code.',
    difficulty: 'Medium'
  });
  console.log(`Good Answer Evaluated in ${Date.now() - t0}ms:`);
  console.log('Source:', goodEval.source);
  console.log('Score:', goodEval.score);
  console.log('Feedback:', goodEval.feedback);
  console.log('Model Answer:', goodEval.modelAnswer);

  // Test 2: Poor / Gibberish answer
  console.log('\nTesting evaluateAnswer with gibberish answer...');
  const t1 = Date.now();
  const badEval = await evaluateAnswer({
    role: 'Full Stack Developer',
    topic: 'JavaScript',
    question: 'Explain closures in JavaScript with a practical real-world example.',
    answer: 'I do not know really, it is just for making variables inside function thingy.',
    difficulty: 'Medium'
  });
  console.log(`Bad Answer Evaluated in ${Date.now() - t1}ms:`);
  console.log('Source:', badEval.source);
  console.log('Score:', badEval.score);
  console.log('Feedback:', badEval.feedback);

  // Test 3: Generate Scorecard
  console.log('\nTesting generateScorecard...');
  const t2 = Date.now();
  const scorecard = await generateScorecard({
    role: 'Full Stack Developer',
    topic: 'JavaScript',
    evaluationHistory: [
      {
        question: 'Explain var, let, and const',
        topic: 'JavaScript',
        answer: 'var is function scoped, let and const are block scoped. const cannot be reassigned.',
        score: goodEval.score,
        feedback: goodEval.feedback
      },
      {
        question: 'Explain closures',
        topic: 'JavaScript',
        answer: 'I do not know really',
        score: badEval.score,
        feedback: badEval.feedback
      }
    ]
  });
  console.log(`Scorecard generated in ${Date.now() - t2}ms:`);
  console.log('Scorecard Source:', scorecard.source);
  console.log('Overall Score:', scorecard.overallScore);
  console.log('Grade:', scorecard.grade);
  console.log('Readiness:', scorecard.readiness);
  console.log('Strengths:', scorecard.strengths);
  console.log('Improvement Areas:', scorecard.improvementAreas);
}

testInterviewAI().catch(err => console.error('Error:', err));
