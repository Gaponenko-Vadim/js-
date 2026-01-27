/**
 * TestQuestion Component
 *
 * Отображение вопроса теста с вариантами ответов
 */

import { Question } from '@/features/tests/types';
import styles from './TestQuestion.module.scss';

export interface TestQuestionProps {
  /** Вопрос */
  question: Question;
  /** Номер вопроса (для отображения) */
  questionNumber: number;
  /** Общее количество вопросов */
  totalQuestions: number;
  /** Выбранный ответ */
  selectedAnswer: number | null;
  /** Callback при выборе ответа */
  onAnswerSelect: (index: number) => void;
  /** Показывать кнопку "Открыть лекцию" */
  showLectureButton?: boolean;
  /** Callback для открытия лекции */
  onOpenLecture?: () => void;
}

export function TestQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  showLectureButton = false,
  onOpenLecture
}: TestQuestionProps) {
  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Question Counter */}
      <p className={styles.questionCounter}>
        Вопрос {questionNumber} из {totalQuestions}
      </p>

      {/* Question Text */}
      <h2 className={styles.questionText}>{question.question}</h2>

      {/* Options */}
      <div className={styles.options}>
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`${styles.option} ${
              selectedAnswer === index ? styles.selected : ''
            }`}
            onClick={() => onAnswerSelect(index)}
          >
            <span className={styles.optionLabel}>
              {String.fromCharCode(65 + index)}
            </span>
            <span className={styles.optionText}>{option}</span>
          </button>
        ))}
      </div>

      {/* Lecture Hint */}
      {showLectureButton && question.id && onOpenLecture && (
        <div className={styles.lectureHint}>
          <button className={styles.hintButton} onClick={onOpenLecture}>
            💡 Нужна подсказка? Открыть лекцию
          </button>
        </div>
      )}
    </div>
  );
}
