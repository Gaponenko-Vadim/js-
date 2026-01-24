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

  // Find the lectureContent template literal
  const startMarker = 'const lectureContent = `';
  const startIndex = content.indexOf(startMarker);

  if (startIndex === -1) {
    console.log(`  ❌ Could not find lectureContent in ${filePath}`);
    return;
  }

  // Find the end of the template literal (the closing backtick before semicolon)
  // We need to find the matching closing backtick for this template
  let endIndex = startIndex + startMarker.length;
  let backtickCount = 1;

  // Find the closing backtick by counting backticks
  while (endIndex < content.length && backtickCount > 0) {
    if (content[endIndex] === '`' && content[endIndex - 1] !== '\\') {
      // Check if this is part of ``` (triple backtick)
      if (content[endIndex - 1] === '`' && content[endIndex - 2] === '`') {
        // This is the end of a ``` sequence, skip
        endIndex++;
        continue;
      }
      if (content[endIndex + 1] === '`' && content[endIndex + 2] === '`') {
        // This is the start of a ``` sequence, skip
        endIndex++;
        continue;
      }
      // This looks like the closing backtick of the template literal
      break;
    }
    endIndex++;
  }

  if (endIndex >= content.length) {
    console.log(`  ❌ Could not find end of lectureContent in ${filePath}`);
    return;
  }

  // Extract the template content
  const before = content.substring(0, startIndex + startMarker.length);
  const templateContent = content.substring(startIndex + startMarker.length, endIndex);
  const after = content.substring(endIndex);

  // Replace all ``` with \`\`\` in the template content
  const fixed = templateContent.replace(/```/g, '\\`\\`\\`');

  // Count replacements
  const count = (templateContent.match(/```/g) || []).length;

  // Write back
  const newContent = before + fixed + after;
  fs.writeFileSync(fullPath, newContent, 'utf-8');

  console.log(`  ✅ Fixed ${count} triple backticks in ${filePath}`);
});

console.log('\n✅ All files processed!');
