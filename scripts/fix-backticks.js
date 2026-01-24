const fs = require('fs');
const path = require('path');

// Читаем файл
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node fix-backticks.js <file-path>');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Заменяем все одинарные backticks (но не тройные \`\`\` и не уже экранированные \`)
// Паттерн: ищем ` который:
// - не следует за \
// - не является частью \`\`\`
// - не в начале/конце template string

// Простой подход: заменяем все ` на \` кроме:
// 1. Уже экранированных (\`)
// 2. Открывающего/закрывающего template string (первый и последний ` после = и перед );)

// Находим начало и конец template string
const templateStart = content.indexOf('const lectureContent = cleanContent(`');
const templateEnd = content.indexOf('`);', templateStart);

if (templateStart === -1 || templateEnd === -1) {
  console.error('Could not find template string boundaries');
  process.exit(1);
}

// Извлекаем template content
const before = content.substring(0, templateStart + 38); // до первого `
const templateContent = content.substring(templateStart + 38, templateEnd);
const after = content.substring(templateEnd);

console.log('Template string found, length:', templateContent.length);

// Заменяем все ` на \` в template content, кроме уже экранированных
let fixed = templateContent.replace(/(?<!\\)`/g, '\\`');

// Также экранируем ${...} интерполяции (кроме уже экранированных)
fixed = fixed.replace(/(?<!\\)\$\{/g, '\\${');

// Собираем обратно
const result = before + fixed + after;

// Сохраняем
fs.writeFileSync(filePath, result, 'utf8');

console.log('Fixed! All backticks in template string are now escaped.');
