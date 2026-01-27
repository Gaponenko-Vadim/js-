/**
 * TaskModals Component
 *
 * Contains all task-related modal dialogs:
 * - Warning modal before showing answer
 * - Task preparation modal
 * - Task details modal
 * - Task answer modal
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './TaskModals.module.scss';
import type { TaskModalsProps } from '../../types';

export function TaskModals({
  selectedTask,
  showTaskWarning,
  showTaskDetails,
  showTaskAnswer,
  showTasksPrep,
  warningOptOut,
  skipTasksWarning,
  prepContent,
  onWarningOptOutChange,
  onConfirmWarning,
  onCloseTaskWarning,
  onCloseTaskDetails,
  onCloseTaskAnswer,
  onCloseTasksPrep,
  onTaskAnswerAction,
  onSkipTasksWarningChange
}: TaskModalsProps) {
  return (
    <>
      {/* Warning Modal */}
      {showTaskWarning && selectedTask && (
        <div className={styles.taskOverlay} onClick={onCloseTaskWarning}>
          <div className={styles.taskModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.taskModalHeader}>
              <h3>Перед просмотром ответа</h3>
              <button
                className={styles.taskModalClose}
                onClick={onCloseTaskWarning}
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
                  onChange={(event) => onWarningOptOutChange(event.target.checked)}
                />
                Больше не показывать это предупреждение
              </label>
            </div>
            <div className={styles.taskModalActions}>
              <button
                className={styles.taskModalSecondary}
                onClick={onCloseTaskWarning}
                type="button"
              >
                Отмена
              </button>
              <button
                className={styles.taskModalPrimary}
                onClick={onConfirmWarning}
                type="button"
              >
                Показать ответ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preparation Modal */}
      {showTasksPrep && (
        <div className={styles.taskOverlay} onClick={onCloseTasksPrep}>
          <div className={styles.taskModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.taskModalHeader}>
              <h3>Подготовка к заданиям</h3>
              <button
                className={styles.taskModalClose}
                onClick={onCloseTasksPrep}
                aria-label="Закрыть"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.taskModalBody}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {prepContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className={styles.taskOverlay} onClick={onCloseTaskDetails}>
          <div className={styles.taskModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.taskModalHeader}>
              <h3>{selectedTask.title}</h3>
              <button
                className={styles.taskModalClose}
                onClick={onCloseTaskDetails}
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

      {/* Task Answer Modal */}
      {showTaskAnswer && selectedTask && (
        <div className={styles.taskOverlay} onClick={onCloseTaskAnswer}>
          <div className={styles.taskModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.taskModalHeader}>
              <h3>{selectedTask.title}</h3>
              <button
                className={styles.taskModalClose}
                onClick={onCloseTaskAnswer}
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
                  onChange={(event) => onSkipTasksWarningChange(!event.target.checked)}
                />
                Показывать предупреждение перед ответом
              </label>
            </div>
            <div className={styles.taskModalActions}>
              <button
                className={styles.taskAnswerActionButton}
                type="button"
                onClick={() => onTaskAnswerAction(false)}
              >
                ❌ Нужно доработать
              </button>
              <button
                className={styles.taskAnswerActionButton}
                type="button"
                onClick={() => onTaskAnswerAction(true)}
              >
                ✅ Сделал правильно
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
