import 'dotenv/config';
import { generateText } from '../src/ai/aiClient.js';

const prompt = `Design a 5-milestone roadmap for 'Backend Engineer'.
Output strictly valid JSON with key 'milestones' which is an array of 5 objects:
{
  "milestones": [
    {
      "id": 1,
      "title": "Milestone 1: Fundamentals",
      "desc": "Overview",
      "tags": ["Node.js", "Express"],
      "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"]
    }
  ]
}`;

const t0 = Date.now();
const text = await generateText(prompt, { json: true, maxTokens: 1500, timeoutMs: 30000 });
console.log(`Finished in ${Date.now() - t0}ms`);
console.log('Raw text:', text);
