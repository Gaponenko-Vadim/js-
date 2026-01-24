const fs = require('fs');
const path = require('path');

const filePath = 'scripts/create-performance-requirements-test.ts';
const fullPath = path.join(process.cwd(), filePath);

console.log(`Processing ${filePath}...`);

let content = fs.readFileSync(fullPath, 'utf-8');

// Find the lectureContent template literal
const regex = /(const lectureContent = `)([^]*?)`;/;
const match = content.match(regex);

if (!match) {
  console.log(`  ❌ Could not find lectureContent template`);
  process.exit(1);
}

const before = match[1];
let templateContent = match[2];

// First, unescape any double-escaped backticks (\\` -> `)
templateContent = templateContent.replace(/\\\\`/g, '`');

// Now escape all backticks that are NOT already escaped
// This regex matches backticks that are NOT preceded by backslash
templateContent = templateContent.replace(/(?<!\\)`/g, '\\`');

const newContent = content.replace(regex, before + templateContent + '`;');
fs.writeFileSync(fullPath, newContent, 'utf-8');

console.log('✅ File processed!');
