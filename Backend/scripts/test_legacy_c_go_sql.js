import { runCodeInSandbox } from '../src/services/code.executor.service.js';

async function testLegacyLangs() {
  const legacyTests = [
    { lang: 'c', code: '#include <stdio.h>\nint main() { printf("HELLO_C"); return 0; }', in: '' },
    { lang: 'go', code: 'package main\nimport "fmt"\nfunc main() { fmt.Print("HELLO_GO") }', in: '' },
    { lang: 'sql', code: 'SELECT 42 as answer;', in: '' }
  ];
  for (const t of legacyTests) {
    try {
      const res = await runCodeInSandbox({ language: t.lang, code: t.code, stdin: t.in });
      console.log(`[LEGACY_${t.lang.toUpperCase()}] exitCode: ${res.exitCode}, stdout: "${res.stdout.trim()}", compErr: ${res.compilationError}, sandbox: "${res.sandbox}"`);
      if (res.stderr) console.log(`   stderr: ${res.stderr.trim()}`);
    } catch (e) {
      console.log(`[LEGACY_${t.lang.toUpperCase()}] ERROR: ${e.message}`);
    }
  }
}

testLegacyLangs();

