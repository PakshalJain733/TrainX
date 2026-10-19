import { runCodeInSandbox } from '../src/services/code.executor.service.js';

const res = await runCodeInSandbox({
  language: 'javascript',
  code: 'console.log("CODE EXECUTOR REAL TEST OK: " + (10 * 10));'
});

console.log('Result from code.executor.service.js:');
console.log(JSON.stringify(res, null, 2));
