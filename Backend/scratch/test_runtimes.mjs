import { spawnSync } from 'node:child_process';

const testNode = spawnSync('node', ['-e', 'console.log("Hello from Node!")'], { encoding: 'utf8' });
console.log('Node test:', testNode.stdout.trim());

const testPy = spawnSync('python', ['-c', 'print("Hello from Python!")'], { encoding: 'utf8' });
console.log('Python test:', testPy.stdout.trim());

const testJava = spawnSync('java', ['-version'], { encoding: 'utf8' });
console.log('Java test status:', testJava.status === 0 ? 'OK' : 'Error');
