const fs = require('fs');
const path = require('path');

const filePath = 'scripts/create-performance-requirements-test.ts';
const fullPath = path.join(process.cwd(), filePath);

console.log(`Processing ${filePath}...`);

let content = fs.readFileSync(fullPath, 'utf-8');

// Find the lectureContent template literal using regex
const regex = /(const lectureContent = `)([^]*?)`;/;
const match = content.match(regex);

if (!match) {
  console.log(`  ❌ Could not find lectureContent template in ${filePath}`);
  process.exit(1);
}

const before = match[1]; // "const lectureContent = `"
const templateContent = match[2]; // the content inside

// Replace ALL backticks (single, double, triple) with escaped versions
const fixed = templateContent.replace(/`/g, '\\`');

// Count replacements
const count = (templateContent.match(/`/g) || []).length;

console.log(`  ✅ Escaping ${count} backticks in ${filePath}`);

// Replace in original content
const newContent = content.replace(regex, before + fixed + '`;');
fs.writeFileSync(fullPath, newContent, 'utf-8');

console.log('✅ File processed!');
