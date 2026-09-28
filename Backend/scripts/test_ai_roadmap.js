import { generateNewRoadmap } from '../services/roadmap.service.js';
import { initializeDatabase } from '../config/init_db.js';

async function testRoadmap() {
  await initializeDatabase();
  console.log("=== TESTING AI ROADMAP GENERATION ===");
  try {
    const result = await generateNewRoadmap(1, 'Cyber Security Analyst', {
      studentProfile: { department: 'ECS', semester: 'VI', cgpa: '8.5' },
      currentSkills: ['Networking', 'Linux Basics'],
    });
    console.log("SUCCESS! Generated AI Roadmap:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("ERROR generating roadmap:", err);
  }
  process.exit(0);
}

testRoadmap();
