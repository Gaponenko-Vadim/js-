/**
 * Parse tasks content from markdown
 */

import type { ParsedTasks, TaskItem } from '../types';

export function parseTasksContent(content: string): ParsedTasks {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const prepHeadingText = '## Подготовка к заданиям';
  let prep = '';
  let contentForTasks = normalized;

  const prepStart = normalized.indexOf(prepHeadingText);
  if (prepStart >= 0) {
    const headingLineEnd = normalized.indexOf('\n', prepStart);
    if (headingLineEnd >= 0) {
      const nextSectionIndex = normalized.indexOf('\n## ', headingLineEnd + 1);
      const nextTaskIndex = normalized.indexOf('\n### ', headingLineEnd + 1);
      let endIndex = normalized.length;
      if (nextSectionIndex >= 0) {
        endIndex = nextSectionIndex;
      } else if (nextTaskIndex >= 0) {
        endIndex = nextTaskIndex;
      }

      prep = normalized.slice(headingLineEnd + 1, endIndex).trim();
      contentForTasks =
        (normalized.slice(0, prepStart) + normalized.slice(endIndex)).trim();
    }
  }

  if (!prep && prepStart < 0) {
    const prepHeading =
      /(^|\n)##\s+Подготовка к заданиям[^\n]*\n([\s\S]*?)(?=\n##\s+Задания|\n###|$)/m;
    const prepMatch = normalized.match(prepHeading);
    prep = prepMatch?.[2]?.trim() ?? '';
    contentForTasks = prepMatch
      ? normalized.replace(prepMatch[0], '').trim()
      : normalized;
  }

  const headingMatches = Array.from(contentForTasks.matchAll(/^###\s+(.+)$/gm));
  if (headingMatches.length === 0) {
    return { intro: contentForTasks.trim(), prep, items: [] };
  }

  const summaryMarkers = [
    '**Кратко:**',
    '**Краткое описание:**',
    '**Коротко:**'
  ];
  const detailsMarkers = [
    '**Полное задание:**',
    '**Полное описание:**',
    '**Подробно:**',
    '**Описание:**'
  ];

  const findMarker = (text: string, markers: string[]) => {
    for (const marker of markers) {
      const index = text.indexOf(marker);
      if (index >= 0) {
        return { marker, index };
      }
    }
    return null;
  };

  const intro = contentForTasks.slice(0, headingMatches[0].index ?? 0).trim();
  const items: TaskItem[] = [];

  for (let i = 0; i < headingMatches.length; i++) {
    const match = headingMatches[i];
    const title = match[1]?.trim() ?? `Задание ${i + 1}`;
    const start = (match.index ?? 0) + match[0].length;
    const end =
      i + 1 < headingMatches.length
        ? headingMatches[i + 1].index ?? contentForTasks.length
        : contentForTasks.length;
    const block = contentForTasks.slice(start, end).trim();

    const answerMarker = '**Ответ:**';
    const explanationMarker = '**Объяснение:**';
    let body = block;
    let answer = '';
    let explanation = '';
    let summary = '';

    const answerIndex = block.indexOf(answerMarker);
    if (answerIndex >= 0) {
      body = block.slice(0, answerIndex).trim();
      const afterAnswer = block.slice(answerIndex + answerMarker.length).trim();
      const explanationIndex = afterAnswer.indexOf(explanationMarker);
      if (explanationIndex >= 0) {
        answer = afterAnswer.slice(0, explanationIndex).trim();
        explanation = afterAnswer
          .slice(explanationIndex + explanationMarker.length)
          .trim();
      } else {
        answer = afterAnswer.trim();
      }
    }

    const summaryMatch = findMarker(body, summaryMarkers);
    const detailsMatch = findMarker(body, detailsMarkers);

    if (
      summaryMatch &&
      detailsMatch &&
      summaryMatch.index < detailsMatch.index
    ) {
      summary = body
        .slice(summaryMatch.index + summaryMatch.marker.length, detailsMatch.index)
        .trim();
      body = body.slice(detailsMatch.index + detailsMatch.marker.length).trim();
    }

    items.push({
      id: `task-${i + 1}`,
      title,
      summary,
      body,
      answer,
      explanation
    });
  }

  return { intro, prep, items };
}
