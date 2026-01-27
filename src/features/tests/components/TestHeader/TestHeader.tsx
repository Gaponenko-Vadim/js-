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
      {/* Title and Timer/Badge */}
      <div className={styles.headerTop}>
        <h1 className={styles.title}>{title}</h1>

        {testMode === 'exam' && timeLeft !== undefined && (
          <TestTimer timeLeft={timeLeft} isWarning={isTimeWarning} />
        )}

        {testMode === 'learning' && (
          <div className={styles.modeBadge}>📚 Обучение</div>
        )}
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Counter */}
      <p className={styles.questionCounter}>
        Вопрос {currentQuestion} из {totalQuestions}
      </p>
    </div>
  );
}
