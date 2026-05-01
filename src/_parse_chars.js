const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '_extracted.js'), 'utf8');

// Extract CHARS array body
const m = src.match(/const CHARS\s*=\s*\[([\s\S]*?)\];\s*\nconst DUMMY_CHAR/);
if (!m) { console.error('CHARS not found'); process.exit(1); }
const charsSrc = m[1];

// Split into top-level { } objects
const entries = [];
let depth = 0, start = -1, inStr = false, strChar = '';
for (let i = 0; i < charsSrc.length; i++) {
  const c = charsSrc[i];
  if (inStr) {
    const prev = charsSrc[i-1];
    if (c === strChar && prev !== '\\') inStr = false;
    continue;
  }
  if (c === '"' || c === "'") { inStr = true; strChar = c; continue; }
  if (c === '{') { if (depth === 0) start = i; depth++; }
  if (c === '}') {
    depth--;
    if (depth === 0 && start >= 0) { entries.push(charsSrc.slice(start, i + 1)); start = -1; }
  }
}

const dm = src.match(/const DUMMY_CHAR\s*=\s*(\{[^;]*\});/s);
const dummySrc = dm ? dm[1] : '{}';

fs.writeFileSync(require('path').join(__dirname, '_chars_parsed.json'), JSON.stringify({ entries, dummySrc }, null, 2));
console.log('Found', entries.length, 'char entries');
entries.forEach((e, i) => {
  const idm = e.match(/id:(\d+)/);
  console.log(i, 'id=' + (idm ? idm[1] : '?'), e.slice(0, 80).replace(/\n/g, ' '));
});
