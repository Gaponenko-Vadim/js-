/**
 * TypeScript типы для Tests Feature
 */

// ============================================
// QUESTION & TEST TYPES
// ============================================

export interface Question {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  sourceTestIds?: string[]; // Для комбинированных тестов
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[]; // Теги профессий (system-analyst, qa-engineer, frontend, backend, fullstack)
  questions: Question[];
  categories?: {
    category: Category;
  }[];
}

// ============================================
// COMBINED TEST TYPES
// ============================================

export interface SourceTest {
  id: string;
  title: string;
  questionsCount: number;
}

export interface CombinedTest extends Test {
  sourceTests?: SourceTest[];
}

export interface TestScore {
  title: string;
  score: number;
  correct: number;
  total: number;
}

// ============================================
// TEST MODE & STATE
// ============================================

export type TestMode = 'learning' | 'exam';

export interface TestState {
  userAnswers: number[];
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  testMode: TestMode;
  timeLeft?: number;
  endTime?: number | null;
}

export interface SavedTestState extends TestState {
  // Дополнительные поля при необходимости
}

// ============================================
// TEST RESULT
// ============================================

export interface TestResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  answers: number[];
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface TestTimerProps {
  timeLeft: number;
  isWarning?: boolean;
}

export interface TestQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  onAnswerSelect: (index: number) => void;
  showLectureButton?: boolean;
  onOpenLecture?: () => void;
}

export interface TestNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  hasAnswer: boolean;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export interface TestModeSelectorProps {
  test: Test;
  onSelectMode: (mode: TestMode) => void;
  onBack: () => void;
}

export interface TestResultsProps {
  test: Test;
  userAnswers: number[];
  score: number;
  testMode: TestMode;
  onRestart: () => void;
  onBackToTests: () => void;
  onViewResults: () => void;
  onOpenLecture: (questionId?: string) => void;
}

export interface TestRestoreDialogProps {
  test: Test;
  savedState: TestState;
  onRestore: () => void;
  onStartFresh: () => void;
  onBack: () => void;
}

export interface TestHeaderProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  testMode: TestMode;
  timeLeft?: number;
  formatTime?: (seconds: number) => string;
}

// ============================================
// API TYPES
// ============================================

export interface SubmitTestRequest {
  testId: string;
  answers: number[];
  score: number;
}

export interface SubmitTestResponse {
  success: boolean;
  resultId?: string;
  error?: string;
}

export interface SubmitCombinedTestRequest {
  listName: string;
  testIds: string[];
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  testScores: Record<string, TestScore>;
}

export interface FetchTestResponse extends Test {}
