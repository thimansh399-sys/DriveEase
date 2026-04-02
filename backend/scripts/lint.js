const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'uploads']);
const TARGET_DIRS = ['controllers', 'middleware', 'models', 'routes', 'scripts', 'utils'];
const ROOT_FILES = ['server.js', 'bookDriverServer.js'];

function collectJsFiles(startPath, out = []) {
  if (!fs.existsSync(startPath)) return out;

  const stats = fs.statSync(startPath);
  if (stats.isFile() && startPath.endsWith('.js')) {
    out.push(startPath);
    return out;
  }

  if (!stats.isDirectory()) return out;

  const entries = fs.readdirSync(startPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(startPath, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath, out);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(fullPath);
    }
  }

  return out;
}

function checkFileSyntax(filePath) {
  const result = spawnSync(process.execPath, ['--check', filePath], {
    stdio: 'pipe',
    encoding: 'utf8'
  });

  return {
    filePath,
    ok: result.status === 0,
    output: `${result.stdout || ''}${result.stderr || ''}`.trim()
  };
}

const files = [
  ...ROOT_FILES.map((file) => path.join(ROOT, file)),
  ...TARGET_DIRS.flatMap((dir) => collectJsFiles(path.join(ROOT, dir)))
].filter((value, index, arr) => arr.indexOf(value) === index);

if (!files.length) {
  console.log('No JavaScript files found for syntax lint.');
  process.exit(0);
}

const failures = [];
for (const file of files) {
  const result = checkFileSyntax(file);
  if (!result.ok) failures.push(result);
}

if (!failures.length) {
  console.log(`Syntax lint passed for ${files.length} files.`);
  process.exit(0);
}

console.error(`Syntax lint failed in ${failures.length} file(s):`);
for (const failure of failures) {
  console.error(`\n- ${path.relative(ROOT, failure.filePath)}`);
  if (failure.output) console.error(failure.output);
}

process.exit(1);
