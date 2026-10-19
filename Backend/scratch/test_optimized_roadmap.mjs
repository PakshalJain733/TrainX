import 'dotenv/config';
import { processroadmapAI } from '../src/ai/roadmap.ai.js';

console.log('Testing optimized processroadmapAI for "Cloud DevOps Engineer"...');
const t0 = Date.now();
const res = await processroadmapAI({
  targetRole: 'Cloud DevOps Engineer',
  studentProfile: { department: 'Information Technology', semester: '6' },
  currentSkills: ['Linux', 'Git'],
});
const elapsed = Date.now() - t0;

console.log(`\nCompleted in ${elapsed}ms (${(elapsed / 1000).toFixed(2)}s)`);
console.log('Source:', res.source);
console.log('Model Used:', res.modelUsed);
console.log('Milestones count:', res.milestones?.length);
if (res.milestones?.length > 0) {
  const m1 = res.milestones[0];
  console.log('M1 Title:', m1.title);
  console.log('M1 Topics:', m1.topics?.join(' | '));
  console.log('M1 Syllabus count:', m1.syllabus?.length);
  console.log('M1 Videos count:', m1.videos?.length);
  console.log('M1 Resources count:', m1.resources?.length);
}
