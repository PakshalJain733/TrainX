import { describeProvider, detectProvider, generateText, generateJSON } from './src/ai/aiClient.js';
import { processroadmapAI } from './src/ai/roadmap.ai.js';
import { generateQuizQuestionsAI, verifyQuizQuestions } from './src/ai/quiz.ai.js';
import { generateAIDiagnostics } from './src/ai/skillGap.ai.js';

console.log('provider      :', detectProvider());
console.log('describe      :', describeProvider());

console.log('\n--- 1. plain text ---');
const t = await generateText('Name one core JavaScript primitive for immutability. One word.', { maxTokens: 64 });
console.log('result        :', t);

console.log('\n--- 2. quiz generation ---');
const quiz = await generateQuizQuestionsAI('JavaScript Closures', 3);
console.log('count         :', quiz.length);
console.log('sample        :', JSON.stringify(quiz[0], null, 2).slice(0, 320));

console.log('\n--- 3. quiz verification ---');
const verified = await verifyQuizQuestions(quiz, 'JavaScript Closures');
console.log('verified      :', verified.map(q => `${q.verified}/${q.confidence}`).join(', '));

console.log('\n--- 4. skill gap diagnostics ---');
const diag = await generateAIDiagnostics({ topic: 'Closures', batchName: 'TE-A', deficiencyRate: '48%', avgScore: '52' });
console.log('source        :', diag.source, '|', diag.modelUsed || '');
console.log('rootCauses    :', (diag.rootCauses || []).length, 'items');

console.log('\n--- 5. roadmap generation ---');
const rm = await processroadmapAI({ targetRole: 'Backend Engineer', studentProfile: { department: 'Computer Engineering' }, currentSkills: ['JavaScript'] });
console.log('source        :', rm.source, '|', rm.modelUsed);
console.log('milestones    :', rm.milestones.length);
console.log('m1 title      :', rm.milestones[0].title);
console.log('m1 topics     :', (rm.milestones[0].topics || []).slice(0, 3).join(' | '));
