/**
 * Tests Feature - Barrel Export
 *
 * Централизованный экспорт всех модулей feature tests
 */

// ============================================
// HOOKS
// ============================================
export { useTestTimer } from './hooks/useTestTimer';
export type {
  UseTestTimerOptions,
  UseTestTimerReturn
} from './hooks/useTestTimer';

export { useTestProgress } from './hooks/useTestProgress';
export type {
  UseTestProgressOptions,
  UseTestProgressReturn
} from './hooks/useTestProgress';

export { useTestSubmit } from './hooks/useTestSubmit';
export type {
  UseTestSubmitOptions,
  UseTestSubmitReturn,
  TestResult as TestResultData
} from './hooks/useTestSubmit';

// ============================================
// COMPONENTS
// ============================================
export { TestTimer } from './components/TestTimer';
export type { TestTimerProps } from './components/TestTimer';

export { TestQuestion } from './components/TestQuestion';
export type { TestQuestionProps } from './components/TestQuestion';

export { TestNavigation } from './components/TestNavigation';
export type { TestNavigationProps } from './components/TestNavigation';

export { TestModeSelector } from './components/TestModeSelector';
export type { TestModeSelectorProps } from './components/TestModeSelector';

export { TestHeader } from './components/TestHeader';
export type { TestHeaderProps } from './components/TestHeader';

export { TestRestoreDialog } from './components/TestRestoreDialog';
export type { TestRestoreDialogProps } from './components/TestRestoreDialog';

export { TestResults } from './components/TestResults';
export type { TestResultsProps } from './components/TestResults';

export { ExamExitConfirmModal } from './components/ExamExitConfirmModal';
export type { ExamExitConfirmModalProps } from './components/ExamExitConfirmModal';

// ============================================
// UTILS
// ============================================
export { calculateCombinedTestScores } from './utils/calculateCombinedTestScores';

// ============================================
// RTK QUERY API & HOOKS
// ============================================
export {
  testsApi,
  useGetTestsQuery,
  useGetTestByIdQuery,
  useGetCombinedTestQuery,
  useSubmitTestMutation,
  useSubmitCombinedTestMutation,
} from './api/testsApi';

// ============================================
// TYPES
// ============================================
export type {
  Question,
  Category,
  Test,
  TestMode,
  TestResult,
  TestState,
  SavedTestState,
  TestTimerProps as TestTimerComponentProps,
  TestQuestionProps as TestQuestionComponentProps,
  TestNavigationProps as TestNavigationComponentProps,
  TestModeSelectorProps as TestModeSelectorComponentProps,
  SubmitTestRequest,
  SubmitTestResponse,
  SubmitCombinedTestRequest,
  FetchTestResponse,
  SourceTest,
  CombinedTest,
  TestScore
} from './types';
