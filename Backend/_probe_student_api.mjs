import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';

const token = jwt.sign(
  { userId: 6, id: 6, role: 'student', collegeId: 1, email: 's6@x.com' },
  config.jwt.secret,
  { expiresIn: '1h' }
);

const eps = [
  '/skill-gaps/my-gaps',
  '/roadmaps/my-roadmap',
  '/roadmaps/',
  '/milestones',
  '/leaderboards',
  '/student/attendance',
  '/student/dashboard',
  '/coding-submissions/student/6',
  '/interviews',
  '/assessments?mine=1',
  '/drives',
  '/reports/student/6',
];

for (const e of eps) {
  const res = await fetch('http://localhost:5000/api/v1' + e, {
    headers: { Authorization: 'Bearer ' + token },
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const data = body && body.data;
  let summary;
  if (data === undefined || data === null || Array.isArray(data) && data.length === 0) {
    summary = 'EMPTY/null';
  } else if (Array.isArray(data)) {
    summary = 'array[' + data.length + '] first=' + JSON.stringify(data[0]).slice(0, 180);
  } else if (typeof data === 'object') {
    summary = 'obj keys=[' + Object.keys(data).join(',') + '] sample=' + JSON.stringify(data).slice(0, 240);
  } else {
    summary = 'scalar=' + JSON.stringify(data).slice(0, 120);
  }
  console.log('GET ' + e + ' -> ' + res.status + ' | ' + summary);
}
process.exit(0);