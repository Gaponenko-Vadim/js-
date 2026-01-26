'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './LectureModal.module.scss';

interface Lecture {
  id: string;
  title: string;
  topic: string;
  content: string;
  scenariosContent?: string | null;
  exampleContent?: string | null;
  tasksContent?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LectureModalProps {
  questionId?: string;
  lectureId?: string;
  isOpen: boolean;
  onClose: () => void;
}

type LectureTab = 'lecture' | 'scenarios' | 'example' | 'tasks';

interface TaskItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  answer: string;
  explanation: string;
}

interface ParsedTasks {
  intro: string;
  items: TaskItem[];
}

function parseTasksContent(content: string): ParsedTasks {
  const headingMatches = Array.from(content.matchAll(/^###\s+(.+)$/gm));
  if (headingMatches.length === 0) {
    return { intro: content.trim(), items: [] };
  }

  const summaryMarkers = ['**Кратко:**', '**Краткое описание:**', '**Коротко:**'];
  const detailsMarkers = ['**Полное задание:**', '**Полное описание:**', '**Подробно:**', '**Описание:**'];

  const findMarker = (text: string, markers: string[]) => {
    for (const marker of markers) {
      const index = text.indexOf(marker);
      if (index >= 0) {
        return { marker, index };
      }
    }
    return null;
  };

  const intro = content.slice(0, headingMatches[0].index ?? 0).trim();
  const items: TaskItem[] = [];

  for (let i = 0; i < headingMatches.length; i++) {
    const match = headingMatches[i];
    const title = match[1]?.trim() ?? `Задание ${i + 1}`;
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < headingMatches.length ? headingMatches[i + 1].index ?? content.length : content.length;
    const block = content.slice(start, end).trim();

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
        explanation = afterAnswer.slice(explanationIndex + explanationMarker.length).trim();
      } else {
        answer = afterAnswer.trim();
      }
    }

    const summaryMatch = findMarker(body, summaryMarkers);
    const detailsMatch = findMarker(body, detailsMarkers);

    if (summaryMatch && detailsMatch && summaryMatch.index < detailsMatch.index) {
      summary = body.slice(summaryMatch.index + summaryMatch.marker.length, detailsMatch.index).trim();
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

  return { intro, items };
}

export default function LectureModal({ questionId, lectureId, isOpen, onClose }: LectureModalProps) {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LectureTab>('lecture');
  const [skipTasksWarning, setSkipTasksWarning] = useState(false);
  const [warningOptOut, setWarningOptOut] = useState(false);
  const [showTaskWarning, setShowTaskWarning] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showTaskAnswer, setShowTaskAnswer] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [taskProgress, setTaskProgress] = useState<Record<string, boolean>>({});
  const taskProgressVersionRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    if (!questionId && !lectureId) return;

    const fetchLecture = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = '';
        if (questionId) {
          url = `/api/lectures/by-question/${questionId}`;
        } else if (lectureId) {
          url = `/api/lectures/${lectureId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Не удалось загрузить лекцию');
        }

        const data = await response.json();
        setLecture(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchLecture();
  }, [isOpen, questionId, lectureId]);

  useEffect(() => {
    if (lecture) {
      setActiveTab('lecture');
      setTaskProgress({});
      taskProgressVersionRef.current += 1;
    }
  }, [lecture?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/user/settings');
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data?.skipTasksWarning === 'boolean') {
          setSkipTasksWarning(data.skipTasksWarning);
        }
      } catch {
        // Keep default preference if settings fail.
      }
    };

    fetchSettings();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !lecture?.id || !lecture?.tasksContent?.trim()) return;

    const fetchProgress = async () => {
      const versionAtStart = taskProgressVersionRef.current;
      try {
        const response = await fetch(`/api/lectures/${lecture.id}/tasks-progress`);
        if (!response.ok) return;
        const data = await response.json();
        const completed = Array.isArray(data?.completedTaskIds) ? data.completedTaskIds : [];
        const map: Record<string, boolean> = {};
        completed.forEach((taskId: string) => {
          map[taskId] = true;
        });
        if (taskProgressVersionRef.current === versionAtStart) {
          setTaskProgress(map);
        }
      } catch {
        // Ignore progress errors; tasks stay unchecked.
      }
    };

    fetchProgress();
  }, [isOpen, lecture?.id, lecture?.tasksContent]);

  if (!isOpen) return null;

  const hasScenarios = Boolean(lecture?.scenariosContent?.trim());
  const hasExample = Boolean(lecture?.exampleContent?.trim());
  const hasTasks = Boolean(lecture?.tasksContent?.trim());
  const markdownToRender = (() => {
    if (activeTab === 'scenarios' && hasScenarios) {
      return lecture?.scenariosContent || '';
    }
    if (activeTab === 'example' && hasExample) {
      return lecture?.exampleContent || '';
    }
    if (activeTab === 'tasks' && hasTasks) {
      return lecture?.tasksContent || '';
    }
    return lecture?.content || '';
  })();
  const parsedTasks = hasTasks && lecture?.tasksContent ? parseTasksContent(lecture.tasksContent) : null;

  const updateSkipTasksWarning = async (value: boolean) => {
    setSkipTasksWarning(value);
    try {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipTasksWarning: value })
      });
    } catch {
      // Silent fallback: preference won't persist on error.
    }
  };

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

  const handleAnswerClick = (task: TaskItem) => {
    setSelectedTask(task);
    setShowTaskDetails(false);
    if (skipTasksWarning) {
      setShowTaskAnswer(true);
    } else {
      setWarningOptOut(false);
      setShowTaskWarning(true);
    }
  };

  const handleConfirmWarning = async () => {
    if (warningOptOut) {
      await updateSkipTasksWarning(true);
    }
    setShowTaskWarning(false);
    setShowTaskAnswer(true);
  };

  const handleCloseTaskAnswer = () => {
    setShowTaskAnswer(false);
  };

  const handleTaskDetailsClick = (task: TaskItem) => {
    setSelectedTask(task);
    setShowTaskWarning(false);
    setShowTaskAnswer(false);
    setShowTaskDetails(true);
  };

  const handleCloseTaskDetails = () => {
    setShowTaskDetails(false);
  };

  const handleTaskAnswerAction = async (completed: boolean) => {
    if (!selectedTask) return;
    await updateTaskProgress(selectedTask.id, completed);
    setShowTaskAnswer(false);
  };

  const updateTaskProgress = async (taskId: string, completed: boolean) => {
    if (!lecture?.id) {
      return;
    }
    const previous = taskProgress[taskId] ?? false;
    setTaskProgress((prev) => ({ ...prev, [taskId]: completed }));
    taskProgressVersionRef.current += 1;

    try {
      const response = await fetch(`/api/lectures/${lecture.id}/tasks-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed })
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }
    } catch {
      setTaskProgress((prev) => ({ ...prev, [taskId]: previous }));
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {(hasScenarios || hasExample || hasTasks) && (
          <div className={styles.tabsBar}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tabButton} ${activeTab === 'lecture' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('lecture')}
                type="button"
              >
                Лекция
              </button>
              {hasScenarios && (
                <button
                  className={`${styles.tabButton} ${activeTab === 'scenarios' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('scenarios')}
                  type="button"
                >
                  Сценарии
                </button>
              )}
              {hasExample && (
                <button
                  className={`${styles.tabButton} ${activeTab === 'example' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('example')}
                  type="button"
                >
                  Пример
                </button>
              )}
              {hasTasks && (
                <button
                  className={`${styles.tabButton} ${activeTab === 'tasks' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('tasks')}
                  type="button"
                >
                  Задания
                </button>
              )}
            </div>
          </div>
        )}

        <div className={styles.main}>
          <div className={styles.header}>
            <h2>{lecture?.title || 'Лекция'}</h2>
            <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
              ✕
            </button>
          </div>

          <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Загрузка лекции...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>❌ {error}</p>
            </div>
          )}

            {lecture && !loading && (
              activeTab === 'tasks' && hasTasks && parsedTasks ? (
                <div className={styles.tasksWrapper}>
                  {parsedTasks.intro && (
                    <div className={styles.tasksIntro}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {parsedTasks.intro}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className={styles.tasksList}>
                    {parsedTasks.items.map((task) => (
                      <div
                        key={task.id}
                        className={`${styles.taskCard} ${taskProgress[task.id] ? styles.taskCardCompleted : ''}`}
                      >
                        <div className={styles.taskHeader}>
                          <div className={styles.taskTitleRow}>
                            <h3 className={styles.taskTitle}>{task.title}</h3>
                            {taskProgress[task.id] && (
                              <span className={styles.taskDoneBadge} aria-label="Выполнено">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className={styles.taskActions}>
                            <button
                              className={styles.taskAnswerButton}
                              type="button"
                              onClick={() => handleTaskDetailsClick(task)}
                            >
                              Задание
                            </button>
                            <button
                              className={styles.taskAnswerButton}
                              type="button"
                              onClick={() => handleAnswerClick(task)}
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
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.markdown}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdownToRender}
                  </ReactMarkdown>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {showTaskWarning && selectedTask && (
        <div className={styles.taskOverlay} onClick={() => setShowTaskWarning(false)}>
          <div className={styles.taskModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.taskModalHeader}>
              <h3>Перед просмотром ответа</h3>
              <button
                className={styles.taskModalClose}
                onClick={() => setShowTaskWarning(false)}
                aria-label="Закрыть"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.taskModalBody}>
              <p>
                Вы уже попытались решить задание самостоятельно?
                Если нет, не рекомендуем сразу смотреть ответ — практика запоминается
                сильнее, чем чтение готового решения.
              </p>
              <label className={styles.taskCheckbox}>
                <input
                  type="checkbox"
                  checked={warningOptOut}
                  onChange={(event) => setWarningOptOut(event.target.checked)}
                />
                Больше не показывать это предупреждение
              </label>
            </div>
            <div className={styles.taskModalActions}>
              <button
                className={styles.taskModalSecondary}
                onClick={() => setShowTaskWarning(false)}
                type="button"
              >
                Отмена
              </button>
              <button
                className={styles.taskModalPrimary}
                onClick={handleConfirmWarning}
                type="button"
              >
                Показать ответ
              </button>
            </div>
          </div>
        </div>
      )}

      {showTaskDetails && selectedTask && (
        <div className={styles.taskOverlay} onClick={handleCloseTaskDetails}>
          <div className={styles.taskModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.taskModalHeader}>
              <h3>{selectedTask.title}</h3>
              <button
                className={styles.taskModalClose}
                onClick={handleCloseTaskDetails}
                aria-label="Закрыть"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.taskModalBody}>
              <div className={styles.taskAnswerSection}>
                <h4>Задание</h4>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedTask.body || 'Описание задания ещё не добавлено.'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTaskAnswer && selectedTask && (
        <div className={styles.taskOverlay} onClick={handleCloseTaskAnswer}>
          <div className={styles.taskModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.taskModalHeader}>
              <h3>{selectedTask.title}</h3>
              <button
                className={styles.taskModalClose}
                onClick={handleCloseTaskAnswer}
                aria-label="Закрыть"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.taskModalBody}>
              <div className={styles.taskAnswerSection}>
                <h4>Ответ</h4>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedTask.answer || 'Ответ ещё не добавлен.'}
                </ReactMarkdown>
              </div>
              <div className={styles.taskAnswerSection}>
                <h4>Объяснение</h4>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedTask.explanation || 'Объяснение ещё не добавлено.'}
                </ReactMarkdown>
              </div>
              <label className={styles.taskCheckbox}>
                <input
                  type="checkbox"
                  checked={!skipTasksWarning}
                  onChange={(event) => updateSkipTasksWarning(!event.target.checked)}
                />
                Показывать предупреждение перед ответом
              </label>
            </div>
            <div className={styles.taskModalActions}>
              <button
                className={styles.taskAnswerActionButton}
                type="button"
                onClick={() => handleTaskAnswerAction(false)}
              >
                ❌ Нужно доработать
              </button>
              <button
                className={styles.taskAnswerActionButton}
                type="button"
                onClick={() => handleTaskAnswerAction(true)}
              >
                ✅ Сделал правильно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
