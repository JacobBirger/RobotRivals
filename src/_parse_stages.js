const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '_extracted.js'), 'utf8');

// Find STAGES array
const m = src.match(/const STAGES\s*=\s*\[([\s\S]*?)\];\s*\n/);
if (!m) { console.error('STAGES not found'); process.exit(1); }
const stagesSrc = m[1];

// Split into top-level { } objects using brace-depth parsing
const entries = [];
let depth = 0, start = -1, inStr = false, strChar = '';
for (let i = 0; i < stagesSrc.length; i++) {
  const c = stagesSrc[i];
  if (inStr) {
    const prev = stagesSrc[i - 1];
    if (c === strChar && prev !== '\\') inStr = false;
    continue;
  }
  if (c === '"' || c === "'") { inStr = true; strChar = c; continue; }
  if (c === '{') { if (depth === 0) start = i; depth++; }
  if (c === '}') {
    depth--;
    if (depth === 0 && start >= 0) { entries.push(stagesSrc.slice(start, i + 1)); start = -1; }
  }
}

fs.writeFileSync(path.join(__dirname, '_stages_parsed.json'), JSON.stringify({ entries }, null, 2));
console.log('Found', entries.length, 'stage entries');
entries.forEach((e, i) => {
  const idm = e.match(/id:(\d+)/);
  const nm = e.match(/name:'([^']+)'/);
  console.log(i, 'id=' + (idm ? idm[1] : '?'), 'name=' + (nm ? nm[1] : '?'));
});
