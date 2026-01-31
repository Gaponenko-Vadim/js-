/**
 * TestHeader Component
 *
 * Заголовок теста с прогресс-баром, таймером и информацией
 */

import { TestMode } from '@/features/tests/types';
import { TestTimer } from '../TestTimer';
import styles from './TestHeader.module.scss';

export interface TestHeaderProps {
  /** Название теста */
  title: string;
  /** Номер текущего вопроса (с 1) */
  currentQuestion: number;
  /** Общее количество вопросов */
  totalQuestions: number;
  /** Режим теста */
  testMode: TestMode;
  /** Оставшееся время (для exam mode) */
  timeLeft?: number;
  /** Предупреждение о времени */
  isTimeWarning?: boolean;
}

export function TestHeader({
  title,
  currentQuestion,
  totalQuestions,
  testMode,
  timeLeft,
  isTimeWarning = false
}: TestHeaderProps) {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className={styles.container}>
      {/* Title and Mode Badge */}
      <div className={styles.headerTop}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
          {testMode === 'learning' && (
            <div className={styles.modeBadge}>📚 Режим обучения</div>
          )}
          {testMode === 'exam' && (
            <div className={styles.examBadge}>🎯 Режим экзамена</div>
          )}
        </div>

        {testMode === 'exam' && timeLeft !== undefined && (
          <TestTimer timeLeft={timeLeft} isWarning={isTimeWarning} />
        )}
      </div>

      {/* Progress Section */}
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span className={styles.questionCounter}>
            Вопрос {currentQuestion} из {totalQuestions}
          </span>
          <span className={styles.progressPercentage}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
