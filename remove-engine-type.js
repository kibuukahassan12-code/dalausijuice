const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const content = fs.readFileSync(schemaPath, 'utf-8');
const lines = content.split('\n');
const filteredLines = lines.filter(line => !line.includes('engineType'));
const newContent = filteredLines.join('\n');
fs.writeFileSync(schemaPath, newContent, 'utf-8');
console.log('Removed engineType lines from schema.prisma');
