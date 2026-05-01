const fs = require('fs');
const path = require('path');

const parsed = JSON.parse(fs.readFileSync(path.join(__dirname, '_stages_parsed.json'), 'utf8'));

function write(file, content) {
  const full = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('wrote', file);
}

const stageConfigs = [
  { name: 'foundry',    id: 0  },
  { name: 'orbital',    id: 1  },
  { name: 'scrapyard',  id: 2  },
  { name: 'neoncity',   id: 3  },
  { name: 'arctic',     id: 4  },
  { name: 'cloudtemple',id: 5  },
  { name: 'moltencore', id: 6  },
  { name: 'datarealm',  id: 7  },
  { name: 'carnival',   id: 8  },
  { name: 'jungle',     id: 9  },
  { name: 'skytemple',  id: 10 },
  { name: 'neocity2',   id: 11 },
];

// Map id -> data string
const stageData = {};
for (const entry of parsed.entries) {
  const idm = entry.match(/\bid:(\d+)\b/);
  if (idm) stageData[parseInt(idm[1])] = entry;
}

for (const cfg of stageConfigs) {
  const data = stageData[cfg.id];
  if (!data) { console.warn('No data found for stage id', cfg.id, cfg.name); continue; }
  write(`stages/${cfg.name}.js`, `export const stage = ${data};\n`);
}

// Regenerate stages/index.js
const imports = stageConfigs.map(c => `import { stage as _${c.name} } from './${c.name}.js';`).join('\n');
const arr = stageConfigs.map(c => `_${c.name}`).join(', ');
write('stages/index.js',
  `${imports}\nexport const STAGES = [${arr}];\nexport { drawStageBG, drawStageGeom, drawFerrisWheel, drawJungleTrees, drawNeoBuildings, drawGear } from './drawStageBG.js';\n`
);

console.log('All stage files written.');
