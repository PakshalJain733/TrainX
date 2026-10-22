import fs from 'fs';
import path from 'path';
import process from 'node:process';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');
const stagingDir = path.join(frontendDir, 'dist_staging');
const viteBin = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

function cleanupDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (e) {
      console.warn(`[safe-build] Warning: Could not clean up ${dirPath}: ${e.message}`);
    }
  }
}

function verifyBuildOutput(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Staging directory does not exist: ${dir}`);
  }

  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html is missing in build output');
  }

  const indexStat = fs.statSync(indexPath);
  if (indexStat.size === 0) {
    throw new Error('index.html is empty (0 bytes)');
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('<script') && !indexContent.includes('type="module"')) {
    throw new Error('index.html does not contain script bundle references');
  }

  const assetsDir = path.join(dir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    throw new Error('assets/ directory is missing in build output');
  }

  const assets = fs.readdirSync(assetsDir);
  const jsFiles = assets.filter((f) => f.endsWith('.js'));
  const cssFiles = assets.filter((f) => f.endsWith('.css'));

  if (jsFiles.length === 0) {
    throw new Error('No JavaScript bundles were generated in assets/');
  }

  if (cssFiles.length === 0) {
    throw new Error('No CSS stylesheets were generated in assets/');
  }

  console.log(`[safe-build] Integrity check PASSED: index.html (${indexStat.size} B), ${jsFiles.length} JS chunk(s), ${cssFiles.length} CSS file(s).`);
}

function atomicPublish(staging, target) {
  const backup = path.join(path.dirname(target), `.dist_backup_${Date.now()}`);
  let hadTarget = false;

  if (fs.existsSync(target)) {
    hadTarget = true;
    try {
      fs.renameSync(target, backup);
    } catch (_renameErr) {
      // Fallback copy if rename fails due to OS filesystem locks
      fs.cpSync(target, backup, { recursive: true });
      fs.rmSync(target, { recursive: true, force: true });
    }
  }

  try {
    try {
      fs.renameSync(staging, target);
    } catch (_renameErr) {
      fs.cpSync(staging, target, { recursive: true });
      cleanupDir(staging);
    }

    if (hadTarget && fs.existsSync(backup)) {
      cleanupDir(backup);
    }
  } catch (publishErr) {
    console.error(`[safe-build] FATAL: Failed to publish build from staging to target: ${publishErr.message}`);
    if (hadTarget && fs.existsSync(backup) && !fs.existsSync(target)) {
      console.warn('[safe-build] Attempting to restore previous working dist from backup...');
      try {
        fs.renameSync(backup, target);
        console.warn('[safe-build] Previous dist successfully restored.');
      } catch (restoreErr) {
        console.error(`[safe-build] Could not restore backup: ${restoreErr.message}`);
      }
    }
    throw publishErr;
  }
}

// 1. Initial cleanup of stale staging folder
cleanupDir(stagingDir);

console.log('[safe-build] Starting production build in staging mode...');

// 2. Spawn Vite build targeting staging directory
const child = spawn(process.execPath, [viteBin, 'build', '--outDir', 'dist_staging'], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
  },
});

child.on('error', (err) => {
  console.error(`[safe-build] Failed to start vite build process: ${err.message}`);
  cleanupDir(stagingDir);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`[safe-build] Vite build failed with exit code ${code}.`);
    console.error('[safe-build] ABORTING: Staging output discarded; existing production dist remains untouched.');
    cleanupDir(stagingDir);
    process.exit(code || 1);
  }

  try {
    // 3. Verify output integrity
    verifyBuildOutput(stagingDir);

    // 4. Atomically publish verified staging output to dist
    atomicPublish(stagingDir, distDir);

    console.log('[safe-build] Production build completed and published successfully to dist/.');
    process.exit(0);
  } catch (err) {
    console.error(`[safe-build] Validation error: ${err.message}`);
    console.error('[safe-build] ABORTING: Invalid build discarded; existing production dist remains untouched.');
    cleanupDir(stagingDir);
    process.exit(1);
  }
});
