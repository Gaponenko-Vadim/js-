const fs = require('fs');
const path = require('path');

const files = [
  'scripts/create-agile-waterfall-test.ts',
  'scripts/create-performance-requirements-test.ts',
  'scripts/create-uiux-usability-test.ts'
];

files.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  console.log(`Processing ${filePath}...`);

  let content = fs.readFileSync(fullPath, 'utf-8');

  // Find the lectureContent template literal using regex
  // Match from "const lectureContent = `" to the closing "`;"
  const regex = /(const lectureContent = `)([^]*?)`;/;
  const match = content.match(regex);

  if (!match) {
    console.log(`  ❌ Could not find lectureContent template in ${filePath}`);
    return;
  }

  const before = match[1]; // "const lectureContent = `"
  const templateContent = match[2]; // the content inside
  const fullMatch = match[0]; // the entire match

  // Replace all ``` with \`\`\` in the template content
  const fixed = templateContent.replace(/```/g, '\\`\\`\\`');

  // Count replacements
  const count = (templateContent.match(/```/g) || []).length;

  if (count === 0) {
    console.log(`  ℹ️  No triple backticks found in ${filePath}`);
    return;
  }

  // Replace in original content
  const newContent = content.replace(regex, before + fixed + '`;');
  fs.writeFileSync(fullPath, newContent, 'utf-8');

  console.log(`  ✅ Fixed ${count} triple backticks in ${filePath}`);
});

console.log('\n✅ All files processed!');
