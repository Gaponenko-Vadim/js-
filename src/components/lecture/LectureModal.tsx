'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './LectureModal.module.scss';
import {
  LectureContent,
  LectureTabs,
  LectureTasks,
  TaskModals,
  parseTasksContent,
  useGetLectureByIdQuery,
  useGetLectureByQuestionIdQuery,
  type Lecture,
  type LectureTab,
  type TaskItem
} from '@/features/lectures';

interface LectureModalProps {
  questionId?: string;
  lectureId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LectureModal({ questionId, lectureId, isOpen, onClose }: LectureModalProps) {
  // RTK Query hooks - используем оба, но активируем только нужный через skip
  const { data: lectureByQuestion, isLoading: loadingByQuestion, error: errorByQuestion } = useGetLectureByQuestionIdQuery(
    questionId || '',
    { skip: !questionId || !isOpen }
  );
  const { data: lectureById, isLoading: loadingById, error: errorById } = useGetLectureByIdQuery(
    lectureId || '',
    { skip: !lectureId || !isOpen || !!questionId } // Если questionId есть, не запрашиваем по lectureId
  );

  // Определяем какие данные использовать
  const lecture = questionId ? lectureByQuestion : lectureById;
  const loading = questionId ? loadingByQuestion : loadingById;
  const error = questionId ? errorByQuestion : errorById;

  const [activeTab, setActiveTab] = useState<LectureTab>('lecture');
  const [skipTasksWarning, setSkipTasksWarning] = useState(false);
  const [warningOptOut, setWarningOptOut] = useState(false);
  const [showTaskWarning, setShowTaskWarning] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showTaskAnswer, setShowTaskAnswer] = useState(false);
  const [showTasksPrep, setShowTasksPrep] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [taskProgress, setTaskProgress] = useState<Record<string, boolean>>({});
  const taskProgressVersionRef = useRef(0);

  // Reset state when lecture changes
  useEffect(() => {
    if (lecture) {
      setActiveTab('lecture');
      setTaskProgress({});
      taskProgressVersionRef.current += 1;
    }
  }, [lecture?.id]);

  // Fetch user settings
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

  // Fetch task progress
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
  const prepContent = parsedTasks?.prep?.trim()
    ? parsedTasks.prep
    : 'Инструкция для подготовки пока не добавлена для этой лекции.';

  const completedTaskIds = Object.keys(taskProgress).filter((taskId) => taskProgress[taskId]);

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
        <LectureTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasScenarios={hasScenarios}
          hasExample={hasExample}
          hasTasks={hasTasks}
        />

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
                <p>❌ Не удалось загрузить лекцию</p>
              </div>
            )}

            {lecture && !loading && (
              activeTab === 'tasks' && hasTasks && parsedTasks ? (
                <LectureTasks
                  tasksContent={lecture.tasksContent || ''}
                  completedTasks={completedTaskIds}
                  onTaskDetailsClick={handleTaskDetailsClick}
                  onTaskAnswerClick={handleAnswerClick}
                  onPrepClick={() => setShowTasksPrep(true)}
                />
              ) : (
                <LectureContent content={markdownToRender} />
              )
            )}
          </div>
        </div>
      </div>

      <TaskModals
        selectedTask={selectedTask}
        showTaskWarning={showTaskWarning}
        showTaskDetails={showTaskDetails}
        showTaskAnswer={showTaskAnswer}
        showTasksPrep={showTasksPrep}
        warningOptOut={warningOptOut}
        skipTasksWarning={skipTasksWarning}
        prepContent={prepContent}
        onWarningOptOutChange={setWarningOptOut}
        onConfirmWarning={handleConfirmWarning}
        onCloseTaskWarning={() => setShowTaskWarning(false)}
        onCloseTaskDetails={handleCloseTaskDetails}
        onCloseTaskAnswer={handleCloseTaskAnswer}
        onCloseTasksPrep={() => setShowTasksPrep(false)}
        onTaskAnswerAction={handleTaskAnswerAction}
        onSkipTasksWarningChange={updateSkipTasksWarning}
      />
    </div>
  );
}
