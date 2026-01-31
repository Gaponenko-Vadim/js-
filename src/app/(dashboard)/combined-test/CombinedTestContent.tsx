'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LectureModal from '@/components/lecture/LectureModal';
import {
  useTestTimer,
  useTestProgress,
  useTestSubmit,
  useGetCombinedTestQuery,
  TestHeader,
  TestQuestion,
  TestNavigation,
  TestModeSelector,
  TestRestoreDialog,
  TestResults,
  type CombinedTest,
  type TestMode
} from '@/features/tests';
import styles from './combined-test.module.scss';

export default function CombinedTestContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testsParam = searchParams.get('tests');
  const listName = searchParams.get('listName') || 'Объединенный тест';
  const combinedTestId = testsParam
    ? `combined_${testsParam.replace(/,/g, '_')}`
    : 'combined';

  // RTK Query hook
  const { data: test, isLoading: loading } = useGetCombinedTestQuery(testsParam || '', {
    skip: !testsParam || !session
  });

  const [testMode, setTestMode] = useState<TestMode | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isLectureOpen, setIsLectureOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<
    string | undefined
  >();

  // Timer hook
  const examDuration = (test?.questions.length || 0) * 20;
  const {
    timeLeft,
    endTime,
    reset: resetTimer,
    setEndTime
  } = useTestTimer({
    isActive: testMode === 'exam' && testStarted && !showResults,
    duration: examDuration,
    onTimeUp: () => submitTest(userAnswers)
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
    testId: combinedTestId,
    questionCount: test?.questions.length || 0,
    testStarted,
    showResults,
    testMode,
    timeLeft,
    endTime
  });

  // Submit hook
  const { submitTest: submitTestHook } = useTestSubmit({
    testId: combinedTestId,
    questions: test?.questions || [],
    testMode: testMode || 'learning',
    isCombined: true,
    listName,
    sourceTests: test?.sourceTests,
    onSubmitComplete: (scorePercentage) => {
      setScore(scorePercentage);
      setShowResults(true);
      clearSavedState();
    }
  });

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  const startTest = (mode: TestMode) => {
    setTestMode(mode);
    setTestStarted(true);
    if (mode === 'exam') {
      setEndTime(Date.now() + examDuration * 1000);
    }
  };

  const handleRestoreTest = () => {
    restoreProgress();
    setTestStarted(true);
    if (savedState && savedState.testMode === 'exam' && savedState.endTime) {
      setTestMode(savedState.testMode);
      setEndTime(savedState.endTime);
    }
  };

  const handleStartFresh = () => {
    startFresh();
  };

  const handleBackToTests = () => {
    if (combinedTestId && testMode === 'exam') {
      clearSavedState();
    }
    router.push('/my-lists');
  };

  const handleNext = () => {
    progressNext(submitTest);
  };

  const submitTest = async (answers: number[]) => {
    await submitTestHook(answers);
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
    setSelectedQuestionId(undefined);
  };

  // Loading state
  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  // Not authenticated or no test
  if (!session || !test) {
    return null;
  }

  // Restore dialog
  if (showRestoreDialog && savedState && savedState.testMode === 'learning') {
    return (
      <TestRestoreDialog
        test={{ ...test, title: listName }}
        savedState={savedState}
        onRestore={handleRestoreTest}
        onStartFresh={handleStartFresh}
        onBack={handleBackToTests}
      />
    );
  }

  // Mode selection
  if (!testMode) {
    return (
      <TestModeSelector
        test={{ ...test, title: listName }}
        onSelectMode={startTest}
        onBack={handleBackToTests}
      />
    );
  }

  // Results screen
  if (showResults) {
    return (
      <>
        <TestResults
          test={{ ...test, title: listName }}
          userAnswers={userAnswers}
          score={score}
          testMode={testMode}
          onRestart={() => {
            setShowResults(false);
            setTestStarted(false);
            setTestMode(null);
            setScore(0);
            resetTimer();
            startFresh();
          }}
          onBackToTests={handleBackToTests}
          onViewResults={() => router.push('/results')}
          onOpenLecture={openLecture}
        />
        <LectureModal
          questionId={selectedQuestionId}
          isOpen={isLectureOpen}
          onClose={closeLecture}
        />
      </>
    );
  }

  // Active test
  const currentQuestion = test.questions[currentQuestionIndex];
  const isTimeWarning = testMode === 'exam' && timeLeft <= 60;

  return (
    <div className={styles.container}>
      <TestHeader
        title={listName}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={test.questions.length}
        testMode={testMode}
        timeLeft={testMode === 'exam' ? timeLeft : undefined}
        isTimeWarning={isTimeWarning}
      />

      <div className={styles.questionCard}>
        <TestQuestion
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={test.questions.length}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={handleAnswerSelect}
          showLectureButton={testMode === 'learning' && !!currentQuestion.id}
          onOpenLecture={() => openLecture(currentQuestion.id)}
        />

        <TestNavigation
          currentIndex={currentQuestionIndex}
          totalQuestions={test.questions.length}
          hasAnswer={selectedAnswer !== null}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>

      <LectureModal
        questionId={selectedQuestionId}
        isOpen={isLectureOpen}
        onClose={closeLecture}
      />
    </div>
  );
}
