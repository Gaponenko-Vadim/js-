/**
 * TestRestoreDialog Component
 *
 * Диалог восстановления сохраненного прогресса теста (только для режима обучения)
 */

import { Test, SavedTestState } from '@/features/tests/types';
import styles from './TestRestoreDialog.module.scss';

export interface TestRestoreDialogProps {
  /** Данные теста */
  test: Test;
  /** Сохраненное состояние */
  savedState: SavedTestState;
  /** Callback для восстановления прогресса */
  onRestore: () => void;
  /** Callback для начала заново */
  onStartFresh: () => void;
  /** Callback для возврата к списку тестов */
  onBack: () => void;
}

export function TestRestoreDialog({
  test,
  savedState,
  onRestore,
  onStartFresh,
  onBack
}: TestRestoreDialogProps) {
  const answeredCount = savedState.userAnswers.filter((a) => a >= 0).length;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.content}>
          <h1 className={styles.title}>🔄 Найден сохранённый прогресс</h1>

          <p className={styles.description}>
            У вас есть незавершённое прохождение теста{' '}
            <strong>{test.title}</strong> в режиме обучения
          </p>

          <div className={styles.info}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📊</span>
              <span className={styles.infoLabel}>Режим:</span>
              <strong className={styles.infoValue}>Обучение</strong>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📝</span>
              <span className={styles.infoLabel}>Текущий вопрос:</span>
              <strong className={styles.infoValue}>
                {savedState.currentQuestionIndex + 1} из {test.questions.length}
              </strong>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>✅</span>
              <span className={styles.infoLabel}>Отвечено:</span>
              <strong className={styles.infoValue}>
                {answeredCount} вопросов
              </strong>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={onRestore}>
              Продолжить прохождение
            </button>

            <button className={styles.secondaryButton} onClick={onStartFresh}>
              Начать заново
            </button>
          </div>

          <button className={styles.backButton} onClick={onBack}>
            ← Назад к списку тестов
          </button>
        </div>
      </div>
    </div>
  );
}
