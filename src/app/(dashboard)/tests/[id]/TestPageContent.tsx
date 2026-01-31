'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LectureModal from '@/components/lecture/LectureModal';
import {
  useTestTimer,
  useTestProgress,
  useTestSubmit,
  useGetTestByIdQuery,
  TestHeader,
  TestQuestion,
  TestNavigation,
  TestModeSelector,
  TestRestoreDialog,
  TestResults,
  ExamExitConfirmModal,
  type Test,
  type TestMode
} from '@/features/tests';
import { TestStructuredData } from '@/shared/components/StructuredData';
import styles from './test.module.scss';

export default function TestPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params?.id as string;
  const categoryParam = searchParams.get('category');

  // RTK Query hook
  const { data: test, isLoading: loading } = useGetTestByIdQuery(testId, {
    skip: !testId || !session
  });

  const [testMode, setTestMode] = useState<TestMode | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isLectureOpen, setIsLectureOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );
  const [showExamExitConfirm, setShowExamExitConfirm] = useState(false);

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Перехват кнопки "Назад" браузера для режима экзамена
  useEffect(() => {
    if (testMode === 'exam' && testStarted && !showResults) {
      // Добавляем запись в историю браузера
      window.history.pushState({ examInProgress: true }, '');

      const handlePopState = (event: PopStateEvent) => {
        // Если пользователь нажал "Назад" во время экзамена
        if (testMode === 'exam' && testStarted && !showResults) {
          // Предотвращаем уход, возвращаем состояние
          window.history.pushState({ examInProgress: true }, '');
          // Показываем popup подтверждения
          setShowExamExitConfirm(true);
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [testMode, testStarted, showResults]);

  // Timer hook
  const examDuration = (test?.questions.length || 0) * 20;
  const {
    timeLeft,
    endTime,
    formattedTime,
    reset: resetTimer,
    setEndTime
  } = useTestTimer({
    isActive: testMode === 'exam' && testStarted && !showResults,
    duration: examDuration,
    onTimeUp: () => {
      submitTest(userAnswers);
    }
  });

  // Progress hook
  const {
    currentQuestionIndex,
    userAnswers,
    selectedAnswer,
    savedState,
    showRestoreDialog,
    handleAnswerSelect,
    handleNext: progressNext,
    handlePrevious,
    restoreProgress,
    startFresh,
    clearSavedState
  } = useTestProgress({
    testId,
    questionCount: test?.questions.length || 0,
    testStarted,
    showResults,
    testMode,
    timeLeft,
    endTime
  });

  // Submit hook
  const { submitTest: submitTestHook } = useTestSubmit({
    testId,
    questions: test?.questions || [],
    testMode: testMode || 'learning',
    onSubmitComplete: (scorePercentage) => {
      setScore(scorePercentage);
      setShowResults(true);
      clearSavedState();
    }
  });

  const submitTest = (answers: number[]) => {
    submitTestHook(answers);
  };

  const handleNext = () => {
    progressNext(submitTest);
  };

  const startTest = (mode: TestMode) => {
    setTestMode(mode);
    setTestStarted(true);
    if (mode === 'exam') {
      setEndTime(Date.now() + examDuration * 1000);
    }
  };

  // Автоматическое восстановление для режима экзамена
  useEffect(() => {
    if (savedState && savedState.testMode === 'exam' && !testStarted) {
      // Для экзамена автоматически восстанавливаем без диалога
      restoreProgress();
      setTestMode(savedState.testMode);
      setTestStarted(true);
      if (savedState.endTime) {
        setEndTime(savedState.endTime);
      }
    }
  }, [savedState, testStarted, restoreProgress, setEndTime]);

  const handleRestoreTest = () => {
    if (savedState) {
      restoreProgress();
      setTestMode(savedState.testMode);
      setTestStarted(true);
      if (savedState.testMode === 'exam' && savedState.endTime) {
        setEndTime(savedState.endTime);
      }
    }
  };

  const handleBackToTests = () => {
    // Для режима экзамена показываем подтверждение выхода
    if (testMode === 'exam' && testStarted && !showResults) {
      setShowExamExitConfirm(true);
      return;
    }

    // Для остальных случаев просто очищаем и выходим
    if (testId) {
      clearSavedState();
    }

    navigateToTests();
  };

  const navigateToTests = () => {
    if (categoryParam) {
      router.push(`/tests?category=${categoryParam}`);
    } else {
      const firstCategory = test?.categories?.[0]?.category;
      if (firstCategory?.slug) {
        router.push(`/tests?category=${firstCategory.slug}`);
      } else {
        router.push('/tests');
      }
    }
  };

  const handleExamExitConfirm = () => {
    setShowExamExitConfirm(false);
    clearSavedState();

    // Удаляем лишнюю запись из истории браузера
    if (window.history.state?.examInProgress) {
      window.history.back();
    }

    // Небольшая задержка чтобы history.back успел сработать
    setTimeout(() => {
      navigateToTests();
    }, 100);
  };

  const handleExamExitCancel = () => {
    setShowExamExitConfirm(false);
  };

  const openLecture = (questionId?: string) => {
    if (questionId) {
      setSelectedQuestionId(questionId);
      setIsLectureOpen(true);
    } else if (test?.questions[0]?.id) {
      setSelectedQuestionId(test.questions[0].id);
      setIsLectureOpen(true);
    } else {
      alert('Лекция не найдена для этого вопроса');
    }
  };

  const closeLecture = () => {
    setIsLectureOpen(false);
    setSelectedQuestionId(null);
  };

  // Loading state
  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!session || !test) {
    return null;
  }

  // Restore dialog (only for learning mode - exam auto-restores)
  if (showRestoreDialog && savedState && savedState.testMode === 'learning') {
    return (
      <div className={styles.container}>
        <TestRestoreDialog
          test={test}
          savedState={savedState}
          onRestore={handleRestoreTest}
          onStartFresh={startFresh}
          onBack={handleBackToTests}
        />
      </div>
    );
  }

  // Mode selection
  if (!testMode) {
    return (
      <div className={styles.container}>
        <TestModeSelector
          test={test}
          onSelectMode={startTest}
          onBack={handleBackToTests}
        />
      </div>
    );
  }

  // Results screen
  if (showResults) {
    return (
      <>
        <TestResults
          test={test}
          userAnswers={userAnswers}
          score={score}
          testMode={testMode}
          onRestart={() => {
            resetTimer();
            startFresh();
            setTestMode(null);
            setTestStarted(false);
            setShowResults(false);
          }}
          onBackToTests={handleBackToTests}
          onViewResults={() => router.push('/results')}
          onOpenLecture={openLecture}
        />
        <LectureModal
          questionId={selectedQuestionId || undefined}
          isOpen={isLectureOpen}
          onClose={closeLecture}
        />
      </>
    );
  }

  // Active test
  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <>
      <TestStructuredData test={test} />
      <div className={styles.container}>
        <TestHeader
          title={test.title}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={test.questions.length}
          testMode={testMode}
          timeLeft={testMode === 'exam' ? timeLeft : undefined}
          isTimeWarning={timeLeft <= 60}
        />

        <div className={styles.questionCard}>
          <TestQuestion
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={test.questions.length}
            selectedAnswer={selectedAnswer}
            onAnswerSelect={handleAnswerSelect}
            showLectureButton={testMode === 'learning'}
            onOpenLecture={
              currentQuestion.id
                ? () => openLecture(currentQuestion.id)
                : undefined
            }
          />

          <TestNavigation
            currentIndex={currentQuestionIndex}
            totalQuestions={test.questions.length}
            hasAnswer={selectedAnswer !== null}
            onPrevious={handlePrevious}
            onNext={handleNext}
            disabled={false}
          />
        </div>

        <LectureModal
          questionId={selectedQuestionId || undefined}
          isOpen={isLectureOpen}
          onClose={closeLecture}
        />

        <ExamExitConfirmModal
          isOpen={showExamExitConfirm}
          onConfirm={handleExamExitConfirm}
          onCancel={handleExamExitCancel}
        />
      </div>
    </>
  );
}
