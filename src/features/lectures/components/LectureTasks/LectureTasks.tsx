/**
 * LectureTasks Component
 *
 * Renders parsed tasks with progress tracking
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './LectureTasks.module.scss';
import { parseTasksContent } from '../../utils/parseTasksContent';
import type { LectureTasksProps, TaskItem } from '../../types';

export function LectureTasks({
  tasksContent,
  completedTasks,
  onTaskDetailsClick,
  onTaskAnswerClick,
  onPrepClick
}: LectureTasksProps) {
  const parsed = parseTasksContent(tasksContent);

  const getTaskPreview = (task: TaskItem) => {
    if (task.summary) {
      return task.summary;
    }

    const lines = task.body.split('\n');
    const previewLines: string[] = [];
    const pickLine = (label: string) => {
      const match = lines.find((line) =>
        line.replace(/^>\s*/, '').trim().startsWith(label)
      );
      if (match) {
        previewLines.push(match.replace(/^>\s*/, '').trim());
      }
    };

    pickLine('**Ситуация:**');
    pickLine('**Что сделать:**');
    pickLine('**Критерий:**');
    pickLine('Ситуация:');
    pickLine('Что сделать:');
    pickLine('Критерий:');

    if (previewLines.length > 0) {
      return previewLines.join('\n');
    }

    const [firstParagraph] = task.body.split(/\n\s*\n/);
    return firstParagraph?.trim() || task.body;
  };

  const tasksHeaderMatch = parsed.intro ? parsed.intro.match(/^##\s+(.+)$/m) : null;
  const tasksHeader = tasksHeaderMatch?.[1]?.trim() || 'Задания для практики 🧪';
  const tasksIntroBody = parsed.intro
    ? parsed.intro.replace(/^##\s+(.+)$/m, '').trim()
    : '';

  return (
    <div className={styles.tasksWrapper}>
      <div className={styles.tasksHeaderRow}>
        <h3 className={styles.tasksHeaderTitle}>{tasksHeader}</h3>
        <button
          className={styles.tasksPrepButton}
          type="button"
          onClick={onPrepClick}
        >
          Подготовка к заданиям
        </button>
      </div>
      {tasksIntroBody && (
        <div className={styles.tasksIntro}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {tasksIntroBody}
          </ReactMarkdown>
        </div>
      )}
      <div className={styles.tasksList}>
        {parsed.items.map((task) => {
          const isCompleted = completedTasks.includes(task.id);
          return (
            <div
              key={task.id}
              className={`${styles.taskCard} ${isCompleted ? styles.taskCardCompleted : ''}`}
            >
              <div className={styles.taskHeader}>
                <div className={styles.taskTitleRow}>
                  <h3 className={styles.taskTitle}>{task.title}</h3>
                  {isCompleted && (
                    <span className={styles.taskDoneBadge} aria-label="Выполнено">
                      ✓
                    </span>
                  )}
                </div>
                <div className={styles.taskActions}>
                  <button
                    className={styles.taskAnswerButton}
                    type="button"
                    onClick={() => onTaskDetailsClick(task)}
                  >
                    Задание
                  </button>
                  <button
                    className={styles.taskAnswerButton}
                    type="button"
                    onClick={() => onTaskAnswerClick(task)}
                  >
                    Ответ
                  </button>
                </div>
              </div>
              <div className={styles.taskBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {getTaskPreview(task)}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
