import dotenv from 'dotenv';
dotenv.config();

import { generateNewRoadmap } from '../src/services/roadmap.service.js';

async function testRoadmapGeneration() {
  console.log('Testing Generate AI Roadmap button service...');
  const testRole = 'Fullstack Web & AI Engineer Test ' + Date.now();

  try {
    const result = await generateNewRoadmap(1, testRole, {
      currentSkills: ['HTML', 'CSS', 'JavaScript'],
    });

    console.log('✅ Generation Result Success!');
    console.log('Roadmap Target Role:', result.targetRole || result.careerTrack);
    console.log('Milestones Generated:', result.milestones ? result.milestones.length : 0);
    if (result.milestones && result.milestones[0]) {
      console.log('Milestone 1 Title:', result.milestones[0].title);
      console.log('Milestone 1 Topics Count:', result.milestones[0].topics?.length);
    }
  } catch (err) {
    console.error('❌ Generation Failed Error:', err);
  }
}

testRoadmapGeneration();
