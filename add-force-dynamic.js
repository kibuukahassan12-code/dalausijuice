const fs = require('fs');
const path = require('path');

function findRouteFiles(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      findRouteFiles(fullPath, files);
    } else if (item.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

const apiDir = path.join(__dirname, 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

let updated = 0;
let skipped = 0;

for (const file of routeFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('force-dynamic')) {
    console.log(`Skipping (already has force-dynamic): ${file}`);
    skipped++;
  } else {
    const newContent = `export const dynamic = "force-dynamic"\n${content}`;
    fs.writeFileSync(file, newContent, 'utf-8');
    console.log(`Updated: ${file}`);
    updated++;
  }
}

console.log(`\nDone! Updated ${updated} files, skipped ${skipped} files.`);
